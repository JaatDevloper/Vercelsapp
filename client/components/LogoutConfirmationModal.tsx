import React from "react";
import {
  View,
  Modal,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";

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
        }}
        onPress={onCancel}
      >
        <Animated.View
          entering={SlideInDown.springify()}
          style={{
            width: SCREEN_WIDTH * 0.85,
            maxWidth: 320,
            borderRadius: BorderRadius.lg,
            overflow: "hidden",
          }}
          onPress={(e) => e?.stopPropagation?.()}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={
                isDark
                  ? ["#EF4444", "#DC2626"]
                  : ["#EF4444", "#F87171"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: Spacing.xl,
                paddingHorizontal: Spacing.lg,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: Spacing.lg,
                }}
              >
                <Feather name="log-out" size={32} color="#FFFFFF" />
              </View>
              <ThemedText
                type="h3"
                style={{
                  color: "#FFFFFF",
                  textAlign: "center",
                  marginBottom: Spacing.sm,
                }}
              >
                Logout
              </ThemedText>
              <ThemedText
                type="body"
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  textAlign: "center",
                  fontSize: 14,
                }}
              >
                Are you sure you want to logout?
              </ThemedText>
            </LinearGradient>

            <View
              style={{
                backgroundColor: theme.backgroundDefault,
                paddingVertical: Spacing.lg,
                paddingHorizontal: Spacing.lg,
                gap: Spacing.sm,
              }}
            >
              <Pressable
                onPress={onConfirm}
                disabled={isLoading}
                style={({ pressed }) => ({
                  backgroundColor: "#EF4444",
                  paddingVertical: Spacing.md,
                  borderRadius: BorderRadius.md,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: pressed || isLoading ? 0.8 : 1,
                })}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="check" size={18} color="#FFFFFF" />
                    <ThemedText
                      type="body"
                      style={{
                        color: "#FFFFFF",
                        fontWeight: "700",
                        marginLeft: Spacing.sm,
                      }}
                    >
                      Yes, Logout
                    </ThemedText>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={onCancel}
                disabled={isLoading}
                style={({ pressed }) => ({
                  backgroundColor: isDark
                    ? theme.backgroundSecondary
                    : "#F3F4F6",
                  paddingVertical: Spacing.md,
                  borderRadius: BorderRadius.md,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: pressed || isLoading ? 0.7 : 1,
                  borderWidth: 1,
                  borderColor: isDark ? theme.border : "#E5E7EB",
                })}
              >
                <Feather
                  name="x"
                  size={18}
                  color={theme.textSecondary}
                />
                <ThemedText
                  type="body"
                  style={{
                    color: theme.textSecondary,
                    fontWeight: "600",
                    marginLeft: Spacing.sm,
                  }}
                >
                  Cancel
                </ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
