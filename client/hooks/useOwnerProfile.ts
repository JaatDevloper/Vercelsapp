import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/query-client";

export interface OwnerProfile {
  _id?: string;
  name: string;
  title: string;
  imageUrl: string;
  about: string;
  skills: string[];
  profession: string;
  experience: Array<{
    title: string;
    company: string;
    period: string;
  }>;
  socialLinks: {
    behance?: string;
    dribbble?: string;
    linkedin?: string;
    instagram?: string;
  };
  achievements: string[];
}

async function fetchOwnerProfile(): Promise<OwnerProfile> {
  const response = await fetch(`${getApiUrl()}/api/ownerprofile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch owner profile");
  }

  return response.json();
}

export function useOwnerProfile() {
  const {
    data: ownerProfile,
    isLoading,
    error,
    refetch,
  } = useQuery<OwnerProfile>({
    queryKey: ["ownerProfile"],
    queryFn: fetchOwnerProfile,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ownerProfile,
    isLoading,
    error,
    refetch,
  };
}
