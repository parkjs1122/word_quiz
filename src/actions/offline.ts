"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getOfflineData() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("인증이 필요합니다.");
  }

  const userId = session.user.id;

  const [words, folders, total, memorized] = await Promise.all([
    prisma.word.findMany({
      where: { userId },
      select: {
        id: true,
        word: true,
        meaning: true,
        memorized: true,
        level: true,
        nextReviewAt: true,
        folderId: true,
      },
    }),
    prisma.folder.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        color: true,
        sortOrder: true,
      },
    }),
    prisma.word.count({ where: { userId } }),
    prisma.word.count({ where: { userId, memorized: true } }),
  ]);

  return {
    words: words.map((w) => ({
      ...w,
      nextReviewAt: w.nextReviewAt.toISOString(),
      color: undefined,
    })),
    folders: folders.map((f) => ({
      ...f,
      color: f.color || "#3B82F6",
    })),
    stats: {
      totalWords: total,
      memorizedCount: memorized,
    },
  };
}
