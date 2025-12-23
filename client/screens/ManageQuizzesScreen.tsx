import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ManagedQuiz {
  _id: string;
  quiz_id: string;
  title: string;
  category: string;
  questionCount: number;
  creator_name: string;
  isDeleted: boolean;
  managedCategory: string | null;
  lastUpdated: string;
}

interface QuizCategory {
  name: string;
  color: string;
  icon: string;
}

export default function ManageQuizzesScreen() {
  const insets = useSafeAreaInsets();
  const themeObj = useTheme();
  const theme = themeObj.theme;
  const [quizzes, setQuizzes] = useState<ManagedQuiz[]>([]);
  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<ManagedQuiz | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#95E1D3");
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quizzesRes, categoriesRes] = await Promise.all([
        fetch("/api/manage/quizzes"),
        fetch("/api/manage/categories"),
      ]);

      if (quizzesRes.ok) {
        const quizzesData = await quizzesRes.json();
        setQuizzes(quizzesData);
      } else {
        console.error("Error fetching quizzes:", quizzesRes.status);
        Alert.alert("Error", "Failed to fetch quizzes");
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      } else {
        console.error("Error fetching categories:", categoriesRes.status);
        Alert.alert("Error", "Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error loading manage data:", error);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredQuizzes = () => {
    if (selectedFilter === "All") {
      return quizzes;
    }
    return quizzes.filter(
      (quiz) => quiz.managedCategory === selectedFilter || quiz.category === selectedFilter
    );
  };

  const updateQuizCategory = async (quizId: string, category: string) => {
    try {
      const response = await fetch(`/api/manage/quizzes/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });

      if (response.ok) {
        loadData();
        setShowCategoryModal(false);
        Alert.alert("Success", "Quiz category updated");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update quiz category");
    }
  };

  const softDeleteQuiz = async (quizId: string, isDeleted: boolean) => {
    try {
      const response = await fetch(`/api/manage/quizzes/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDeleted: !isDeleted }),
      });

      if (response.ok) {
        loadData();
        Alert.alert("Success", `Quiz ${!isDeleted ? "deleted" : "restored"}`);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update quiz");
    }
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Error", "Category name is required");
      return;
    }

    try {
      const response = await fetch("/api/manage/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName,
          color: newCategoryColor,
          icon: "tag",
        }),
      });

      if (response.ok) {
        loadData();
        setNewCategoryName("");
        setNewCategoryColor("#95E1D3");
        setShowCategoryModal(false);
        Alert.alert("Success", "Category created");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create category");
    }
  };

  const renderQuizCard = ({ item: quiz }: { item: ManagedQuiz }) => (
    <Animated.View
      entering={FadeInDown.delay(50)}
      style={[
        styles.quizCard,
        {
          backgroundColor: theme.backgroundSecondary,
          opacity: quiz.isDeleted ? 0.6 : 1,
        },
      ]}
    >
      <View style={styles.quizHeader}>
        <View style={styles.quizInfo}>
          <ThemedText type="h3" numberOfLines={1}>
            {quiz.title}
          </ThemedText>
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
          >
            By {quiz.creator_name} • {quiz.questionCount} questions
          </ThemedText>
        </View>
        {quiz.isDeleted && (
          <View style={[styles.deletedBadge, { backgroundColor: "#FF000030" }]}>
            <Feather name="trash-2" size={12} color="#FF0000" />
          </View>
        )}
      </View>

      <View style={styles.categoryBadge}>
        <ThemedText type="small" style={{ color: theme.primary }}>
          {quiz.managedCategory || quiz.category}
        </ThemedText>
      </View>

      <View style={styles.quizActions}>
        <Pressable
          onPress={() => setSelectedQuiz(quiz)}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: `${theme.primary}20`,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="folder" size={16} color={theme.primary} />
          <ThemedText type="small" style={{ marginLeft: Spacing.xs }}>
            Move
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => softDeleteQuiz(quiz.quiz_id, quiz.isDeleted)}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: quiz.isDeleted ? "#00AA0020" : "#FF000020",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather
            name={quiz.isDeleted ? "refresh-cw" : "trash-2"}
            size={16}
            color={quiz.isDeleted ? "#00AA00" : "#FF0000"}
          />
          <ThemedText
            type="small"
            style={{
              marginLeft: Spacing.xs,
              color: quiz.isDeleted ? "#00AA00" : "#FF0000",
            }}
          >
            {quiz.isDeleted ? "Restore" : "Delete"}
          </ThemedText>
        </Pressable>
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </ThemedView>
    );
  }

  const filteredQuizzes = getFilteredQuizzes();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText type="h2">Manage Quizzes</ThemedText>
        <Pressable
          onPress={() => setShowCategoryModal(true)}
          style={({ pressed }) => [
            styles.createCategoryBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <LinearGradient
            colors={[theme.primary, `${theme.primary}80`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBtn}
          >
            <Feather name="plus" size={18} color="white" />
            <ThemedText type="small" style={{ color: "white", marginLeft: Spacing.xs }}>
              Category
            </ThemedText>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        <Pressable
          onPress={() => setSelectedFilter("All")}
          style={({ pressed }) => [
            styles.filterChip,
            {
              backgroundColor:
                selectedFilter === "All" ? theme.primary : theme.backgroundSecondary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <ThemedText
            type="small"
            style={{
              color: selectedFilter === "All" ? "white" : theme.text,
              fontWeight: selectedFilter === "All" ? "600" : "400",
            }}
          >
            All
          </ThemedText>
        </Pressable>

        {categories.map((cat) => (
          <Pressable
            key={cat.name}
            onPress={() => setSelectedFilter(cat.name)}
            style={({ pressed }) => [
              styles.filterChip,
              {
                backgroundColor:
                  selectedFilter === cat.name ? cat.color : theme.backgroundSecondary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <ThemedText
              type="small"
              style={{
                color: selectedFilter === cat.name ? "white" : theme.text,
                fontWeight: selectedFilter === cat.name ? "600" : "400",
              }}
            >
              {cat.name}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {filteredQuizzes.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={48} color={theme.textSecondary} />
          <ThemedText type="h3" style={{ marginTop: Spacing.md }}>
            {quizzes.length === 0 ? "No quizzes yet" : "No quizzes found"}
          </ThemedText>
          {quizzes.length > 0 && (
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
            >
              Try adjusting your search or category filter
            </ThemedText>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredQuizzes}
          keyExtractor={(item) => item._id}
          renderItem={renderQuizCard}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Category Selection Modal */}
      <Modal
        visible={!!selectedQuiz}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedQuiz(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: "#00000080" }]}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot, paddingTop: insets.top },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Select Category</ThemedText>
              <Pressable onPress={() => setSelectedQuiz(null)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.categoriesList}>
              {categories.map((cat: any) => (
                <Pressable
                  key={cat.name}
                  onPress={() => {
                    if (selectedQuiz) {
                      updateQuizCategory(selectedQuiz.quiz_id, cat.name);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.categoryOption,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      opacity: pressed ? 0.7 : 1,
                      borderLeftColor: cat.color,
                      borderLeftWidth: 4,
                    },
                  ]}
                >
                  <View
                    style={[styles.categoryDot, { backgroundColor: cat.color }]}
                  />
                  <ThemedText type="body">{cat.name}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: "#00000080" }]}>
          <View
            style={[
              styles.createCategoryModal,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <ThemedText type="h3" style={{ marginBottom: Spacing.md }}>
              Create New Category
            </ThemedText>

            <ThemedText type="small" style={{ marginBottom: Spacing.xs }}>
              Category Name
            </ThemedText>
            <TextInput
              placeholder="e.g., Science"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.primary,
                  backgroundColor: theme.backgroundSecondary,
                },
              ]}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />

            <ThemedText type="small" style={{ marginTop: Spacing.md, marginBottom: Spacing.xs }}>
              Color
            </ThemedText>
            <View style={styles.colorPicker}>
              {[
                "#FF6B6B",
                "#4ECDC4",
                "#95E1D3",
                "#F38181",
                "#AA96DA",
                "#FCBAD3",
              ].map((color) => (
                <Pressable
                  key={color}
                  onPress={() => setNewCategoryColor(color)}
                  style={[
                    styles.colorOption,
                    {
                      backgroundColor: color,
                      borderColor: newCategoryColor === color ? theme.text : "transparent",
                      borderWidth: newCategoryColor === color ? 2 : 0,
                    },
                  ]}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowCategoryModal(false)}
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <ThemedText type="body" style={{ color: theme.text }}>
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={createCategory}
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
              >
                <ThemedText type="body" style={{ color: "white" }}>
                  Create
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  filterScroll: {
    marginBottom: Spacing.md,
  },
  filterContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  createCategoryBtn: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  gradientBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  listContent: {
    paddingBottom: Spacing.lg,
  },
  quizCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  quizHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  quizInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  deletedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    backgroundColor: `rgba(149, 225, 211, 0.2)`,
  },
  quizActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `#00000030`,
  },
  categoriesList: {
    marginBottom: Spacing.md,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
  },
  createCategoryModal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "80%",
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    fontSize: 16,
  },
  colorPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
});
