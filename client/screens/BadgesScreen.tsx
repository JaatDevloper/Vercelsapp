import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useQuizHistory } from "@/hooks/useQuizHistory";
import { useProfile } from "@/hooks/useProfile";
import { useSilentAutoRefresh } from "@/hooks/useSilentAutoRefresh";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  colors: string[];
  requirement: string;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  category: "daily" | "streak" | "score" | "special";
}


interface ProfileFrame {
  id: string;
  name: string;
  colors: string[];
  borderStyle: "solid" | "gradient" | "animated" | "crown";
  isUnlocked: boolean;
  requirement: string;
  isPremium?: boolean;
  icon?: string;
}

const PROFILE_FRAMES: ProfileFrame[] = [
  {
    id: "frame_basic",
    name: "Basic",
    colors: ["#6B7280", "#9CA3AF"],
    borderStyle: "solid",
    isUnlocked: true,
    requirement: "Default frame",
  },
  {
    id: "frame_bronze",
    name: "Bronze",
    colors: ["#CD7F32", "#B8860B"],
    borderStyle: "gradient",
    isUnlocked: true,
    requirement: "Complete 5 quizzes",
  },
  {
    id: "frame_silver",
    name: "Silver",
    colors: ["#C0C0C0", "#A8A8A8"],
    borderStyle: "gradient",
    isUnlocked: true,
    requirement: "Complete 20 quizzes",
  },
  {
    id: "frame_gold",
    name: "Gold",
    colors: ["#FFD700", "#FFA500"],
    borderStyle: "gradient",
    isUnlocked: false,
    requirement: "Complete 50 quizzes",
  },
  {
    id: "frame_platinum",
    name: "Platinum",
    colors: ["#E5E4E2", "#BCC6CC"],
    borderStyle: "gradient",
    isUnlocked: false,
    requirement: "Complete 100 quizzes",
  },
  {
    id: "frame_diamond",
    name: "Diamond",
    colors: ["#B9F2FF", "#00CED1"],
    borderStyle: "animated",
    isUnlocked: false,
    requirement: "Complete 200 quizzes",
  },
  {
    id: "frame_legendary",
    name: "Legendary",
    colors: ["#8B5CF6", "#EC4899"],
    borderStyle: "animated",
    isUnlocked: false,
    requirement: "Reach 90% average score",
  },
  {
    id: "frame_champion",
    name: "Champion",
    colors: ["#EF4444", "#F59E0B"],
    borderStyle: "animated",
    isUnlocked: false,
    requirement: "Win 50 multiplayer games",
  },
  {
    id: "frame_royal_crown",
    name: "Royal Crown",
    colors: ["#FFD700", "#DAA520"],
    borderStyle: "crown",
    isUnlocked: false,
    requirement: "Premium Member",
    isPremium: true,
    icon: "award",
  },
  {
    id: "frame_emperor_crown",
    name: "Emperor",
    colors: ["#9333EA", "#7C3AED"],
    borderStyle: "crown",
    isUnlocked: false,
    requirement: "VIP Status",
    isPremium: true,
    icon: "award",
  },
  {
    id: "frame_diamond_crown",
    name: "Diamond King",
    colors: ["#06B6D4", "#22D3EE"],
    borderStyle: "crown",
    isUnlocked: false,
    requirement: "Elite Member",
    isPremium: true,
    icon: "award",
  },
  {
    id: "frame_ruby_crown",
    name: "Ruby Crown",
    colors: ["#DC2626", "#F87171"],
    borderStyle: "crown",
    isUnlocked: false,
    requirement: "Master Status",
    isPremium: true,
    icon: "award",
  },
  {
    id: "frame_emerald_crown",
    name: "Emerald Crown",
    colors: ["#059669", "#34D399"],
    borderStyle: "crown",
    isUnlocked: false,
    requirement: "Legend Status",
    isPremium: true,
    icon: "award",
  },
  {
    id: "frame_sapphire_crown",
    name: "Sapphire King",
    colors: ["#2563EB", "#60A5FA"],
    borderStyle: "crown",
    isUnlocked: false,
    requirement: "Champion Status",
    isPremium: true,
    icon: "award",
  },
  {
    id: "frame_cosmic_crown",
    name: "Cosmic Crown",
    colors: ["#7C3AED", "#A855F7", "#EC4899"],
    borderStyle: "crown",
    isUnlocked: false,
    requirement: "Ultimate Status",
    isPremium: true,
    icon: "award",
  },
  {
    id: "frame_phoenix_crown",
    name: "Phoenix Crown",
    colors: ["#F97316", "#FBBF24", "#EF4444"],
    borderStyle: "crown",
    isUnlocked: false,
    requirement: "Supreme Status",
    isPremium: true,
    icon: "award",
  },
];

function getAchievementBadges(stats: { totalQuizzes: number; averageScore: number }): AchievementBadge[] {
  return [
    {
      id: "daily_10",
      name: "Daily Warrior",
      description: "Complete 10 quizzes in a day",
      icon: "sun",
      colors: ["#F59E0B", "#D97706"],
      requirement: "10 quizzes/day",
      progress: Math.min(stats.totalQuizzes, 10),
      maxProgress: 10,
      isUnlocked: stats.totalQuizzes >= 10,
      category: "daily",
    },
    {
      id: "daily_20",
      name: "Quiz Machine",
      description: "Complete 20 quizzes in a day",
      icon: "zap",
      colors: ["#EF4444", "#DC2626"],
      requirement: "20 quizzes/day",
      progress: Math.min(stats.totalQuizzes, 20),
      maxProgress: 20,
      isUnlocked: stats.totalQuizzes >= 20,
      category: "daily",
    },
    {
      id: "daily_50",
      name: "Quiz Legend",
      description: "Complete 50 quizzes in a day",
      icon: "award",
      colors: ["#8B5CF6", "#7C3AED"],
      requirement: "50 quizzes/day",
      progress: Math.min(stats.totalQuizzes, 50),
      maxProgress: 50,
      isUnlocked: stats.totalQuizzes >= 50,
      category: "daily",
    },
    {
      id: "streak_3",
      name: "Getting Started",
      description: "3 day quiz streak",
      icon: "flame",
      colors: ["#F97316", "#EA580C"],
      requirement: "3 day streak",
      progress: 1,
      maxProgress: 3,
      isUnlocked: false,
      category: "streak",
    },
    {
      id: "streak_7",
      name: "Week Warrior",
      description: "7 day quiz streak",
      icon: "flame",
      colors: ["#EF4444", "#B91C1C"],
      requirement: "7 day streak",
      progress: 1,
      maxProgress: 7,
      isUnlocked: false,
      category: "streak",
    },
    {
      id: "streak_30",
      name: "Month Master",
      description: "30 day quiz streak",
      icon: "flame",
      colors: ["#DC2626", "#7F1D1D"],
      requirement: "30 day streak",
      progress: 1,
      maxProgress: 30,
      isUnlocked: false,
      category: "streak",
    },
    {
      id: "score_70",
      name: "Sharp Mind",
      description: "Achieve 70% average score",
      icon: "target",
      colors: ["#10B981", "#059669"],
      requirement: "70% avg score",
      progress: Math.min(stats.averageScore, 70),
      maxProgress: 70,
      isUnlocked: stats.averageScore >= 70,
      category: "score",
    },
    {
      id: "score_80",
      name: "Brain Power",
      description: "Achieve 80% average score",
      icon: "cpu",
      colors: ["#06B6D4", "#0891B2"],
      requirement: "80% avg score",
      progress: Math.min(stats.averageScore, 80),
      maxProgress: 80,
      isUnlocked: stats.averageScore >= 80,
      category: "score",
    },
    {
      id: "score_90",
      name: "Genius",
      description: "Achieve 90% average score",
      icon: "star",
      colors: ["#8B5CF6", "#6D28D9"],
      requirement: "90% avg score",
      progress: Math.min(stats.averageScore, 90),
      maxProgress: 90,
      isUnlocked: stats.averageScore >= 90,
      category: "score",
    },
    {
      id: "score_perfect",
      name: "Perfectionist",
      description: "Score 100% on any quiz",
      icon: "check-circle",
      colors: ["#EC4899", "#BE185D"],
      requirement: "100% score",
      progress: 0,
      maxProgress: 1,
      isUnlocked: false,
      category: "score",
    },
    {
      id: "special_first",
      name: "First Steps",
      description: "Complete your first quiz",
      icon: "flag",
      colors: ["#6366F1", "#4F46E5"],
      requirement: "1 quiz",
      progress: Math.min(stats.totalQuizzes, 1),
      maxProgress: 1,
      isUnlocked: stats.totalQuizzes >= 1,
      category: "special",
    },
    {
      id: "special_social",
      name: "Social Butterfly",
      description: "Play 10 multiplayer games",
      icon: "users",
      colors: ["#14B8A6", "#0D9488"],
      requirement: "10 MP games",
      progress: 0,
      maxProgress: 10,
      isUnlocked: false,
      category: "special",
    },
  ];
}

interface BadgeCardProps {
  badge: AchievementBadge;
  theme: any;
  index: number;
}

function BadgeCard({ badge, theme, index }: BadgeCardProps) {
  const progressPercentage = (badge.progress / badge.maxProgress) * 100;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={[
        styles.badgeCard,
        {
          backgroundColor: theme.backgroundDefault,
          opacity: badge.isUnlocked ? 1 : 0.7,
        },
      ]}
    >
      <LinearGradient
        colors={badge.colors as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badgeIconContainer, !badge.isUnlocked && styles.lockedBadge]}
      >
        {badge.isUnlocked ? (
          <Feather name={badge.icon as any} size={24} color="#FFFFFF" />
        ) : (
          <Feather name="lock" size={24} color="#FFFFFF" />
        )}
      </LinearGradient>
      <View style={styles.badgeContent}>
        <View style={styles.badgeHeader}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {badge.name}
          </ThemedText>
          {badge.isUnlocked && (
            <View style={[styles.unlockedBadge, { backgroundColor: "#10B981" }]}>
              <Feather name="check" size={10} color="#FFFFFF" />
            </View>
          )}
        </View>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
          {badge.description}
        </ThemedText>
        {!badge.isUnlocked && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: badge.colors[0],
                  },
                ]}
              />
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {badge.progress}/{badge.maxProgress}
            </ThemedText>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

interface FrameCardProps {
  frame: ProfileFrame;
  isSelected: boolean;
  onSelect: (frame: ProfileFrame) => void;
  theme: any;
  index: number;
}

function FrameCard({ frame, isSelected, onSelect, theme, index }: FrameCardProps) {
  const isCrownFrame = frame.borderStyle === "crown";
  
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <Pressable
        onPress={() => frame.isUnlocked && onSelect(frame)}
        style={({ pressed }) => [
          styles.frameCard,
          {
            backgroundColor: theme.backgroundDefault,
            opacity: frame.isUnlocked ? (pressed ? 0.8 : 1) : 0.6,
            borderWidth: isSelected ? 2 : 0,
            borderColor: isSelected ? frame.colors[0] : "transparent",
          },
        ]}
      >
        <View style={styles.framePreview}>
          {isCrownFrame && (
            <View style={styles.crownContainer}>
              <LinearGradient
                colors={frame.colors.length >= 2 ? frame.colors.slice(0, 2) as [string, string] : [frame.colors[0], frame.colors[0]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.crownBadge}
              >
                <Feather name="award" size={10} color="#FFFFFF" />
              </LinearGradient>
            </View>
          )}
          <LinearGradient
            colors={frame.colors.length >= 2 ? frame.colors.slice(0, 2) as [string, string] : [frame.colors[0], frame.colors[0]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.frameRing, isCrownFrame && styles.crownFrameRing]}
          >
            <View style={[styles.frameInner, { backgroundColor: theme.backgroundDefault }]}>
              <Feather name="user" size={20} color={theme.textSecondary} />
            </View>
          </LinearGradient>
          {!frame.isUnlocked && (
            <View style={styles.frameLock}>
              <Feather name="lock" size={12} color="#FFFFFF" />
            </View>
          )}
          {isSelected && (
            <View style={styles.frameSelected}>
              <Feather name="check" size={12} color="#FFFFFF" />
            </View>
          )}
          {frame.isPremium && (
            <View style={[styles.premiumTag, { backgroundColor: frame.colors[0] }]}>
              <Feather name="star" size={8} color="#FFFFFF" />
            </View>
          )}
        </View>
        <ThemedText type="small" style={{ fontWeight: "600", marginTop: Spacing.xs }}>
          {frame.name}
        </ThemedText>
        <ThemedText
          type="small"
          style={{ color: theme.textSecondary, fontSize: 10, textAlign: "center" }}
          numberOfLines={2}
        >
          {frame.requirement}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

export default function BadgesScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { getStats } = useQuizHistory();
  const { profile, updateFrame, deviceId, authEnabled } = useProfile();
  const stats = getStats();
  
  useSilentAutoRefresh(["profile", deviceId], 10000, { enabled: authEnabled });

  const [selectedFrame, setSelectedFrame] = useState<ProfileFrame>(
    profile?.selectedFrameId 
      ? PROFILE_FRAMES.find(f => f.id === profile.selectedFrameId) || PROFILE_FRAMES[0]
      : PROFILE_FRAMES[0]
  );
  
  useEffect(() => {
    if (profile?.selectedFrameId) {
      const frame = PROFILE_FRAMES.find(f => f.id === profile.selectedFrameId);
      if (frame) setSelectedFrame(frame);
    }
  }, [profile?.selectedFrameId]);

  const [activeTab, setActiveTab] = useState<"badges" | "frames">("badges");

  const handleSelectFrame = (frame: ProfileFrame) => {
    setSelectedFrame(frame);
    updateFrame(frame.id);
  };

  const achievementBadges = getAchievementBadges(stats);
  const unlockedCount = achievementBadges.filter((b) => b.isUnlocked).length;

  const categoryLabels: Record<string, string> = {
    daily: "Daily Challenges",
    streak: "Streak Achievements",
    score: "Score Milestones",
    special: "Special Badges",
  };

  const groupedBadges = achievementBadges.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, AchievementBadge[]>);

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={isDark ? ["#1a1a2e", "#16213e"] : ["#2C3E50", "#3498db"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <ThemedText type="h3" style={styles.headerTitle}>
            Badges & Frames
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <ThemedText type="h2" style={styles.statNumber}>
              {unlockedCount}
            </ThemedText>
            <ThemedText type="small" style={styles.statLabel}>
              Unlocked
            </ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: "rgba(255,255,255,0.3)" }]} />
          <View style={styles.statBox}>
            <ThemedText type="h2" style={styles.statNumber}>
              {achievementBadges.length}
            </ThemedText>
            <ThemedText type="small" style={styles.statLabel}>
              Total
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.tabContainer, { backgroundColor: theme.backgroundDefault }]}>
        <Pressable
          onPress={() => setActiveTab("badges")}
          style={[
            styles.tab,
            activeTab === "badges" && [styles.activeTab, { borderBottomColor: theme.primary }],
          ]}
        >
          <Feather
            name="award"
            size={18}
            color={activeTab === "badges" ? theme.primary : theme.textSecondary}
          />
          <ThemedText
            type="body"
            style={{
              color: activeTab === "badges" ? theme.primary : theme.textSecondary,
              fontWeight: activeTab === "badges" ? "600" : "400",
            }}
          >
            Achievements
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("frames")}
          style={[
            styles.tab,
            activeTab === "frames" && [styles.activeTab, { borderBottomColor: theme.primary }],
          ]}
        >
          <Feather
            name="circle"
            size={18}
            color={activeTab === "frames" ? theme.primary : theme.textSecondary}
          />
          <ThemedText
            type="body"
            style={{
              color: activeTab === "frames" ? theme.primary : theme.textSecondary,
              fontWeight: activeTab === "frames" ? "600" : "400",
            }}
          >
            Profile Frames
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "badges" ? (
          <>
            {Object.entries(groupedBadges).map(([category, badges]) => (
              <View key={category} style={styles.categorySection}>
                <ThemedText
                  type="small"
                  style={[styles.categoryTitle, { color: theme.textSecondary }]}
                >
                  {categoryLabels[category]}
                </ThemedText>
                {badges.map((badge, index) => (
                  <BadgeCard key={badge.id} badge={badge} theme={theme} index={index} />
                ))}
              </View>
            ))}
          </>
        ) : (
          <View style={styles.framesGrid}>
            {PROFILE_FRAMES.map((frame, index) => (
              <FrameCard
                key={frame.id}
                frame={frame}
                isSelected={selectedFrame.id === frame.id}
                onSelect={handleSelectFrame}
                theme={theme}
                index={index}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  statBox: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  statNumber: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  categorySection: {
    marginBottom: Spacing.xl,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: Spacing.md,
    textTransform: "uppercase",
  },
  badgeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  badgeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  lockedBadge: {
    opacity: 0.6,
  },
  badgeContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  badgeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  unlockedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  framesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  frameCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 3) / 4,
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  framePreview: {
    position: "relative",
  },
  frameRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    padding: 3,
  },
  frameInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  frameLock: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#6B7280",
    justifyContent: "center",
    alignItems: "center",
  },
  frameSelected: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
  crownContainer: {
    position: "absolute",
    top: -8,
    zIndex: 10,
  },
  crownBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  crownFrameRing: {
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  premiumTag: {
    position: "absolute",
    top: -4,
    left: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
});
