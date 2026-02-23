"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function saveQuizResult(data: {
  totalWords: number;
  correctCount: number;
  wrongCount: number;
  quizMode: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("인증이 필요합니다.");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.quizHistory.create({
    data: {
      userId: session.user.id,
      quizDate: today,
      totalWords: data.totalWords,
      correctCount: data.correctCount,
      wrongCount: data.wrongCount,
      quizMode: data.quizMode,
    },
  });
}

export async function getQuizHistoryLast30Days() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("인증이 필요합니다.");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  return prisma.quizHistory.findMany({
    where: {
      userId: session.user.id,
      quizDate: { gte: thirtyDaysAgo },
    },
    orderBy: { quizDate: "asc" },
  });
}

export async function getQuizDatesLast90Days() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("인증이 필요합니다.");

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  ninetyDaysAgo.setHours(0, 0, 0, 0);

  const results = await prisma.quizHistory.findMany({
    where: {
      userId: session.user.id,
      quizDate: { gte: ninetyDaysAgo },
    },
    select: { quizDate: true },
    distinct: ["quizDate"],
    orderBy: { quizDate: "desc" },
  });

  return results.map((r) => r.quizDate.toISOString().slice(0, 10));
}
