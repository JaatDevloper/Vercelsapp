import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import QuizCard, { getQuizCreatedTime } from "@/components/QuizCard";
import CategoryChip from "@/components/CategoryChip";
import SkeletonCard from "@/components/SkeletonCard";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { Quiz } from "@/types/quiz";

interface Category {
  name: string;
  color: string;
  icon: string;
}

export default function DiscoverScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState<Category[]>([]);
  const searchInputRef = useRef<TextInput>(null);

  // Fetch categories from API
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/manage/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          console.error("Failed to fetch categories, status:", response.status);
          // Fallback to default categories if API fails
          setCategories([
            { name: "Science", color: "#FF6B6B", icon: "flask" },
            { name: "History", color: "#4ECDC4", icon: "book" },
            { name: "Technology", color: "#95E1D3", icon: "zap" },
            { name: "Sports", color: "#F38181", icon: "activity" },
            { name: "Entertainment", color: "#AA96DA", icon: "film" },
            { name: "General Knowledge", color: "#FCBAD3", icon: "star" },
            { name: "Art&Culture", color: "#FFB3BA", icon: "palette" },
            { name: "Rajasthan History", color: "#BAE1FF", icon: "book" },
          ]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback to default categories on error
        setCategories([
          { name: "Science", color: "#FF6B6B", icon: "flask" },
          { name: "History", color: "#4ECDC4", icon: "book" },
          { name: "Technology", color: "#95E1D3", icon: "zap" },
          { name: "Sports", color: "#F38181", icon: "activity" },
          { name: "Entertainment", color: "#AA96DA", icon: "film" },
          { name: "General Knowledge", color: "#FCBAD3", icon: "star" },
          { name: "Art&Culture", color: "#FFB3BA", icon: "palette" },
          { name: "Rajasthan History", color: "#BAE1FF", icon: "book" },
        ]);
      }
    };
    fetchCategories();
  }, []);

  const CATEGORIES = ["All", ...categories.map((c) => c.name)];

  const { 
    data: quizzes, 
    isLoading, 
    refetch, 
    isRefetching,
    error,
    isError 
  } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes", selectedCategory],
    queryFn: async () => {
      // Use /api/quizzes for "All" quizzes from "quizzes" collection
      // Use /api/manage/category/:categoryName for category-specific quizzes from "manage" collection
      const url = selectedCategory === "All" 
        ? "/api/quizzes"
        : `/api/manage/category/${encodeURIComponent(selectedCategory)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch quizzes");
      return response.json();
    },
    staleTime: 1000 * 30, // 30 seconds - refresh more frequently
    refetchInterval: 1000 * 60, // Auto-refresh every 60 seconds
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  const filteredQuizzes = useMemo(() => {
    if (!quizzes || !Array.isArray(quizzes)) return [];
    
    let filtered = quizzes;
    
    // Only filter by search query now (category is handled by API)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (quiz) =>
          quiz.title?.toLowerCase().includes(query) ||
          quiz.category?.toLowerCase().includes(query) ||
          quiz.creator_name?.toLowerCase().includes(query)
      );
    }
    
    // Sort by creation time - newest first
    return [...filtered].sort((a, b) => {
      const timeA = getQuizCreatedTime(a.created_at || a.timestamp);
      const timeB = getQuizCreatedTime(b.created_at || b.timestamp);
      return timeB - timeA;
    });
  }, [quizzes, searchQuery]);

  const handleQuizPress = useCallback((quizId: string) => {
    navigation.navigate("QuizDetails", { quizId });
  }, [navigation]);

  const handleJoinRoom = useCallback(() => {
    navigation.navigate("JoinRoom");
  }, [navigation]);

  const renderQuizCard = useCallback(({ item }: { item: Quiz }) => (
    <QuizCard
      quiz={item}
      onPress={() => handleQuizPress(item._id)}
    />
  ), [handleQuizPress]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, []);

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} style={{ marginLeft: i % 2 === 0 ? Spacing.md : 0 }} />
          ))}
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="wifi-off" size={48} color={theme.textSecondary} />
          <ThemedText type="h4" style={styles.emptyTitle}>Unable to load quizzes</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
            {error instanceof Error ? error.message : "Please check your connection and try again"}
          </ThemedText>
          <Pressable 
            style={[styles.retryButton, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}
            onPress={() => refetch()}
          >
            <Feather name="refresh-cw" size={16} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: "#FFFFFF", marginLeft: Spacing.xs }}>
              Retry
            </ThemedText>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Feather name="search" size={48} color={theme.textSecondary} />
        <ThemedText type="h4" style={styles.emptyTitle}>No quizzes found</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
          {searchQuery || selectedCategory !== "All" 
            ? "Try adjusting your search or category filter"
            : "Quizzes will appear here once loaded"}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.fixedHeader, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.joinRoomRow}>
          <Pressable
            onPress={handleJoinRoom}
            style={({ pressed }) => [
              styles.joinRoomButton,
              { 
                backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="users" size={16} color="#FFFFFF" />
            <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              Join Room
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.titleRow}>
          <View style={styles.logoContainer}>
            <Feather name="zap" size={28} color={isDark ? Colors.dark.primary : Colors.light.primary} />
            <ThemedText type="h3" style={styles.appTitle}>QuizzyEdu</ThemedText>
          </View>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: theme.text, outlineStyle: "none" } as any]}
            placeholder="Search quizzes..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            blurOnSubmit={false}
            underlineColorAndroid="transparent"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={handleClearSearch} hitSlop={10}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
          keyboardShouldPersistTaps="always"
        >
          {CATEGORIES.map((item) => (
            <CategoryChip
              key={item}
              label={item}
              isSelected={selectedCategory === item}
              onPress={() => setSelectedCategory(item)}
            />
          ))}
        </ScrollView>

        <View style={styles.resultsRow}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {filteredQuizzes.length} quizzes found
          </ThemedText>
        </View>
      </View>

      <FlatList
        data={filteredQuizzes}
        keyExtractor={(item) => item._id}
        renderItem={renderQuizCard}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: tabBarHeight + Spacing.xl + 80,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        removeClippedSubviews={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    paddingHorizontal: Spacing.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  joinRoomRow: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  appTitle: {
    marginLeft: Spacing.xs,
  },
  joinRoomButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    height: 48,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 48,
    padding: 0,
  },
  categoriesContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  resultsRow: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  skeletonGrid: {
    gap: Spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
    gap: Spacing.md,
  },
  emptyTitle: {
    marginTop: Spacing.md,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
});
