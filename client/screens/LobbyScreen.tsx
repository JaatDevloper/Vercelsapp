import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { Participant, WebSocketMessage } from "@/types/room";

type LobbyRouteProp = RouteProp<RootStackParamList, "Lobby">;

const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "http://localhost:5000";
};

const getWsBase = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `wss://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "ws://localhost:5000";
};

const API_BASE = getApiBase();
const WS_BASE = getWsBase();

export default function LobbyScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<LobbyRouteProp>();

  const { roomCode, odId, quizId, isHost, playerName } = route.params;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchRoomStatus();
    connectWebSocket();

    // Poll room status every 2 seconds to catch quiz start
    // This is needed because Vercel serverless functions can't broadcast WebSocket messages
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/api/rooms/${roomCode}`);
        if (response.ok) {
          const data = await response.json();
          setParticipants(data.participants || []);
          
          if (data.status === "active") {
            clearInterval(pollInterval);
            navigation.replace("MultiplayerQuiz", { roomCode, odId, quizId, playerName });
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomCode, odId, quizId, playerName, navigation]);

  const fetchRoomStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/rooms/${roomCode}`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants || []);
        
        if (data.status === "active") {
          navigation.replace("MultiplayerQuiz", { roomCode, odId, quizId, playerName });
        }
      }
    } catch (error) {
      console.error("Error fetching room:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = () => {
    const ws = new WebSocket(`${WS_BASE}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join_room", roomCode }));
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        if (message.type === "player_joined" || message.type === "player_left") {
          if (message.participants) {
            setParticipants(message.participants);
          }
        }

        if (message.type === "quiz_started") {
          navigation.replace("MultiplayerQuiz", { roomCode, odId, quizId, playerName });
        }
      } catch (e) {
        console.error("WebSocket message error:", e);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      setTimeout(() => {
        if (wsRef.current === ws) {
          connectWebSocket();
        }
      }, 3000);
    };
  };

  const handleStartQuiz = async () => {
    if (participants.length < 2) {
      Alert.alert("Need More Players", "Wait for at least one friend to join before starting");
      return;
    }

    setIsStarting(true);
    try {
      const response = await fetch(`${API_BASE}/api/rooms/${roomCode}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ odId }),
      });

      if (!response.ok) {
        throw new Error("Failed to start quiz");
      }

      navigation.replace("MultiplayerQuiz", { roomCode, odId, quizId, playerName });
    } catch (error) {
      Alert.alert("Error", "Failed to start quiz");
    } finally {
      setIsStarting(false);
    }
  };

  const handleLeave = async () => {
    try {
      await fetch(`${API_BASE}/api/rooms/${roomCode}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ odId }),
      });
    } catch (error) {
      console.error("Error leaving room:", error);
    }
    navigation.goBack();
  };

  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;
  const gradientColors = isDark 
    ? ["#1e3a5f", "#0d1b2a"] as const
    : ["#4facfe", "#00f2fe"] as const;

  const renderParticipant = ({ item, index }: { item: Participant; index: number }) => (
    <Animated.View 
      entering={FadeIn.delay(index * 100)}
      style={[styles.participantCard, { backgroundColor: theme.backgroundDefault }]}
    >
      <View style={[styles.avatar, { backgroundColor: primaryColor }]}>
        <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
          {item.name.charAt(0).toUpperCase()}
        </ThemedText>
      </View>
      <View style={styles.participantInfo}>
        <ThemedText type="body" style={{ fontWeight: "600" }}>
          {item.name}
        </ThemedText>
        {item.isHost && (
          <View style={[styles.hostBadge, { backgroundColor: primaryColor }]}>
            <ThemedText type="small" style={{ color: "#FFFFFF" }}>Host</ThemedText>
          </View>
        )}
      </View>
      <Feather name="check-circle" size={20} color={primaryColor} />
    </Animated.View>
  );

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Pressable
          onPress={handleLeave}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="x" size={24} color="#FFFFFF" />
        </Pressable>

        <ThemedText type="h2" style={styles.headerTitle}>
          Waiting Room
        </ThemedText>
        
        <View style={styles.codeContainer}>
          <ThemedText type="body" style={{ color: "rgba(255,255,255,0.8)" }}>
            Room Code
          </ThemedText>
          <ThemedText type="h1" style={styles.roomCode}>
            {roomCode}
          </ThemedText>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Players ({participants.length})
          </ThemedText>
        </Animated.View>

        <FlatList
          data={participants}
          keyExtractor={(item) => item.odId}
          renderItem={renderParticipant}
          contentContainerStyle={styles.participantsList}
          showsVerticalScrollIndicator={false}
        />

        {!isHost && (
          <Animated.View 
            entering={FadeInDown.delay(300).duration(400)}
            style={[styles.waitingCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <ActivityIndicator size="small" color={primaryColor} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginLeft: Spacing.md }}>
              Waiting for host to start the quiz...
            </ThemedText>
          </Animated.View>
        )}
      </View>

      {isHost && (
        <Animated.View 
          entering={FadeInDown.delay(400).duration(400)}
          style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}
        >
          <Pressable
            onPress={handleStartQuiz}
            disabled={isStarting || participants.length < 2}
            style={({ pressed }) => [
              styles.startButton,
              {
                backgroundColor: primaryColor,
                opacity: pressed || isStarting || participants.length < 2 ? 0.6 : 1,
              },
            ]}
          >
            {isStarting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
                Start Quiz ({participants.length} players)
              </ThemedText>
            )}
          </Pressable>
          {participants.length < 2 && (
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
              Wait for at least one friend to join
            </ThemedText>
          )}
        </Animated.View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: Spacing.lg,
  },
  codeContainer: {
    alignItems: "center",
  },
  roomCode: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 6,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
  participantsList: {
    gap: Spacing.md,
  },
  participantCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  participantInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  hostBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  waitingCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  startButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
