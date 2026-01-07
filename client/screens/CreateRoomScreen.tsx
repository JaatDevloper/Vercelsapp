import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Share,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Clipboard from "expo-clipboard";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type CreateRoomRouteProp = RouteProp<RootStackParamList, "CreateRoom">;

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

export default function CreateRoomScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CreateRoomRouteProp>();

  const { quizId, quizTitle } = route.params;

  const [name, setName] = useState("");
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [odId, setOdId] = useState<string | null>(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCreateRoom = async () => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter your name to create a room");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`${API_BASE}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, hostName: name.trim(), isBroadcast }),
      });

      if (!response.ok) {
        throw new Error("Failed to create room");
      }

      const data = await response.json();
      setRoomCode(data.roomCode);
      setOdId(data.odId);
    } catch (error) {
      Alert.alert("Error", "Failed to create room. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = async () => {
    if (roomCode) {
      await Clipboard.setStringAsync(roomCode);
      Alert.alert("Copied!", "Room code copied to clipboard");
    }
  };

  const handleShareCode = async () => {
    if (roomCode) {
      try {
        await Share.share({
          message: `Join my quiz! Room code: ${roomCode}`,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }
  };

  const handleGoToLobby = () => {
    if (roomCode && odId) {
      navigation.replace("Lobby", {
        roomCode,
        odId,
        quizId,
        isHost: true,
        playerName: name.trim(),
      });
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
          Invite Friends
        </ThemedText>
        <ThemedText type="body" style={styles.headerSubtitle}>
          {quizTitle}
        </ThemedText>
      </LinearGradient>

      <View style={styles.content}>
        {!roomCode ? (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
              Enter Your Name
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
              placeholder="Your name"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              maxLength={20}
              autoFocus
            />

            <Pressable
              onPress={() => setIsBroadcast(!isBroadcast)}
              style={styles.broadcastToggle}
            >
              <View style={[
                styles.checkbox, 
                { borderColor: primaryColor },
                isBroadcast && { backgroundColor: primaryColor }
              ]}>
                {isBroadcast && <Feather name="check" size={14} color="#FFFFFF" />}
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>Broadcast Room</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Make this room visible to everyone on the Home Screen
                </ThemedText>
              </View>
            </Pressable>

            <Pressable
              onPress={handleCreateRoom}
              disabled={isCreating || !name.trim()}
              style={({ pressed }) => [
                styles.createButton,
                {
                  backgroundColor: primaryColor,
                  opacity: pressed || isCreating || !name.trim() ? 0.6 : 1,
                },
              ]}
            >
              {isCreating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
                  Create Room
                </ThemedText>
              )}
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={[styles.codeCard, { backgroundColor: theme.backgroundDefault }]}>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
                Share this code with your friends
              </ThemedText>
              <ThemedText type="h1" style={[styles.roomCode, { color: primaryColor }]}>
                {roomCode}
              </ThemedText>

              <View style={styles.codeActions}>
                <Pressable
                  onPress={handleCopyCode}
                  style={({ pressed }) => [
                    styles.actionButton,
                    { backgroundColor: theme.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Feather name="copy" size={20} color={theme.text} />
                  <ThemedText type="body">Copy</ThemedText>
                </Pressable>

                <Pressable
                  onPress={handleShareCode}
                  style={({ pressed }) => [
                    styles.actionButton,
                    { backgroundColor: theme.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Feather name="share-2" size={20} color={theme.text} />
                  <ThemedText type="body">Share</ThemedText>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleGoToLobby}
              style={({ pressed }) => [
                styles.continueButton,
                { backgroundColor: primaryColor, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
                Go to Lobby
              </ThemedText>
              <Feather name="arrow-right" size={20} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        )}
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
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  broadcastToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  createButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  codeCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  roomCode: {
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: 8,
    marginVertical: Spacing.lg,
  },
  codeActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
});
