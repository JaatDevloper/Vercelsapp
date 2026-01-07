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
import NamePromptModal from "@/components/NamePromptModal";
import { useTheme } from "@/hooks/useTheme";
import { useSilentAutoRefresh } from "@/hooks/useSilentAutoRefresh";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { Quiz } from "@/types/quiz";
import { getDeviceId } from "@/lib/deviceId";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Animated, { FadeInUp, PinwheelIn } from "react-native-reanimated";
import LiveTestCard from "@/components/LiveTestCard";

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
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [broadcastRooms, setBroadcastRooms] = useState<any[]>([]);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  // Fetch broadcast rooms
  const { data: broadcastData, refetch: refetchBroadcasts } = useQuery<any[]>({
    queryKey: ["/api/rooms/broadcasts"],
    queryFn: async () => {
      const response = await fetch("/api/rooms/broadcasts");
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !isOfferTab
  });

  useEffect(() => {
    if (broadcastData) {
      setBroadcastRooms(broadcastData);
    }
  }, [broadcastData]);

  useSilentAutoRefresh(["/api/rooms/broadcasts"], 5000, { enabled: !isOfferTab });

  const handleJoinBroadcast = (room: any) => {
    setSelectedRoom(room);
    setNameModalVisible(true);
  };

  const handleNameSubmit = async (playerName: string) => {
    if (!selectedRoom) return;
    
    setNameModalVisible(false);
    
    try {
      const response = await fetch(`/api/rooms/${selectedRoom.roomCode.toUpperCase()}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: playerName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to join room");
      }

      const data = await response.json();
      navigation.navigate("Lobby", {
        roomCode: data.roomCode,
        odId: data.odId,
        quizId: data.quizId,
        isHost: false,
        playerName: playerName.trim(),
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to join room");
    } finally {
      setSelectedRoom(null);
    }
  };

  // Fetch notifications to count unread
  const { data: notifications } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      if (!response.ok) return [];
      return response.json();
    },
    enabled: true
  });

  useEffect(() => {
    const checkUnread = async () => {
      if (!notifications) return;
      const lastRead = await AsyncStorage.getItem("last_read_notification_time");
      const lastReadTime = lastRead ? new Date(lastRead).getTime() : 0;
      
      const unread = notifications.filter(n => new Date(n.createdAt).getTime() > lastReadTime).length;
      setUnreadNotifications(unread);
    };
    checkUnread();
  }, [notifications]);
  
  // Fetch profile silently to check premium status
  const { data: profile, refetch: refetchProfile } = useQuery({
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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if deviceId is set before refetching
      if (deviceId) {
        refetchProfile().then((result) => {
          if (result.data) {
            console.log("Profile refetched on focus:", result.data.name);
          }
        });
      }
    });
    return unsubscribe;
  }, [navigation, deviceId, refetchProfile]);

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
          {isOfferTab && (
            <Pressable
              onPress={() => handleBatchPress(item)}
              style={[styles.enrollButton, { backgroundColor: theme.primary }]}
            >
              <ThemedText style={styles.enrollButtonText}>Enrole Now</ThemedText>
              <Feather name="arrow-right" size={16} color="white" />
            </Pressable>
          )}
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
    if (isLoading) return <View style={styles.skeletonGrid}>{[1, 2, 3, 4].map(i => <SkeletonCard key={i} style={{ marginLeft: i % 2 === 0 ? Spacing.md : 0 }} />)}</View>;
    return (
      <View style={styles.emptyContainer}>
        <Feather name="search" size={48} color={theme.textSecondary} />
        <ThemedText type="h4" style={styles.emptyTitle}>No content found</ThemedText>
      </View>
    );
  };

  // Combine quiz and batch data for a single FlatList
  const getCombinedData = () => {
    if (isOfferTab) return batches || [];
    return [
      ...(selectedCategory === "All" && batches && batches.length > 0 ? [{ type: "batches", data: batches }] : []),
      ...(filteredQuizzes.length > 0 || isLoading ? [{ type: "quizzes", data: filteredQuizzes }] : [{ type: "empty" }])
    ];
  };

  const combinedData = getCombinedData();

  const handleLiveQuizStart = useCallback(async () => {
    // Show a loading state if needed, but since refetch is fast, we just wait
    const { data: freshProfile } = await refetchProfile();
    
    // Check if profile exists and has required fields
    if (!freshProfile || !freshProfile.name) {
      navigation.navigate("LoginProfile");
      return;
    }
    navigation.navigate("Quiz", { quizId: "live" });
  }, [navigation, refetchProfile]);

  const renderCombinedItem = useCallback(({ item, index }: { item: any; index: number }) => {
    if (isOfferTab) return renderBatchItem({ item, index });
    
    if (item.type === "batches") {
      return (
        <View style={{ marginBottom: Spacing.xl }}>
          <Animated.View entering={PinwheelIn.duration(1000)}>
            <LiveTestCard onStart={handleLiveQuizStart} />
          </Animated.View>

          {broadcastRooms.length > 0 && (
            <View style={styles.broadcastSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.broadcastIconContainer}>
                  <Feather name="radio" size={20} color="#FF6B6B" />
                </View>
                <ThemedText type="h3">Live Broadcasts</ThemedText>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.broadcastScroll}
              >
                {broadcastRooms.map((room, idx) => (
                  <Pressable 
                    key={room._id || idx}
                    onPress={() => handleJoinBroadcast(room)}
                    style={[styles.broadcastCard, { backgroundColor: theme.backgroundSecondary }]}
                    hitSlop={10}
                  >
                    <View style={styles.broadcastCardHeader}>
                      <View style={[styles.liveBadge, { backgroundColor: "#FF6B6B" }]}>
                        <ThemedText style={styles.liveBadgeText}>LIVE</ThemedText>
                      </View>
                      <ThemedText type="small" style={{ color: theme.textSecondary, fontWeight: "700" }}>#{room.roomCode}</ThemedText>
                    </View>
                    <ThemedText type="body" style={styles.broadcastQuizTitle} numberOfLines={1}>
                      {room.quizTitle || "Multiplayer Quiz"}
                    </ThemedText>
                    <View style={styles.broadcastCardFooter}>
                      <View style={styles.hostInfo}>
                        <Feather name="user" size={12} color={theme.textSecondary} />
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>{room.hostName}</ThemedText>
                      </View>
                      <Pressable 
                        onPress={(e) => {
                          e.stopPropagation();
                          console.log("Join button explicitly pressed for room:", room.roomCode);
                          handleJoinBroadcast(room);
                        }}
                        style={[styles.joinNowButton, { backgroundColor: theme.primary }]}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                      >
                        <ThemedText style={styles.joinNowText}>Join</ThemedText>
                      </Pressable>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <ThemedText type="h2" style={{ marginBottom: Spacing.md }}>Featured Batches</ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ gap: Spacing.md }}
          >
            {item.data.map((batch: any, idx: number) => renderBatchItem({ item: batch, index: idx }))}
          </ScrollView>
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
          <Pressable 
            onPress={() => {
              setUnreadNotifications(0);
              AsyncStorage.setItem("last_read_notification_time", new Date().toISOString());
              navigation.navigate("Notifications");
            }} 
            style={styles.notificationBadgeContainer}
          >
            <Feather name="bell" size={24} color={theme.text} />
            {unreadNotifications > 0 && (
              <View style={[styles.badge, { backgroundColor: Colors.light.error }]}>
                <ThemedText style={styles.badgeText}>{unreadNotifications > 9 ? "9+" : unreadNotifications}</ThemedText>
              </View>
            )}
          </Pressable>
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
      <NamePromptModal 
        visible={nameModalVisible} 
        onClose={() => setNameModalVisible(false)} 
        onSubmit={handleNameSubmit} 
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
    zIndex: 10,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  appNameRow: {
    marginBottom: Spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 60, // Add space for the dark mode toggle
  },
  notificationBadgeContainer: {
    position: "relative",
    padding: 4,
    marginRight: 10,
  },
  badge: {
    position: "absolute",
    right: -2,
    top: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    lineHeight: 12,
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
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
    gap: Spacing.md,
  },
  emptyTitle: {
    marginTop: Spacing.md,
    textAlign: "center",
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
  broadcastSection: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  broadcastIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  broadcastScroll: {
    gap: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  broadcastCard: {
    width: 220,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  broadcastCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  liveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  broadcastQuizTitle: {
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  broadcastCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hostInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  joinNowButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  joinNowText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  enrollButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  enrollButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});
