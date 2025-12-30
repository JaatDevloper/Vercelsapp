import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "./ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function LiveTestCard({ onStart }: { onStart: () => void }) {
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

  const progress = liveData.joinedCount / liveData.maxParticipants;

  return (
    <LinearGradient
      colors={["#D946EF", "#7C3AED"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Top Right Icon Button */}
      <View style={styles.topRightIcon}>
        <View style={styles.iconCircle}>
          <Feather name="grid" size={20} color="white" />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.contentArea}>
        <ThemedText style={styles.mainTitle}>{liveData.liveTitle}</ThemedText>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <View style={styles.buttonRow}>
          <Pressable style={styles.addButton}>
            <ThemedText style={styles.addButtonText}>+ Add subtask</ThemedText>
          </Pressable>
          <Pressable onPress={onStart} style={styles.doneButton}>
            <Feather name="check" size={16} color="white" />
            <ThemedText style={styles.doneButtonText}>Done</ThemedText>
          </Pressable>
        </View>
        <ThemedText style={styles.progressText}>
          <ThemedText style={{ fontWeight: '600' }}>{liveData.joinedCount}</ThemedText>/{liveData.maxParticipants} participants
        </ThemedText>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH - 32,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
    borderRadius: BorderRadius['2xl'],
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: "#D946EF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  topRightIcon: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: Spacing['2xl'],
    marginBottom: Spacing.xl,
    minHeight: 120,
  },
  mainTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  bottomSection: {
    marginTop: Spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  addButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  doneButtonText: {
    color: '#D946EF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
  },
});
