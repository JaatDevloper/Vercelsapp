import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Svg, { Polygon } from "react-native-svg";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useProfile } from "@/hooks/useProfile";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type TimeFilter = "today" | "month" | "allTime";

interface LeaderboardUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  points: number;
  quizzesTaken: number;
  correctAnswers: number;
  totalQuestions: number;
  avgScorePercent: number;
  rank: number;
}

async function fetchLeaderboard(filter: TimeFilter): Promise<LeaderboardUser[]> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/api/leaderboard?filter=${filter}`);
  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard");
  }
  return response.json();
}

const GRADIENT_COLORS = ["#FF6B8A", "#FF8E8E", "#FFB366"];

function UserAvatar({ 
  name, 
  avatarUrl,
  size,
  borderColor = "#FFFFFF",
  borderWidth = 3,
}: { 
  name: string; 
  avatarUrl?: string;
  size: number;
  borderColor?: string;
  borderWidth?: number;
}) {
  const avatarColors = ["#6366F1", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
  const colorIndex = name.charCodeAt(0) % avatarColors.length;
  const bgColor = avatarColors[colorIndex];
  const hasAvatar = avatarUrl && avatarUrl.length > 0;

  return (
    <View style={[
      styles.avatarContainer,
      { 
        width: size + borderWidth * 2, 
        height: size + borderWidth * 2,
        borderRadius: (size + borderWidth * 2) / 2,
        borderWidth: borderWidth,
        borderColor: borderColor,
        backgroundColor: hasAvatar ? 'transparent' : bgColor,
      }
    ]}>
      {hasAvatar ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      ) : (
        <ThemedText style={{ 
          color: "#FFFFFF", 
          fontSize: size * 0.4,
          fontWeight: "700",
        }}>
          {name.charAt(0).toUpperCase()}
        </ThemedText>
      )}
    </View>
  );
}

function HexagonAvatar({ 
  name, 
  size, 
  avatarUrl,
  borderColor = "#FFFFFF",
  showCrown = false,
}: { 
  name: string; 
  size: number; 
  avatarUrl?: string;
  borderColor?: string;
  showCrown?: boolean;
}) {
  const avatarColors = ["#6366F1", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"];
  const colorIndex = name.charCodeAt(0) % avatarColors.length;
  const bgColor = avatarColors[colorIndex];
  const hasAvatar = avatarUrl && avatarUrl.length > 0;

  const w = size;
  const h = size * 1.1;
  const cx = w / 2;
  const cy = h / 2;
  const r = w / 2 - 3;
  
  const hexPoints = [
    [cx, cy - r],
    [cx + r * 0.866, cy - r * 0.5],
    [cx + r * 0.866, cy + r * 0.5],
    [cx, cy + r],
    [cx - r * 0.866, cy + r * 0.5],
    [cx - r * 0.866, cy - r * 0.5],
  ].map(p => p.join(",")).join(" ");

  const borderR = w / 2;
  const borderHexPoints = [
    [cx, cy - borderR],
    [cx + borderR * 0.866, cy - borderR * 0.5],
    [cx + borderR * 0.866, cy + borderR * 0.5],
    [cx, cy + borderR],
    [cx - borderR * 0.866, cy + borderR * 0.5],
    [cx - borderR * 0.866, cy - borderR * 0.5],
  ].map(p => p.join(",")).join(" ");

  return (
    <View style={[styles.hexagonContainer, { width: w, height: h + 10 }]}>
      {showCrown && (
        <View style={[styles.crownContainer, { top: -18 }]}>
          <ThemedText style={styles.crownEmoji}>👑</ThemedText>
        </View>
      )}
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Polygon points={borderHexPoints} fill={borderColor} />
        <Polygon points={hexPoints} fill={bgColor} />
      </Svg>
      <View style={[styles.hexagonInitial, { width: w, height: h }]}>
        {hasAvatar ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{
              width: size * 0.7,
              height: size * 0.7,
              borderRadius: size * 0.35,
            }}
          />
        ) : (
          <ThemedText type="h3" style={{ color: "#FFFFFF", fontSize: size * 0.35 }}>
            {name.charAt(0).toUpperCase()}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

function StatBadge({ icon, value, label, color }: { icon: string; value: string | number; label: string; color: string }) {
  return (
    <View style={styles.statBadge}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Feather name={icon as any} size={12} color={color} />
      </View>
      <View>
        <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
        <ThemedText style={styles.statLabel}>{label}</ThemedText>
      </View>
    </View>
  );
}

function TopThreePodium({ users }: { users: LeaderboardUser[] }) {
  const first = users.find(u => u.rank === 1);
  const second = users.find(u => u.rank === 2);
  const third = users.find(u => u.rank === 3);

  const renderWinner = (user: LeaderboardUser | undefined, rank: number, isFirst: boolean = false) => {
    if (!user) return <View style={styles.winnerSpotEmpty} />;
    
    const rankColors = {
      1: "#FFD700",
      2: "#C0C0C0",
      3: "#CD7F32",
    };
    
    return (
      <Animated.View 
        entering={FadeIn.delay(100 * rank).duration(400)} 
        style={[styles.winnerSpot, isFirst && styles.firstPlace]}
      >
        <HexagonAvatar 
          name={user.name} 
          size={isFirst ? 90 : 70} 
          avatarUrl={user.avatarUrl}
          showCrown={isFirst}
        />
        <ThemedText style={[styles.winnerName, isFirst && styles.firstName]} numberOfLines={1}>
          {user.name}
        </ThemedText>
        <View style={styles.winnerStats}>
          <View style={[styles.pointsBadge, { backgroundColor: rankColors[rank as keyof typeof rankColors] }]}>
            <Feather name="star" size={12} color="#FFFFFF" />
            <ThemedText style={styles.pointsText}>{user.points}</ThemedText>
          </View>
        </View>
        <View style={styles.winnerMiniStats}>
          <ThemedText style={styles.miniStatText}>
            {user.quizzesTaken} quizzes
          </ThemedText>
          <ThemedText style={styles.miniStatText}>
            {user.avgScorePercent}% avg
          </ThemedText>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.podiumContainer}>
      <View style={styles.decorativeElements}>
        {[...Array(12)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.decorativeStar,
              {
                left: `${5 + (i * 8)}%`,
                top: `${5 + (i % 4) * 20}%`,
                opacity: 0.5 + (i % 3) * 0.2,
              },
            ]}
          >
            <ThemedText style={{ fontSize: 6 + (i % 3) * 2, color: "#FFEB3B" }}>✦</ThemedText>
          </View>
        ))}
      </View>
      
      <View style={styles.winnersRow}>
        {renderWinner(second, 2)}
        {renderWinner(first, 1, true)}
        {renderWinner(third, 3)}
      </View>

      <View style={styles.podiumBars}>
        <View style={[styles.podiumBar, styles.podiumBarSecond]}>
          <View style={styles.podiumRankBadge}>
            <ThemedText style={styles.podiumNumber}>2</ThemedText>
          </View>
        </View>
        <View style={[styles.podiumBar, styles.podiumBarFirst]}>
          <View style={[styles.podiumRankBadge, { backgroundColor: "#FFD700" }]}>
            <ThemedText style={styles.podiumNumber}>1</ThemedText>
          </View>
        </View>
        <View style={[styles.podiumBar, styles.podiumBarThird]}>
          <View style={[styles.podiumRankBadge, { backgroundColor: "#CD7F32" }]}>
            <ThemedText style={styles.podiumNumber}>3</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

function LeaderboardCard({ user, theme }: { user: LeaderboardUser; theme: any }) {
  const rankColors: { [key: number]: string } = {
    4: "#9333EA",
    5: "#3B82F6",
    6: "#10B981",
    7: "#F59E0B",
  };
  const rankColor = rankColors[user.rank] || "#6B7280";
  
  return (
    <Animated.View
      entering={FadeInDown.delay(50 * (user.rank - 3)).duration(300)}
      style={[styles.leaderboardCard, { backgroundColor: theme.backgroundSecondary }]}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.rankCircle, { backgroundColor: `${rankColor}20`, borderColor: rankColor }]}>
          <ThemedText style={[styles.rankText, { color: rankColor }]}>{user.rank}</ThemedText>
        </View>
        
        <UserAvatar 
          name={user.name} 
          avatarUrl={user.avatarUrl}
          size={50}
          borderColor={theme.border}
          borderWidth={2}
        />
        
        <View style={styles.userInfo}>
          <ThemedText style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
            {user.name}
          </ThemedText>
          <ThemedText style={[styles.userEmail, { color: theme.textSecondary }]} numberOfLines={1}>
            @{user.username}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.cardRight}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Feather name="star" size={14} color="#FFD700" />
            <ThemedText style={[styles.statNumber, { color: "#FFD700" }]}>{user.points}</ThemedText>
          </View>
          <View style={styles.statItem}>
            <Feather name="book-open" size={14} color="#06B6D4" />
            <ThemedText style={[styles.statNumber, { color: "#06B6D4" }]}>{user.quizzesTaken}</ThemedText>
          </View>
          <View style={styles.statItem}>
            <Feather name="percent" size={14} color="#10B981" />
            <ThemedText style={[styles.statNumber, { color: "#10B981" }]}>{user.avgScorePercent}%</ThemedText>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${user.avgScorePercent}%`, backgroundColor: "#10B981" }]} />
        </View>
      </View>
    </Animated.View>
  );
}

function RankingCard({ user, theme, index }: { user: LeaderboardUser; theme: any; index: number }) {
  const getMedalColor = (rank: number) => {
    if (rank === 1) return { bg: "#FFD700", glow: "rgba(255, 215, 0, 0.3)", gradient: ["#FFD700", "#FFA500"] };
    if (rank === 2) return { bg: "#C0C0C0", glow: "rgba(192, 192, 192, 0.3)", gradient: ["#C0C0C0", "#A8A8A8"] };
    if (rank === 3) return { bg: "#CD7F32", glow: "rgba(205, 127, 50, 0.3)", gradient: ["#CD7F32", "#B8860B"] };
    return { bg: "#6366F1", glow: "rgba(99, 102, 241, 0.2)", gradient: ["#6366F1", "#4F46E5"] };
  };
  
  const medalInfo = getMedalColor(user.rank);
  const isTopThree = user.rank <= 3;
  
  return (
    <Animated.View
      entering={FadeInDown.delay(60 * index).duration(400)}
      style={[
        styles.rankingCardWide,
        { backgroundColor: theme.backgroundSecondary },
        isTopThree && { borderWidth: 2, borderColor: medalInfo.bg }
      ]}
    >
      <View style={styles.rankingCardWideLeft}>
        <LinearGradient
          colors={medalInfo.gradient as [string, string]}
          style={styles.rankBadgeWide}
        >
          <ThemedText style={styles.rankBadgeTextWide}>#{user.rank}</ThemedText>
          {isTopThree && (
            <ThemedText style={styles.medalEmojiWide}>
              {user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : "🥉"}
            </ThemedText>
          )}
        </LinearGradient>
        
        <View style={styles.rankingAvatarSection}>
          <View style={[styles.rankingAvatarWrapperWide, isTopThree && { shadowColor: medalInfo.bg, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } }]}>
            <UserAvatar
              name={user.name}
              avatarUrl={user.avatarUrl}
              size={50}
              borderColor={isTopThree ? medalInfo.bg : theme.border}
              borderWidth={isTopThree ? 3 : 2}
            />
          </View>
          <ThemedText style={[styles.rankingUserNameBelow, { color: theme.text }]} numberOfLines={1}>
            {user.name}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.rankingCardWideRight}>
        <View style={styles.rankingStatsRowWide}>
          <View style={[styles.rankingStatItemWide, { backgroundColor: "rgba(255, 215, 0, 0.1)" }]}>
            <Feather name="star" size={14} color="#FFD700" />
            <View style={styles.rankingStatTextWide}>
              <ThemedText style={[styles.rankingStatValueWide, { color: "#FFD700" }]}>{user.points}</ThemedText>
              <ThemedText style={[styles.rankingStatLabelWide, { color: theme.textSecondary }]}>Score</ThemedText>
            </View>
          </View>
          <View style={[styles.rankingStatItemWide, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
            <Feather name="check-circle" size={14} color="#10B981" />
            <View style={styles.rankingStatTextWide}>
              <ThemedText style={[styles.rankingStatValueWide, { color: "#10B981" }]}>{user.correctAnswers}</ThemedText>
              <ThemedText style={[styles.rankingStatLabelWide, { color: theme.textSecondary }]}>Correct</ThemedText>
            </View>
          </View>
          <View style={[styles.rankingStatItemWide, { backgroundColor: "rgba(6, 182, 212, 0.1)" }]}>
            <Feather name="percent" size={14} color="#06B6D4" />
            <View style={styles.rankingStatTextWide}>
              <ThemedText style={[styles.rankingStatValueWide, { color: "#06B6D4" }]}>{user.avgScorePercent}%</ThemedText>
              <ThemedText style={[styles.rankingStatLabelWide, { color: theme.textSecondary }]}>Accuracy</ThemedText>
            </View>
          </View>
        </View>
        
        <View style={styles.rankingProgressWide}>
          <View style={[styles.rankingProgressBarWide, { backgroundColor: "rgba(128, 128, 128, 0.15)" }]}>
            <LinearGradient
              colors={["#10B981", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.rankingProgressFillWide, { width: `${user.avgScorePercent}%` }]}
            />
          </View>
          <View style={styles.rankingQuizzesWide}>
            <Feather name="book-open" size={12} color="#06B6D4" />
            <ThemedText style={[styles.rankingQuizzesTextWide, { color: theme.textSecondary }]}>
              {user.quizzesTaken} quizzes
            </ThemedText>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function RankingsSection({ users, theme }: { users: LeaderboardUser[]; theme: any }) {
  const sortedByScore = [...users].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
    return b.avgScorePercent - a.avgScorePercent;
  });
  
  return (
    <View style={styles.rankingsSection}>
      <LinearGradient
        colors={["#FF6B8A", "#FF8E8E", "#FFB366"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.rankingsSectionHeader}
      >
        <View style={styles.rankingsTitleRow}>
          <Feather name="award" size={24} color="#FFFFFF" />
          <View style={styles.rankingsTitleContainer}>
            <ThemedText style={styles.rankingsSectionTitle}>RANKINGS</ThemedText>
            <ThemedText style={styles.rankingsSectionSubtitle}>Top performers by score & accuracy</ThemedText>
          </View>
        </View>
        <View style={styles.rankingsDecorative}>
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.rankingsDecorativeStar,
                {
                  left: `${10 + (i * 15)}%`,
                  top: `${20 + (i % 3) * 25}%`,
                  opacity: 0.4 + (i % 3) * 0.2,
                },
              ]}
            >
              <ThemedText style={{ fontSize: 8 + (i % 3) * 4, color: "#FFFFFF" }}>✦</ThemedText>
            </View>
          ))}
        </View>
      </LinearGradient>
      
      <View style={styles.rankingsListWide}>
        {sortedByScore.slice(0, 10).map((user, index) => (
          <RankingCard key={user.id} user={{ ...user, rank: index + 1 }} theme={theme} index={index} />
        ))}
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [activeFilter, setActiveFilter] = useState<TimeFilter>("allTime");
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profileExists, isLoading: profileLoading } = useProfile();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const hasShownModalRef = useRef(false);

  // Show modal only when this screen is focused and user doesn't have a profile
  useFocusEffect(
    React.useCallback(() => {
      if (!profileLoading && !profileExists && !hasShownModalRef.current) {
        setShowProfileModal(true);
        hasShownModalRef.current = true;
      }
      return () => {
        // Don't show modal when leaving the screen
      };
    }, [profileExists, profileLoading])
  );

  const { data: leaderboardData = [], isLoading, refetch } = useQuery({
    queryKey: ["leaderboard", activeFilter],
    queryFn: () => fetchLeaderboard(activeFilter),
    staleTime: 30000,
  });

  const topThree = leaderboardData.filter(u => u.rank <= 3);
  const others = leaderboardData.filter(u => u.rank > 3);
  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;

  // Show modal overlay if no profile
  if (!profileLoading && !profileExists && showProfileModal) {
    return (
      <ThemedView style={styles.container}>
        <Modal
          visible={showProfileModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowProfileModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View 
              entering={FadeInDown}
              style={[
                styles.modalContent,
                { backgroundColor: theme.backgroundDefault }
              ]}
            >
              <Pressable 
                onPress={() => setShowProfileModal(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color={theme.textSecondary} />
              </Pressable>
              <View style={[styles.modalHeader, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="lock" size={32} color={primaryColor} />
                <ThemedText type="h2" style={{ marginTop: Spacing.md, textAlign: "center" }}>
                  See Your Rank
                </ThemedText>
                <ThemedText 
                  type="body" 
                  style={{ 
                    marginTop: Spacing.md, 
                    textAlign: "center",
                    color: theme.textSecondary
                  }}
                >
                  Create your profile to see your rank and compete on the leaderboard!
                </ThemedText>
              </View>

              <ScrollView 
                style={styles.modalPreview}
                contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.lg }}
              >
                <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
                  LEADERBOARD PREVIEW
                </ThemedText>
                {leaderboardData.slice(0, 5).map((user) => (
                  <View 
                    key={user.id}
                    style={[
                      styles.previewCard,
                      { backgroundColor: theme.backgroundSecondary }
                    ]}
                  >
                    <View style={styles.previewRank}>
                      <ThemedText style={{ color: primaryColor, fontWeight: "700" }}>
                        #{user.rank}
                      </ThemedText>
                    </View>
                    <View style={styles.previewInfo}>
                      <ThemedText type="small" style={{ fontWeight: "600" }}>
                        {user.name}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        {user.points} pts
                      </ThemedText>
                    </View>
                    <Feather name="arrow-right" size={16} color={theme.textSecondary} />
                  </View>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => {
                    setShowProfileModal(false);
                    navigation.navigate("Profile");
                  }}
                  style={[
                    styles.createButton,
                    { backgroundColor: primaryColor }
                  ]}
                >
                  <Feather name="user-plus" size={18} color="white" />
                  <ThemedText style={{ color: "white", fontWeight: "600", marginLeft: Spacing.sm }}>
                    Create Profile
                  </ThemedText>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText type="body" style={{ marginTop: Spacing.lg, color: theme.textSecondary }}>
          Loading leaderboard...
        </ThemedText>
      </ThemedView>
    );
  }

  const isEmpty = leaderboardData.length === 0;

  if (isEmpty) {
    return (
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={GRADIENT_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top + Spacing.md }]}
        >
          <View style={styles.headerTop}>
            <ThemedText type="h3" style={styles.headerTitle}>LEADERBOARD</ThemedText>
          </View>
        </LinearGradient>
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: `${primaryColor}15` }]}>
            <Feather name="award" size={40} color={primaryColor} />
          </View>
          <ThemedText type="h4" style={{ marginBottom: Spacing.sm, textAlign: "center" }}>
            No Rankings Yet
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
            Complete quizzes to earn points and climb the leaderboard!
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const totalParticipants = leaderboardData.length;
  const totalPoints = leaderboardData.reduce((sum, u) => sum + u.points, 0);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarHeight + Spacing.xl + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={GRADIENT_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top + Spacing.md }]}
        >
          <View style={styles.headerTop}>
            <View>
              <ThemedText type="h3" style={styles.headerTitle}>LEADERBOARD</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                {totalParticipants} participants • {totalPoints.toLocaleString()} pts
              </ThemedText>
            </View>
            <Pressable onPress={() => refetch()} style={styles.refreshButton}>
              <Feather name="refresh-cw" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.filterTabs}>
            {[
              { key: "today", label: "Today" },
              { key: "month", label: "This Month" },
              { key: "allTime", label: "All Time" },
            ].map((filter) => (
              <Pressable
                key={filter.key}
                onPress={() => setActiveFilter(filter.key as TimeFilter)}
                style={[
                  styles.filterTab,
                  activeFilter === filter.key && styles.filterTabActive,
                ]}
              >
                <ThemedText
                  style={[
                    styles.filterTabText,
                    activeFilter === filter.key && styles.filterTabTextActive,
                  ]}
                >
                  {filter.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <TopThreePodium users={topThree} />
        </LinearGradient>

        {others.length > 0 && (
          <View style={styles.listSection}>
            <View style={styles.listHeader}>
              <ThemedText style={[styles.listTitle, { color: theme.text }]}>
                Other Rankings
              </ThemedText>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <Feather name="star" size={12} color="#FFD700" />
                  <ThemedText style={styles.legendText}>Points</ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <Feather name="book-open" size={12} color="#06B6D4" />
                  <ThemedText style={styles.legendText}>Quizzes</ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <Feather name="percent" size={12} color="#10B981" />
                  <ThemedText style={styles.legendText}>Accuracy</ThemedText>
                </View>
              </View>
            </View>
            {others.map((user) => (
              <LeaderboardCard key={user.id} user={user} theme={theme} />
            ))}
          </View>
        )}

        {leaderboardData.length > 0 && (
          <RankingsSection users={leaderboardData} theme={theme} />
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "85%",
    overflow: "hidden",
  },
  modalHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  modalPreview: {
    maxHeight: 300,
  },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  previewRank: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  previewInfo: {
    flex: 1,
  },
  modalActions: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    paddingBottom: Spacing.xl + 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  createButton: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  headerGradient: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: 2,
    fontSize: 22,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    marginTop: 4,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  filterTabs: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  filterTabActive: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  filterTabText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
    fontSize: 13,
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },
  podiumContainer: {
    alignItems: "center",
    paddingTop: Spacing.lg,
    position: "relative",
  },
  decorativeElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeStar: {
    position: "absolute",
  },
  winnersRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.sm,
    marginBottom: -Spacing.lg,
    width: "100%",
  },
  winnerSpot: {
    alignItems: "center",
    flex: 1,
    zIndex: 1,
    paddingHorizontal: 4,
  },
  winnerSpotEmpty: {
    flex: 1,
  },
  firstPlace: {
    marginBottom: Spacing.xl,
  },
  winnerName: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    marginTop: Spacing.xs,
    textAlign: "center",
    maxWidth: 100,
  },
  firstName: {
    fontSize: 15,
  },
  winnerStats: {
    marginTop: Spacing.xs,
  },
  winnerMiniStats: {
    flexDirection: "row",
    marginTop: 4,
    gap: 8,
  },
  miniStatText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
    fontWeight: "500",
  },
  hexagonContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  hexagonInitial: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  crownContainer: {
    position: "absolute",
    zIndex: 10,
    alignItems: "center",
  },
  crownEmoji: {
    fontSize: 24,
  },
  avatarContainer: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  pointsText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  podiumBars: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    width: "100%",
    paddingHorizontal: Spacing.lg,
  },
  podiumBar: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: Spacing.lg,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  podiumBarFirst: {
    height: 100,
    backgroundColor: "rgba(255, 215, 0, 0.3)",
    marginHorizontal: Spacing.xs,
  },
  podiumBarSecond: {
    height: 70,
    backgroundColor: "rgba(192, 192, 192, 0.3)",
  },
  podiumBarThird: {
    height: 60,
    backgroundColor: "rgba(205, 127, 50, 0.3)",
  },
  podiumRankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#C0C0C0",
    justifyContent: "center",
    alignItems: "center",
  },
  podiumNumber: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  listSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  listHeader: {
    marginBottom: Spacing.md,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  legendRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  leaderboardCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  rankText: {
    fontSize: 14,
    fontWeight: "800",
  },
  userInfo: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  cardRight: {
    alignItems: "flex-end",
    minWidth: 120,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: 6,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 13,
    fontWeight: "700",
  },
  progressBar: {
    width: 100,
    height: 4,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  rankingsSection: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  rankingsSectionHeader: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    position: "relative",
    overflow: "hidden",
  },
  rankingsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    zIndex: 2,
  },
  rankingsTitleContainer: {
    flex: 1,
  },
  rankingsSectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 2,
  },
  rankingsSectionSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  rankingsDecorative: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  rankingsDecorativeStar: {
    position: "absolute",
  },
  rankingsListWide: {
    gap: Spacing.md,
  },
  rankingCardWide: {
    flexDirection: "row",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  rankingCardWideLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.sm,
  },
  rankBadgeWide: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  rankBadgeTextWide: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  medalEmojiWide: {
    fontSize: 12,
    marginTop: -2,
  },
  rankingAvatarWrapperWide: {
    marginLeft: Spacing.xs,
  },
  rankingAvatarSection: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.xs,
  },
  rankingUserNameBelow: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
    maxWidth: 70,
  },
  rankingUserInfoWide: {
    flex: 1,
    marginLeft: Spacing.xs,
    justifyContent: "center",
  },
  rankingUserNameWide: {
    fontSize: 14,
    fontWeight: "700",
  },
  rankingUsernameWide: {
    fontSize: 11,
    marginTop: 2,
  },
  rankingCardWideRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 150,
  },
  rankingStatsRowWide: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  rankingStatItemWide: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  rankingStatTextWide: {
    alignItems: "flex-start",
  },
  rankingStatValueWide: {
    fontSize: 14,
    fontWeight: "800",
  },
  rankingStatLabelWide: {
    fontSize: 9,
  },
  rankingProgressWide: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    width: "100%",
  },
  rankingProgressBarWide: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  rankingProgressFillWide: {
    height: "100%",
    borderRadius: 3,
  },
  rankingQuizzesWide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rankingQuizzesTextWide: {
    fontSize: 10,
  },
});
