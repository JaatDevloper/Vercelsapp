import React, { useContext } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import Svg, { Circle, Path, G } from "react-native-svg";
import { ThemeContext } from "@/context/ThemeContext";

const TOGGLE_WIDTH = 48;
const TOGGLE_HEIGHT = 22;
const KNOB_SIZE = 18;
const KNOB_MARGIN = 2;

export default function DayNightToggle() {
  const { isDark, toggleTheme } = useContext(ThemeContext);

  const knobAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(
            isDark ? TOGGLE_WIDTH - KNOB_SIZE - KNOB_MARGIN : KNOB_MARGIN,
            { damping: 15, stiffness: 150 }
          ),
        },
      ],
    };
  }, [isDark]);

  return (
    <Pressable onPress={toggleTheme} style={styles.container}>
      <View style={styles.toggleBackground}>
        {isDark ? (
          <LinearGradient
            colors={["#1a1a2e", "#4A2574", "#6B3A8C"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradient}
          >
            <NightScene />
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={["#87CEEB", "#FFB347", "#FF8C00"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradient}
          >
            <DayScene />
          </LinearGradient>
        )}
        <Animated.View style={[styles.knob, knobAnimatedStyle]}>
          {isDark ? (
            <LinearGradient
              colors={["#C9C9C9", "#FFFFFF"]}
              style={styles.knobGradient}
            >
              <MoonIcon />
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={["#FFE066", "#FFCC00"]}
              style={styles.knobGradient}
            >
              <SunIcon />
            </LinearGradient>
          )}
        </Animated.View>
      </View>
    </Pressable>
  );
}

function NightScene() {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 48 22">
      <G>
        <Circle cx="35" cy="5" r="0.8" fill="rgba(255,255,255,0.8)" />
        <Circle cx="40" cy="10" r="0.6" fill="rgba(255,255,255,0.6)" />
        <Circle cx="32" cy="8" r="0.5" fill="rgba(255,255,255,0.7)" />
        <Path
          d="M0 22 L0 16 Q12 14 24 15 Q36 16 48 14 L48 22 Z"
          fill="rgba(60, 25, 80, 0.6)"
        />
      </G>
    </Svg>
  );
}

function DayScene() {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 48 22">
      <G>
        <Path
          d="M14 12 Q17 10 20 12"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1"
          fill="none"
        />
        <Path
          d="M0 22 L0 18 Q12 15 24 16 Q36 17 48 15 L48 22 Z"
          fill="rgba(194, 65, 12, 0.4)"
        />
      </G>
    </Svg>
  );
}

function SunIcon() {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" style={styles.icon}>
      <Circle cx="12" cy="12" r="5" fill="#FF8C00" />
      <G stroke="#FF8C00" strokeWidth="2" strokeLinecap="round">
        <Path d="M12 2 L12 4" />
        <Path d="M12 20 L12 22" />
        <Path d="M4 12 L2 12" />
        <Path d="M22 12 L20 12" />
        <Path d="M6.34 6.34 L4.93 4.93" />
        <Path d="M19.07 19.07 L17.66 17.66" />
        <Path d="M6.34 17.66 L4.93 19.07" />
        <Path d="M19.07 4.93 L17.66 6.34" />
      </G>
    </Svg>
  );
}

function MoonIcon() {
  return (
    <Svg width={8} height={8} viewBox="0 0 24 24" style={styles.icon}>
      <Path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill="#6B7280"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
  },
  toggleBackground: {
    width: TOGGLE_WIDTH,
    height: TOGGLE_HEIGHT,
    borderRadius: TOGGLE_HEIGHT / 2,
    overflow: "hidden",
    position: "relative",
  },
  gradient: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  knob: {
    position: "absolute",
    top: KNOB_MARGIN,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  knobGradient: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: KNOB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    alignSelf: "center",
  },
});
