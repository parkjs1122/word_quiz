"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { isOfflineDataReady, getPendingActions } from "./db";
import { syncPendingActions } from "./sync";

interface OfflineContextValue {
  isOnline: boolean;
  isOfflineReady: boolean;
  pendingCount: number;
  isSyncing: boolean;
  syncProgress: { current: number; total: number } | null;
  refreshOfflineStatus: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue>({
  isOnline: true,
  isOfflineReady: false,
  pendingCount: 0,
  isSyncing: false,
  syncProgress: null,
  refreshOfflineStatus: async () => {},
});

export function useOffline() {
  return useContext(OfflineContext);
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineReadyState, setIsOfflineReadyState] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const refreshOfflineStatus = useCallback(async () => {
    try {
      const ready = await isOfflineDataReady();
      setIsOfflineReadyState(ready);
      const actions = await getPendingActions();
      setPendingCount(actions.length);
    } catch {
      // IndexedDB not available
    }
  }, []);

  // Initialize
  useEffect(() => {
    setIsOnline(navigator.onLine);
    refreshOfflineStatus();
  }, [refreshOfflineStatus]);

  // Listen for online/offline events
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-sync when coming back online (with retry)
  useEffect(() => {
    if (!isOnline || pendingCount === 0) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout>;

    async function doSync() {
      if (cancelled) return;
      setIsSyncing(true);
      try {
        await syncPendingActions((current, total) => {
          if (!cancelled) {
            setSyncProgress({ current, total });
          }
        });
      } catch {
        // Sync failed
      } finally {
        if (!cancelled) {
          setIsSyncing(false);
          setSyncProgress(null);
          await refreshOfflineStatus();
        }
      }

      // Check if there are remaining actions (partial sync)
      if (!cancelled) {
        const remaining = await getPendingActions();
        if (remaining.length > 0) {
          // Retry after 10 seconds
          retryTimer = setTimeout(doSync, 10_000);
        }
      }
    }

    doSync();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [isOnline, pendingCount, refreshOfflineStatus]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isOfflineReady: isOfflineReadyState,
        pendingCount,
        isSyncing,
        syncProgress,
        refreshOfflineStatus,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}
