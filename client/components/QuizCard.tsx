import React from "react";
import { StyleSheet, Pressable, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import PremiumLockBadge from "@/components/PremiumLockBadge";
import type { Quiz } from "@/types/quiz";

interface QuizCardProps {
  quiz: Quiz;
  onPress: () => void;
  style?: ViewStyle;
  isPremiumLocked?: boolean;
  isUserPremium?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const NEW_QUIZ_THRESHOLD_HOURS = 168; // 7 days

function isNewQuiz(createdAt: string | Date | undefined): boolean {
  if (!createdAt) return false;
  
  let createdDate: Date;
  
  if (createdAt instanceof Date) {
    createdDate = createdAt;
  } else if (typeof createdAt === 'string') {
    createdDate = new Date(createdAt);
  } else if (typeof createdAt === 'object' && '$date' in (createdAt as any)) {
    createdDate = new Date((createdAt as any).$date);
  } else {
    return false;
  }
  
  if (isNaN(createdDate.getTime())) return false;
  
  const now = new Date();
  const hoursDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
  return hoursDiff <= NEW_QUIZ_THRESHOLD_HOURS;
}

export function getQuizCreatedTime(createdAt: string | Date | undefined): number {
  if (!createdAt) return 0;
  
  let createdDate: Date;
  
  if (createdAt instanceof Date) {
    createdDate = createdAt;
  } else if (typeof createdAt === 'string') {
    createdDate = new Date(createdAt);
  } else if (typeof createdAt === 'object' && '$date' in (createdAt as any)) {
    createdDate = new Date((createdAt as any).$date);
  } else {
    return 0;
  }
  
  return isNaN(createdDate.getTime()) ? 0 : createdDate.getTime();
}

export default function QuizCard({ quiz, onPress, style, isPremiumLocked = false, isUserPremium = false }: QuizCardProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const badgePulse = useSharedValue(1);

  const isNew = isNewQuiz(quiz.created_at || quiz.timestamp);
  const isLocked = isPremiumLocked && !isUserPremium;

  React.useEffect(() => {
    if (isNew) {
      badgePulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [isNew]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgePulse.value }],
  }));

  const handlePressIn = () => {
    if (!isLocked) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
    }
  };

  const handlePressOut = () => {
    if (!isLocked) {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    }
  };

  const questionCount = quiz.questionCount || 
    (Array.isArray(quiz.questions) ? quiz.questions.length : 0);

  const title = quiz.title || "Untitled Quiz";
  const creatorName = quiz.creator_name || quiz.creator_id || "Unknown";
  const category = quiz.category || "General";

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { 
          backgroundColor: isLocked ? 'rgba(255, 107, 157, 0.08)' : theme.backgroundDefault,
          borderWidth: isLocked ? 2 : isNew ? 1.5 : 0,
          borderColor: isLocked ? '#FF6B9D' : isNew ? (isDark ? '#10B981' : '#059669') : 'transparent',
          opacity: 1,
        },
        animatedStyle,
        style,
      ]}
    >
      {isLocked && <PremiumLockBadge position="top-right" />}
      {isNew && !isLocked && (
        <Animated.View style={[styles.newBadgeContainer, badgeAnimatedStyle]}>
          <LinearGradient
            colors={['#10B981', '#059669', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.newBadge}
          >
            <Feather name="star" size={10} color="#FFFFFF" />
            <ThemedText style={styles.newBadgeText}>NEW</ThemedText>
            <Feather name="star" size={10} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
      )}
      <View style={styles.cardContent}>
        <View style={[
          styles.iconContainer,
          isLocked && { backgroundColor: 'rgba(255, 107, 157, 0.15)' },
          isNew && !isLocked && { backgroundColor: 'rgba(16, 185, 129, 0.15)' }
        ]}>
          <Feather 
            name={isLocked ? "lock" : isNew ? "zap" : "file-text"}
            size={24} 
            color={isLocked ? '#FF6B9D' : isNew ? '#10B981' : (isDark ? Colors.dark.primary : Colors.light.primary)} 
          />
        </View>
        
        <View style={styles.textContent}>
          <ThemedText type="body" style={styles.title} numberOfLines={2}>
            {title}
          </ThemedText>

          <ThemedText type="small" style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
            {questionCount} questions • By {creatorName} • {category}
          </ThemedText>
        </View>

        <View style={styles.arrowContainer}>
          <Feather name="chevron-right" size={20} color={isLocked ? '#FF6B9D' : isNew ? '#10B981' : theme.textSecondary} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    position: "relative",
    overflow: "visible",
    ...Shadows.card,
  },
  newBadgeContainer: {
    position: "absolute",
    top: -10,
    right: 12,
    zIndex: 10,
  },
  newBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  newBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  description: {
    lineHeight: 18,
  },
  arrowContainer: {
    marginLeft: Spacing.sm,
  },
});
