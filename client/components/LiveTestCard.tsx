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
      colors={["#FF6B8A", "#FF8E8E", "#FFB366"]}
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
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: Spacing.md },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', marginRight: 6 },
  liveText: { color: '#3B82F6', fontWeight: 'bold', fontSize: 14 },
  title: { color: 'white', fontSize: 24, marginBottom: Spacing.md },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: 'white', fontSize: 16 },
  divider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 12 },
  tagContainer: { flexDirection: 'row', marginBottom: Spacing.xl },
  tag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { color: 'white', fontSize: 14 },
  participationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  avatarStack: { flexDirection: 'row', position: 'relative', width: 100, height: 24 },
  avatar: { width: 24, height: 24, borderRadius: 12, position: 'absolute', borderWidth: 2, borderColor: '#1E293B' },
  joinedCount: { color: 'white', fontSize: 16 },
  progressContainer: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: Spacing.xl },
  progressBar: { height: '100%', backgroundColor: '#10B981' },
  startButton: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: BorderRadius.lg, alignItems: 'center' },
  startButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
