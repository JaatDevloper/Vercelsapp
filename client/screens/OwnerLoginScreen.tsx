import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useOwnerAuth } from "@/hooks/useOwnerAuth";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

export default function OwnerLoginScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { ownerLogin } = useOwnerAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [inputError, setInputError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleOwnerLogin = async () => {
    setInputError("");

    if (!email.trim()) {
      setInputError("Please enter your email");
      return;
    }

    if (!validateEmail(email)) {
      setInputError("Please enter a valid email");
      return;
    }

    if (!password.trim()) {
      setInputError("Please enter your password");
      return;
    }

    setIsLoggingIn(true);
    try {
      const success = await ownerLogin(email.trim(), password);

      if (success) {
        Alert.alert("Success", "Owner login successful!");
        navigation.navigate("AdminDashboard");
      } else {
        Alert.alert(
          "Login Failed",
          "Invalid email or password. Please check your credentials."
        );
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred during login");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={isDark ? ["#1a1a2e", "#16213e"] : ["#FF6B6B", "#FF8E8E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContent}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <ThemedText type="h3" style={styles.headerTitle}>Owner Login</ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <ThemedText type="small" style={styles.headerSubtitle}>
          Access the admin control panel
        </ThemedText>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.formContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={[styles.formCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${primaryColor}20` }]}>
              <Feather name="shield" size={32} color={primaryColor} />
            </View>

            <ThemedText type="h2" style={styles.formTitle}>
              Owner Access
            </ThemedText>
            <ThemedText type="small" style={styles.formSubtitle}>
              Only administrators can access this panel
            </ThemedText>

            {inputError ? (
              <View style={[styles.errorBox, { backgroundColor: "#FF6B6B20" }]}>
                <Feather name="alert-circle" size={18} color="#FF6B6B" />
                <ThemedText
                  type="small"
                  style={[styles.errorText, { color: "#FF6B6B" }]}
                >
                  {inputError}
                </ThemedText>
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <ThemedText type="body" style={styles.label}>
                Email Address
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: theme.border, backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <Feather name="mail" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter owner email"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoggingIn}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText type="body" style={styles.label}>
                Password
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: theme.border, backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <Feather name="lock" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter password"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoggingIn}
                  secureTextEntry={!showPassword}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleOwnerLogin}
              disabled={isLoggingIn}
              style={({ pressed }) => [
                styles.loginButton,
                {
                  backgroundColor: primaryColor,
                  opacity: isLoggingIn || pressed ? 0.7 : 1,
                },
              ]}
            >
              {isLoggingIn ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Feather name="lock" size={20} color="white" />
                  <ThemedText type="body" style={styles.loginButtonText}>
                    Access Admin Panel
                  </ThemedText>
                </>
              )}
            </Pressable>

            <View style={styles.securityNote}>
              <Feather name="info" size={16} color={theme.textSecondary} />
              <ThemedText
                type="small"
                style={[styles.securityText, { color: theme.textSecondary }]}
              >
                Your credentials are securely stored in the app
              </ThemedText>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  formContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  formCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  formTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  formSubtitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    height: 50,
  },
  input: {
    flex: 1,
    marginHorizontal: Spacing.md,
    fontSize: 16,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  loginButtonText: {
    color: "white",
    marginLeft: Spacing.sm,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  securityText: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
});
