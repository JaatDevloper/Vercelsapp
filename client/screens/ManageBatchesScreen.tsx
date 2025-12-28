import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const { width } = Dimensions.get("window");

export default function ManageBatchesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/batches");
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchBatches();
    });
    return unsubscribe;
  }, [navigation]);

  const handleDeleteBatch = (id: string) => {
    Alert.alert(
      "Delete Batch",
      "Are you sure you want to delete this batch?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`/api/admin/batches/${id}`, {
                method: "DELETE",
              });
              if (response.ok) {
                setBatches(batches.filter(b => b._id !== id));
                Alert.alert("Success", "Batch deleted successfully");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete batch");
            }
          }
        }
      ]
    );
  };

  const renderBatchItem = ({ item }: { item: any }) => (
    <View style={[styles.batchCard, { backgroundColor: theme.backgroundSecondary }]}>
      <Image
        source={{ uri: item.thumbnail || "https://via.placeholder.com/150" }}
        style={styles.thumbnail}
      />
      <View style={styles.batchInfo}>
        <ThemedText type="body" style={{ fontWeight: 'bold' }}>{item.title}</ThemedText>
        <ThemedText type="small" numberOfLines={2} style={{ color: theme.textSecondary }}>{item.description}</ThemedText>
        <ThemedText type="small" style={{ marginTop: Spacing.xs, color: theme.primary }}>
          {item.topics?.length || 0} Topics
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <Pressable 
          onPress={() => navigation.navigate("EditBatch" as any, { batch: item })}
          style={[styles.actionButton, { backgroundColor: theme.backgroundDefault }]}
        >
          <Feather name="edit-2" size={18} color={theme.primary} />
        </Pressable>
        <Pressable 
          onPress={() => handleDeleteBatch(item._id)}
          style={[styles.actionButton, { backgroundColor: theme.backgroundDefault }]}
        >
          <Feather name="trash-2" size={18} color="#FF6B6B" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3">Manage Batches</ThemedText>
        <Pressable onPress={() => navigation.navigate("CreateBatch" as any)}>
          <Feather name="plus" size={24} color={theme.primary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </ThemedView>
      ) : (
        <FlatList
          data={batches}
          keyExtractor={(item) => item._id}
          renderItem={renderBatchItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>No batches found</ThemedText>
            </View>
          }
        />
      )}
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
  listContent: { padding: Spacing.lg },
  batchCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  thumbnail: {
    width: 80,
    height: 60,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  batchInfo: { flex: 1 },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
});
