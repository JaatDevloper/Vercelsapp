import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface SkeletonCardProps {
  style?: ViewStyle;
}

export default function SkeletonCard({ style }: SkeletonCardProps) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundDefault }, style]}>
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.badge,
            { backgroundColor: theme.backgroundSecondary },
            animatedStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: theme.backgroundSecondary },
            animatedStyle,
          ]}
        />
      </View>
      <Animated.View
        style={[
          styles.title,
          { backgroundColor: theme.backgroundSecondary },
          animatedStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.subtitle,
          { backgroundColor: theme.backgroundSecondary },
          animatedStyle,
        ]}
      />
      <View style={styles.footer}>
        <Animated.View
          style={[
            styles.stat,
            { backgroundColor: theme.backgroundSecondary },
            animatedStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.stat,
            { backgroundColor: theme.backgroundSecondary },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    maxWidth: "48%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  badge: {
    width: 60,
    height: 20,
    borderRadius: BorderRadius.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    height: 20,
    borderRadius: 4,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    height: 20,
    width: "70%",
    borderRadius: 4,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  stat: {
    width: 50,
    height: 16,
    borderRadius: 4,
  },
});
