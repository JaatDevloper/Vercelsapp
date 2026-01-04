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
import { useNavigation } from "@react-navigation/native";
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
  const navigation = useNavigation();
  const [quizzes, setQuizzes] = useState<ManagedQuiz[]>([]);
  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<ManagedQuiz | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<QuizCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#95E1D3");
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedQuizIds, setSelectedQuizIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const toggleSelectQuiz = (quizId: string) => {
    setSelectedQuizIds(prev =>
      prev.includes(quizId)
        ? prev.filter(id => id !== quizId)
        : [...prev, quizId]
    );
  };

  const toggleSelectAll = (filteredQuizzes: ManagedQuiz[]) => {
    if (selectedQuizIds.length === filteredQuizzes.length) {
      setSelectedQuizIds([]);
    } else {
      setSelectedQuizIds(filteredQuizzes.map(q => q.quiz_id));
    }
  };

  const bulkUpdateCategory = async (category: string) => {
    if (selectedQuizIds.length === 0) return;
    try {
      setLoading(true);
      const promises = selectedQuizIds.map(id =>
        fetch(`/api/manage/quizzes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category }),
        })
      );
      await Promise.all(promises);
      loadData();
      if (selectedFilter !== "All") loadCategoryQuizzes(selectedFilter);
      else loadAllQuizzes();
      setSelectedQuizIds([]);
      setShowMoveModal(false);
      Alert.alert("Success", `Moved ${selectedQuizIds.length} quizzes to ${category}`);
    } catch (error) {
      Alert.alert("Error", "Failed to update some quizzes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch category-specific quizzes when selectedFilter changes
    if (selectedFilter !== "All") {
      loadCategoryQuizzes(selectedFilter);
    } else {
      // Load all quizzes from quizzes collection when "All" is selected
      loadAllQuizzes();
    }
  }, [selectedFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const categoriesRes = await fetch("/api/manage/categories");

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      } else {
        console.error("Error fetching categories:", categoriesRes.status);
        Alert.alert("Error", "Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadAllQuizzes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/quizzes");
      
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      } else {
        console.error("Error fetching all quizzes:", response.status);
        setQuizzes([]);
      }
    } catch (error) {
      console.error("Error loading all quizzes:", error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryQuizzes = async (categoryName: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/manage/category/${encodeURIComponent(categoryName)}`);
      
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      } else {
        console.error("Error fetching category quizzes:", response.status);
        setQuizzes([]);
      }
    } catch (error) {
      console.error("Error loading category quizzes:", error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredQuizzes = () => {
    // Filter by search query
    if (searchQuery.trim() === "") {
      return quizzes;
    }
    return quizzes.filter((quiz) =>
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
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

  const updateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) {
      Alert.alert("Error", "Category name is required");
      return;
    }

    try {
      const response = await fetch(`/api/manage/categories/${encodeURIComponent(editingCategory.name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          color: newCategoryColor,
          icon: "tag",
        }),
      });

      if (response.ok) {
        loadData();
        setNewCategoryName("");
        setNewCategoryColor("#95E1D3");
        setEditingCategory(null);
        setShowEditCategoryModal(false);
        Alert.alert("Success", "Category updated");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update category");
    }
  };

  const deleteCategory = async (categoryName: string) => {
    Alert.alert("Delete Category", `Are you sure you want to delete "${categoryName}"?`, [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            const response = await fetch(`/api/manage/categories/${encodeURIComponent(categoryName)}`, {
              method: "DELETE",
            });

            if (response.ok) {
              loadData();
              Alert.alert("Success", "Category deleted");
            }
          } catch (error) {
            Alert.alert("Error", "Failed to delete category");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const openEditCategoryModal = (category: QuizCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color);
    setShowEditCategoryModal(true);
  };

  const renderQuizCard = ({ item: quiz }: { item: ManagedQuiz }) => {
    const isSelected = selectedQuizIds.includes(quiz.quiz_id);
    return (
      <Animated.View
        entering={FadeInDown.delay(50)}
        style={[
          styles.quizCard,
          {
            backgroundColor: theme.backgroundSecondary,
            opacity: quiz.isDeleted ? 0.6 : 1,
            borderWidth: isSelected ? 2 : 0,
            borderColor: theme.primary,
          },
        ]}
      >
        <Pressable
          onPress={() => toggleSelectQuiz(quiz.quiz_id)}
          style={styles.quizHeader}
        >
          <View style={[
            styles.checkbox,
            {
              borderColor: theme.primary,
              backgroundColor: isSelected ? theme.primary : 'transparent'
            }
          ]}>
            {isSelected && <Feather name="check" size={12} color="white" />}
          </View>
          <View style={[styles.quizInfo, { marginLeft: Spacing.sm }]}>
            <ThemedText type="body">
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
        </Pressable>

        <View style={styles.categoryBadge}>
          <ThemedText type="small" style={{ color: theme.primary }}>
            {quiz.managedCategory || quiz.category || "General"}
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
  };

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
        <Pressable onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h2" style={{ flex: 1, marginLeft: Spacing.md }}>
          Manage Quizzes
        </ThemedText>
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

      {/* Search Bar */}
      <View style={[styles.searchBox, { backgroundColor: theme.backgroundSecondary, marginHorizontal: Spacing.md, marginVertical: Spacing.sm }]}>
        <Feather name="search" size={20} color={theme.textSecondary} />
        <TextInput
          placeholder="Search quizzes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text, flex: 1, marginLeft: Spacing.sm }]}
        />
        {searchQuery !== "" && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Feather name="x" size={20} color={theme.textSecondary} />
          </Pressable>
        )}
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
            onLongPress={() => openEditCategoryModal(cat)}
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

      {/* Bulk Actions Bar */}
      {filteredQuizzes.length > 0 && (
        <View style={[styles.bulkActions, { backgroundColor: theme.backgroundSecondary }]}>
          <Pressable
            onPress={() => toggleSelectAll(filteredQuizzes)}
            style={styles.bulkSelectBtn}
          >
            <View style={[
              styles.checkbox,
              {
                borderColor: theme.primary,
                backgroundColor: selectedQuizIds.length === filteredQuizzes.length ? theme.primary : 'transparent'
              }
            ]}>
              {selectedQuizIds.length === filteredQuizzes.length && <Feather name="check" size={12} color="white" />}
            </View>
            <ThemedText type="small" style={{ marginLeft: Spacing.sm }}>
              Select All ({selectedQuizIds.length})
            </ThemedText>
          </Pressable>

          {selectedQuizIds.length > 0 && (
            <Pressable
              onPress={() => setShowMoveModal(true)}
              style={({ pressed }) => [
                styles.bulkMoveBtn,
                { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 }
              ]}
            >
              <Feather name="folder" size={16} color="white" />
              <ThemedText type="small" style={{ color: 'white', marginLeft: Spacing.xs }}>
                Move Selected
              </ThemedText>
            </Pressable>
          )}
        </View>
      )}

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

      {/* Move Quizzes Modal */}
      <Modal
        visible={showMoveModal || !!selectedQuiz}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSelectedQuiz(null);
          setShowMoveModal(false);
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: "#00000080" }]}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot, paddingTop: insets.top },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Move to Category</ThemedText>
              <Pressable onPress={() => {
                setSelectedQuiz(null);
                setShowMoveModal(false);
              }}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.categoriesList}>
              {categories.map((cat: any) => (
                <Pressable
                  key={cat.name}
                  onPress={() => {
                    if (selectedQuizIds.length > 0) {
                      bulkUpdateCategory(cat.name);
                    } else if (selectedQuiz) {
                      updateQuizCategory(selectedQuiz.quiz_id, cat.name);
                    }
                    setSelectedQuiz(null);
                    setShowMoveModal(false);
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

      {/* Edit Category Modal */}
      <Modal
        visible={showEditCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowEditCategoryModal(false);
          setEditingCategory(null);
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: "#00000080" }]}>
          <View
            style={[
              styles.createCategoryModal,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <ThemedText type="h3" style={{ marginBottom: Spacing.md }}>
              Edit Category
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
                onPress={() => {
                  setShowEditCategoryModal(false);
                  setEditingCategory(null);
                  setNewCategoryName("");
                  setNewCategoryColor("#95E1D3");
                }}
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
                onPress={() => {
                  if (editingCategory) {
                    deleteCategory(editingCategory.name);
                    setShowEditCategoryModal(false);
                    setEditingCategory(null);
                  }
                }}
                style={[styles.modalButton, { backgroundColor: "#FF6B6B" }]}
              >
                <ThemedText type="body" style={{ color: "white" }}>
                  Delete
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={updateCategory}
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
              >
                <ThemedText type="body" style={{ color: "white" }}>
                  Update
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
    paddingHorizontal: Spacing.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchInput: {
    paddingVertical: Spacing.sm,
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
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  bulkSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulkMoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
});
