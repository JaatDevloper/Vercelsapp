import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence } from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function LiveTestCard({ onStart }: { onStart: () => void }) {
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const dotOpacity = useSharedValue(1);

  useEffect(() => {
    dotOpacity.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 500 }), withTiming(1, { duration: 500 })),
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

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  if (loading || !liveData) return null;

  const progress = liveData.joinedCount / liveData.maxParticipants;

  return (
    <LinearGradient
      colors={["#FFB266", "#FFB8A8", "#D99FFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Main Content Container */}
      <View style={styles.contentWrapper}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <ThemedText style={styles.mainTitle}>{liveData.liveTitle}</ThemedText>
        </View>

        {/* Hidden Stats - kept for backend data but not displayed */}
        <View style={{ display: 'none' }}>
          <ThemedText>{liveData.duration}</ThemedText>
          <ThemedText>{liveData.maxParticipants}</ThemedText>
          <ThemedText>{liveData.quizTitle}</ThemedText>
          <View style={[{ width: `${progress * 100}%` }]} />
          <ThemedText>{liveData.joinedCount}</ThemedText>
        </View>

        {/* Button Section */}
        <Pressable onPress={onStart} style={styles.startButton}>
          <Animated.View style={[styles.dot, dotStyle]} />
          <ThemedText style={styles.startButtonText}>Start Quiz</ThemedText>
          <Feather name="arrow-right" size={16} color="#333333" />
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  contentWrapper: {
    justifyContent: 'space-between',
    minHeight: 140,
  },
  titleSection: {
    marginBottom: 20,
  },
  mainTitle: {
    color: '#1A1A1A',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  startButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  startButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
