import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence,
  FadeInUp
} from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function LiveTestCard({ onStart }: { onStart: () => void }) {
  const { theme } = useTheme();
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const liveDotScale = useSharedValue(1);
  const liveDotOpacity = useSharedValue(1);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    // Live dot animation: scale + opacity pulse
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

    // Card fade in animation
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

  const progress = liveData.joinedCount / liveData.maxParticipants;
  const participationPercentage = Math.round(progress * 100);

  return (
    <Animated.View style={[cardStyle, { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, borderRadius: BorderRadius.xl, overflow: 'hidden' }]}>
      <View style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
        
        {/* Premium Header with Live Indicator */}
        <LinearGradient
          colors={[theme.primary, theme.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <ThemedText style={styles.quizName}>{liveData.liveTitle}</ThemedText>
              <ThemedText style={styles.quizTopic}>{liveData.quizTitle}</ThemedText>
            </View>
            
            {/* Live Indicator Badge */}
            <View style={styles.liveBadge}>
              <Animated.View style={[styles.liveDot, liveDotStyle]} />
              <ThemedText style={styles.liveText}>LIVE</ThemedText>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Grid Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statColumn}>
            <View style={[styles.statCard, { backgroundColor: `${theme.primary}15` }]}>
              <Feather name="help-circle" size={24} color={theme.primary} />
              <ThemedText style={styles.statLabel}>Total Questions</ThemedText>
              <ThemedText style={[styles.statValue, { color: theme.primary }]}>{liveData.maxParticipants}</ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: `${theme.secondary}15` }]}>
              <Feather name="users" size={24} color={theme.secondary} />
              <ThemedText style={styles.statLabel}>All Participants</ThemedText>
              <ThemedText style={[styles.statValue, { color: theme.secondary }]}>{liveData.maxParticipants}</ThemedText>
            </View>
          </View>

          <View style={styles.statColumn}>
            <View style={[styles.statCard, { backgroundColor: '#10B98115' }]}>
              <Feather name="check-circle" size={24} color="#10B981" />
              <ThemedText style={styles.statLabel}>Joined</ThemedText>
              <ThemedText style={[styles.statValue, { color: '#10B981' }]}>{liveData.joinedCount}</ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#F59E0B15' }]}>
              <Feather name="clock" size={24} color="#F59E0B" />
              <ThemedText style={styles.statLabel}>Duration</ThemedText>
              <ThemedText style={[styles.statValue, { color: '#F59E0B' }]}>{liveData.duration} min</ThemedText>
            </View>
          </View>
        </View>

        {/* Progress Bar Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <ThemedText style={styles.progressLabel}>Participation Rate</ThemedText>
            <ThemedText style={styles.progressPercent}>{participationPercentage}%</ThemedText>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.backgroundSecondary }]}>
            <LinearGradient
              colors={[theme.primary, theme.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
        </View>

        {/* Action Button */}
        <Pressable 
          onPress={onStart} 
          style={({ pressed }) => [
            styles.startButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 }
          ]}
        >
          <ThemedText style={styles.startButtonText}>Start Test</ThemedText>
          <Feather name="arrow-right" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  headerGradient: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
    gap: Spacing.xs,
  },
  quizName: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  quizTopic: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  liveBadge: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 60,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginBottom: Spacing.xs,
  },
  liveText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  statColumn: {
    flex: 1,
    gap: Spacing.md,
  },
  statCard: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  startButton: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
