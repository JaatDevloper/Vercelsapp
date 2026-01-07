import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useNavigation } from "@react-navigation/native";

export default function ManageBroadcastRoomsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/rooms/broadcasts");
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDeleteRoom = (roomCode: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this broadcast room?");
    if (!confirmed) return;

    const performDelete = async () => {
      try {
        const response = await fetch(`/api/admin/rooms/${roomCode}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setRooms(rooms.filter((r) => r.roomCode !== roomCode));
        } else {
          alert("Failed to delete room");
        }
      } catch (error) {
        alert("Something went wrong");
      }
    };

    performDelete();
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={styles.cardHeader}>
        <View style={styles.roomInfo}>
          <ThemedText type="h4">#{item.roomCode}</ThemedText>
          <View style={styles.liveBadge}>
            <ThemedText style={styles.liveText}>LIVE</ThemedText>
          </View>
        </View>
        <Pressable 
          onPress={() => handleDeleteRoom(item.roomCode)}
          hitSlop={20}
        >
          <Feather name="trash-2" size={20} color="#FF6B6B" />
        </Pressable>
      </View>
      
      <ThemedText type="body" style={styles.quizTitle}>{item.quizTitle}</ThemedText>
      
      <View style={styles.cardFooter}>
        <View style={styles.metaInfo}>
          <Feather name="user" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.hostName}</ThemedText>
        </View>
        <View style={styles.metaInfo}>
          <Feather name="users" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.participants?.length || 0} players
          </ThemedText>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h2">Manage Broadcasts</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {loading && rooms.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.roomCode}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchRooms} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="radio" size={48} color={theme.textSecondary} />
              <ThemedText type="body" style={{ marginTop: Spacing.md }}>No active broadcast rooms</ThemedText>
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
  backButton: { padding: 8 },
  list: { padding: Spacing.lg },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  roomInfo: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  liveBadge: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
  quizTitle: { fontWeight: "700", marginBottom: Spacing.md },
  cardFooter: { flexDirection: "row", gap: Spacing.lg },
  metaInfo: { flexDirection: "row", alignItems: "center", gap: 4 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xl },
});