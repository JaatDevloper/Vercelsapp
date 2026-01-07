import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import Animated, { 
  FadeIn, 
  FadeOut, 
  ScaleInCenter, 
  ScaleOutCenter 
} from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface NamePromptModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  title?: string;
}

const { width } = Dimensions.get("window");

export default function NamePromptModal({
  visible,
  onClose,
  onSubmit,
  title = "Enter your name to join the quiz",
}: NamePromptModalProps) {
  const { theme, isDark } = useTheme();
  const [name, setName] = useState("");

  useEffect(() => {
    if (visible) {
      setName("");
    }
  }, [visible]);

  const handleSubmit = () => {
    if (name.trim().length > 0) {
      onSubmit(name.trim());
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Animated.View 
          entering={FadeIn.duration(300)} 
          exiting={FadeOut.duration(200)}
          style={StyleSheet.absoluteFill}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 30 : 50}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <Pressable style={styles.overlay} onPress={onClose} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <Animated.View
            entering={ScaleInCenter.duration(300).springify()}
            exiting={ScaleOutCenter.duration(200)}
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark 
                  ? "rgba(31, 41, 55, 0.85)" 
                  : "rgba(255, 255, 255, 0.85)",
                borderColor: isDark 
                  ? "rgba(255, 255, 255, 0.1)" 
                  : "rgba(0, 0, 0, 0.05)",
              },
            ]}
          >
            <ThemedText type="h4" style={styles.title}>
              {title}
            </ThemedText>

            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: isDark 
                    ? "rgba(0, 0, 0, 0.2)" 
                    : "rgba(0, 0, 0, 0.05)",
                  borderColor: theme.border,
                },
              ]}
              placeholder="Your Name"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
            />

            <View style={styles.buttonContainer}>
              <Pressable
                onPress={onClose}
                style={[styles.button, styles.cancelButton]}
              >
                <ThemedText style={{ color: theme.textSecondary }}>Cancel</ThemedText>
              </Pressable>

              <Pressable
                onPress={handleSubmit}
                style={[
                  styles.button,
                  styles.submitButton,
                  { backgroundColor: theme.primary },
                  name.trim().length === 0 && { opacity: 0.5 }
                ]}
                disabled={name.trim().length === 0}
              >
                <ThemedText style={styles.submitText}>Join</ThemedText>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  keyboardView: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: Math.min(width * 0.85, 400),
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  input: {
    height: 50,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    marginBottom: Spacing.xl,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
  },
  submitButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
