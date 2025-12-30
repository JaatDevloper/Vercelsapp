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
      colors={["#FFA366", "#FF9999", "#E799FF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Live Badge */}
      <View style={styles.badgeContainer}>
        <View style={styles.liveBadge}>
          <Animated.View style={[styles.dot, dotStyle]} />
          <ThemedText style={styles.liveText}>Live Now</ThemedText>
        </View>
      </View>

      {/* Title */}
      <ThemedText style={styles.title}>{liveData.liveTitle}</ThemedText>

      {/* Info Row - Compact */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Feather name="clock" size={14} color="rgba(0,0,0,0.6)" />
          <ThemedText style={styles.infoText}>{liveData.duration}m</ThemedText>
        </View>
        <ThemedText style={styles.infoDot}>•</ThemedText>
        <View style={styles.infoItem}>
          <Feather name="file-text" size={14} color="rgba(0,0,0,0.6)" />
          <ThemedText style={styles.infoText}>80</ThemedText>
        </View>
        <ThemedText style={styles.infoDot}>•</ThemedText>
        <View style={styles.infoItem}>
          <Feather name="users" size={14} color="rgba(0,0,0,0.6)" />
          <ThemedText style={styles.infoText}>{liveData.maxParticipants}</ThemedText>
        </View>
      </View>

      {/* Topic */}
      <ThemedText style={styles.topic} numberOfLines={1}>
        {liveData.quizTitle}
      </ThemedText>

      {/* Progress & Participation */}
      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <ThemedText style={styles.participantText}>
          {liveData.joinedCount}/{liveData.maxParticipants}
        </ThemedText>
      </View>

      {/* Start Button */}
      <Pressable onPress={onStart} style={styles.startButton}>
        <ThemedText style={styles.startButtonText}>Start Quiz</ThemedText>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    overflow: 'hidden',
  },
  badgeContainer: {
    marginBottom: Spacing.sm,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    width: 'auto',
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginRight: 5,
  },
  liveText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 11,
  },
  title: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  infoText: {
    color: 'rgba(0, 0, 0, 0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  infoDot: {
    color: 'rgba(0, 0, 0, 0.3)',
    fontSize: 10,
    fontWeight: '600',
  },
  topic: {
    color: 'rgba(0, 0, 0, 0.75)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: Spacing.md,
  },
  progressRow: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  participantText: {
    color: 'rgba(0, 0, 0, 0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  startButtonText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '700',
  },
});
