import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "http://localhost:5000";
};

const API_BASE = getApiBase();

export default function JoinRoomScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      Alert.alert("Code Required", "Please enter the room code");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter your name");
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch(`${API_BASE}/api/rooms/${roomCode.trim().toUpperCase()}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: name.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to join room");
      }

      const data = await response.json();
      navigation.replace("Lobby", {
        roomCode: data.roomCode,
        odId: data.odId,
        quizId: data.quizId,
        isHost: false,
        playerName: name.trim(),
      });
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to join room");
    } finally {
      setIsJoining(false);
    }
  };

  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;
  const gradientColors = isDark 
    ? ["#1e3a5f", "#0d1b2a"] as const
    : ["#4facfe", "#00f2fe"] as const;

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>

        <ThemedText type="h2" style={styles.headerTitle}>
          Join Quiz Room
        </ThemedText>
        <ThemedText type="body" style={styles.headerSubtitle}>
          Enter the code shared by your friend
        </ThemedText>
      </LinearGradient>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Room Code
          </ThemedText>
          <TextInput
            style={[
              styles.codeInput,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="ABC123"
            placeholderTextColor={theme.textSecondary}
            value={roomCode}
            onChangeText={(text) => setRoomCode(text.toUpperCase())}
            maxLength={6}
            autoCapitalize="characters"
            autoFocus
          />

          <ThemedText type="h4" style={{ marginBottom: Spacing.md, marginTop: Spacing.xl }}>
            Your Name
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Enter your name"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
            maxLength={20}
          />

          <Pressable
            onPress={handleJoinRoom}
            disabled={isJoining || !roomCode.trim() || !name.trim()}
            style={({ pressed }) => [
              styles.joinButton,
              {
                backgroundColor: primaryColor,
                opacity: pressed || isJoining || !roomCode.trim() || !name.trim() ? 0.6 : 1,
              },
            ]}
          >
            {isJoining ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
                  Join Room
                </ThemedText>
                <Feather name="arrow-right" size={20} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerTitle: {
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
  codeInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: 16,
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
});
