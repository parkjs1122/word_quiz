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

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOnline || pendingCount === 0) return;

    let cancelled = false;

    async function doSync() {
      setIsSyncing(true);
      try {
        await syncPendingActions((current, total) => {
          if (!cancelled) {
            setSyncProgress({ current, total });
          }
        });
      } catch {
        // Sync failed, will retry next time
      } finally {
        if (!cancelled) {
          setIsSyncing(false);
          setSyncProgress(null);
          await refreshOfflineStatus();
        }
      }
    }

    doSync();
    return () => {
      cancelled = true;
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
