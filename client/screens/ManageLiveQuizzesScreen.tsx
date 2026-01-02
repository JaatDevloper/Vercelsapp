import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable 
          onPress={() => navigation.navigate("LiveQuizSelection")}
          style={{ marginRight: 16 }}
        >
          <Feather name="plus" size={24} color={theme.primary} />
        </Pressable>
      ),
    });
  }, [navigation, theme.primary]);

  const { data: liveQuizzes, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/livequizzes"],
    queryFn: async () => {
      const response = await fetch("/api/admin/livequizzes");
      if (!response.ok) throw new Error("Failed to fetch live quizzes");
      return response.json();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/livequiz/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete live quiz');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/livequizzes"] });
      refetch();
      Alert.alert("Success", "Live Quiz deleted successfully");
    },
    onError: (error) => {
      console.error("Delete error:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to delete live quiz");
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
              <ThemedText type="h3" style={styles.quizTitle}>
                {item.liveTitle || item.quizTitle}
              </ThemedText>
              <View style={styles.statsRow}>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#DEF7EC' : '#FDE8E8' }]}>
                  <ThemedText style={[styles.statusText, { color: item.status === 'active' ? '#03543F' : '#9B1C1C' }]}>
                    {item.status.toUpperCase()}
                  </ThemedText>
                </View>
                <View style={styles.participantCount}>
                  <Feather name="users" size={14} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ marginLeft: 4 }}>
                    {item.joinedCount || 0}
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable 
                onPress={() => {
                  console.log("Edit button pressed for:", item._id);
                  navigation.navigate("CreateLiveQuiz", { quizId: item.quizId, quizTitle: item.quizTitle, existingQuiz: item });
                }}
                style={styles.actionButton}
              >
                <Feather name="edit-3" size={24} color={theme.primary} />
              </Pressable>
              <Pressable 
                onPress={() => {
                  console.log("Delete button pressed for:", item._id);
                  handleDelete(item._id);
                }}
                style={({ pressed }) => [
                  styles.actionButton,
                  { 
                    backgroundColor: pressed ? 'rgba(0,0,0,0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    borderColor: '#EF4444',
                    zIndex: 999
                  }
                ]}
                hitSlop={{ top: 40, bottom: 40, left: 40, right: 40 }}
              >
                <Feather name="trash-2" size={28} color="#EF4444" />
              </Pressable>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="list" size={48} color={theme.textSecondary} style={{ marginBottom: 16, opacity: 0.5 }} />
            <ThemedText type="body" style={{ textAlign: 'center', opacity: 0.7 }}>
              No running live quizzes found.{"\n"}Tap the + button in the header to create one!
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { 
    padding: Spacing.md, 
    paddingTop: Spacing.xl * 3,
    paddingBottom: Spacing.xl
  },
  quizItem: {
    padding: Spacing.lg,
    borderRadius: 20,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quizInfo: { flex: 1, paddingRight: Spacing.md },
  quizTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 8 
  },
  statsRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 12
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  participantCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: { 
    flexDirection: 'row', 
    gap: 12, 
    alignItems: 'center' 
  },
  actionButton: { 
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: { 
    paddingVertical: 100, 
    alignItems: 'center',
    justifyContent: 'center'
  }
});
