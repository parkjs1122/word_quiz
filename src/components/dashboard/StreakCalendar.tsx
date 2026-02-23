"use client";

interface StreakCalendarProps {
  activeDates: string[]; // ISO date strings (YYYY-MM-DD)
  streak: number;
}

export default function StreakCalendar({
  activeDates,
  streak,
}: StreakCalendarProps) {
  const activeSet = new Set(activeDates);

  // Generate last 91 days (13 weeks)
  const days: { date: string; active: boolean }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({ date: dateStr, active: activeSet.has(dateStr) });
  }

  // Pad start to align with day of week (Monday = 0)
  const firstDay = new Date(days[0].date);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday=0
  const padded = [
    ...Array.from({ length: startDow }, () => null),
    ...days,
  ];

  const cellSize = 12;
  const gap = 2;
  const cols = Math.ceil(padded.length / 7);
  const width = cols * (cellSize + gap);
  const height = 7 * (cellSize + gap);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          학습 캘린더
        </h3>
        {streak > 0 && (
          <span className="text-sm font-medium text-orange-500">
            {streak}일 연속 학습 중
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <svg width={width} height={height + 4}>
          {padded.map((day, i) => {
            if (!day) return null;
            const col = Math.floor(i / 7);
            const row = i % 7;
            const x = col * (cellSize + gap);
            const y = row * (cellSize + gap);

            return (
              <rect
                key={day.date}
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                rx={2}
                className={
                  day.active
                    ? "fill-green-500 dark:fill-green-400"
                    : "fill-gray-100 dark:fill-gray-700"
                }
              >
                <title>{day.date}</title>
              </rect>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
