"use client";

interface StreakCalendarProps {
  activeDates: string[]; // 로컬 타임존 기준 YYYY-MM-DD
  streak: number;
  todayStr: string; // 서버에서 전달받은 오늘 날짜 (YYYY-MM-DD)
}

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function StreakCalendar({
  activeDates,
  streak,
  todayStr,
}: StreakCalendarProps) {
  const activeSet = new Set(activeDates);

  // Generate last 91 days (13 weeks) based on server-provided today
  const days: { date: string; active: boolean }[] = [];
  const today = new Date(todayStr + "T00:00:00");

  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = toLocalDateString(d);
    days.push({ date: dateStr, active: activeSet.has(dateStr) });
  }

  // Pad start to align with day of week (Monday = 0)
  const firstDay = new Date(days[0].date + "T00:00:00");
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
