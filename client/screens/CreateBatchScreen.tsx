import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

export default function CreateBatchScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [topics, setTopics] = useState<{ id: string; name: string; quizId: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAddTopic = () => {
    Alert.alert("Add Topic", "Feature to select quiz from collection coming soon");
  };

  const handleCreateBatch = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a batch title");
      return;
    }
    setLoading(true);
    // Logic to save batch
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Success", "Batch created successfully");
      navigation.goBack();
    }, 1000);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3">Create Batch</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formGroup}>
          <ThemedText type="body" style={styles.label}>Batch Title</ThemedText>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="Enter batch title"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText type="body" style={styles.label}>Description</ThemedText>
          <TextInput
            style={[styles.input, styles.textarea, { color: theme.text, borderColor: theme.border }]}
            placeholder="Enter batch description"
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText type="body" style={styles.label}>Thumbnail URL</ThemedText>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="Enter image URL"
            placeholderTextColor={theme.textSecondary}
            value={thumbnail}
            onChangeText={setThumbnail}
          />
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="h2">Topics & Quizzes</ThemedText>
          <Pressable onPress={handleAddTopic} style={styles.addTopicButton}>
            <Feather name="plus" size={20} color={Colors.light.primary} />
            <ThemedText type="body" style={{ color: Colors.light.primary, marginLeft: Spacing.xs }}>Add Topic</ThemedText>
          </Pressable>
        </View>

        {topics.map((topic) => (
          <View key={topic.id} style={[styles.topicCard, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText type="body">{topic.name}</ThemedText>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Pressable
          style={[styles.createButton, { backgroundColor: Colors.light.primary }]}
          onPress={handleCreateBatch}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <ThemedText type="body" style={styles.createButtonText}>Create Batch</ThemedText>}
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: { padding: Spacing.xs },
  scrollContent: { padding: Spacing.lg },
  formGroup: { marginBottom: Spacing.lg },
  label: { marginBottom: Spacing.xs, fontWeight: "600" },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  textarea: { height: 100, paddingTop: Spacing.md, textAlignVertical: "top" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  addTopicButton: { flexDirection: "row", alignItems: "center" },
  topicCard: { padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  createButton: {
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  createButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
