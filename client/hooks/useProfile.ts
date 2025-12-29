import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getDeviceId } from "@/lib/deviceId";

/* ===================== TYPES ===================== */

export interface Profile {
  _id: string;
  deviceId: string;
  name: string;
  email: string;
  avatarUrl: string;
  selectedBadgeId: string;
  selectedFrameId: string;
  isPremium?: boolean;
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

export interface LoginProfileData {
  name?: string;
  email: string;
  password: string;
}

/* ===================== API ===================== */

const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

async function fetchProfile(deviceId: string): Promise<Profile> {
  const res = await fetch(
    `${baseUrl}/api/profile?deviceId=${encodeURIComponent(deviceId)}`
  );

  if (res.status === 404) throw new Error("PROFILE_NOT_FOUND");
  if (!res.ok) throw new Error("FETCH_PROFILE_FAILED");

  return res.json();
}

async function createProfile(
  data: CreateProfileData & { deviceId: string }
): Promise<Profile> {
  const res = await fetch(`${baseUrl}/api/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const e = await res.json();
    throw new Error(e.error || "CREATE_PROFILE_FAILED");
  }

  return res.json();
}

async function loginProfile(
  data: LoginProfileData & { newDeviceId: string }
): Promise<Profile> {
  const params = new URLSearchParams({
    email: data.email,
    password: data.password,
    newDeviceId: data.newDeviceId,
  });

  if (data.name) params.append("name", data.name);

  const res = await fetch(`${baseUrl}/api/profile?${params}`);

  if (res.status === 404) throw new Error("PROFILE_NOT_FOUND");
  if (!res.ok) {
    const e = await res.json();
    throw new Error(e.error || "LOGIN_FAILED");
  }

  return res.json();
}

async function updateProfilePhoto(data: {
  deviceId: string;
  avatarUrl: string;
}): Promise<Profile> {
  const res = await fetch(`${baseUrl}/api/profile/photo`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const e = await res.json();
    throw new Error(e.error || "UPDATE_PHOTO_FAILED");
  }

  return res.json();
}

async function updateProfileBadge(data: {
  deviceId: string;
  badgeId: string;
}): Promise<Profile> {
  const res = await fetch(`${baseUrl}/api/profile/badge`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const e = await res.json();
    throw new Error(e.error || "UPDATE_BADGE_FAILED");
  }

  return res.json();
}

async function updateProfileFrame(data: {
  deviceId: string;
  frameId: string;
}): Promise<Profile> {
  const res = await fetch(`${baseUrl}/api/profile/frame`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const e = await res.json();
    throw new Error(e.error || "UPDATE_FRAME_FAILED");
  }

  return res.json();
}

async function logoutProfile(deviceId: string) {
  await fetch(`${baseUrl}/api/profile/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId }),
  });
}

/* ===================== HOOK ===================== */

export function useProfile() {
  const queryClient = useQueryClient();

  const [deviceId, setDeviceId] = useState<string | null>(null);

  // 🔐 SINGLE AUTH GATE (THIS FIXES EVERYTHING)
  const [authEnabled, setAuthEnabled] = useState(false);

  /* -------- Init -------- */
  useEffect(() => {
    getDeviceId()
      .then((id) => {
        setDeviceId(id);
        setAuthEnabled(true); // allow auto-login on fresh app start
      })
      .catch(() => setDeviceId(null));
  }, []);

  /* -------- Profile Query -------- */
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery<Profile>({
    queryKey: ["profile", deviceId],
    queryFn: () => fetchProfile(deviceId!),
    enabled: !!deviceId && authEnabled,
    retry: false,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  /* ===================== MUTATIONS ===================== */

  const createProfileMutation = useMutation({
    mutationFn: (data: CreateProfileData) =>
      createProfile({ ...data, deviceId: deviceId! }),
    onSuccess: (newProfile) => {
      setAuthEnabled(true);
      queryClient.setQueryData(["profile", deviceId], newProfile);
    },
  });

  const loginProfileMutation = useMutation({
    mutationFn: (data: LoginProfileData) =>
      loginProfile({ ...data, newDeviceId: deviceId! }),
    onSuccess: (existingProfile) => {
      setAuthEnabled(true);
      queryClient.setQueryData(["profile", deviceId], existingProfile);
    },
  });

  const updatePhotoMutation = useMutation({
    mutationFn: (avatarUrl: string) =>
      updateProfilePhoto({ deviceId: deviceId!, avatarUrl }),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["profile", deviceId], updatedProfile);
    },
  });

  const updateBadgeMutation = useMutation({
    mutationFn: (badgeId: string) =>
      updateProfileBadge({ deviceId: deviceId!, badgeId }),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["profile", deviceId], updatedProfile);
    },
  });

  const updateFrameMutation = useMutation({
    mutationFn: (frameId: string) =>
      updateProfileFrame({ deviceId: deviceId!, frameId }),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["profile", deviceId], updatedProfile);
    },
  });

  /* ===================== LOGOUT (FINAL FIX) ===================== */

  const logout = async () => {
    if (!deviceId) return;

    // 🔒 STOP AUTO FETCH FIRST
    setAuthEnabled(false);

    try {
      await logoutProfile(deviceId);
    } catch {}

    // 🧹 CLEAR PROFILE COMPLETELY
    queryClient.removeQueries({ queryKey: ["profile", deviceId] });
  };

  /* ===================== DERIVED STATE ===================== */

  const profileNotFound =
    error instanceof Error && error.message === "PROFILE_NOT_FOUND";

  return {
    profile,
    isLoading: isLoading || !deviceId,

    profileExists: !!profile,
    profileNotFound,

    createProfile: createProfileMutation.mutate,
    isCreating: createProfileMutation.isPending,
    createError: createProfileMutation.error,

    loginProfile: loginProfileMutation.mutate,
    isLoggingIn: loginProfileMutation.isPending,
    loginError: loginProfileMutation.error,

    updatePhoto: updatePhotoMutation.mutate,
    isUpdatingPhoto: updatePhotoMutation.isPending,
    updatePhotoError: updatePhotoMutation.error,

    updateBadge: updateBadgeMutation.mutate,
    isUpdatingBadge: updateBadgeMutation.isPending,

    updateFrame: updateFrameMutation.mutate,
    isUpdatingFrame: updateFrameMutation.isPending,

    requestOTP: async (email: string) => {
      const res = await fetch(`${baseUrl}/api/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to request OTP");
      }
      return res.json();
    },

    verifyOTP: async (email: string, otp: string) => {
      const res = await fetch(`${baseUrl}/api/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Invalid OTP");
      }
      return res.json();
    },

    resetPassword: async (data: any) => {
      const res = await fetch(`${baseUrl}/api/profile/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to reset password");
      }
      return res.json();
    },

    changePassword: async (data: any) => {
      const res = await fetch(`${baseUrl}/api/profile/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, deviceId: deviceId! }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to change password");
      }
      return res.json();
    },

    deviceId,
    logout,
    authEnabled,
  };
}
