import React, { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { Spacing } from "@/constants/theme";

interface LoadingIndicatorProps {
  message?: string;
  color?: string;
}

export function LoadingIndicator({ message = "Loading...", color = "#4facfe" }: LoadingIndicatorProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.loaderContainer}>
        <Animated.View style={animatedStyle}>
          <Feather name="loader" size={48} color={color} />
        </Animated.View>
        <ThemedText type="h4" style={[styles.message, { color }]}>
          {message}
        </ThemedText>
        <ThemedText type="small" style={styles.subMessage}>
          Please wait while we prepare your content
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: {
    alignItems: "center",
    gap: Spacing.md,
  },
  message: {
    marginTop: Spacing.md,
    fontWeight: "700",
  },
  subMessage: {
    opacity: 0.6,
  },
});
