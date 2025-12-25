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
import Animated, { 
  FadeInDown, 
  FadeIn,
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

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "general" | "quizzes" | "account";
  icon: keyof typeof Feather.glyphMap;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "1",
    category: "general",
    question: "What is TestOne?",
    answer: "TestOne is your ultimate quiz companion designed to help you prepare for exams and assessments with multiple quiz modes, multiplayer competitions, and leaderboards.",
    icon: "zap",
  },
  {
    id: "2",
    category: "quizzes",
    question: "How do I take a quiz?",
    answer: "Browse quizzes in Discover, tap one to view details, and click 'Start Quiz' to begin answering questions within the time limit.",
    icon: "book-open",
  },
  {
    id: "3",
    category: "quizzes",
    question: "Can I create my own quiz?",
    answer: "Log in as admin, navigate to 'Manage Quizzes', click 'Create New Quiz', add questions, set difficulty levels, and publish.",
    icon: "edit-3",
  },
  {
    id: "4",
    category: "quizzes",
    question: "What is Multiplayer mode?",
    answer: "Compete with friends in real-time. Create a room, share the code, and challenge others to take the same quiz simultaneously.",
    icon: "users",
  },
  {
    id: "5",
    category: "quizzes",
    question: "How do I join a multiplayer room?",
    answer: "Go to Discover, tap 'Join Room', enter the room code shared by your friend, and wait for the host to start the quiz.",
    icon: "log-in",
  },
  {
    id: "6",
    category: "account",
    question: "How do I change my profile picture?",
    answer: "Go to Profile, tap your avatar, select a new image from your device, crop it, and upload.",
    icon: "camera",
  },
  {
    id: "7",
    category: "account",
    question: "What are badges and frames?",
    answer: "Badges are achievements for milestones. Frames are decorative profile borders that unlock as you progress.",
    icon: "award",
  },
  {
    id: "8",
    category: "general",
    question: "How do I track my progress?",
    answer: "Check Profile or History to view quiz statistics, scores, and trends. The Leaderboard shows your ranking.",
    icon: "bar-chart-2",
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
      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Feather name="chevron-left" size={28} color={theme.text} />
          </Pressable>
          <ThemedText type="h3" style={{ fontWeight: "700" }}>
            Help & Support
          </ThemedText>
          <View style={{ width: 28 }} />
        </View>

        {/* Search Bar */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[styles.searchWrapper, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            placeholder="Search help..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </Animated.View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category Tabs */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={({ pressed }) => [
                  styles.categoryTab,
                  {
                    backgroundColor: selectedCategory === cat.id ? theme.primary : theme.backgroundSecondary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Feather name={cat.icon} size={16} color={selectedCategory === cat.id ? "#FFFFFF" : theme.text} />
                <ThemedText
                  type="small"
                  style={{
                    color: selectedCategory === cat.id ? "#FFFFFF" : theme.text,
                    marginLeft: 6,
                    fontWeight: "600",
                  }}
                >
                  {cat.label}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* FAQ List */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.faqContainer}>
          {filteredFAQ.length > 0 ? (
            filteredFAQ.map((item, index) => (
              <FAQAccordion
                key={item.id}
                item={item}
                isExpanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                index={index}
                theme={theme}
              />
            ))
          ) : (
            <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
              <Feather name="search" size={48} color={theme.textSecondary} />
              <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: 12 }}>
                No results found
              </ThemedText>
            </Animated.View>
          )}
        </Animated.View>

        {/* Contact Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.contactSection}>
          <Pressable
            onPress={handleEmailPress}
            style={({ pressed }) => [
              styles.contactButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Animated.View entering={ZoomIn.delay(350).duration(400)}>
              <Feather name="send" size={24} color="#FFFFFF" />
            </Animated.View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "700" }}>
                Still need help?
              </ThemedText>
              <ThemedText type="small" style={{ color: "#FFFFFF", opacity: 0.9, marginTop: 2 }}>
                Contact our support team
              </ThemedText>
            </View>
            <Feather name="arrow-right" size={20} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

interface FAQAccordionProps {
  item: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
  theme: any;
}

function FAQAccordion({ item, isExpanded, onToggle, index, theme }: FAQAccordionProps) {
  const rotateZ = useSharedValue(0);

  React.useEffect(() => {
    rotateZ.value = withTiming(isExpanded ? 1 : 0, { duration: 300 });
  }, [isExpanded, rotateZ]);

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotateZ.value * 180}deg` }],
    };
  });

  return (
    <Animated.View
      entering={FadeInDown.delay(250 + index * 50).duration(400)}
      style={[styles.faqItem, { backgroundColor: theme.backgroundDefault }]}
    >
      <Pressable onPress={onToggle} style={styles.faqHeader}>
        <View style={styles.faqTitleContainer}>
          <View style={[styles.faqIcon, { backgroundColor: `${theme.primary}15` }]}>
            <Feather name={item.icon} size={18} color={theme.primary} />
          </View>
          <ThemedText type="body" style={{ fontWeight: "600", flex: 1 }}>
            {item.question}
          </ThemedText>
        </View>
        <Animated.View style={iconAnimatedStyle}>
          <Feather name="chevron-down" size={20} color={theme.primary} />
        </Animated.View>
      </Pressable>

      {isExpanded && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.faqAnswer}>
          <ThemedText type="body" style={{ color: theme.textSecondary, lineHeight: 24 }}>
            {item.answer}
          </ThemedText>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  categoriesContainer: {
    marginBottom: 28,
  },
  categoriesScroll: {
    paddingRight: 16,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  faqContainer: {
    marginBottom: 20,
  },
  faqItem: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  faqIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  faqAnswer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  contactSection: {
    marginTop: 8,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 14,
    overflow: "hidden",
  },
});
