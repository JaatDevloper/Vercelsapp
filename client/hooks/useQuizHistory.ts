import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo } from "react";
import { getDeviceId } from "@/lib/deviceId";
import type { QuizHistoryItem } from "@/types/quiz";

export interface QuizHistoryItemWithDevice extends QuizHistoryItem {
  deviceId: string;
}

async function fetchHistory(deviceId: string): Promise<QuizHistoryItem[]> {
  const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";
  
  const response = await fetch(`${baseUrl}/api/history?deviceId=${encodeURIComponent(deviceId)}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch quiz history");
  }
  
  return response.json();
}

async function addHistoryItem(data: Omit<QuizHistoryItem, "id"> & { deviceId: string; userName?: string; userEmail?: string }): Promise<QuizHistoryItem> {
  const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";
  
  const response = await fetch(`${baseUrl}/api/history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to save quiz history");
  }
  
  return response.json();
}

async function clearHistoryItems(deviceId: string): Promise<void> {
  const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";
  
  const response = await fetch(`${baseUrl}/api/history?deviceId=${encodeURIComponent(deviceId)}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to clear quiz history");
  }
}

export function useQuizHistory() {
  const queryClient = useQueryClient();
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const {
    data: history = [],
    isLoading,
    error,
    refetch,
  } = useQuery<QuizHistoryItem[]>({
    queryKey: ["quizHistory", deviceId],
    queryFn: () => fetchHistory(deviceId!),
    enabled: !!deviceId,
  });

  const addHistoryMutation = useMutation({
    mutationFn: async (item: Omit<QuizHistoryItem, "id"> & { userName?: string; userEmail?: string }) => {
      if (!deviceId) {
        throw new Error("Device ID not available");
      }
      return addHistoryItem({ ...item, deviceId });
    },
    onSuccess: (newItem) => {
      queryClient.setQueryData<QuizHistoryItem[]>(["quizHistory", deviceId], (old) => {
        return [newItem, ...(old || [])];
      });
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      if (!deviceId) {
        throw new Error("Device ID not available");
      }
      return clearHistoryItems(deviceId);
    },
    onSuccess: () => {
      queryClient.setQueryData<QuizHistoryItem[]>(["quizHistory", deviceId], []);
    },
  });

  const addHistory = useCallback((item: Omit<QuizHistoryItem, "id"> & { userName?: string; userEmail?: string }) => {
    addHistoryMutation.mutate(item);
  }, [addHistoryMutation]);

  const clearHistory = useCallback(() => {
    clearHistoryMutation.mutate();
  }, [clearHistoryMutation]);

  const getStats = useCallback(() => {
    if (history.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        perfectScores: 0,
      };
    }

    const totalQuizzes = history.length;
    const totalScore = history.reduce((sum, item) => sum + item.score, 0);
    const averageScore = Math.round(totalScore / totalQuizzes);
    const bestScore = Math.max(...history.map((item) => item.score));
    const perfectScores = history.filter((item) => item.score === 100).length;

    return {
      totalQuizzes,
      averageScore,
      bestScore,
      perfectScores,
    };
  }, [history]);

  return {
    history,
    addHistory,
    clearHistory,
    getStats,
    isLoading: isLoading || !deviceId,
    error,
    refetch,
    deviceId,
  };
}
