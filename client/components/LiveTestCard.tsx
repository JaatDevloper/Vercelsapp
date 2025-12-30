import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Dimensions } from "react-native";
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
      colors={["#2D1B4E", "#3D2A5C"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.badgeRow}>
        <View style={styles.liveBadge}>
          <Animated.View style={[styles.dot, dotStyle]} />
          <ThemedText style={styles.liveText}>Live Now</ThemedText>
        </View>
      </View>

      <ThemedText type="h2" style={styles.title}>{liveData.liveTitle}</ThemedText>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Feather name="clock" size={16} color="white" />
          <ThemedText style={styles.statText}>{liveData.duration} mins</ThemedText>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Feather name="file-text" size={16} color="white" />
          <ThemedText style={styles.statText}>80 Qns</ThemedText>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Feather name="users" size={16} color="white" />
          <ThemedText style={styles.statText}>{liveData.maxParticipants}</ThemedText>
        </View>
      </View>

      <View style={styles.tagContainer}>
        <View style={styles.tag}>
          <ThemedText style={styles.tagText}>{liveData.quizTitle}</ThemedText>
        </View>
      </View>

      <View style={styles.participationRow}>
         <View style={styles.avatarStack}>
            {[1,2,3].map(i => (
                <View key={i} style={[styles.avatar, { left: i * 15, zIndex: 10 - i, backgroundColor: theme.primary }]} />
            ))}
            <View style={[styles.avatar, { left: 4 * 15, zIndex: 5, backgroundColor: '#10B981' }]}>
                <Feather name="user" size={12} color="white" />
            </View>
         </View>
         <ThemedText style={styles.joinedCount}>
            <ThemedText style={{ fontWeight: 'bold' }}>{liveData.joinedCount}</ThemedText>/{liveData.maxParticipants}
         </ThemedText>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>

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
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  badgeRow: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    marginBottom: Spacing['2xl'],
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  dot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#3B82F6', 
    marginRight: 8 
  },
  liveText: { 
    color: '#3B82F6', 
    fontWeight: '600', 
    fontSize: 13,
    letterSpacing: 0.3,
  },
  title: { 
    color: 'white', 
    fontSize: 26, 
    fontWeight: '700',
    marginBottom: Spacing.xl,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  statsRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: Spacing['2xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  statItem: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  statText: { 
    color: 'white', 
    fontSize: 15,
    fontWeight: '500',
  },
  divider: { 
    width: 1, 
    height: 20, 
    backgroundColor: 'rgba(255,255,255,0.25)', 
    marginHorizontal: 12 
  },
  tagContainer: { 
    flexDirection: 'row', 
    marginBottom: Spacing['2xl'],
  },
  tag: { 
    backgroundColor: 'rgba(79, 47, 120, 0.6)', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(147, 112, 219, 0.4)',
  },
  tagText: { 
    color: 'white', 
    fontSize: 13,
    fontWeight: '500',
  },
  participationRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Spacing.xl,
  },
  avatarStack: { 
    flexDirection: 'row', 
    position: 'relative', 
    width: 100, 
    height: 28,
    alignItems: 'center',
  },
  avatar: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    position: 'absolute', 
    borderWidth: 2.5, 
    borderColor: 'rgba(255, 107, 138, 0.8)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  joinedCount: { 
    color: 'white', 
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: { 
    height: 8, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    borderRadius: 4, 
    overflow: 'hidden', 
    marginBottom: Spacing['2xl'],
  },
  progressBar: { 
    height: '100%', 
    backgroundColor: '#1DB584',
    borderRadius: 4,
  },
  startButton: { 
    backgroundColor: '#1DB584', 
    paddingVertical: 16, 
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    shadowColor: "#1DB584",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  startButtonText: { 
    color: 'white', 
    fontSize: 17, 
    fontWeight: '600',
    letterSpacing: 0.3,
  }
});
