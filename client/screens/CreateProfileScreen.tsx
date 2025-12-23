import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useProfile } from "@/hooks/useProfile";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { OTPVerificationScreen } from "./OTPVerificationScreen";

export default function CreateProfileScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { createProfile, isCreating, createError, requestOTP, isRequestingOTP, verifyOTP, isVerifyingOTP } = useProfile();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingProfileData, setPendingProfileData] = useState<any>(null);

  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to add a profile photo."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setAvatarUrl(base64Image);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const validateEmail = (email: string) => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleCreateProfile = async () => {
    setNameError("");
    setEmailError("");

    let hasError = false;

    if (!name.trim()) {
      setNameError("Name is required");
      hasError = true;
    }

    if (email && !validateEmail(email)) {
      setEmailError("Please enter a valid email");
      hasError = true;
    }

    if (hasError) return;

    // Request OTP
    const profileData = { name: name.trim(), email: email.trim(), avatarUrl };
    setPendingProfileData(profileData);
    
    try {
      await requestOTP(email.trim());
      setShowOTPModal(true);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to send OTP");
    }
  };

  const handleOTPVerified = async (otp: string) => {
    if (!pendingProfileData) return;

    try {
      await verifyOTP(email.trim(), otp);
      setShowOTPModal(false);
      
      // Create profile after OTP verification
      createProfile(pendingProfileData, {
        onSuccess: () => {
          navigation.goBack();
        },
        onError: (error) => {
          Alert.alert("Error", error.message || "Failed to create profile");
        },
      });
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Invalid OTP");
    }
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
          <ThemedText type="h3" style={styles.headerTitle}>Create Profile</ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <ThemedText type="small" style={styles.headerSubtitle}>
          Set up your profile to personalize your experience
        </ThemedText>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={[styles.avatarSection, { backgroundColor: theme.backgroundDefault }]}
          >
            <Pressable onPress={pickImage}>
              <View style={[styles.avatar, { backgroundColor: primaryColor }]}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Feather name="user" size={50} color="#FFFFFF" />
                )}
              </View>
              <View style={[styles.cameraButton, { backgroundColor: theme.primary }]}>
                <Feather name="camera" size={14} color="#FFFFFF" />
              </View>
            </Pressable>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              Tap to add profile photo
            </ThemedText>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={[styles.formSection, { backgroundColor: theme.backgroundDefault }]}
          >
            <View style={styles.inputGroup}>
              <ThemedText type="body" style={styles.inputLabel}>Full Name *</ThemedText>
              <View style={[
                styles.inputContainer,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: nameError ? Colors.light.error : theme.border,
                },
              ]}>
                <Feather name="user" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.textInput, { color: theme.text }]}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (nameError) setNameError("");
                  }}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
              {nameError ? (
                <ThemedText type="small" style={styles.errorText}>{nameError}</ThemedText>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="body" style={styles.inputLabel}>Email Address</ThemedText>
              <View style={[
                styles.inputContainer,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: emailError ? Colors.light.error : theme.border,
                },
              ]}>
                <Feather name="mail" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.textInput, { color: theme.text }]}
                  placeholder="Enter your email (optional)"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError("");
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {emailError ? (
                <ThemedText type="small" style={styles.errorText}>{emailError}</ThemedText>
              ) : null}
            </View>
          </Animated.View>

          {createError && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.errorBanner}>
              <Feather name="alert-circle" size={20} color={Colors.light.error} />
              <ThemedText type="small" style={{ color: Colors.light.error, flex: 1 }}>
                {createError.message || "Failed to create profile"}
              </ThemedText>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <Pressable
              onPress={handleCreateProfile}
              disabled={isCreating || isRequestingOTP}
              style={({ pressed }) => [
                styles.createButton,
                { opacity: (isCreating || isRequestingOTP) ? 0.6 : pressed ? 0.8 : 1 },
              ]}
            >
              <LinearGradient
                colors={isDark ? [primaryColor, "#5B8DEE"] : ["#2C3E50", "#3498db"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {isCreating || isRequestingOTP ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="check" size={20} color="#FFFFFF" />
                    <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "700" }}>
                      Create Profile
                    </ThemedText>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <OTPVerificationScreen
        visible={showOTPModal}
        email={email}
        onClose={() => setShowOTPModal(false)}
        onVerified={handleOTPVerified}
        isLoading={isVerifyingOTP}
      />
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
    paddingTop: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginTop: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  formSection: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
  },
  errorText: {
    color: Colors.light.error,
    marginTop: Spacing.xs,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: `${Colors.light.error}15`,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  createButton: {
    marginTop: Spacing.md,
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
});
