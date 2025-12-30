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

  useEffect(() => {
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

  if (loading || !liveData) return null;

  return (
    <LinearGradient
      colors={["#FF5A4A", "#FF6B57"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Header Row with Badge and Heart */}
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>Live</ThemedText>
        </View>
        <Pressable style={styles.heartButton}>
          <Feather name="heart" size={20} color="#FF5A4A" />
        </Pressable>
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        <View style={styles.textContent}>
          <ThemedText style={styles.title}>{liveData.liveTitle}</ThemedText>
          <ThemedText style={styles.description}>{liveData.quizTitle}</ThemedText>
          
          <View style={styles.statsContainer}>
            <View style={styles.statBadge}>
              <Feather name="clock" size={12} color="white" />
              <ThemedText style={styles.statLabel}>{liveData.duration} mins</ThemedText>
            </View>
            <View style={styles.statBadge}>
              <Feather name="file-text" size={12} color="white" />
              <ThemedText style={styles.statLabel}>80 Qns</ThemedText>
            </View>
            <View style={styles.statBadge}>
              <Feather name="users" size={12} color="white" />
              <ThemedText style={styles.statLabel}>{liveData.maxParticipants}</ThemedText>
            </View>
          </View>
        </View>

        {/* Decorative Image Placeholder */}
        <View style={styles.imageArea}>
          <View style={styles.imageContent}>
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
            <View style={styles.decorShape} />
          </View>
        </View>
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
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['2xl'],
    borderRadius: BorderRadius['2xl'],
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    shadowColor: "#FF5A4A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  badge: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    gap: Spacing.lg,
  },
  textContent: {
    flex: 1,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.md,
    lineHeight: 34,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  statLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  imageArea: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    top: 10,
    right: 10,
  },
  decorCircle2: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    bottom: 15,
    left: 5,
  },
  decorShape: {
    position: 'absolute',
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255, 200, 100, 0.3)',
    borderRadius: 5,
    bottom: 5,
    right: 5,
  },
  startButton: {
    backgroundColor: '#17B89B',
    paddingVertical: 16,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#17B89B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
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
