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
import { Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function LiveTestCard({ onStart }: { onStart: () => void }) {
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
        withTiming(1.3, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      true
    );

    liveDotOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(0.4, { duration: 600 }),
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

  return (
    <Animated.View style={[cardStyle, { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg }]}>
      <LinearGradient
        colors={["#F9C97C", "#F6D5E7", "#C77DFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.card}
      >
        {/* Main Content Container */}
        <View style={styles.contentWrapper}>
          {/* Header: Title + Live Dot */}
          <View style={styles.headerRow}>
            <View style={styles.titleSection}>
              <ThemedText style={styles.mainTitle}>{liveData.liveTitle}</ThemedText>
            </View>

            {/* Live Dot Indicator */}
            <View style={styles.liveIndicator}>
              <Animated.View style={[styles.liveDot, liveDotStyle]} />
              <ThemedText style={styles.liveText}>Live Now</ThemedText>
            </View>
          </View>

          {/* Test Meta Info */}
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Feather name="clock" size={14} color="rgba(43, 43, 43, 0.5)" />
              <ThemedText style={styles.metaText}>{liveData.duration}</ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Feather name="help-circle" size={14} color="rgba(43, 43, 43, 0.5)" />
              <ThemedText style={styles.metaText}>{liveData.maxParticipants}</ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Feather name="users" size={14} color="rgba(43, 43, 43, 0.5)" />
              <ThemedText style={styles.metaText}>{liveData.joinedCount} joined</ThemedText>
            </View>
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
            <ThemedText style={styles.startButtonText}>Start Test</ThemedText>
            <Feather name="arrow-right" size={16} color="#2B2B2B" />
          </Pressable>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  contentWrapper: {
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleSection: {
    flex: 1,
  },
  mainTitle: {
    color: '#2B2B2B',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D26A',
  },
  liveText: {
    color: '#2B2B2B',
    fontSize: 12,
    fontWeight: '600',
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: 'rgba(43, 43, 43, 0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  startButtonText: {
    color: '#2B2B2B',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
