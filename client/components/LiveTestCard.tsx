import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence,
  interpolate,
  useDerivedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function LiveTestCard({ onStart }: { onStart: () => void }) {
  const { theme, isDark } = useTheme();
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
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.05)"]}
        style={styles.card}
      >
        <View style={styles.glassOverlay} />
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
          <View style={styles.statItem}>
            <Feather name="clock" size={16} color="#6B7280" />
            <ThemedText style={styles.statText}>{liveData.duration || 80} mins</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Feather name="file-text" size={16} color="#6B7280" />
            <ThemedText style={styles.statText}>{liveData.questionCount || 80} Qns</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Feather name="users" size={16} color="#6B7280" />
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
            <View style={[styles.avatar, { backgroundColor: "#6366F1", zIndex: 3 }]} />
            <View style={[styles.avatar, { backgroundColor: "#818CF8", zIndex: 2, marginLeft: -12 }]} />
            <View style={[styles.avatar, { backgroundColor: "#4F46E5", zIndex: 1, marginLeft: -12 }]} />
            <View style={[styles.avatar, { backgroundColor: "#10B981", zIndex: 0, marginLeft: -12 }]} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: "94%",
    alignSelf: "center",
    marginVertical: Spacing.md,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 35,
    elevation: 12,
    overflow: "hidden",
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    opacity: 0.5,
  },
  card: {
    padding: 24,
    borderRadius: 28,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
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
    borderRadius: 20,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  liveNowText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6366F1",
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
    borderColor: "white",
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
    width: "100%",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 3,
  },
  ctaContainer: {
    width: "100%",
  },
  startButton: {
    backgroundColor: "#000000",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 4,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

