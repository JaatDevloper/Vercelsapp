import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import QuizCard, { getQuizCreatedTime } from "@/components/QuizCard";
import CategoryChip from "@/components/CategoryChip";
import SkeletonCard from "@/components/SkeletonCard";
import PremiumModal from "@/components/PremiumModal";
import { useTheme } from "@/hooks/useTheme";
import { useSilentAutoRefresh } from "@/hooks/useSilentAutoRefresh";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { Quiz } from "@/types/quiz";
import { getDeviceId } from "@/lib/deviceId";

import Animated, { FadeInUp } from "react-native-reanimated";

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
  const route = useRoute();
  const isOfferTab = route.name === "Offers";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState<Category[]>([]);
  const searchInputRef = useRef<TextInput>(null);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);
  
  // Fetch profile silently to check premium status
  const { data: profile } = useQuery({
    queryKey: ["profile", deviceId],
    queryFn: async () => {
      if (!deviceId) return null;
      const baseUrl = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      const response = await fetch(`${baseUrl}/api/profile?deviceId=${encodeURIComponent(deviceId)}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!deviceId
  });
  
  useSilentAutoRefresh(["profile", deviceId], 5000, { enabled: !!deviceId });

  const { 
    data: batches,
    isLoading: batchesLoading
  } = useQuery<any[]>({
    queryKey: ["/api/batches"],
    queryFn: async () => {
      const response = await fetch("/api/batches");
      if (!response.ok) return [];
      return response.json();
    },
    enabled: true
  });
  
  useSilentAutoRefresh(["/api/batches"], 10000, { enabled: true });

  const handleBatchPress = (batch: any) => {
    navigation.navigate("BatchDetails" as any, { batchId: batch._id });
  };

  const renderBatchItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 100).duration(500)}>
      <Pressable 
        onPress={() => handleBatchPress(item)}
        style={[
          styles.batchCard, 
          { 
            backgroundColor: isDark ? theme.backgroundSecondary : '#fff', 
            width: isOfferTab ? '100%' : 200, 
            marginBottom: isOfferTab ? Spacing.lg : 0, 
            marginRight: isOfferTab ? 0 : Spacing.md 
          }
        ]}
      >
        <View style={styles.batchThumbnailContainer}>
          <Image 
            source={{ uri: item.thumbnail || "https://via.placeholder.com/150" }} 
            style={[styles.batchThumbnail, { height: isOfferTab ? 180 : 120 }]} 
          />
        </View>
        <View style={styles.batchInfo}>
          <ThemedText type="body" style={{ fontWeight: 'bold' }}>{item.title}</ThemedText>
          <ThemedText type="small" numberOfLines={1}>{item.description}</ThemedText>
        </View>
      </Pressable>
    </Animated.View>
  );

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/manage/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
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

  const isUserPremium = profile?.isPremium === true;

  const { data: quizzes, isLoading, refetch, isRefetching } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === "All" 
        ? "/api/quizzes"
        : `/api/manage/category/${encodeURIComponent(selectedCategory)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch quizzes");
      return response.json();
    },
    enabled: !isOfferTab
  });

  const filteredQuizzes = useMemo(() => {
    if (!quizzes || !Array.isArray(quizzes)) return [];
    let filtered = quizzes;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q => q.title?.toLowerCase().includes(query) || q.category?.toLowerCase().includes(query));
    }
    return [...filtered].sort((a, b) => getQuizCreatedTime(b.created_at || b.timestamp) - getQuizCreatedTime(a.created_at || a.timestamp));
  }, [quizzes, searchQuery]);

  const handleQuizPress = useCallback((quizId: string, isPremiumLocked: boolean) => {
    if (isPremiumLocked && !isUserPremium) setPremiumModalVisible(true);
    else navigation.navigate("QuizDetails", { quizId });
  }, [navigation, isUserPremium]);

  const renderQuizCard = useCallback(({ item, index }: { item: Quiz; index: number }) => {
    const isFreeQuiz = index < 5;
    const isPremiumLocked = !isFreeQuiz;
    return <QuizCard quiz={item} onPress={() => handleQuizPress(item._id, isPremiumLocked)} isPremiumLocked={isPremiumLocked} isUserPremium={isUserPremium} />;
  }, [handleQuizPress, isUserPremium]);

  const renderEmpty = () => {
    if (isLoading || batchesLoading) {
      return (
        <View style={styles.skeletonGrid}>
          {[1, 2, 3, 4].map(i => (
            <SkeletonCard key={i} style={{ marginLeft: i % 2 === 0 ? Spacing.md : 0 }} />
          ))}
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Feather name="search" size={48} color={theme.textSecondary} />
        <ThemedText type="h4" style={styles.emptyTitle}>No content found</ThemedText>
      </View>
    );
  };

  const renderBatchSkeletons = () => (
    <View style={{ flexDirection: 'row', gap: Spacing.md }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={[styles.batchCard, { backgroundColor: theme.backgroundSecondary, width: 200 }]}>
          <View style={[styles.batchThumbnail, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
          <View style={{ padding: Spacing.sm, gap: Spacing.xs }}>
            <View style={{ height: 16, width: '80%', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 4 }} />
            <View style={{ height: 12, width: '60%', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 4 }} />
          </View>
        </View>
      ))}
    </View>
  );

  // Combine quiz and batch data for a single FlatList
  const getCombinedData = () => {
    if (isOfferTab) {
      if (batchesLoading) return [{ type: "loading_batches" }];
      return batches || [];
    }
    return [
      ...(selectedCategory === "All" ? [{ type: "batches_section" }] : []),
      ...(filteredQuizzes.length > 0 || isLoading ? [{ type: "quizzes", data: filteredQuizzes }] : [{ type: "empty" }])
    ];
  };

  const combinedData = getCombinedData();

  const renderCombinedItem = useCallback(({ item, index }: { item: any; index: number }) => {
    if (isOfferTab) {
      if (item.type === "loading_batches") return renderBatchSkeletons();
      return renderBatchItem({ item, index });
    }
    
    if (item.type === "batches_section") {
      return (
        <View style={{ marginBottom: Spacing.xl }}>
          <ThemedText type="h2" style={{ marginBottom: Spacing.md }}>Featured Batches</ThemedText>
          {batchesLoading ? (
            renderBatchSkeletons()
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ gap: Spacing.md }}
            >
              {batches?.map((batch: any, idx: number) => renderBatchItem({ item: batch, index: idx }))}
            </ScrollView>
          )}
        </View>
      );
    }
    
    if (item.type === "quizzes") {
      return (
        <View>
          {item.data.map((quiz: Quiz, idx: number) => renderQuizCard({ item: quiz, index: idx }))}
        </View>
      );
    }
    
    return renderEmpty();
  }, [isOfferTab, renderQuizCard, filteredQuizzes, isLoading]);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.fixedHeader, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.appNameRow}>
          <View style={styles.logoContainer}>
            <Feather name="zap" size={28} color={isDark ? Colors.dark.primary : Colors.light.primary} />
            <ThemedText type="h3">{isOfferTab ? "Special Offers" : "QuizzyEdu"}</ThemedText>
          </View>
        </View>

        {!isOfferTab && (
          <>
            <View style={styles.controlsRow}>
              <Pressable onPress={() => isUserPremium ? navigation.navigate("CreateQuiz") : setPremiumModalVisible(true)} style={[styles.joinRoomButton, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}>
                <Feather name="plus" size={16} color="#FFFFFF" />
                <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>Create Quiz</ThemedText>
              </Pressable>
              <Pressable onPress={() => navigation.navigate("JoinRoom")} style={[styles.joinRoomButton, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}>
                <Feather name="users" size={16} color="#FFFFFF" />
                <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>Join Room</ThemedText>
              </Pressable>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: theme.backgroundDefault }]}>
              <Feather name="search" size={20} color={theme.textSecondary} />
              <TextInput ref={searchInputRef} style={[styles.searchInput, { color: theme.text, outlineStyle: "none" } as any]} placeholder="Search quizzes..." value={searchQuery} onChangeText={setSearchQuery} />
            </View>
          </>
        )}

        {!isOfferTab && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
            {CATEGORIES.map(item => <CategoryChip key={item} label={item} isSelected={selectedCategory === item} onPress={() => setSelectedCategory(item)} />)}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={combinedData}
        keyExtractor={(item, index) => {
          if (item.type === "batches") return "batches";
          if (item.type === "quizzes") return "quizzes";
          if (item.type === "empty") return "empty";
          return item._id || index.toString();
        }}
        renderItem={renderCombinedItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + Spacing.xl + 80 }]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        removeClippedSubviews={false}
        refreshControl={
          !isOfferTab ? (
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={theme.primary}
            />
          ) : undefined
        }
      />

      <PremiumModal visible={premiumModalVisible} onClose={() => setPremiumModalVisible(false)} onSubscribe={() => setPremiumModalVisible(false)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  appNameRow: {
    marginBottom: Spacing.sm,
  },
  controlsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  batchCard: {
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 0,
    width: 200,
    // Soft White Shadow Effect
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    overflow: 'visible',
  },
  batchThumbnailContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  batchThumbnail: {
    width: '100%',
    height: 120,
  },
  batchInfo: {
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
});
