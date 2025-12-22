import { useState, useEffect } from "react";
import { useProfile } from "./useProfile";

interface AdminAccessResponse {
  isAdmin: boolean;
  isLoading: boolean;
  role: "admin" | "moderator" | "user" | null;
}

export function useAdminAccess(): AdminAccessResponse {
  const { profile } = useProfile();
  const [role, setRole] = useState<"admin" | "moderator" | "user" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      // Check if user is admin or moderator
      const userRole = (profile as any).role || "user";
      setRole(userRole);
      setIsLoading(false);
    } else {
      setRole(null);
      setIsLoading(false);
    }
  }, [profile]);

  return {
    isAdmin: role === "admin" || role === "moderator",
    isLoading,
    role,
  };
}
