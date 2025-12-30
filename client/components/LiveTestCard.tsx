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
} from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function LiveTestCard({ onStart }: { onStart: () => void }) {
  const { theme } = useTheme();
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const liveDotScale = useSharedValue(1);
  const liveDotOpacity = useSharedValue(1);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    liveDotScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(1.4, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      true
    );

    liveDotOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(0.3, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      true
    );

    cardOpacity.value = withTiming(1, { duration: 500 });

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

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));

  if (loading || !liveData) return null;

  return (
    <Animated.View style={[cardStyle, { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg }]}>
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.card, { borderRadius: BorderRadius.lg }]}
      >
        <View style={styles.contentRow}>
          {/* Quiz Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.titleContainer}>
              <ThemedText style={styles.quizName}>{liveData.liveTitle}</ThemedText>
              <ThemedText style={styles.quizTopic}>{liveData.quizTitle}</ThemedText>
            </View>
          </View>

          {/* Stats Section - Horizontal */}
          <View style={styles.statsRow}>
            {/* Total Questions */}
            <View style={styles.stat}>
              <Feather name="help-circle" size={16} color="rgba(255, 255, 255, 0.8)" />
              <ThemedText style={styles.statValue}>{liveData.maxParticipants}</ThemedText>
              <ThemedText style={styles.statLabel}>Questions</ThemedText>
            </View>

            {/* Participants Limit */}
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Feather name="users" size={16} color="rgba(255, 255, 255, 0.8)" />
              <ThemedText style={styles.statValue}>{liveData.maxParticipants}</ThemedText>
              <ThemedText style={styles.statLabel}>Limit</ThemedText>
            </View>

            {/* Joined Count */}
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Feather name="check-circle" size={16} color="rgba(255, 255, 255, 0.8)" />
              <ThemedText style={styles.statValue}>{liveData.joinedCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Joined</ThemedText>
            </View>
          </View>

          {/* Live Badge & Button */}
          <View style={styles.actionSection}>
            {/* Live Indicator */}
            <View style={styles.liveBadge}>
              <Animated.View style={[styles.liveDot, liveDotStyle]} />
              <ThemedText style={styles.liveText}>LIVE</ThemedText>
            </View>

            {/* Start Button */}
            <Pressable 
              onPress={onStart}
              style={({ pressed }) => [
                styles.startButton,
                { opacity: pressed ? 0.85 : 1 }
              ]}
            >
              <Feather name="play" size={14} color={theme.primary} />
              <ThemedText style={styles.startButtonText}>Start</ThemedText>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoSection: {
    flex: 1,
  },
  titleContainer: {
    gap: Spacing.xs,
  },
  quizName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  quizTopic: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stat: {
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  statValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: Spacing.xs,
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  liveBadge: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginBottom: Spacing.xs,
  },
  liveText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  startButton: {
    backgroundColor: 'white',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  startButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
});
