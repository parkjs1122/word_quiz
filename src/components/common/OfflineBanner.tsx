"use client";

import { useOffline } from "@/lib/offline/context";

export default function OfflineBanner() {
  const { isOnline, isSyncing, syncProgress, pendingCount } = useOffline();

  // Online and syncing
  if (isOnline && isSyncing && syncProgress) {
    return (
      <div className="bg-blue-500 px-4 py-2 text-center text-sm font-medium text-white">
        학습 결과 동기화 중... ({syncProgress.current}/{syncProgress.total})
      </div>
    );
  }

  // Online with pending actions (sync hasn't started yet)
  if (isOnline && pendingCount > 0) {
    return (
      <div className="bg-blue-500 px-4 py-2 text-center text-sm font-medium text-white">
        동기화 대기 중... ({pendingCount}개 항목)
      </div>
    );
  }

  // Offline
  if (!isOnline) {
    return (
      <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white">
        오프라인 모드 — 로컬에 저장된 데이터로 학습합니다
      </div>
    );
  }

  return null;
}
