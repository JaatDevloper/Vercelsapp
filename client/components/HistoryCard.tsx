import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import type { QuizHistoryItem } from "@/types/quiz";

interface HistoryCardProps {
  historyItem: QuizHistoryItem;
  onRetake: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HistoryCard({ historyItem, onRetake }: HistoryCardProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const getScoreColor = () => {
    if (historyItem.score >= 70) return isDark ? Colors.dark.success : Colors.light.success;
    if (historyItem.score >= 50) return isDark ? Colors.dark.warning : Colors.light.warning;
    return isDark ? Colors.dark.error : Colors.light.error;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AnimatedPressable
      onPress={onRetake}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.info}>
          <ThemedText type="body" style={styles.title} numberOfLines={2}>
            {historyItem.quizTitle}
          </ThemedText>
          <View style={styles.meta}>
            <Feather name="clock" size={12} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {formatDate(historyItem.completedAt)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.scoreSection}>
          <View style={[styles.scoreCircle, { borderColor: getScoreColor() }]}>
            <ThemedText type="h4" style={{ color: getScoreColor() }}>
              {historyItem.score}%
            </ThemedText>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {historyItem.correctAnswers}/{historyItem.totalQuestions}
          </ThemedText>
        </View>
      </View>

      <View style={styles.retakeRow}>
        <Feather name="refresh-cw" size={14} color={theme.primary} />
        <ThemedText type="small" style={{ color: theme.primary, fontWeight: "500" }}>
          Retake Quiz
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  info: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  title: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  scoreSection: {
    alignItems: "center",
  },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  retakeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
});
