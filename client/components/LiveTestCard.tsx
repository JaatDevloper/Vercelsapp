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
      colors={["#1B2F42", "#253B52"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Main Layout - Horizontal */}
      <View style={styles.mainContainer}>
        {/* Left Section - Content */}
        <View style={styles.leftSection}>
          {/* Live Badge */}
          <View style={styles.liveBadge}>
            <Animated.View style={[styles.dot, dotStyle]} />
            <ThemedText style={styles.liveText}>Live Now</ThemedText>
          </View>

          {/* Title */}
          <ThemedText style={styles.title} numberOfLines={2}>{liveData.liveTitle}</ThemedText>

          {/* Stats Row - Compact */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Feather name="clock" size={14} color="rgba(255,255,255,0.8)" />
              <ThemedText style={styles.statText}>{liveData.duration}m</ThemedText>
            </View>
            <View style={styles.statDot} />
            <View style={styles.statItem}>
              <Feather name="file-text" size={14} color="rgba(255,255,255,0.8)" />
              <ThemedText style={styles.statText}>80</ThemedText>
            </View>
            <View style={styles.statDot} />
            <View style={styles.statItem}>
              <Feather name="users" size={14} color="rgba(255,255,255,0.8)" />
              <ThemedText style={styles.statText}>{liveData.maxParticipants}</ThemedText>
            </View>
          </View>

          {/* Topic Tag - Minimal */}
          <View style={styles.topicTag}>
            <ThemedText style={styles.topicText} numberOfLines={1}>{liveData.quizTitle}</ThemedText>
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={styles.participantStack}>
              <View style={styles.avatarStack}>
                {[1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.miniAvatar,
                      {
                        left: i * 8,
                        zIndex: 10 - i,
                        backgroundColor: i === 3 ? "#10B981" : `hsl(${220 - i * 30}, 70%, 60%)`,
                      },
                    ]}
                  />
                ))}
                <View
                  style={[
                    styles.miniAvatar,
                    {
                      left: 4 * 8,
                      zIndex: 5,
                      backgroundColor: "#10B981",
                    },
                  ]}
                />
              </View>
              <ThemedText style={styles.participantText}>
                {liveData.joinedCount}/{liveData.maxParticipants}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Right Section - Button */}
        <Pressable onPress={onStart} style={styles.startButton}>
          <ThemedText style={styles.startButtonText}>Start Test</ThemedText>
          <Feather name="arrow-right" size={18} color="white" />
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing['2xl'],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  mainContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: Spacing.xl,
  },
  leftSection: {
    flex: 1,
    justifyContent: 'space-between',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    width: 'auto',
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginRight: 6,
  },
  liveText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.md,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '500',
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  topicTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  topicText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  progressSection: {
    gap: Spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  participantStack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarStack: {
    flexDirection: 'row',
    position: 'relative',
    width: 50,
    height: 20,
  },
  miniAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#1B2F42',
  },
  participantText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#10B981',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 100,
  },
  startButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
