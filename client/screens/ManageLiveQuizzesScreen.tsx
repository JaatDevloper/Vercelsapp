import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

export default function ManageLiveQuizzesScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const { data: liveQuizzes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/livequizzes"],
    queryFn: async () => {
      const response = await fetch("/api/admin/livequizzes");
      if (!response.ok) throw new Error("Failed to fetch live quizzes");
      return response.json();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const baseUrl = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      const response = await fetch(`${baseUrl}/api/admin/livequiz/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete live quiz');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/livequizzes"] });
      Alert.alert("Success", "Live Quiz deleted successfully");
    },
    onError: (error) => {
      console.error("Delete error:", error);
      Alert.alert("Error", "Failed to delete live quiz");
    }
  });

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Live Quiz",
      "Are you sure you want to delete this live quiz?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(id) }
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={liveQuizzes}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={[styles.quizItem, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.quizInfo}>
              <ThemedText type="body" style={{ fontWeight: 'bold' }}>{item.liveTitle || item.quizTitle}</ThemedText>
              <ThemedText type="small">Status: {item.status}</ThemedText>
              <ThemedText type="small">Participants: {item.joinedCount || 0}</ThemedText>
            </View>
            <View style={styles.actions}>
              <Pressable 
                onPress={() => navigation.navigate("CreateLiveQuiz", { quizId: item.quizId, quizTitle: item.quizTitle, existingQuiz: item })}
                style={styles.actionButton}
              >
                <Feather name="edit-2" size={18} color={theme.primary} />
              </Pressable>
              <Pressable 
                onPress={() => handleDelete(item._id)}
                style={styles.actionButton}
              >
                <Feather name="trash-2" size={18} color="#EF4444" />
              </Pressable>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText>No running live quizzes found.</ThemedText>
          </View>
        }
      />

      <Pressable 
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate("LiveQuizSelection")}
      >
        <Feather name="plus" size={24} color="white" />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.md },
  quizItem: {
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quizInfo: { flex: 1 },
  actions: { flexDirection: 'row', gap: 12 },
  actionButton: { padding: 4 },
  empty: { padding: 20, alignItems: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
});
