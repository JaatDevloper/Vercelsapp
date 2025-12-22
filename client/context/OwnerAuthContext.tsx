import React, { createContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OwnerAuthContextType {
  isOwnerLoggedIn: boolean;
  ownerEmail: string | null;
  ownerLogin: (email: string, password: string) => Promise<boolean>;
  ownerLogout: () => Promise<void>;
  isLoading: boolean;
}

export const OwnerAuthContext = createContext<OwnerAuthContextType>({
  isOwnerLoggedIn: false,
  ownerEmail: null,
  ownerLogin: async () => false,
  ownerLogout: async () => {},
  isLoading: true,
});

// Hardcoded owner credentials
const OWNER_CREDENTIALS = {
  email: "akhilchoudhary0078@gmail.com",
  password: "Dofa@6006",
};

const OWNER_AUTH_STORAGE_KEY = "@quizbot_owner_auth";

export function OwnerAuthProvider({ children }: { children: React.ReactNode }) {
  const [isOwnerLoggedIn, setIsOwnerLoggedIn] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if owner is already logged in on app load
  useEffect(() => {
    const checkOwnerAuth = async () => {
      try {
        const storedAuth = await AsyncStorage.getItem(OWNER_AUTH_STORAGE_KEY);
        if (storedAuth === "true") {
          setIsOwnerLoggedIn(true);
          setOwnerEmail(OWNER_CREDENTIALS.email);
        }
      } catch (error) {
        console.error("Error checking owner auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOwnerAuth();
  }, []);

  const ownerLogin = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        // Validate credentials against hardcoded values
        if (
          email === OWNER_CREDENTIALS.email &&
          password === OWNER_CREDENTIALS.password
        ) {
          setIsOwnerLoggedIn(true);
          setOwnerEmail(email);
          await AsyncStorage.setItem(OWNER_AUTH_STORAGE_KEY, "true");
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error("Error during owner login:", error);
        return false;
      }
    },
    []
  );

  const ownerLogout = useCallback(async () => {
    try {
      setIsOwnerLoggedIn(false);
      setOwnerEmail(null);
      await AsyncStorage.removeItem(OWNER_AUTH_STORAGE_KEY);
    } catch (error) {
      console.error("Error during owner logout:", error);
    }
  }, []);

  return (
    <OwnerAuthContext.Provider
      value={{
        isOwnerLoggedIn,
        ownerEmail,
        ownerLogin,
        ownerLogout,
        isLoading,
      }}
    >
      {children}
    </OwnerAuthContext.Provider>
  );
}
