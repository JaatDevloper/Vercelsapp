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
        colors={["#F5F7FB", "#EEF2FF"]}
        style={styles.card}
      >
        <View style={styles.header}>
          <ThemedText style={styles.headerLabel}>Live Quiz</ThemedText>
          <View style={styles.liveIndicatorContainer}>
            <Animated.View style={[styles.liveDot, liveDotStyle]} />
          </View>
        </View>

        <View style={styles.titleSection}>
          <ThemedText style={styles.quizTitle} numberOfLines={2}>
            {liveData.liveTitle || "Daily Quiz Challenge"}
          </ThemedText>
          {liveData.quizTitle && (
            <ThemedText style={styles.description}>
              {liveData.quizTitle}
            </ThemedText>
          )}
        </View>

        <Animated.View style={[styles.ctaContainer, buttonAnimatedStyle]}>
          <Pressable 
            onPress={onStart}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.startButton}
          >
            <View style={styles.buttonContent}>
              <ThemedText style={styles.startButtonText}>Start Quiz</ThemedText>
              <ThemedText style={styles.buttonSubtext}>
                ⏱ {liveData.questionCount || 10} Questions • {liveData.joinedCount || 0}/{liveData.maxParticipants || 50} Joined
              </ThemedText>
            </View>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 8,
  },
  card: {
    padding: 24,
    borderRadius: 28,
    width: "100%",
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
  liveIndicatorContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  titleSection: {
    marginBottom: 24,
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "left",
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 19.6,
    textAlign: "left",
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
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  buttonSubtext: {
    color: "#E5E7EB",
    fontSize: 12,
  },
});

