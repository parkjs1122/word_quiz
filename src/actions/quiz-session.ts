"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("인증이 필요합니다.");
  }
  return session.user.id;
}

export type QuizMode = "normal" | "reverse" | "multipleChoice";

interface QuizWord {
  id: string;
  word: string;
  meaning: string;
  memorized: boolean;
}

export interface SavedQuizSession {
  words: QuizWord[];
  currentIndex: number;
  memorizedCount: number;
  folderIds?: string[];
  quizMode: QuizMode;
  manualReveal: boolean;
  wrongWords?: QuizWord[];
}

export async function saveQuizSessionToDB(data: SavedQuizSession) {
  const userId = await getUserId();

  const words = JSON.parse(JSON.stringify(data.words)) as Prisma.InputJsonValue;
  const wrongWords = data.wrongWords
    ? (JSON.parse(JSON.stringify(data.wrongWords)) as Prisma.InputJsonValue)
    : Prisma.JsonNull;
  const folderIds = data.folderIds
    ? (data.folderIds as unknown as Prisma.InputJsonValue)
    : Prisma.JsonNull;

  const payload = {
    words,
    currentIndex: data.currentIndex,
    memorizedCount: data.memorizedCount,
    folderIds,
    quizMode: data.quizMode,
    manualReveal: data.manualReveal,
    wrongWords,
  };

  await prisma.quizSession.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
}

export async function loadQuizSessionFromDB(): Promise<SavedQuizSession | null> {
  const userId = await getUserId();

  const session = await prisma.quizSession.findUnique({
    where: { userId },
  });

  if (!session) return null;

  // Check TTL
  if (Date.now() - session.updatedAt.getTime() > MAX_AGE_MS) {
    await prisma.quizSession.delete({ where: { userId } });
    return null;
  }

  return {
    words: session.words as unknown as QuizWord[],
    currentIndex: session.currentIndex,
    memorizedCount: session.memorizedCount,
    folderIds: session.folderIds as string[] | undefined,
    quizMode: session.quizMode as QuizMode,
    manualReveal: session.manualReveal,
    wrongWords: session.wrongWords as unknown as QuizWord[] | undefined,
  };
}

export async function clearQuizSessionFromDB() {
  const userId = await getUserId();

  await prisma.quizSession.deleteMany({
    where: { userId },
  });
}
