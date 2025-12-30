import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

export default function LiveTestCard({ onStart }: { onStart: () => void }) {
  const { isDark } = useTheme();
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading || !liveData) return null;

  return (
    <LinearGradient
      colors={["#f8fafc", "#eef2ff"]}
      style={styles.backgroundGradient}
    >
      <View style={styles.cardWrapper}>
        <BlurView intensity={80} tint="light" style={styles.blurContainer}>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.25)", "rgba(255, 255, 255, 0.05)"]}
            style={styles.card}
          >
            <View style={styles.header}>
              <ThemedText style={styles.liveTitleText}>
                {liveData.liveTitle || "तृतीय श्रेणी अध्यापक परीक्षा"}
              </ThemedText>
              <View style={styles.liveIndicatorContainer}>
                <Animated.View style={[styles.liveDot, liveDotStyle]} />
                <ThemedText style={styles.liveNowText}>Live Now</ThemedText>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statPill}>
                <Feather name="clock" size={14} color="#475569" />
                <ThemedText style={styles.statText}>{liveData.duration || 80} mins</ThemedText>
              </View>
              <View style={styles.statPill}>
                <Feather name="file-text" size={14} color="#475569" />
                <ThemedText style={styles.statText}>{liveData.questionCount || 80} Qns</ThemedText>
              </View>
              <View style={styles.statPill}>
                <Feather name="users" size={14} color="#475569" />
                <ThemedText style={styles.statText}>{liveData.maxParticipants || 50}</ThemedText>
              </View>
            </View>

            <View style={styles.topicContainer}>
              <ThemedText style={styles.topicText}>
                {liveData.quizTitle || " राजस्थान के प्रमुख लोकनृत्य (REET SPECIAL)"}
              </ThemedText>
            </View>

            <View style={styles.participantsRow}>
              <View style={styles.avatarStack}>
                <View style={[styles.avatar, { backgroundColor: "#6366f1", zIndex: 3 }]} />
                <View style={[styles.avatar, { backgroundColor: "#818cf8", zIndex: 2, marginLeft: -12 }]} />
                <View style={[styles.avatar, { backgroundColor: "#a5b4fc", zIndex: 1, marginLeft: -12 }]} />
                <View style={[styles.avatar, { backgroundColor: "#c7d2fe", zIndex: 0, marginLeft: -12 }]} />
              </View>
              <ThemedText style={styles.joinedTotalText}>
                {liveData.joinedCount || 0}/{liveData.maxParticipants || 50}
              </ThemedText>
            </View>

            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${Math.min(((liveData.joinedCount || 0) / (liveData.maxParticipants || 50)) * 100, 100)}%` }
                ]} 
              />
            </View>

            <Animated.View style={[styles.ctaContainer, buttonAnimatedStyle]}>
              <Pressable 
                onPress={onStart}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.startButton}
              >
                <ThemedText style={styles.startButtonText}>Start Quiz</ThemedText>
              </Pressable>
            </Animated.View>
          </LinearGradient>
        </BlurView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backgroundGradient: {
    paddingVertical: Spacing.lg,
  },
  cardWrapper: {
    width: "94%",
    alignSelf: "center",
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  blurContainer: {
    borderRadius: 28,
  },
  card: {
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  liveTitleText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
  },
  liveIndicatorContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
  },
  liveNowText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6366f1",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  topicContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  topicText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "500",
    textAlign: "center",
  },
  participantsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  joinedTotalText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    marginBottom: 20,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 3,
  },
  ctaContainer: {
    width: "100%",
  },
  startButton: {
    backgroundColor: "#000000",
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

