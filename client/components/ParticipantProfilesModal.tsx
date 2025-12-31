import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";

interface Participant {
  userName: string;
  avatarUrl?: string;
  score: number;
}

interface ParticipantProfilesModalProps {
  visible: boolean;
  onClose: () => void;
  participants: Participant[];
}

export default function ParticipantProfilesModal({
  visible,
  onClose,
  participants,
}: ParticipantProfilesModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <ThemedView style={styles.modalContainer}>
          <View style={styles.header}>
            <ThemedText type="h3">Participants</ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#6B7280" />
            </Pressable>
          </View>

          <FlatList
            data={participants}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.participantItem}>
                <Image
                  source={{ uri: item.avatarUrl || "https://via.placeholder.com/150" }}
                  style={styles.avatar}
                />
                <View style={styles.info}>
                  <ThemedText style={styles.name}>{item.userName}</ThemedText>
                  <ThemedText type="small" style={styles.score}>
                    Score: {item.score}
                  </ThemedText>
                </View>
              </View>
            )}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <ThemedText style={{ color: "#6B7280" }}>No participants yet</ThemedText>
              </View>
            }
          />
        </ThemedView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: Dimensions.get("window").width * 0.9,
    maxHeight: Dimensions.get("window").height * 0.7,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  list: {
    paddingBottom: Spacing.md,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E5E7EB",
  },
  info: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  score: {
    color: "#6B7280",
    marginTop: 2,
  },
  empty: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
});
