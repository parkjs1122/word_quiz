"use client";

interface DayData {
  date: string;
  correct: number;
  wrong: number;
}

interface LearningGraphProps {
  data: DayData[];
}

export default function LearningGraph({ data }: LearningGraphProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          아직 학습 기록이 없습니다. 퀴즈를 풀면 여기에 기록이 표시됩니다.
        </p>
      </div>
    );
  }

  const maxTotal = Math.max(...data.map((d) => d.correct + d.wrong), 1);
  const chartHeight = 120;
  const barWidth = Math.min(16, Math.floor(280 / data.length));
  const gap = 2;
  const chartWidth = data.length * (barWidth + gap);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        최근 학습 기록
      </h3>
      <div className="overflow-x-auto">
        <svg
          width={Math.max(chartWidth, 280)}
          height={chartHeight + 24}
          className="mx-auto"
        >
          {data.map((d, i) => {
            const total = d.correct + d.wrong;
            const totalH = (total / maxTotal) * chartHeight;
            const correctH = (d.correct / maxTotal) * chartHeight;
            const x = i * (barWidth + gap);
            const showLabel = i === 0 || i === data.length - 1 || i % 7 === 0;

            return (
              <g key={d.date}>
                {/* Wrong (bottom stacked) */}
                <rect
                  x={x}
                  y={chartHeight - totalH}
                  width={barWidth}
                  height={totalH - correctH}
                  rx={2}
                  className="fill-red-400 dark:fill-red-500"
                />
                {/* Correct (top stacked) */}
                <rect
                  x={x}
                  y={chartHeight - totalH + (totalH - correctH)}
                  width={barWidth}
                  height={correctH}
                  rx={2}
                  className="fill-green-400 dark:fill-green-500"
                />
                {/* Date label */}
                {showLabel && (
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 16}
                    textAnchor="middle"
                    className="fill-gray-400 text-[9px] dark:fill-gray-500"
                  >
                    {d.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-400" />
          정답
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-400" />
          오답
        </span>
      </div>
    </div>
  );
}
