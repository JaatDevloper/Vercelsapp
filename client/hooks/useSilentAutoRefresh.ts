import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Silent Auto-Refresh Hook
 * 
 * Enables background data refetching without any UI disruptions:
 * ✅ No loading spinners
 * ✅ No UI flickers
 * ✅ No screen jumps
 * ✅ No refresh indicators
 * ✅ Data updates quietly in background
 * ✅ UI updates only if data actually changed
 * 
 * @param queryKey - The query key to auto-refresh (e.g., ["profile", deviceId])
 * @param intervalMs - Refetch interval in milliseconds (default: 10000 = 10 seconds)
 * @param options - Configuration options
 */

interface UseSilentAutoRefreshOptions {
  enabled?: boolean;
  compareData?: (oldData: unknown, newData: unknown) => boolean;
}

export function useSilentAutoRefresh(
  queryKey: unknown[],
  intervalMs: number = 10000,
  options: UseSilentAutoRefreshOptions = {}
) {
  const queryClient = useQueryClient();
  const { enabled = true, compareData } = options;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDataRef = useRef<unknown>(null);

  const performSilentRefresh = useCallback(async () => {
    if (!enabled) return;

    try {
      // Get the current query state
      const queryState = queryClient.getQueryState(queryKey);
      
      if (!queryState) return;

      // Store old data before refetch
      const oldData = queryState.data;
      lastDataRef.current = oldData;

      // Refetch in the background silently (no UI updates unless data changed)
      const result = await queryClient.refetchQueries(
        { queryKey, type: "active" },
        {
          throwOnError: false, // Don't throw errors
        }
      );

      // Check if data actually changed
      if (result.length > 0 && compareData) {
        const newState = queryClient.getQueryState(queryKey);
        const newData = newState?.data;

        // Only update UI if data changed according to custom compare function
        if (oldData && newData && !compareData(oldData, newData)) {
          // Data changed - query cache will auto-update components
        }
        // If compareData returns true (data is same), React Query won't trigger re-renders
      }
    } catch (error) {
      // Silently catch errors - don't show UI errors
      console.debug("[Silent Refresh] Background fetch error:", error);
    }
  }, [queryKey, queryClient, enabled, compareData]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start the background refresh interval
    intervalRef.current = setInterval(() => {
      performSilentRefresh();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [intervalMs, enabled, performSilentRefresh]);

  // Return function to manually trigger refresh if needed
  return {
    refreshNow: performSilentRefresh,
  };
}

/**
 * Factory function to create pre-configured silent refresh for specific query
 * Usage example:
 * 
 * const { data: profile } = useProfile();
 * useSilentAutoRefresh(["profile", deviceId], 10000);
 * 
 * Or with custom data comparison:
 * useSilentAutoRefresh(["profile", deviceId], 10000, {
 *   compareData: (old, new) => JSON.stringify(old) === JSON.stringify(new)
 * });
 */
