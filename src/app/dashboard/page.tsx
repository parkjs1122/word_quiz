import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toLocalDateString } from "@/lib/date-utils";
import Link from "next/link";
import StatsCard from "@/components/dashboard/StatsCard";
import LearningGraph from "@/components/dashboard/LearningGraph";
import StreakCalendar from "@/components/dashboard/StreakCalendar";
import FolderStats from "@/components/dashboard/FolderStats";
import OnboardingOverlay from "@/components/common/OnboardingOverlay";
import PrepareOfflineButton from "@/components/offline/PrepareOfflineButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [total, memorized, reviewDueCount, folders, quizHistory, quizDates] =
    await Promise.all([
      prisma.word.count({ where: { userId } }),
      prisma.word.count({ where: { userId, memorized: true } }),
      prisma.word.count({
        where: { userId, nextReviewAt: { lte: new Date() } },
      }),
      prisma.folder.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          color: true,
          _count: { select: { words: true } },
        },
      }),
      // Last 30 days quiz history
      (() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        return prisma.quizHistory.findMany({
          where: { userId, quizDate: { gte: thirtyDaysAgo } },
          orderBy: { quizDate: "asc" },
        });
      })(),
      // Last 90 days quiz dates for calendar
      (() => {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        ninetyDaysAgo.setHours(0, 0, 0, 0);
        return prisma.quizHistory.findMany({
          where: { userId, quizDate: { gte: ninetyDaysAgo } },
          select: { quizDate: true },
          distinct: ["quizDate"],
          orderBy: { quizDate: "desc" },
        });
      })(),
    ]);

  const stats = {
    totalWords: total,
    memorizedCount: memorized,
    unmemorizedCount: total - memorized,
    memorizedRate: total > 0 ? Math.round((memorized / total) * 100) : 0,
  };

  // Aggregate quiz history by day
  const dailyMap = new Map<string, { correct: number; wrong: number }>();
  for (const h of quizHistory) {
    const dateStr = toLocalDateString(h.quizDate);
    const existing = dailyMap.get(dateStr) || { correct: 0, wrong: 0 };
    existing.correct += h.correctCount;
    existing.wrong += h.wrongCount;
    dailyMap.set(dateStr, existing);
  }
  const graphData = Array.from(dailyMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  // Calendar active dates
  const activeDates = quizDates.map((d) => toLocalDateString(d.quizDate));

  // Calculate streak
  const activeDateSet = new Set(activeDates);
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(today);

  // Check if studied today; if not, start counting from yesterday
  const studiedToday = activeDateSet.has(toLocalDateString(checkDate));
  if (studiedToday) {
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  while (activeDateSet.has(toLocalDateString(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Folder stats with memorized counts
  const folderStats = await Promise.all(
    folders.map(async (f) => {
      const memorizedCount = await prisma.word.count({
        where: { userId, folderId: f.id, memorized: true },
      });
      return {
        name: f.name,
        total: f._count.words,
        memorized: memorizedCount,
        color: f.color || "#3B82F6",
      };
    })
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">대시보드</h1>

      {total === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
          <div className="mb-4 text-5xl">📖</div>
          <h2 className="mb-2 text-xl font-semibold">아직 단어가 없습니다</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            마이페이지에서 단어를 업로드하고 학습을 시작하세요!
          </p>
          <Link
            href="/mypage"
            className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            단어 업로드하기
          </Link>
        </div>
      ) : (
        <>
          <StatsCard {...stats} />

          {/* Action buttons */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/quiz"
              className="flex-1 rounded-lg bg-blue-600 py-3 text-center text-base font-semibold text-white hover:bg-blue-700 sm:py-4 sm:text-lg"
            >
              퀴즈 시작 ({stats.unmemorizedCount}개 미암기)
            </Link>
            {reviewDueCount > 0 && (
              <Link
                href="/quiz?mode=review"
                className="flex-1 rounded-lg bg-orange-500 py-3 text-center text-base font-semibold text-white hover:bg-orange-600 sm:py-4 sm:text-lg"
              >
                오늘 복습 ({reviewDueCount}개)
              </Link>
            )}
            <Link
              href="/mypage"
              className="flex-1 rounded-lg border border-gray-300 py-3 text-center text-base font-semibold hover:bg-gray-50 sm:py-4 sm:text-lg dark:border-gray-600 dark:hover:bg-gray-800"
            >
              단어 관리
            </Link>
          </div>

          {/* Offline preparation */}
          <PrepareOfflineButton />

          {/* Stats grid */}
          <div className="mt-8 space-y-4">
            <StreakCalendar
              activeDates={activeDates}
              streak={streak}
              todayStr={toLocalDateString(today)}
            />
            <LearningGraph data={graphData} />
            <FolderStats folders={folderStats} />
          </div>
        </>
      )}

      <OnboardingOverlay userId={userId} />
    </div>
  );
}
