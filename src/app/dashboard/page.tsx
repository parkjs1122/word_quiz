import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import StatsCard from "@/components/dashboard/StatsCard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [total, memorized] = await Promise.all([
    prisma.word.count({ where: { userId } }),
    prisma.word.count({ where: { userId, memorized: true } }),
  ]);

  const stats = {
    totalWords: total,
    memorizedCount: memorized,
    unmemorizedCount: total - memorized,
    memorizedRate: total > 0 ? Math.round((memorized / total) * 100) : 0,
  };

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

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/quiz"
              className="flex-1 rounded-lg bg-blue-600 py-3 text-center text-base font-semibold text-white hover:bg-blue-700 sm:py-4 sm:text-lg"
            >
              퀴즈 시작 ({stats.unmemorizedCount}개 미암기)
            </Link>
            <Link
              href="/mypage"
              className="flex-1 rounded-lg border border-gray-300 py-3 text-center text-base font-semibold hover:bg-gray-50 sm:py-4 sm:text-lg dark:border-gray-600 dark:hover:bg-gray-800"
            >
              단어 관리
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
