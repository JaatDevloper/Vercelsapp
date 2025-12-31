import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import ParticipantProfilesModal from "./ParticipantProfilesModal";
import { useQuery } from "@tanstack/react-query";
import { getDeviceId } from "@/lib/deviceId";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

export default function LiveTestCard({ onStart }: { onStart: () => void }) {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [deviceId, setDeviceId] = useState<string>("");
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const { refetch: refetchProfile, isFetching: isRefreshingProfile } = useQuery<any>({
    queryKey: ["profile", deviceId],
    queryFn: async () => {
      if (!deviceId) return null;
      const baseUrl = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      const response = await fetch(`${baseUrl}/api/profile?deviceId=${encodeURIComponent(deviceId)}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!deviceId,
    staleTime: 0,
  });

  const liveDotScale = useSharedValue(1);
  const liveDotOpacity = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    liveDotScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(1.4, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );

    liveDotOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(0.4, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );

    const fetchLiveData = async () => {
      try {
        const response = await fetch("/api/livequiz/active");
        if (response.ok) {
          const data = await response.json();
          setLiveData(data);
        }
      } catch (e) {} finally {
        setLoading(false);
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchParticipants = async () => {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      const response = await fetch(`${baseUrl}/api/livequiz/participants`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
        setShowProfiles(true);
      }
    } catch (e) {
      console.error("Error fetching participants:", e);
    }
  };

  const liveDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: liveDotScale.value }],
    opacity: liveDotOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.97, { duration: 100 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  const handleStartPress = async () => {
    if (isCheckingAuth || isRefreshingProfile) return;
    
    setIsCheckingAuth(true);
    try {
      console.log("LiveTestCard: Starting fresh profile check...");
      
      // We use a direct fetch here to bypass any React Query potential lag or caching issues
      const baseUrl = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      const response = await fetch(`${baseUrl}/api/profile?deviceId=${encodeURIComponent(deviceId)}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      let profile = null;
      if (response.ok) {
        profile = await response.json();
      }
      
      console.log("LiveTestCard: Fresh direct check result:", profile?.name || "Not logged in");
      
      if (!profile || !profile.name) {
        console.log("LiveTestCard: No profile found, redirecting to login");
        navigation.navigate("LoginProfile");
      } else {
        console.log("LiveTestCard: Profile valid, starting quiz");
        navigation.navigate("Quiz", { quizId: "live" });
      }
    } catch (error) {
      console.error("LiveTestCard: Auth check exception:", error);
      onStart(); // Fallback
    } finally {
      setIsCheckingAuth(false);
    }
  };

  if (loading || !liveData) return null;

  return (
    <View style={styles.cardWrapper}>
      <BlurView intensity={16} tint="light" style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.liveTitleText}>
            {liveData.liveTitle || "तृतीय श्रेणी अध्यापक परीक्षा"}
          </ThemedText>

          <View style={styles.liveIndicatorContainer}>
            <Animated.View style={[styles.liveDot, liveDotStyle]} />
            <ThemedText style={styles.liveNowText}>Live Now</ThemedText>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Feather name="clock" size={16} color="#6B7280" />
            <ThemedText style={styles.statText}>
              {liveData.duration || 80} mins
            </ThemedText>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Feather name="file-text" size={16} color="#6B7280" />
            <ThemedText style={styles.statText}>
              {liveData.questionCount || "80"} Qns
            </ThemedText>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Feather name="users" size={16} color="#6B7280" />
            <ThemedText style={styles.statText}>
              {liveData.maxParticipants || 50}
            </ThemedText>
          </View>
        </View>

        {/* Topic */}
        <View style={styles.topicContainer}>
          <ThemedText style={styles.topicText}>
            {liveData.quizTitle || "राजस्थान के प्रमुख लोकनृत्य (REET SPECIAL)"}
          </ThemedText>
        </View>

        {/* Participants */}
        <View style={styles.participantsRow}>
          <Pressable onPress={fetchParticipants} style={styles.avatarStack}>
            {participants.length > 0 ? (
              participants.slice(0, 4).map((p, i) => (
                <Image
                  key={i}
                  source={{ uri: p.avatarUrl || "https://via.placeholder.com/150" }}
                  style={[styles.avatar, { zIndex: 4 - i, marginLeft: i === 0 ? 0 : -12 }]}
                />
              ))
            ) : (
              <>
                <View style={[styles.avatar, { backgroundColor: "#6366F1", zIndex: 3 }]} />
                <View style={[styles.avatar, { backgroundColor: "#818CF8", zIndex: 2, marginLeft: -12 }]} />
                <View style={[styles.avatar, { backgroundColor: "#4F46E5", zIndex: 1, marginLeft: -12 }]} />
                <View style={[styles.avatar, { backgroundColor: "#10B981", zIndex: 0, marginLeft: -12 }]} />
              </>
            )}
          </Pressable>

          <ThemedText style={styles.joinedTotalText}>
            {liveData.joinedCount || 0}/{liveData.maxParticipants || 50}
          </ThemedText>
        </View>

        {/* Progress */}
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(
                  ((liveData.joinedCount || 0) /
                    (liveData.maxParticipants || 50)) *
                    100,
                  100
                )}%`,
              },
            ]}
          />
        </View>

        {/* CTA */}
        <Animated.View style={[styles.ctaContainer, buttonAnimatedStyle]}>
          <Pressable
            onPress={handleStartPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isCheckingAuth}
            style={styles.startButton}
          >
            {isCheckingAuth ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.startButtonText}>
                Start Quiz
              </ThemedText>
            )}
          </Pressable>
        </Animated.View>
      </BlurView>

      <ParticipantProfilesModal
        visible={showProfiles}
        onClose={() => setShowProfiles(false)}
        participants={participants}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: "94%",
    alignSelf: "center",
    marginVertical: Spacing.md,
    borderRadius: 28,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },

  card: {
    padding: 24,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  liveTitleText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    flex: 1,
    marginRight: 10,
  },

  liveIndicatorContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.12)",
    alignItems: "center",
    gap: 6,
  },

  liveNowText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4F46E5",
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6366F1",
  },

  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },

  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },

  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#D1D5DB",
  },

  topicContainer: {
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 20,
  },

  topicText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    textAlign: "center",
  },

  participantsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#fff",
  },

  joinedTotalText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },

  progressBarBackground: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    marginBottom: 24,
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: "#10B981",
  },

  ctaContainer: {
    width: "100%",
  },

  startButton: {
    backgroundColor: "#000",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },

  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
