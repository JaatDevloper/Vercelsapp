import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getDeviceId } from "@/lib/deviceId";

// Use localStorage for web, AsyncStorage for React Native
const storage = typeof window !== 'undefined' ? localStorage : null;

export interface Profile {
  _id: string;
  deviceId: string;
  name: string;
  email: string;
  avatarUrl: string;
  income: number;
  expense: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfileData {
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
  income?: number;
  expense?: number;
  currency?: string;
}

async function fetchProfile(deviceId: string): Promise<Profile> {
  const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";
  
  const response = await fetch(`${baseUrl}/api/profile?deviceId=${encodeURIComponent(deviceId)}`);
  
  if (response.status === 404) {
    throw new Error("PROFILE_NOT_FOUND");
  }
  
  if (!response.ok) {
    throw new Error("Failed to fetch profile");
  }
  
  return response.json();
}

async function createProfile(data: CreateProfileData & { deviceId: string }): Promise<Profile> {
  const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";
  
  const response = await fetch(`${baseUrl}/api/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create profile");
  }
  
  return response.json();
}

export interface LoginProfileData {
  name?: string;
  email: string;
  password: string;
}

async function updateProfilePhoto(data: { deviceId: string; avatarUrl: string }): Promise<Profile> {
  const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";
  
  const response = await fetch(`${baseUrl}/api/profile/photo`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update profile photo");
  }
  
  return response.json();
}

async function loginProfile(data: LoginProfileData & { newDeviceId: string }): Promise<Profile> {
  const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";
  
  const params = new URLSearchParams();
  if (data.name) params.append("name", data.name);
  params.append("email", data.email);
  params.append("password", data.password);
  params.append("newDeviceId", data.newDeviceId);
  
  const response = await fetch(`${baseUrl}/api/profile?${params.toString()}`);
  
  if (response.status === 404) {
    throw new Error("PROFILE_NOT_FOUND");
  }
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to login");
  }
  
  return response.json();
}

async function requestOTP(email: string): Promise<{ message: string }> {
  const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";
  
  const response = await fetch(`${baseUrl}/api/otp/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to send OTP");
  }
  
  return response.json();
}

async function verifyOTP(email: string, otp: string): Promise<{ message: string }> {
  const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";
  
  const response = await fetch(`${baseUrl}/api/otp/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: email.trim().toLowerCase(), otp }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Invalid OTP");
  }
  
  return response.json();
}

async function logoutProfile(deviceId: string): Promise<{ message: string }> {
  const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";
  
  const response = await fetch(`${baseUrl}/api/profile/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ deviceId }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to logout");
  }
  
  return response.json();
}

export function useProfile() {
  const queryClient = useQueryClient();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize from persistent storage and device ID
  useEffect(() => {
    const initializeProfile = async () => {
      try {
        // Get device ID
        const id = await getDeviceId();
        setDeviceId(id);
        
        // Check if user was logged out (persistent flag)
        // Use localStorage on web for better compatibility
        if (storage) {
          const loggedOutFlag = storage.getItem(`logout_${id}`);
          if (loggedOutFlag === "true") {
            console.log("User is logged out from localStorage, preventing auto-login");
            setIsLoggedOut(true);
          } else {
            // Ensure isLoggedOut is false if no flag exists
            setIsLoggedOut(false);
          }
        }
      } catch (error) {
        console.error("Error initializing profile:", error);
        setDeviceId(null);
      } finally {
        // CRITICAL: Mark initialization as complete before enabling query
        setIsInitializing(false);
      }
    };
    
    initializeProfile();
  }, []);

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery<Profile>({
    queryKey: ["profile", deviceId],
    queryFn: () => fetchProfile(deviceId!),
    // CRITICAL: Only enable after initialization AND device ID exists AND user not logged out
    enabled: !!deviceId && !isLoggedOut && !isInitializing,
    retry: false,
    staleTime: 30 * 60 * 1000, // 30 minutes - prevent auto-refetch after login
    gcTime: 60 * 60 * 1000, // 60 minutes cache retention
    refetchOnWindowFocus: false, // CRITICAL: Disable auto-refetch when window regains focus
    refetchOnReconnect: false, // Disable auto-refetch on network reconnect
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: CreateProfileData) => {
      if (!deviceId) {
        throw new Error("Device ID not available");
      }
      return createProfile({ ...data, deviceId });
    },
    onSuccess: async (newProfile) => {
      // Clear logged out flag when user creates a new profile
      setIsLoggedOut(false);
      // Remove the logout flag from localStorage
      if (deviceId && storage) {
        storage.removeItem(`logout_${deviceId}`);
        console.log("Profile creation successful: logout flag cleared");
      }
      // Set profile data in cache for immediate UI update
      queryClient.setQueryData(["profile", deviceId], newProfile);
      // Force refetch to ensure query is enabled and running
      setTimeout(() => {
        refetch();
      }, 0);
    },
  });

  const loginProfileMutation = useMutation({
    mutationFn: async (data: LoginProfileData) => {
      if (!deviceId) {
        throw new Error("Device ID not available");
      }
      return loginProfile({ ...data, newDeviceId: deviceId });
    },
    onSuccess: async (existingProfile) => {
      console.log("Login mutation succeeded, clearing logout state");
      
      // Remove the logout flag from localStorage FIRST
      if (deviceId && storage) {
        storage.removeItem(`logout_${deviceId}`);
        console.log(`Login successful: cleared logout_${deviceId} flag from localStorage`);
      }
      
      // Set profile data in cache for immediate UI update
      queryClient.setQueryData(["profile", deviceId], existingProfile);
      
      // CRITICAL: Reset isLoggedOut state to re-enable query execution
      // This must happen AFTER clearing the flag so it takes effect
      setIsLoggedOut(false);
      console.log("isLoggedOut set to false, query should now be enabled");
    },
  });

  const updatePhotoMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      if (!deviceId) {
        throw new Error("Device ID not available");
      }
      return updateProfilePhoto({ deviceId, avatarUrl });
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["profile", deviceId], updatedProfile);
    },
  });

  const profileNotFound = error?.message === "PROFILE_NOT_FOUND";

  const otpRequestMutation = useMutation({
    mutationFn: async (email: string) => {
      return requestOTP(email);
    },
  });

  const otpVerifyMutation = useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      return verifyOTP(email, otp);
    },
  });

  const logout = async () => {
    if (!deviceId) {
      throw new Error("Device ID not available");
    }
    
    try {
      // Call logout endpoint to clear session on server
      await logoutProfile(deviceId);
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue even if API fails
    }
    
    // CRITICAL: Set logged out flag to prevent query from re-enabling
    setIsLoggedOut(true);
    
    // CRITICAL: Persist logout flag to localStorage so it survives page refresh
    try {
      if (storage) {
        storage.setItem(`logout_${deviceId}`, "true");
        console.log("Logout flag saved to localStorage");
      }
    } catch (error) {
      console.error("Failed to persist logout flag:", error);
    }
    
    // Cancel any in-flight queries
    queryClient.cancelQueries({ queryKey: ["profile", deviceId] });
    
    // Clear only this profile's data from cache
    queryClient.setQueryData(["profile", deviceId], undefined);
  };

  return {
    profile,
    isLoading: isLoading || !deviceId,
    error: profileNotFound || isLoggedOut ? null : error,
    profileExists: !!profile && !profileNotFound && !isLoggedOut,
    profileNotFound: profileNotFound || isLoggedOut,
    createProfile: createProfileMutation.mutate,
    isCreating: createProfileMutation.isPending,
    createError: createProfileMutation.error,
    loginProfile: loginProfileMutation.mutate,
    isLoggingIn: loginProfileMutation.isPending,
    loginError: loginProfileMutation.error,
    updatePhoto: updatePhotoMutation.mutate,
    isUpdatingPhoto: updatePhotoMutation.isPending,
    updatePhotoError: updatePhotoMutation.error,
    requestOTP: otpRequestMutation.mutateAsync,
    isRequestingOTP: otpRequestMutation.isPending,
    verifyOTP: (email: string, otp: string) => otpVerifyMutation.mutateAsync({ email, otp }),
    isVerifyingOTP: otpVerifyMutation.isPending,
    refetch,
    deviceId,
    logout,
  };
}
