import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

export default function LiveQuizSelectionScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  
  const { data: quizzes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/quizzes"],
    queryFn: async () => {
      const response = await fetch("/api/quizzes");
      if (!response.ok) throw new Error("Failed to fetch quizzes");
      return response.json();
    }
  });

  const handleSelectQuiz = (quiz: any) => {
    navigation.navigate("CreateLiveQuiz", { quizId: quiz._id, quizTitle: quiz.title });
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
        data={quizzes}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Pressable 
            onPress={() => handleSelectQuiz(item)}
            style={[styles.quizItem, { backgroundColor: theme.backgroundSecondary }]}
          >
            <ThemedText type="body" style={{ fontWeight: 'bold' }}>{item.title}</ThemedText>
            <ThemedText type="small">{item.category}</ThemedText>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} style={styles.icon} />
          </Pressable>
        )}
        contentContainerStyle={styles.list}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { 
    padding: Spacing.md,
    paddingTop: Spacing.xl * 3
  },
  quizItem: {
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    flexDirection: 'column',
    position: 'relative',
  },
  icon: { position: 'absolute', right: Spacing.md, top: '50%', marginTop: -10 }
});
