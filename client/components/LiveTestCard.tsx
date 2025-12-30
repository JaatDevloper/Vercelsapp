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
    <Animated.View style={[cardStyle, { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, aspectRatio: 16 / 9 }]}>
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.card, { borderRadius: BorderRadius.lg, flex: 1 }]}
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
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    flex: 1,
  },
  infoSection: {
    flex: 1.2,
    justifyContent: 'center',
  },
  titleContainer: {
    gap: Spacing.xs,
  },
  quizName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  quizTopic: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 2,
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  statValue: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 8,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 0.8,
    justifyContent: 'flex-end',
  },
  liveBadge: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
    marginBottom: 2,
  },
  liveText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  startButton: {
    backgroundColor: 'white',
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  startButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
});
