import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function CreateLiveQuizScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { quizId, quizTitle } = route.params;

  const [liveTitle, setLiveTitle] = useState("");
  const [duration, setDuration] = useState("80");
  const [maxParticipants, setMaxParticipants] = useState("3500");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!liveTitle.trim()) {
      Alert.alert("Error", "Please enter a Live Test Title");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/livequiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId,
          quizTitle,
          liveTitle,
          duration: parseInt(duration),
          maxParticipants: parseInt(maxParticipants),
          status: "live",
          startTime: new Date().toISOString(),
          joinedCount: 0
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Live Quiz started successfully");
        navigation.navigate("AdminDashboard");
      } else {
        Alert.alert("Error", "Failed to start Live Quiz");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText type="h2" style={styles.label}>Selected Quiz: {quizTitle}</ThemedText>
        
        <ThemedText type="body" style={styles.inputLabel}>Live Test Title (Hindi supported)</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
          value={liveTitle}
          onChangeText={setLiveTitle}
          placeholder="e.g. तृतीय श्रेणी अध्यापक परीक्षा"
          placeholderTextColor={theme.textSecondary}
        />

        <ThemedText type="body" style={styles.inputLabel}>Duration (mins)</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
        />

        <ThemedText type="body" style={styles.inputLabel}>Max Participants</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
          value={maxParticipants}
          onChangeText={setMaxParticipants}
          keyboardType="numeric"
        />

        <Pressable 
          onPress={handleCreate}
          disabled={loading}
          style={[styles.button, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
        >
          {loading ? <ActivityIndicator color="white" /> : <ThemedText style={styles.buttonText}>Launch Live Quiz</ThemedText>}
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.lg },
  label: { marginBottom: Spacing.xl },
  inputLabel: { marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: 16,
  },
  button: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold' }
});
