import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/theme";

interface PremiumLockBadgeProps {
  position?: "top-right" | "center";
}

export default function PremiumLockBadge({ position = "top-right" }: PremiumLockBadgeProps) {
  if (position === "top-right") {
    return (
      <View style={styles.badgeContainer}>
        <LinearGradient
          colors={["#FF6B9D", "#C44569"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badge}
        >
          <Feather name="lock" size={12} color="#FFFFFF" />
          <ThemedText style={styles.badgeText}>PREMIUM</ThemedText>
        </LinearGradient>
      </View>
    );
  }

  // Center position for full card overlay
  return (
    <View style={styles.overlayContainer}>
      <View style={styles.lockOverlay}>
        <Feather name="lock" size={48} color="#FFFFFF" />
        <ThemedText style={styles.premiumText}>Premium Only</ThemedText>
        <ThemedText style={styles.upgradeText}>Upgrade to unlock</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    position: "absolute",
    top: -10,
    right: 12,
    zIndex: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    shadowColor: "#FF6B9D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 5,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  premiumText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: Spacing.md,
  },
  upgradeText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
});
