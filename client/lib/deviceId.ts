import * as Application from "expo-application";
import { Platform } from "react-native";

let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    if (Platform.OS === "ios") {
      const iosId = await Application.getIosIdForVendorAsync();
      cachedDeviceId = iosId || generateFallbackId();
    } else if (Platform.OS === "android") {
      cachedDeviceId = Application.getAndroidId() || generateFallbackId();
    } else {
      cachedDeviceId = generateWebDeviceId();
    }
  } catch (error) {
    console.error("Error getting device ID:", error);
    cachedDeviceId = generateFallbackId();
  }

  return cachedDeviceId;
}

function generateFallbackId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `fallback-${timestamp}-${randomPart}`;
}

function generateWebDeviceId(): string {
  const storageKey = "quizbot_device_id";
  
  if (typeof window !== "undefined" && window.localStorage) {
    const existing = window.localStorage.getItem(storageKey);
    if (existing) {
      return existing;
    }
    
    const newId = `web-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 15)}`;
    window.localStorage.setItem(storageKey, newId);
    return newId;
  }
  
  return generateFallbackId();
}
