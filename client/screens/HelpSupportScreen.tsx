import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Linking,
  ActivityIndicator,
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
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "general" | "bot" | "quizzes" | "account";
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "1",
    category: "general",
    question: "What is TestOne?",
    answer: "TestOne is your ultimate quiz companion app designed to help you prepare for exams and assessments. Features include multiple quiz modes, real-time multiplayer competitions, progress tracking, and personalized learning paths.",
  },
  {
    id: "2",
    category: "bot",
    question: "How does the Bot feature work?",
    answer: "Our advanced bot analyzes your quiz performance and provides personalized recommendations. It learns from your mistakes and suggests topics you need to focus on for better results.",
  },
  {
    id: "3",
    category: "bot",
    question: "Can the Bot help me improve my scores?",
    answer: "Absolutely! The Bot provides detailed analytics, identifies weak areas, suggests practice quizzes, and tracks your improvement over time. Use its insights to focus your study efforts effectively.",
  },
  {
    id: "4",
    category: "quizzes",
    question: "How do I create my own quiz?",
    answer: "Log in as an admin/owner, navigate to 'Manage Quizzes', and click 'Create New Quiz'. Add your questions, answer options, set difficulty levels, and publish. Your quiz will be available for others to take.",
  },
  {
    id: "5",
    category: "quizzes",
    question: "What is Multiplayer mode?",
    answer: "Multiplayer mode lets you compete with friends in real-time. Create a room, share the code, and challenge others to take the same quiz simultaneously. See who finishes first and with the best score!",
  },
  {
    id: "6",
    category: "account",
    question: "How do I change my profile picture?",
    answer: "Go to your Profile page, tap on your current avatar, and select a new image from your device. You can crop and customize it before uploading.",
  },
  {
    id: "7",
    category: "account",
    question: "What are badges and frames?",
    answer: "Badges are achievements you earn by reaching milestones. Frames are decorative borders for your profile that unlock as you progress. They showcase your accomplishments!",
  },
  {
    id: "8",
    category: "general",
    question: "How is my progress tracked?",
    answer: "We track your quiz scores, completion rates, average performance, and improvement trends. Check your Dashboard for detailed analytics and insights about your learning journey.",
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All", icon: "grid" as const },
    { id: "general", label: "General", icon: "info" as const },
    { id: "bot", label: "Bot", icon: "zap" as const },
    { id: "quizzes", label: "Quizzes", icon: "book" as const },
    { id: "account", label: "Account", icon: "user" as const },
  ];

  const filteredFAQ = FAQ_DATA.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
      <LinearGradient
        colors={isDark ? ["#6366F1", "#8B5CF6"] : ["#06B6D4", "#0891B2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Feather name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
          <ThemedText type="h3" style={styles.headerTitle}>
            Help & Support
          </ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.headerContent}>
          <View style={[styles.heroIcon, { backgroundColor: "rgba(255, 255, 255, 0.2)" }]}>
            <Feather name="help-circle" size={48} color="#FFFFFF" />
          </View>
          <ThemedText type="h2" style={styles.heroTitle}>
            How can we
          </ThemedText>
          <ThemedText type="h2" style={[styles.heroTitle, { fontWeight: "700" }]}>
            help you?
          </ThemedText>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.searchContainer, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={[styles.searchInput, { borderColor: theme.border }]}>
            <Feather name="search" size={20} color={theme.textSecondary} />
            <TextInput
              placeholder="Search questions..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.input, { color: theme.text }]}
            />
          </View>
        </Animated.View>

        {/* Category Tabs */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={styles.categoriesContainer}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  {
                    backgroundColor:
                      selectedCategory === cat.id
                        ? theme.primary
                        : theme.backgroundSecondary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Feather
                  name={cat.icon}
                  size={16}
                  color={
                    selectedCategory === cat.id ? "#FFFFFF" : theme.textSecondary
                  }
                />
                <ThemedText
                  type="small"
                  style={{
                    color: selectedCategory === cat.id ? "#FFFFFF" : theme.text,
                    marginLeft: Spacing.xs,
                    fontWeight: "600",
                  }}
                >
                  {cat.label}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* FAQ Section Title */}
        <View style={styles.sectionTitleContainer}>
          <ThemedText
            type="h4"
            style={{
              color: theme.text,
              fontWeight: "700",
              marginBottom: Spacing.sm,
            }}
          >
            Frequently Asked Questions
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {filteredFAQ.length} question{filteredFAQ.length !== 1 ? "s" : ""}
          </ThemedText>
        </View>

        {/* FAQ Items */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={{ width: "100%" }}
        >
          {filteredFAQ.length > 0 ? (
            filteredFAQ.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
                style={({ pressed }) => [
                  styles.faqItem,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={styles.faqHeader}>
                  <View
                    style={[
                      styles.categoryBadge,
                      {
                        backgroundColor:
                          item.category === "bot"
                            ? `${theme.primary}20`
                            : item.category === "quizzes"
                            ? `${theme.secondary}20`
                            : item.category === "account"
                            ? `#F59E0B20`
                            : `#10B98120`,
                      },
                    ]}
                  >
                    <ThemedText
                      type="small"
                      style={{
                        color:
                          item.category === "bot"
                            ? theme.primary
                            : item.category === "quizzes"
                            ? theme.secondary
                            : item.category === "account"
                            ? "#F59E0B"
                            : "#10B981",
                        fontWeight: "600",
                        textTransform: "capitalize",
                      }}
                    >
                      {item.category}
                    </ThemedText>
                  </View>
                  <Feather
                    name={expandedId === item.id ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.primary}
                  />
                </View>

                <ThemedText
                  type="body"
                  style={{
                    color: theme.text,
                    fontWeight: "600",
                    marginTop: Spacing.sm,
                  }}
                >
                  {item.question}
                </ThemedText>

                {expandedId === item.id && (
                  <Animated.View entering={FadeInDown.duration(300)}>
                    <ThemedText
                      type="body"
                      style={{
                        color: theme.textSecondary,
                        marginTop: Spacing.md,
                        lineHeight: 24,
                      }}
                    >
                      {item.answer}
                    </ThemedText>
                  </Animated.View>
                )}
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Feather name="search" size={48} color={theme.textSecondary} />
              <ThemedText
                type="body"
                style={{ color: theme.textSecondary, marginTop: Spacing.md }}
              >
                No results found
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Try a different search term
              </ThemedText>
            </View>
          )}
        </Animated.View>

        {/* Contact Section */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.contactSection}
        >
          <View style={[styles.contactCard, { backgroundColor: theme.backgroundDefault }]}>
            <View
              style={[
                styles.contactIconContainer,
                { backgroundColor: `${theme.primary}15` },
              ]}
            >
              <Feather name="mail" size={32} color={theme.primary} />
            </View>

            <ThemedText
              type="h4"
              style={{
                color: theme.text,
                fontWeight: "700",
                marginTop: Spacing.lg,
              }}
            >
              Still need help?
            </ThemedText>
            <ThemedText
              type="body"
              style={{
                color: theme.textSecondary,
                marginTop: Spacing.sm,
                textAlign: "center",
              }}
            >
              Contact our support team directly
            </ThemedText>

            <Pressable
              onPress={handleEmailPress}
              style={({ pressed }) => [
                styles.emailButton,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <LinearGradient
                colors={
                  isDark ? [theme.primary, "#7C3AED"] : ["#06B6D4", "#0891B2"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emailButtonGradient}
              >
                <Feather name="send" size={18} color="#FFFFFF" />
                <ThemedText
                  type="body"
                  style={{
                    color: "#FFFFFF",
                    fontWeight: "600",
                    marginLeft: Spacing.sm,
                  }}
                >
                  Email Us
                </ThemedText>
              </LinearGradient>
            </Pressable>

            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.lg }}>
              {CONTACT_INFO.email}
            </ThemedText>
          </View>
        </Animated.View>

        {/* Quick Tips */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(400)}
          style={styles.tipsSection}
        >
          <ThemedText type="h4" style={{ color: theme.text, fontWeight: "700" }}>
            Quick Tips
          </ThemedText>
          <View style={[styles.tipItem, { borderLeftColor: theme.primary }]}>
            <Feather name="zap" size={20} color={theme.primary} />
            <ThemedText type="body" style={{ color: theme.text, marginLeft: Spacing.md, flex: 1 }}>
              Check the Bot analytics regularly for personalized improvement suggestions
            </ThemedText>
          </View>
          <View style={[styles.tipItem, { borderLeftColor: theme.secondary }]}>
            <Feather name="users" size={20} color={theme.secondary} />
            <ThemedText type="body" style={{ color: theme.text, marginLeft: Spacing.md, flex: 1 }}>
              Invite friends to multiplayer mode for a competitive learning experience
            </ThemedText>
          </View>
          <View style={[styles.tipItem, { borderLeftColor: "#F59E0B" }]}>
            <Feather name="trending-up" size={20} color="#F59E0B" />
            <ThemedText type="body" style={{ color: theme.text, marginLeft: Spacing.md, flex: 1 }}>
              Focus on weak areas highlighted by the Bot to improve your scores
            </ThemedText>
          </View>
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
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  headerContent: {
    alignItems: "center",
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitle: {
    color: "#FFFFFF",
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
  },
  searchContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderRadius: 16,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesScroll: {
    paddingRight: 16,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    marginRight: 8,
  },
  sectionTitleContainer: {
    marginBottom: 16,
  },
  faqItem: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  contactSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  contactCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  contactIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emailButton: {
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
  },
  emailButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  tipsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  tipItem: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderRadius: 16,
    alignItems: "flex-start",
  },
});
