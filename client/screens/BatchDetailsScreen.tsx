import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

const { width } = Dimensions.get("window");

export default function BatchDetailsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { batchId } = route.params as { batchId: string };

  const { data: batch, isLoading } = useQuery({
    queryKey: ["/api/batches", batchId],
    queryFn: async () => {
      const response = await fetch("/api/batches");
      if (!response.ok) return null;
      const batches = await response.json();
      return batches.find((b: any) => b._id === batchId);
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const response = await fetch(`/api/profile?deviceId=unknown`);
      if (!response.ok) return null;
      return response.json();
    }
  });

  const isBatchUnlocked = profile?.unlockedBatches?.includes(batchId) || batch?.price === 0;

  const handlePurchase = async () => {
    if (!batch) return;
    
    Alert.alert(
      "Confirm Purchase",
      `Would you like to purchase "${batch.title}" for ₹${batch.price}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Purchase", 
          onPress: async () => {
            try {
              const response = await fetch("/api/batches/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deviceId: "unknown", batchId }),
              });
              if (response.ok) {
                queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
                Alert.alert("Success", "Batch unlocked successfully!");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to purchase batch");
            }
          }
        }
      ]
    );
  };

  if (isLoading || !batch) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  // Group topics by their name to show "folders"
  const topicGroups = batch.topics?.reduce((acc: any, topic: any) => {
    if (!acc[topic.name]) acc[topic.name] = [];
    acc[topic.name].push(topic);
    return acc;
  }, {});

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={{ uri: batch.thumbnail }} style={styles.banner} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.bannerOverlay}
          />
          <Pressable 
            onPress={() => navigation.goBack()} 
            style={[styles.backButton, { top: insets.top + Spacing.md }]}
          >
            <Feather name="arrow-left" size={24} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.content}>
          <ThemedText type="h1" style={styles.title}>{batch.title}</ThemedText>
          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            {batch.description}
          </ThemedText>

          {!isBatchUnlocked && (
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.purchaseCard}
            >
              <View>
                <ThemedText style={styles.priceLabel}>Limited Offer</ThemedText>
                <ThemedText style={styles.priceValue}>₹{batch.price}</ThemedText>
              </View>
              <Pressable style={styles.purchaseButton} onPress={handlePurchase}>
                <ThemedText style={styles.purchaseButtonText}>Unlock All Quizzes</ThemedText>
              </Pressable>
            </LinearGradient>
          )}

          <View style={styles.topicsSection}>
            <ThemedText type="h2" style={styles.sectionTitle}>Topics</ThemedText>
            {Object.entries(topicGroups).map(([name, quizzes]: [string, any]) => (
              <View key={name} style={[styles.topicFolder, { backgroundColor: theme.backgroundSecondary }]}>
                <View style={styles.folderHeader}>
                  <Feather name="folder" size={20} color={theme.primary} />
                  <ThemedText type="body" style={styles.folderName}>{name}</ThemedText>
                </View>
                
                <View style={styles.quizList}>
                  {quizzes.map((quiz: any, index: number) => (
                    <Pressable 
                      key={quiz.quizId + index}
                      style={styles.quizItem}
                      onPress={() => {
                        if (isBatchUnlocked) {
                          navigation.navigate("QuizDetails", { quizId: quiz.quizId });
                        } else {
                          handlePurchase();
                        }
                      }}
                    >
                      <ThemedText type="small" style={{ flex: 1 }}>Quiz {index + 1}</ThemedText>
                      <Feather 
                        name={isBatchUnlocked ? "play-circle" : "lock"} 
                        size={18} 
                        color={isBatchUnlocked ? theme.primary : theme.textSecondary} 
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { height: 240, position: "relative" },
  banner: { width: "100%", height: "100%" },
  bannerOverlay: { ...StyleSheet.absoluteFillObject },
  backButton: {
    position: "absolute",
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { padding: Spacing.lg, marginTop: -20, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: 'transparent' },
  title: { marginBottom: Spacing.sm },
  description: { marginBottom: Spacing.xl, lineHeight: 20 },
  purchaseCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  priceLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" },
  priceValue: { color: "#fff", fontSize: 28, fontWeight: "800" },
  purchaseButton: {
    backgroundColor: "#fff",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  purchaseButtonText: { color: "#FFA500", fontWeight: "700" },
  topicsSection: { marginTop: Spacing.md },
  sectionTitle: { marginBottom: Spacing.md },
  topicFolder: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  folderHeader: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.md, gap: Spacing.sm },
  folderName: { fontWeight: "700" },
  quizList: { gap: Spacing.sm },
  quizItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
});
