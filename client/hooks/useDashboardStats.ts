import { useQuery } from "@tanstack/react-query";

export interface DashboardStats {
  totalUsers: number;
  totalQuizzes: number;
  totalRooms: number;
  activeRooms: number;
  avgScore: number;
  totalAttempts: number;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";

  const response = await fetch(`${baseUrl}/api/admin/stats`);

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }

  return response.json();
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Garbage collect after 10 minutes
    retry: 2,
  });
}
