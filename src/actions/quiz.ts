"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getQuizWords() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("인증이 필요합니다.");
  }

  const words = await prisma.word.findMany({
    where: { userId: session.user.id, memorized: false },
    select: { id: true, word: true, meaning: true, memorized: true },
  });

  // Fisher-Yates shuffle
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }

  return words;
}
