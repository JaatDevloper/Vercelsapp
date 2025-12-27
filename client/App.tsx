import React, { useEffect } from "react";
import { StyleSheet, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/context/ThemeContext";
import { OwnerAuthProvider } from "@/context/OwnerAuthContext";
import { useTheme } from "@/hooks/useTheme";

function AppContent() {
  const { isDark } = useTheme();
  
  useEffect(() => {
    if (Platform.OS === "web") {
      const handleCopy = (e: ClipboardEvent) => e.preventDefault();
      const handleContextMenu = (e: MouseEvent) => e.preventDefault();
      
      document.addEventListener("copy", handleCopy);
      document.addEventListener("cut", handleCopy);
      document.addEventListener("contextmenu", handleContextMenu);
      
      return () => {
        document.removeEventListener("copy", handleCopy);
        document.removeEventListener("cut", handleCopy);
        document.removeEventListener("contextmenu", handleContextMenu);
      };
    }
  }, []);

  return (
    <GestureHandlerRootView style={[styles.root, Platform.OS === 'web' && { userSelect: 'none', WebkitUserSelect: 'none' } as any]}>
      <KeyboardProvider>
        <NavigationContainer>
          <RootStackNavigator />
        </NavigationContainer>
        <StatusBar style={isDark ? "light" : "dark"} />
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider>
            <OwnerAuthProvider>
              <AppContent />
            </OwnerAuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
