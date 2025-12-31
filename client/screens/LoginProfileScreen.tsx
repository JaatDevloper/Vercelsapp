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
import { useProfile } from "@/hooks/useProfile";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

function OwnerLoginButton({ onPress, theme }: { onPress: () => void; theme: any }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: "#FF6B6B",
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
          borderRadius: BorderRadius.md,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Feather name="shield" size={18} color="white" />
      <ThemedText type="small" style={{ color: "white", marginLeft: Spacing.xs }}>
        Owner Login
      </ThemedText>
    </Pressable>
  );
}

export default function LoginProfileScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { loginProfile, isLoggingIn, loginError } = useProfile();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [inputError, setInputError] = useState("");

  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;

  const validateEmail = (email: string) => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = () => {
    setInputError("");

    if (!email.trim()) {
      setInputError("Please enter your email");
      return;
    }

    if (!validateEmail(email)) {
      setInputError("Please enter a valid email");
      return;
    }

    if (!password) {
      setInputError("Please enter your password");
      return;
    }

    loginProfile(
      { 
        name: name.trim() || undefined,
        email: email.trim(),
        password
      },
      {
        onSuccess: () => {
          // Force a small delay to allow QueryClient to finalize its internal state
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: "MainTabs" as any }],
            });
          }, 300);
        },
        onError: (error) => {
          if (error.message === "PROFILE_NOT_FOUND") {
            Alert.alert(
              "Login Failed",
              "Invalid email or password. Please check your details and try again."
            );
          } else {
            Alert.alert("Error", error.message || "Failed to login");
          }
        },
      }
    );
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={isDark ? ["#1a1a2e", "#16213e"] : ["#2C3E50", "#3498db"]}
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
          <ThemedText type="h3" style={styles.headerTitle}>Login</ThemedText>
          <OwnerLoginButton
            onPress={() => navigation.navigate("OwnerLogin")}
            theme={theme}
          />
        </View>
        <ThemedText type="small" style={styles.headerSubtitle}>
          Login with your email and password
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
              <Feather name="log-in" size={40} color={primaryColor} />
            </View>

            <ThemedText type="body" style={[styles.description, { color: theme.textSecondary }]}>
              Enter your email and password to login to your profile.
            </ThemedText>

            <View style={styles.inputContainer}>
              <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Name (Optional)
              </ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="user" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your profile name (optional)"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Email
              </ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="mail" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your email address"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Password
              </ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="lock" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Feather 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color={theme.textSecondary} 
                  />
                </Pressable>
              </View>
            </View>

            {inputError ? (
              <ThemedText type="small" style={styles.errorText}>
                {inputError}
              </ThemedText>
            ) : null}

            {loginError && loginError.message !== "PROFILE_NOT_FOUND" ? (
              <ThemedText type="small" style={styles.errorText}>
                {loginError.message}
              </ThemedText>
            ) : null}

            <Pressable
              onPress={handleLogin}
              disabled={isLoggingIn}
              style={({ pressed }) => [
                styles.loginButton,
                { opacity: pressed || isLoggingIn ? 0.8 : 1 },
              ]}
            >
              <LinearGradient
                colors={isDark ? [primaryColor, "#5B8DEE"] : ["#2C3E50", "#3498db"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {isLoggingIn ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="log-in" size={20} color="#FFFFFF" />
                    <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "700" }}>
                      Login
                    </ThemedText>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => {
                navigation.goBack();
                setTimeout(() => {
                  navigation.navigate("CreateProfile");
                }, 100);
              }}
              style={({ pressed }) => [
                styles.createNewLink,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <ThemedText type="small" style={{ color: primaryColor }}>
                Don't have a profile? Create one
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate("ForgotPassword")}
              style={({ pressed }) => [
                styles.forgotPasswordLink,
                { opacity: pressed ? 0.7 : 1, marginTop: Spacing.sm },
              ]}
            >
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Forgot Password?
              </ThemedText>
            </Pressable>
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
    paddingBottom: Spacing.xl,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  formContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  formCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing["2xl"],
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  description: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  inputContainer: {
    width: "100%",
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    height: Spacing.inputHeight,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: Spacing.md,
  },
  andContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: Spacing.md,
  },
  andLine: {
    flex: 1,
    height: 1,
  },
  errorText: {
    color: Colors.light.error,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  loginButton: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    width: "100%",
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  createNewLink: {
    marginTop: Spacing.xl,
    padding: Spacing.sm,
  },
  forgotPasswordLink: {
    padding: Spacing.sm,
  },
});
