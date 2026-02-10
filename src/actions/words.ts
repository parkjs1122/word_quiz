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

export async function uploadWords(formData: FormData) {
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

export async function toggleMemorized(id: string, memorized: boolean) {
  const userId = await getUserId();

  await prisma.word.update({
    where: { id, userId },
    data: { memorized },
  });
}

export async function resetAllMemorized() {
  const userId = await getUserId();

  await prisma.word.updateMany({
    where: { userId },
    data: { memorized: false },
  });
}

export async function exportWords(): Promise<string> {
  const userId = await getUserId();

  const words = await prisma.word.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return words.map((w) => `${w.word}\t${w.meaning}`).join("\n");
}

export async function getWords(filter?: "all" | "memorized" | "unmemorized") {
  const userId = await getUserId();

  const where: { userId: string; memorized?: boolean } = { userId };
  if (filter === "memorized") where.memorized = true;
  if (filter === "unmemorized") where.memorized = false;

  return prisma.word.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function getStats() {
  const userId = await getUserId();

  const [total, memorized] = await Promise.all([
    prisma.word.count({ where: { userId } }),
    prisma.word.count({ where: { userId, memorized: true } }),
  ]);

  return {
    totalWords: total,
    memorizedCount: memorized,
    unmemorizedCount: total - memorized,
    memorizedRate: total > 0 ? Math.round((memorized / total) * 100) : 0,
  };
}
