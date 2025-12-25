import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Linking,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { 
  FadeIn,
  FadeInDown,
  ZoomIn,
  withSpring,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Article {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
}

interface Discussion {
  id: string;
  title: string;
  date: string;
  category: string;
  avatar: string;
  color: string;
}

const TOP_ARTICLES: Article[] = [
  {
    id: "1",
    title: "How do I start taking quizzes on TestOne?",
    description: "Browse available quizzes, tap one to view details, then click 'Start Quiz' to begin answering questions within the time limit.",
    icon: "book-open",
  },
  {
    id: "2",
    title: "How do I create and publish my own quiz?",
    description: "Log in as an admin, go to 'Manage Quizzes', click 'Create New Quiz', add questions, set difficulty, and publish to make it available for others.",
    icon: "plus-circle",
  },
  {
    id: "3",
    title: "What is Multiplayer Mode and how does it work?",
    description: "Compete with friends in real-time. Create a room, share the code with friends, and challenge them to take the same quiz simultaneously.",
    icon: "users",
  },
  {
    id: "4",
    title: "How do I earn badges and unlock frames?",
    description: "Badges are achievements earned by reaching milestones. Frames are decorative borders that unlock as you progress and showcase your accomplishments.",
    icon: "award",
  },
];

const DISCUSSIONS: Discussion[] = [
  {
    id: "1",
    title: "How do I join a multiplayer room with my friends?",
    date: "22 Dec 2025",
    category: "Multiplayer",
    avatar: "M",
    color: "#4F46E5",
  },
  {
    id: "2",
    title: "How can I change my profile picture in TestOne?",
    date: "20 Dec 2025",
    category: "Account",
    avatar: "P",
    color: "#EC4899",
  },
  {
    id: "3",
    title: "Can I retake quizzes to improve my score?",
    date: "18 Dec 2025",
    category: "Quizzes",
    avatar: "R",
    color: "#F59E0B",
  },
  {
    id: "4",
    title: "How do I view my quiz history and progress?",
    date: "15 Dec 2025",
    category: "Analytics",
    avatar: "H",
    color: "#10B981",
  },
];

const CONTACT_INFO = {
  email: "jaatcoderx@gmail.com",
  emailSubject: "Help & Support - TestOne",
};

export default function HelpSupportScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleEmailPress = async () => {
    const mailtoUrl = `mailto:${CONTACT_INFO.email}?subject=${encodeURIComponent(
      CONTACT_INFO.emailSubject
    )}`;
    try {
      await Linking.openURL(mailtoUrl);
    } catch (error) {
      console.error("Failed to open email", error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <Animated.View 
        entering={FadeIn.duration(400)} 
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerTop}>
          <Pressable 
            onPress={() => navigation.goBack()} 
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Feather name="chevron-left" size={28} color={theme.text} />
          </Pressable>
          <Pressable>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <ThemedText style={{ color: "#FFFFFF", fontWeight: "700" }}>G</ThemedText>
            </View>
          </Pressable>
        </View>
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section with Gradient and Illustration */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <LinearGradient
            colors={["#F0E7FF", "#D4C5FF", "#A8B5FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroSection}
          >
            {/* Illustration - Creative SVG-like design with icons */}
            <Animated.View 
              entering={ZoomIn.delay(200).duration(600)}
              style={styles.illustrationContainer}
            >
              {/* Question mark circle */}
              <View style={[styles.illustrationCircle, { backgroundColor: "#FF6B6B" }]}>
                <ThemedText style={styles.illustrationText}>?</ThemedText>
              </View>
              {/* Speech bubble 1 */}
              <View style={[styles.speechBubble1, { backgroundColor: "#FFD93D" }]} />
              {/* Speech bubble 2 */}
              <View style={[styles.speechBubble2, { backgroundColor: "#FFA07A" }]} />
            </Animated.View>

            {/* Hero Text */}
            <View style={styles.heroText}>
              <ThemedText 
                style={[styles.heroTitle, { color: "#1A1A1A" }]}
              >
                How can we help you today?
              </ThemedText>
              <ThemedText 
                style={[
                  styles.heroSubtitle,
                  { color: "#666666" },
                ]}
              >
                Get answers about TestOne quizzes, multiplayer mode, badges, and your account.
              </ThemedText>
            </View>

            {/* Search Bar in Hero */}
            <Animated.View 
              entering={FadeInDown.delay(300).duration(500)}
              style={styles.heroSearchContainer}
            >
              <Feather name="search" size={18} color="#999999" />
              <TextInput
                placeholder="Type to search"
                placeholderTextColor="#999999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.heroSearchInput, { color: "#1A1A1A" }]}
              />
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Top Articles Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Top Articles</ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.articlesScroll}
          >
            {TOP_ARTICLES.map((article, index) => (
              <Animated.View
                key={article.id}
                entering={FadeInDown.delay(450 + index * 50).duration(500)}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.articleCard,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <ThemedText style={styles.articleTitle}>
                    {article.title}
                  </ThemedText>
                  <ThemedText style={styles.articleDescription}>
                    {article.description}
                  </ThemedText>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Latest Discussions Section */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Latest discussions</ThemedText>
          {DISCUSSIONS.map((discussion, index) => (
            <Animated.View
              key={discussion.id}
              entering={FadeInDown.delay(550 + index * 50).duration(500)}
            >
              <Pressable
                onPress={handleEmailPress}
                style={({ pressed }) => [
                  styles.discussionItem,
                  { 
                    backgroundColor: theme.backgroundDefault,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={[styles.discussionAvatar, { backgroundColor: discussion.color }]}>
                  <ThemedText style={styles.discussionAvatarText}>
                    {discussion.avatar}
                  </ThemedText>
                </View>
                <View style={styles.discussionContent}>
                  <ThemedText style={styles.discussionTitle}>
                    {discussion.title}
                  </ThemedText>
                  <View style={styles.discussionMeta}>
                    <ThemedText style={styles.discussionDate}>
                      {discussion.date}
                    </ThemedText>
                    <View style={styles.metaSeparator} />
                    <ThemedText style={styles.discussionCategory}>
                      {discussion.category}
                    </ThemedText>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Bottom Navigation Icons */}
        <Animated.View 
          entering={FadeInDown.delay(600).duration(500)}
          style={styles.bottomNav}
        >
          <Pressable style={styles.navIcon}>
            <Feather name="home" size={24} color={theme.textSecondary} />
          </Pressable>
          <Pressable style={styles.navIcon}>
            <Feather name="file-text" size={24} color={theme.textSecondary} />
          </Pressable>
          <Pressable 
            onPress={handleEmailPress}
            style={styles.navIcon}
          >
            <View style={[styles.primaryButton, { backgroundColor: theme.primary }]}>
              <Feather name="send" size={20} color="#FFFFFF" />
            </View>
          </Pressable>
          <Pressable style={styles.navIcon}>
            <Feather name="play" size={24} color={theme.textSecondary} />
          </Pressable>
          <Pressable style={styles.navIcon}>
            <Feather name="menu" size={24} color={theme.textSecondary} />
          </Pressable>
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 24,
    paddingTop: 40,
    alignItems: "center",
    marginBottom: 32,
    overflow: "hidden",
  },
  illustrationContainer: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  illustrationCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
  },
  illustrationText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  speechBubble1: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    bottom: 20,
    left: 20,
    zIndex: 1,
  },
  speechBubble2: {
    position: "absolute",
    width: 55,
    height: 55,
    borderRadius: 27.5,
    top: 10,
    right: 15,
    zIndex: 2,
  },
  heroText: {
    alignItems: "center",
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  heroSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: "100%",
  },
  heroSearchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  articlesScroll: {
    paddingRight: 16,
  },
  articleCard: {
    width: SCREEN_WIDTH - 72,
    backgroundColor: "#F8F9FF",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4F46E5",
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    lineHeight: 20,
  },
  articleDescription: {
    fontSize: 12,
    color: "#888888",
    lineHeight: 18,
  },
  discussionItem: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    borderRadius: 12,
  },
  discussionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  discussionAvatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  discussionContent: {
    flex: 1,
  },
  discussionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  discussionMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  discussionDate: {
    fontSize: 12,
    color: "#999999",
  },
  metaSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CCCCCC",
    marginHorizontal: 8,
  },
  discussionCategory: {
    fontSize: 12,
    color: "#999999",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 24,
  },
  navIcon: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});
