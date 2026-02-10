"use client";

interface StatsCardProps {
  totalWords: number;
  memorizedCount: number;
  unmemorizedCount: number;
  memorizedRate: number;
}

export default function StatsCard({
  totalWords,
  memorizedCount,
  unmemorizedCount,
  memorizedRate,
}: StatsCardProps) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (memorizedRate / 100) * circumference;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Stats Numbers */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="rounded-lg bg-white p-3 text-center shadow sm:p-4 dark:bg-gray-800">
          <p className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
            {totalWords}
          </p>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400">전체 단어</p>
        </div>
        <div className="rounded-lg bg-white p-3 text-center shadow sm:p-4 dark:bg-gray-800">
          <p className="text-2xl font-bold text-green-600 sm:text-3xl dark:text-green-400">
            {memorizedCount}
          </p>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400">암기 완료</p>
        </div>
        <div className="rounded-lg bg-white p-3 text-center shadow sm:p-4 dark:bg-gray-800">
          <p className="text-2xl font-bold text-red-600 sm:text-3xl dark:text-red-400">
            {unmemorizedCount}
          </p>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400">미암기</p>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="flex items-center justify-center rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div className="relative">
          <svg className="h-32 w-32 -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="text-blue-600 transition-all duration-500 dark:text-blue-400"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {memorizedRate}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
