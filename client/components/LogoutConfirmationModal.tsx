import React from "react";
import {
  View,
  Modal,
  Pressable,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";

interface LogoutConfirmationModalProps {
  visible: boolean;
  isLoading?: boolean;
  isDark: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  theme: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function LogoutConfirmationModal({
  visible,
  isLoading = false,
  isDark,
  onConfirm,
  onCancel,
  theme,
}: LogoutConfirmationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: Spacing.lg,
        }}
        onPress={onCancel}
      >
        <Animated.View
          entering={ZoomIn.springify()}
          style={{
            width: "100%",
            maxWidth: 380,
            backgroundColor: theme.backgroundDefault,
            borderRadius: BorderRadius.xl,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 10,
          }}
        >
          <Pressable onPress={(e: any) => e.stopPropagation()}>
            {/* Header with Close Button */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                paddingHorizontal: Spacing.lg,
                paddingTop: Spacing.lg,
                paddingBottom: Spacing.md,
              }}
            >
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => ({
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: pressed ? "rgba(0, 0, 0, 0.05)" : "transparent",
                })}
              >
                <Feather
                  name="x"
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>

            {/* Content */}
            <View
              style={{
                paddingHorizontal: Spacing.xl,
                paddingBottom: Spacing.xl,
                alignItems: "center",
              }}
            >
              {/* Icon Illustration */}
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: isDark
                    ? "rgba(20, 184, 166, 0.1)"
                    : "rgba(20, 184, 166, 0.08)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: Spacing.xl,
                }}
              >
                <Feather
                  name="log-out"
                  size={48}
                  color="#14B8A6"
                />
              </View>

              {/* Title */}
              <ThemedText
                type="h2"
                style={{
                  color: theme.textPrimary,
                  textAlign: "center",
                  marginBottom: Spacing.md,
                  fontSize: 22,
                  fontWeight: "700",
                }}
              >
                Are you logging out?
              </ThemedText>

              {/* Description */}
              <ThemedText
                type="body"
                style={{
                  color: theme.textSecondary,
                  textAlign: "center",
                  fontSize: 15,
                  lineHeight: 22,
                  marginBottom: Spacing.lg,
                }}
              >
                You can always log back in at any time. If you just want to switch accounts, you can{" "}
                <ThemedText
                  type="body"
                  style={{
                    color: "#14B8A6",
                    fontWeight: "600",
                    textDecorationLine: "underline",
                  }}
                >
                  add another account
                </ThemedText>
                .
              </ThemedText>

              {/* Buttons */}
              <View
                style={{
                  flexDirection: "row",
                  gap: Spacing.md,
                  width: "100%",
                }}
              >
                {/* Cancel Button */}
                <Pressable
                  onPress={onCancel}
                  disabled={isLoading}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: Spacing.md,
                    borderRadius: BorderRadius.full,
                    borderWidth: 2,
                    borderColor: isDark
                      ? theme.border
                      : "#E5E7EB",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: isDark
                      ? "transparent"
                      : "#FFFFFF",
                    opacity: pressed || isLoading ? 0.7 : 1,
                  })}
                >
                  <ThemedText
                    type="body"
                    style={{
                      color: theme.textPrimary,
                      fontWeight: "600",
                      fontSize: 15,
                    }}
                  >
                    Cancel
                  </ThemedText>
                </Pressable>

                {/* Logout Button */}
                <Pressable
                  onPress={onConfirm}
                  disabled={isLoading}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: Spacing.md,
                    borderRadius: BorderRadius.full,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#000000",
                    opacity: pressed || isLoading ? 0.85 : 1,
                  })}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <ThemedText
                      type="body"
                      style={{
                        color: "#FFFFFF",
                        fontWeight: "600",
                        fontSize: 15,
                      }}
                    >
                      Log out
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
