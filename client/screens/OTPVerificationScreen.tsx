import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface OTPVerificationScreenProps {
  visible: boolean;
  email: string;
  onClose: () => void;
  onVerified: (otp: string) => void;
  isLoading: boolean;
}

export function OTPVerificationScreen({
  visible,
  email,
  onClose,
  onVerified,
  isLoading,
}: OTPVerificationScreenProps) {
  const { theme, isDark } = useTheme();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<TextInput>(null);
  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;

  useEffect(() => {
    if (visible) {
      setOtp("");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  const handleOTPChange = (text: string) => {
    const numOnly = text.replace(/[^0-9]/g, "");
    setOtp(numOnly.slice(0, 6));
    if (error) setError("");
  };

  const handleVerify = () => {
    if (otp.length !== 6) {
      setError("Please enter a 6-digit OTP");
      return;
    }
    onVerified(otp);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <Pressable
        style={styles.overlay}
        onPress={() => !isLoading && onClose()}
      >
        <Pressable
          style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Animated.View entering={FadeInDown.duration(300)}>
            <LinearGradient
              colors={isDark ? [primaryColor, "#5B8DEE"] : ["#2C3E50", "#3498db"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.header}
            >
              <View style={styles.iconContainer}>
                <Feather name="mail" size={32} color="#FFFFFF" />
              </View>
              <ThemedText type="h2" style={styles.title}>
                Verify Your Email
              </ThemedText>
              <ThemedText type="body" style={styles.subtitle}>
                We've sent a 6-digit OTP to
              </ThemedText>
              <ThemedText type="body" style={[styles.subtitle, { fontWeight: "600" }]}>
                {email}
              </ThemedText>
            </LinearGradient>

            <View style={styles.content}>
              <ThemedText type="body" style={styles.label}>
                Enter OTP Code
              </ThemedText>
              <TextInput
                ref={inputRef}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: error ? Colors.light.error : theme.border,
                  },
                ]}
                placeholder="000000"
                placeholderTextColor={theme.textSecondary}
                value={otp}
                onChangeText={handleOTPChange}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
                selectionColor={primaryColor}
              />
              {error && (
                <ThemedText type="small" style={styles.errorText}>
                  {error}
                </ThemedText>
              )}

              <Pressable
                onPress={handleVerify}
                disabled={isLoading || otp.length !== 6}
                style={({ pressed }) => [
                  styles.verifyButton,
                  { opacity: isLoading || otp.length !== 6 ? 0.6 : pressed ? 0.8 : 1 },
                ]}
              >
                <LinearGradient
                  colors={isDark ? [primaryColor, "#5B8DEE"] : ["#2C3E50", "#3498db"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="check" size={20} color="#FFFFFF" />
                      <ThemedText style={styles.buttonText}>
                        Verify OTP
                      </ThemedText>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={onClose}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.cancelButton,
                  { opacity: isLoading ? 0.6 : pressed ? 0.8 : 1 },
                ]}
              >
                <ThemedText type="body" style={{ color: primaryColor, fontWeight: "600" }}>
                  Cancel
                </ThemedText>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  header: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  content: {
    padding: Spacing.xl,
  },
  label: {
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  otpInput: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 4,
    textAlign: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.light.error,
    marginBottom: Spacing.md,
  },
  verifyButton: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
});
