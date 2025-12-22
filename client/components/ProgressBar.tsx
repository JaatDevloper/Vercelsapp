import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Colors, BorderRadius } from "@/constants/theme";

interface ProgressBarProps {
  progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  const { theme, isDark } = useTheme();
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));

  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <Animated.View
        style={[
          styles.progress,
          { backgroundColor: primaryColor },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    borderRadius: 3,
  },
});
