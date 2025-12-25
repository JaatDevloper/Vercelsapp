import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getDeviceId } from "@/lib/deviceId";

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

export interface LoginProfileData {
  name?: string;
  email: string;
  password: string;
}

/* ===================== API HELPERS ===================== */

const getBaseUrl = () =>
  process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";

async function fetchProfile(deviceId: string): Promise<Profile> {
  const res = await fetch(
    `${getBaseUrl()}/api/profile?deviceId=${encodeURIComponent(deviceId)}`
  );

  if (res.status === 404) throw new Error("PROFILE_NOT_FOUND");
  if (!res.ok) throw new Error("FETCH_PROFILE_FAILED");

  return res.json();
}

async function createProfile(
  data: CreateProfileData & { deviceId: string }
): Promise<Profile> {
  const res = await fetch(`${getBaseUrl()}/api/profile`, {
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

  const res = await fetch(`${getBaseUrl()}/api/profile?${params}`);

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
  const res = await fetch(`${getBaseUrl()}/api/profile/photo`, {
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

async function logoutProfile(deviceId: string) {
  await fetch(`${getBaseUrl()}/api/profile/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId }),
  });
}

async function requestOTP(email: string): Promise<{ message: string }> {
  const res = await fetch(`${getBaseUrl()}/api/otp/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });

  if (!res.ok) {
    const e = await res.json();
    throw new Error(e.error || "SEND_OTP_FAILED");
  }

  return res.json();
}

async function verifyOTP(email: string, otp: string): Promise<{ message: string }> {
  const res = await fetch(`${getBaseUrl()}/api/otp/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: email.trim().toLowerCase(), otp }),
  });

  if (!res.ok) {
    const e = await res.json();
    throw new Error(e.error || "VERIFY_OTP_FAILED");
  }

  return res.json();
}

/* ===================== HOOK ===================== */

export function useProfile() {
  const queryClient = useQueryClient();
  const [deviceId, setDeviceId] = useState<string | null>(null);

  /* -------- Init Device ID -------- */
  useEffect(() => {
    getDeviceId().then(setDeviceId).catch(() => setDeviceId(null));
  }, []);

  /* -------- Profile Query -------- */
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery<Profile>({
    queryKey: ["profile", deviceId],
    queryFn: () => fetchProfile(deviceId!),
    enabled: !!deviceId,
    retry: false,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  /* -------- Mutations -------- */

  const createProfileMutation = useMutation({
    mutationFn: (data: CreateProfileData) =>
      createProfile({ ...data, deviceId: deviceId! }),
    onSuccess: (newProfile) => {
      queryClient.setQueryData(["profile", deviceId], newProfile);
    },
  });

  const loginProfileMutation = useMutation({
    mutationFn: (data: LoginProfileData) =>
      loginProfile({ ...data, newDeviceId: deviceId! }),
    onSuccess: (existingProfile) => {
      // Set profile data immediately
      queryClient.setQueryData(["profile", deviceId], existingProfile);
      // Invalidate to trigger a fresh fetch and confirm login
      queryClient.invalidateQueries({ queryKey: ["profile", deviceId] });
    },
  });

  const updatePhotoMutation = useMutation({
    mutationFn: (avatarUrl: string) =>
      updateProfilePhoto({ deviceId: deviceId!, avatarUrl }),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["profile", deviceId], updatedProfile);
    },
  });

  const logout = async () => {
    if (!deviceId) return;

    try {
      await logoutProfile(deviceId);
    } catch {}

    // Clear profile data and remove query
    queryClient.removeQueries({ queryKey: ["profile", deviceId] });
  };

  /* -------- OTP Mutations -------- */

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

  /* -------- Derived State -------- */

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

    requestOTP: otpRequestMutation.mutateAsync,
    isRequestingOTP: otpRequestMutation.isPending,
    verifyOTP: (email: string, otp: string) => otpVerifyMutation.mutateAsync({ email, otp }),
    isVerifyingOTP: otpVerifyMutation.isPending,

    deviceId,
    logout,
  };
}
