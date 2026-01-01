import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
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
  const headerHeight = useHeaderHeight(); // ✅ KEY FIX

  const { data: liveQuizzes = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/livequizzes"],
    queryFn: async () => {
      const response = await fetch("/api/admin/livequizzes");
      if (!response.ok) throw new Error("Failed to fetch live quizzes");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
        ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
        : "";
      const response = await fetch(
        `${baseUrl}/api/admin/livequiz/${id}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete live quiz");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/livequizzes"],
      });
      Alert.alert("Success", "Live Quiz deleted successfully");
    },
  });

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
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.liveBadge}>
                <ThemedText style={styles.liveText}>LIVE</ThemedText>
              </View>

              <View style={styles.participants}>
                <Feather name="users" size={16} color="#aaa" />
                <ThemedText>0</ThemedText>
              </View>

              <Pressable
                onPress={() =>
                  navigation.navigate("EditLiveQuiz", { id: item.id })
                }
              >
                <Feather name="edit-2" size={18} color={theme.primary} />
              </Pressable>

              <Pressable onPress={() => deleteMutation.mutate(item.id)}>
                <Feather name="trash" size={18} color="#ff4d4d" />
              </Pressable>
            </View>
          </View>
        )}
        contentContainerStyle={{
          paddingTop: headerHeight + 16, // ✅ FIX
          paddingHorizontal: Spacing.md,
          paddingBottom: 160,
        }}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <Pressable
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate("CreateLiveQuiz")}
      >
        <Feather name="plus" size={28} color="#fff" />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: "#2e3646",
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  liveBadge: {
    backgroundColor: "#ffdddd",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveText: {
    color: "#d60000",
    fontWeight: "700",
    fontSize: 12,
  },
  participants: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
});
