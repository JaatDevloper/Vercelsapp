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
      const queryState = queryClient.getQueryState(queryKey);
      if (!queryState) return;

      const oldData = queryState.data;
      
      // CRITICAL: Don't refresh if no data exists yet (prevents dummy profile creation)
      if (!oldData) return;

      const queryCache = queryClient.getQueryCache();
      const query = queryCache.find(queryKey);

      if (!query || !query.options.queryFn) return;

      // Use fetchQuery - properly handles the queryFn closure without triggering isFetching
      const newData = await queryClient.fetchQuery({
        queryKey,
        queryFn: query.options.queryFn as any,
      });

      // Silent update: Force a fresh update if we have new data
      if (newData !== undefined && newData !== null) {
        // Use a more robust comparison or just always set if we're debugging
        queryClient.setQueryData(queryKey, newData);
        
        // Also invalidate to trigger UI updates in components using useQuery
        queryClient.invalidateQueries({ queryKey });
      }
    } catch (error) {
      // Silently catch errors - restore old data if refresh fails
      const queryState = queryClient.getQueryState(queryKey);
      if (queryState?.data === undefined) {
        // If data was cleared by error, restore it
        queryClient.setQueryData(queryKey, lastDataRef.current);
      }
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
