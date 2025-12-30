import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence } from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function LiveTestCard({ onStart }: { onStart: () => void }) {
  const { theme } = useTheme();
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
      colors={["#1F3A52", "#2B4A62"]}
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

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Feather name="clock" size={18} color="white" />
          <ThemedText style={styles.statText}>{liveData.duration} mins</ThemedText>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Feather name="file-text" size={18} color="white" />
          <ThemedText style={styles.statText}>80 Qns</ThemedText>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Feather name="users" size={18} color="white" />
          <ThemedText style={styles.statText}>{liveData.maxParticipants}</ThemedText>
        </View>
      </View>

      {/* Topic Tag */}
      <View style={styles.topicContainer}>
        <View style={styles.topicTag}>
          <ThemedText style={styles.topicBadgeText}>Topic ▶</ThemedText>
          <ThemedText style={styles.topicText}>{liveData.quizTitle}</ThemedText>
        </View>
      </View>

      {/* Participants Section */}
      <View style={styles.participationContainer}>
        <View style={styles.avatarStack}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.avatar,
                {
                  left: i * 16,
                  zIndex: 10 - i,
                  backgroundColor: i === 3 ? "#10B981" : `hsl(${220 - i * 30}, 70%, 60%)`,
                },
              ]}
            />
          ))}
          <View
            style={[
              styles.avatar,
              {
                left: 4 * 16,
                zIndex: 5,
                backgroundColor: "#10B981",
              },
            ]}
          >
            <Feather name="user" size={12} color="white" />
          </View>
        </View>
        <ThemedText style={styles.participantCount}>
          /{liveData.maxParticipants}
        </ThemedText>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>

      {/* Start Button */}
      <Pressable onPress={onStart} style={styles.startButton}>
        <ThemedText style={styles.startButtonText}>Start Test</ThemedText>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing['2xl'],
    borderRadius: BorderRadius['2xl'],
    marginBottom: Spacing.xl,
    marginHorizontal: Spacing.lg,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing['2xl'],
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginRight: 6,
  },
  liveText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 13,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.xl,
    lineHeight: 34,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  topicContainer: {
    marginBottom: Spacing.xl,
  },
  topicTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(60, 80, 110, 0.6)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  topicBadgeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  topicText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  participationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarStack: {
    flexDirection: 'row',
    position: 'relative',
    width: 100,
    height: 32,
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: '#1F3A52',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantCount: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  progressContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  startButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
