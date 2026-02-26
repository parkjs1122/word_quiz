"use client";

import { useState, useEffect } from "react";
import { getOfflineData } from "@/actions/offline";
import {
  saveWordsToLocal,
  saveFoldersToLocal,
  setMetaValue,
  getMetaValue,
} from "@/lib/offline/db";
import { useOffline } from "@/lib/offline/context";

export default function PrepareOfflineButton() {
  const { refreshOfflineStatus } = useOffline();
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function loadMeta() {
      try {
        const syncAt = (await getMetaValue("lastSyncAt")) as string | null;
        const count = (await getMetaValue("wordCount")) as number | null;
        if (syncAt) setLastSync(syncAt);
        if (count) setWordCount(count);
      } catch {
        // IndexedDB not available
      }
    }
    loadMeta();
  }, []);

  async function handlePrepare() {
    setLoading(true);
    setDone(false);
    try {
      const data = await getOfflineData();

      await saveWordsToLocal(
        data.words.map((w) => ({
          id: w.id,
          word: w.word,
          meaning: w.meaning,
          memorized: w.memorized,
          level: w.level,
          nextReviewAt: w.nextReviewAt,
          folderId: w.folderId,
        }))
      );
      await saveFoldersToLocal(data.folders);
      await setMetaValue("lastSyncAt", new Date().toISOString());
      await setMetaValue("wordCount", data.stats.totalWords);

      setLastSync(new Date().toISOString());
      setWordCount(data.stats.totalWords);
      setDone(true);
      await refreshOfflineStatus();

      setTimeout(() => setDone(false), 3000);
    } catch {
      // Failed to prepare
    } finally {
      setLoading(false);
    }
  }

  function formatTimeAgo(isoString: string): string {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  }

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              오프라인 모드
            </span>
          </div>
          {lastSync && (
            <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
              {wordCount}개 단어 저장됨 · {formatTimeAgo(lastSync)}
            </p>
          )}
        </div>
        <button
          onClick={handlePrepare}
          disabled={loading}
          className={`shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            done
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          } disabled:opacity-50`}
        >
          {loading ? "다운로드 중..." : done ? "준비 완료!" : lastSync ? "업데이트" : "오프라인 준비"}
        </button>
      </div>
    </div>
  );
}
