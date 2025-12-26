import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useProfile } from "@/hooks/useProfile";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

export default function ChangePasswordScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { changePassword } = useProfile();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const validatePassword = (pwd: string) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(pwd);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (!validatePassword(newPassword)) {
      Alert.alert("Weak Password", "Password must have 8+ chars, uppercase, lowercase, number & special char");
      return;
    }

    setIsLoading(true);
    try {
      await (changePassword as any)({ oldPassword, newPassword });
      Alert.alert("Success", "Password changed successfully", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3" style={styles.headerTitle}>Change Password</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>Current Password</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <Feather name="lock" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                secureTextEntry={!showOldPassword}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Enter current password"
                placeholderTextColor={theme.textSecondary}
              />
              <Pressable onPress={() => setShowOldPassword(!showOldPassword)}>
                <Feather name={showOldPassword ? "eye-off" : "eye"} size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>New Password</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <Feather name="shield" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={theme.textSecondary}
              />
              <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
                <Feather name={showNewPassword ? "eye-off" : "eye"} size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>Confirm New Password</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <Feather name="check-circle" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                secureTextEntry={!showNewPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <Pressable
            onPress={handleChangePassword}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.primary, opacity: pressed || isLoading ? 0.8 : 1 }
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <ThemedText style={styles.buttonText}>Update Password</ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: { padding: Spacing.xs },
  headerTitle: { fontWeight: "700" },
  content: { padding: Spacing.lg },
  inputGroup: { marginBottom: Spacing.lg },
  label: { marginBottom: Spacing.xs, fontWeight: "600" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 50,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  input: { flex: 1, marginLeft: Spacing.md, fontSize: 16 },
  button: {
    height: 50,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  buttonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});