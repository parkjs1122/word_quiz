"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseWordFile } from "@/lib/parse-words";

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("인증이 필요합니다.");
  }
  return session.user.id;
}

export async function createWord(data: {
  word: string;
  meaning: string;
  folderId?: string | null;
}) {
  const userId = await getUserId();
  const trimmedWord = data.word.trim();
  const trimmedMeaning = data.meaning.trim();
  if (!trimmedWord || !trimmedMeaning) {
    return { error: "단어와 뜻을 모두 입력해주세요." };
  }

  const word = await prisma.word.create({
    data: {
      word: trimmedWord,
      meaning: trimmedMeaning,
      memorized: false,
      userId,
      folderId: data.folderId ?? null,
    },
    include: { folder: { select: { id: true, name: true } } },
  });

  return { word };
}

export async function uploadWords(formData: FormData, folderId?: string | null) {
  const userId = await getUserId();
  const file = formData.get("file") as File;

  if (!file) {
    return { error: "파일을 선택해주세요." };
  }

  if (!file.name.endsWith(".txt")) {
    return { error: "txt 파일만 업로드 가능합니다." };
  }

  const content = await file.text();
  const { words, skippedLines } = parseWordFile(content);

  if (words.length === 0) {
    return {
      error: "파일 형식이 올바르지 않습니다. 단어와 뜻을 탭으로 구분해주세요.",
    };
  }

  await prisma.word.createMany({
    data: words.map((w) => ({
      word: w.word,
      meaning: w.meaning,
      memorized: false,
      userId,
      folderId: folderId || null,
    })),
  });

  return {
    count: words.length,
    skippedLines,
  };
}

export async function updateWord(
  id: string,
  data: { word: string; meaning: string; memorized?: boolean }
) {
  const userId = await getUserId();

  await prisma.word.update({
    where: { id, userId },
    data: {
      word: data.word,
      meaning: data.meaning,
      ...(data.memorized !== undefined && { memorized: data.memorized }),
    },
  });
}

export async function deleteWord(id: string) {
  const userId = await getUserId();

  await prisma.word.delete({
    where: { id, userId },
  });
}

export async function deleteWords(ids: string[]) {
  const userId = await getUserId();

  await prisma.word.deleteMany({
    where: { id: { in: ids }, userId },
  });
}

const SRS_INTERVALS = [0, 1, 3, 7, 14, 30]; // days

export async function toggleMemorized(id: string, memorized: boolean) {
  const userId = await getUserId();

  if (memorized) {
    const word = await prisma.word.findUnique({ where: { id, userId } });
    if (!word) return;

    const newLevel = Math.min(word.level + 1, 5);
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + SRS_INTERVALS[newLevel]);

    await prisma.word.update({
      where: { id, userId },
      data: {
        memorized: newLevel >= 5,
        level: newLevel,
        nextReviewAt: nextReview,
      },
    });
  } else {
    await prisma.word.update({
      where: { id, userId },
      data: {
        memorized: false,
        level: 0,
        nextReviewAt: new Date(),
      },
    });
  }
}

export async function resetAllMemorized(folderId?: string | null) {
  const userId = await getUserId();

  const where: { userId: string; folderId?: string | null } = { userId };
  if (folderId !== undefined) {
    where.folderId = folderId;
  }

  await prisma.word.updateMany({
    where,
    data: { memorized: false, level: 0, nextReviewAt: new Date() },
  });
}

export async function exportWords(folderId?: string | null): Promise<string> {
  const userId = await getUserId();

  const where: { userId: string; folderId?: string | null } = { userId };
  if (folderId !== undefined) {
    where.folderId = folderId;
  }

  const words = await prisma.word.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  return words.map((w) => `${w.word}\t${w.meaning}`).join("\n");
}

// folderId: string => specific folder, null => uncategorized, undefined => all
export async function getWords(
  filter?: "all" | "memorized" | "unmemorized",
  folderId?: string | null
) {
  const userId = await getUserId();

  const where: { userId: string; memorized?: boolean; folderId?: string | null } = { userId };
  if (filter === "memorized") where.memorized = true;
  if (filter === "unmemorized") where.memorized = false;
  if (folderId !== undefined) {
    where.folderId = folderId;
  }

  return prisma.word.findMany({
    where,
    include: { folder: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStats(folderId?: string | null) {
  const userId = await getUserId();

  const where: { userId: string; folderId?: string | null } = { userId };
  if (folderId !== undefined) {
    where.folderId = folderId;
  }

  const [total, memorized] = await Promise.all([
    prisma.word.count({ where }),
    prisma.word.count({ where: { ...where, memorized: true } }),
  ]);

  return {
    totalWords: total,
    memorizedCount: memorized,
    unmemorizedCount: total - memorized,
    memorizedRate: total > 0 ? Math.round((memorized / total) * 100) : 0,
  };
}
