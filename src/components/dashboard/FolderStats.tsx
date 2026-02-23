"use client";

interface FolderStat {
  name: string;
  total: number;
  memorized: number;
  color: string;
}

interface FolderStatsProps {
  folders: FolderStat[];
}

export default function FolderStats({ folders }: FolderStatsProps) {
  if (folders.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        폴더별 진행도
      </h3>
      <div className="space-y-3">
        {folders.map((f) => {
          const rate = f.total > 0 ? Math.round((f.memorized / f.total) * 100) : 0;
          return (
            <div key={f.name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: f.color }}
                  />
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {f.name}
                  </span>
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {f.memorized}/{f.total} ({rate}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${rate}%`,
                    backgroundColor: f.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
