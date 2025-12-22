import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface AnswerOptionProps {
  label: string;
  index: number;
  isSelected: boolean;
  onPress: () => void;
  showResult?: boolean;
  isCorrect?: boolean;
  isWrongSelection?: boolean;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export default function AnswerOption({ 
  label, 
  index, 
  isSelected, 
  onPress,
  showResult = false,
  isCorrect = false,
  isWrongSelection = false,
  disabled = false,
}: AnswerOptionProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;
  const successColor = isDark ? Colors.dark.success : Colors.light.success;
  const errorColor = isDark ? Colors.dark.error : Colors.light.error;
  const warningColor = isDark ? Colors.dark.warning : Colors.light.warning;

  const getBackgroundColor = () => {
    if (showResult) {
      if (isCorrect) return successColor;
      if (isWrongSelection) return warningColor;
      return theme.backgroundDefault;
    }
    return isSelected ? primaryColor : theme.backgroundDefault;
  };

  const getBorderColor = () => {
    if (showResult) {
      if (isCorrect) return successColor;
      if (isWrongSelection) return warningColor;
      return theme.border;
    }
    return isSelected ? primaryColor : theme.border;
  };

  const getTextColor = () => {
    if (showResult) {
      if (isCorrect || isWrongSelection) return "#FFFFFF";
      return theme.text;
    }
    return isSelected ? "#FFFFFF" : theme.text;
  };

  const getIcon = () => {
    if (showResult) {
      if (isCorrect) {
        return <Feather name="check-circle" size={22} color="#FFFFFF" />;
      }
      if (isWrongSelection) {
        return <Feather name="x-circle" size={22} color="#FFFFFF" />;
      }
      return null;
    }
    if (isSelected) {
      return <Feather name="check" size={20} color="#FFFFFF" />;
    }
    return null;
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.option,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          opacity: disabled && !showResult ? 0.7 : 1,
        },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.letterBadge,
          {
            backgroundColor: (showResult && (isCorrect || isWrongSelection)) || isSelected 
              ? "rgba(255,255,255,0.2)" 
              : theme.backgroundSecondary,
          },
        ]}
      >
        <ThemedText
          type="body"
          style={[
            styles.letter,
            { color: (showResult && (isCorrect || isWrongSelection)) || isSelected ? "#FFFFFF" : theme.textSecondary },
          ]}
        >
          {OPTION_LETTERS[index]}
        </ThemedText>
      </View>
      <ThemedText
        type="body"
        style={[
          styles.label,
          { color: getTextColor() },
        ]}
      >
        {label}
      </ThemedText>
      {getIcon()}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    minHeight: 56,
  },
  letterBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  letter: {
    fontWeight: "600",
  },
  label: {
    flex: 1,
  },
});
