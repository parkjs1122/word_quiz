"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toLocalDateString } from "@/lib/date-utils";

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

/**
 * 오늘의 퀴즈 진행 상황을 저장/업데이트합니다.
 * 매 답변마다 호출되어 퀴즈를 끝까지 완료하지 않아도 캘린더에 기록됩니다.
 */
export async function saveQuizProgress(data: {
  totalAnswered: number;
  correctCount: number;
  wrongCount: number;
  quizMode: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("인증이 필요합니다.");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 오늘 같은 모드의 기존 레코드를 찾아 업데이트, 없으면 생성
  const existing = await prisma.quizHistory.findFirst({
    where: {
      userId: session.user.id,
      quizDate: today,
      quizMode: data.quizMode,
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    await prisma.quizHistory.update({
      where: { id: existing.id },
      data: {
        totalWords: data.totalAnswered,
        correctCount: data.correctCount,
        wrongCount: data.wrongCount,
      },
    });
  } else {
    await prisma.quizHistory.create({
      data: {
        userId: session.user.id,
        quizDate: today,
        totalWords: data.totalAnswered,
        correctCount: data.correctCount,
        wrongCount: data.wrongCount,
        quizMode: data.quizMode,
      },
    });
  }
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

  return results.map((r) => toLocalDateString(r.quizDate));
}
