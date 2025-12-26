import React, { useState } from "react";
import { StyleSheet, ScrollView, View, Pressable, Switch, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function ProfileSettingsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [offlineMode, setOfflineMode] = useState(false);
  const [cacheQuizzes, setCacheQuizzes] = useState(true);
  const [saveImages, setSaveImages] = useState(true);

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      "Are you sure you want to clear all cached quizzes and images? This will free up space but may slow down loading.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: () => Alert.alert("Success", "Cache cleared successfully!") }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3" style={styles.headerTitle}>Profile Settings</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            OFFLINE SETTINGS
          </ThemedText>
          <View style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>Offline Mode</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Access cached quizzes without internet</ThemedText>
              </View>
              <Switch 
                value={offlineMode} 
                onValueChange={setOfflineMode}
                trackColor={{ false: "#767577", true: theme.primary }}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>Auto-cache Quizzes</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Automatically download new quizzes</ThemedText>
              </View>
              <Switch 
                value={cacheQuizzes} 
                onValueChange={setCacheQuizzes}
                trackColor={{ false: "#767577", true: theme.primary }}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>Save Media</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Keep images for offline viewing</ThemedText>
              </View>
              <Switch 
                value={saveImages} 
                onValueChange={setSaveImages}
                trackColor={{ false: "#767577", true: theme.primary }}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            STORAGE MANAGEMENT
          </ThemedText>
          <Pressable 
            onPress={handleClearCache}
            style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <ThemedText type="body" style={{ fontWeight: "600", color: theme.error }}>Clear App Cache</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Free up space on your device</ThemedText>
              </View>
              <Feather name="trash-2" size={20} color={theme.error} />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontWeight: "700",
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: "700",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  settingText: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.lg,
  },
});