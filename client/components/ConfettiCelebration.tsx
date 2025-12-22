import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONFETTI_COLORS = [
  "#FF6B8A",
  "#FFD700",
  "#06B6D4",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EC4899",
  "#3B82F6",
];

interface ConfettiPieceProps {
  index: number;
  startX: number;
  color: string;
  delay: number;
  onComplete?: () => void;
  isLast: boolean;
}

function ConfettiPiece({ index, startX, color, delay, onComplete, isLast }: ConfettiPieceProps) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    const randomXOffset = (Math.random() - 0.5) * 150;
    const duration = 800 + Math.random() * 400;

    scale.value = withDelay(delay, withTiming(1, { duration: 100 }));
    
    translateY.value = withDelay(
      delay,
      withTiming(200 + Math.random() * 100, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );

    translateX.value = withDelay(
      delay,
      withTiming(randomXOffset, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );

    rotate.value = withDelay(
      delay,
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random()), {
        duration,
      })
    );

    opacity.value = withDelay(
      delay + duration - 200,
      withTiming(0, { duration: 200 }, (finished) => {
        if (finished && isLast && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const pieceSize = 6 + Math.random() * 6;
  const isCircle = Math.random() > 0.5;

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        animatedStyle,
        {
          left: startX,
          backgroundColor: color,
          width: pieceSize,
          height: isCircle ? pieceSize : pieceSize * 2,
          borderRadius: isCircle ? pieceSize / 2 : 2,
        },
      ]}
    />
  );
}

interface ConfettiCelebrationProps {
  visible: boolean;
  onComplete?: () => void;
}

export default function ConfettiCelebration({ visible, onComplete }: ConfettiCelebrationProps) {
  if (!visible) return null;

  const confettiCount = 40;
  const confettiPieces = Array.from({ length: confettiCount }, (_, i) => ({
    id: i,
    startX: Math.random() * SCREEN_WIDTH,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: Math.random() * 200,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.map((piece, index) => (
        <ConfettiPiece
          key={piece.id}
          index={index}
          startX={piece.startX}
          color={piece.color}
          delay={piece.delay}
          onComplete={onComplete}
          isLast={index === confettiCount - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    overflow: "hidden",
  },
  confettiPiece: {
    position: "absolute",
    top: 0,
  },
});
