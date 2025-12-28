import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
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
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");

  useEffect(() => {
    fetch("/api/quizzes")
      .then((res) => res.json())
      .then(setQuizzes)
      .catch(console.error);
  }, []);

  const handleAddTopic = () => {
    if (!newTopicName.trim()) {
      Alert.alert("Error", "Please enter a topic name");
      return;
    }
    setShowQuizModal(true);
  };

  const selectQuizForTopic = (quiz: any) => {
    setTopics([...topics, { id: Date.now().toString(), name: newTopicName, quizId: quiz._id }]);
    setNewTopicName("");
    setShowQuizModal(false);
  };

  const handleCreateBatch = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a batch title");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/admin/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, thumbnail, topics }),
      });
      if (response.ok) {
        Alert.alert("Success", "Batch created successfully");
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create batch");
    } finally {
      setLoading(false);
    }
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

        <View style={styles.formGroup}>
          <ThemedText type="body" style={styles.label}>Topic Name</ThemedText>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TextInput
              style={[styles.input, { flex: 1, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g. Rajasthan History"
              placeholderTextColor={theme.textSecondary}
              value={newTopicName}
              onChangeText={setNewTopicName}
            />
            <Pressable onPress={handleAddTopic} style={[styles.addTopicButton, { backgroundColor: Colors.light.primary, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, justifyContent: 'center' }]}>
              <ThemedText type="body" style={{ color: '#fff' }}>Add</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="h2">Topics Added</ThemedText>
        </View>

        {topics.map((topic) => (
          <View key={topic.id} style={[styles.topicCard, { backgroundColor: theme.backgroundSecondary, flexDirection: 'row', justifyContent: 'space-between' }]}>
            <ThemedText type="body">{topic.name}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Quiz ID: {topic.quizId.slice(-4)}</ThemedText>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showQuizModal} animationType="slide">
        <ThemedView style={{ flex: 1, padding: Spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg }}>
            <ThemedText type="h2">Select Quiz for {newTopicName}</ThemedText>
            <Pressable onPress={() => setShowQuizModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>
          <ScrollView>
            {quizzes.map((quiz) => (
              <Pressable 
                key={quiz._id} 
                onPress={() => selectQuizForTopic(quiz)}
                style={{ padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: theme.border }}
              >
                <ThemedText type="body">{quiz.title}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>{quiz.category}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </ThemedView>
      </Modal>

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
  addTopicButton: { height: 48 },
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
