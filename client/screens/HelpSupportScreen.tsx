import React, { useState, useEffect } from "react";
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
  Easing,
  withRepeat,
  withSequence,
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
  answer: string;
}

const TOP_ARTICLES: Article[] = [
  {
    id: "1",
    title: "How do I start taking quizzes on QuizzyEdu?",
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
    answer: "To join a multiplayer room, follow these steps:\n\n1. Open QuizzyEdu and go to the Multiplayer section\n2. Tap 'Join Room' button\n3. Enter the room code shared by your friend\n4. Select a quiz from the available options\n5. Tap 'Ready' to start playing\n\nYou and your friends will compete in real-time, answering the same questions. Your scores will be displayed on the leaderboard!",
  },
  {
    id: "2",
    title: "How can I change my profile picture in QuizzyEdu?",
    date: "20 Dec 2025",
    category: "Account",
    avatar: "P",
    color: "#EC4899",
    answer: "Changing your profile picture is easy:\n\n1. Navigate to your Profile by tapping the profile icon\n2. Tap on your current profile picture\n3. Choose 'Change Photo' from the options\n4. Select 'Camera' to take a new photo or 'Gallery' to choose from existing images\n5. Crop and adjust the image as needed\n6. Tap 'Save' to confirm\n\nYour new profile picture will be visible to all users immediately!",
  },
  {
    id: "3",
    title: "Can I retake quizzes to improve my score?",
    date: "18 Dec 2025",
    category: "Quizzes",
    avatar: "R",
    color: "#F59E0B",
    answer: "Yes, absolutely! You can retake quizzes to improve your scores:\n\n1. Open the quiz you want to retake from your quiz history\n2. Tap the 'Retake Quiz' button\n3. Review the questions carefully and provide your answers\n4. Your new score will replace the previous one if it's higher\n\nNote: You can retake each quiz unlimited times. Only your best score will be displayed in your profile stats and badges!",
  },
  {
    id: "4",
    title: "How do I view my quiz history and progress?",
    date: "15 Dec 2025",
    category: "Analytics",
    avatar: "H",
    color: "#10B981",
    answer: "To view your quiz history and progress:\n\n1. Go to your Profile section\n2. Tap on 'Statistics' or 'History' tab\n3. You'll see all completed quizzes with dates and scores\n4. Tap on any quiz to see detailed results\n5. View your overall statistics including:\n   - Total quizzes completed\n   - Average score\n   - Total time spent\n   - Progress towards badges\n\nYour analytics help you track improvement over time!",
  },
];

const CONTACT_INFO = {
  email: "jaatcoderx@gmail.com",
  emailSubject: "Help & Support - QuizzyEdu",
};

export default function HelpSupportScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const modalScale = useSharedValue(0.8);
  const modalOpacity = useSharedValue(0);
  
  // Animated values for Contact Us button
  const buttonScale = useSharedValue(1);
  const buttonPulse = useSharedValue(1);

  // Initialize pulse animation
  useEffect(() => {
    buttonPulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, []);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: buttonPulse.value }
    ],
  }));

  const handleDiscussionPress = (discussion: Discussion) => {
    setSelectedDiscussion(discussion);
    modalOpacity.value = withTiming(1, { duration: 300 });
    modalScale.value = withSpring(1, { damping: 12, mass: 1 });
  };

  const closeModal = () => {
    modalOpacity.value = withTiming(0, { duration: 200 });
    modalScale.value = withTiming(0.8, { duration: 200 });
    setTimeout(() => setSelectedDiscussion(null), 200);
  };

  const handleEmailPress = async () => {
    buttonScale.value = withSpring(0.95, { damping: 10, mass: 1 });
    setTimeout(() => {
      buttonScale.value = withSpring(1, { damping: 10, mass: 1 });
    }, 100);
    
    const mailtoUrl = `mailto:${CONTACT_INFO.email}?subject=${encodeURIComponent(
      CONTACT_INFO.emailSubject
    )}`;
    try {
      await Linking.openURL(mailtoUrl);
    } catch (error) {
      console.error("Failed to open email", error);
    }
  };

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

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
                Get answers about QuizzyEdu quizzes, multiplayer mode, badges, and your account.
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
                  onPress={() => handleDiscussionPress(discussion)}
                  style={({ pressed }) => [
                    styles.discussionItem,
                    { 
                      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                      borderColor: isDark ? "#374151" : "#F3F4F6",
                      opacity: pressed ? 0.9 : 1,
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

        {/* Clean & Minimal Contact Us Button */}
        <Animated.View 
          entering={FadeInDown.delay(600).duration(500)}
          style={styles.contactSection}
        >
          <Animated.View 
            style={[animatedButtonStyle, styles.cleanButtonContainer]}
          >
            <Pressable 
              onPress={handleEmailPress}
              style={({ pressed }) => [
                styles.cleanButton,
                { 
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Feather name="send" size={20} color="#FFFFFF" />
              <ThemedText style={styles.cleanButtonText}>Email Us</ThemedText>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {/* Answer Modal */}
      {selectedDiscussion && (
        <Pressable 
          style={styles.modalOverlay} 
          onPress={closeModal}
        >
          <Animated.View 
            style={[styles.modalContainer, animatedModalStyle]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={[styles.modalAvatar, { backgroundColor: selectedDiscussion.color }]}>
                  <ThemedText style={styles.modalAvatarText}>
                    {selectedDiscussion.avatar}
                  </ThemedText>
                </View>
                <Pressable 
                  onPress={closeModal}
                  style={styles.closeButton}
                >
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              </View>

              {/* Modal Body */}
              <ScrollView 
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                <ThemedText style={styles.modalTitle}>
                  {selectedDiscussion.title}
                </ThemedText>
                
                <View style={styles.modalMeta}>
                  <ThemedText style={styles.modalCategory}>
                    {selectedDiscussion.category}
                  </ThemedText>
                  <ThemedText style={styles.modalDate}>
                    {selectedDiscussion.date}
                  </ThemedText>
                </View>

                <View style={styles.answerDivider} />

                <ThemedText style={styles.answerLabel}>Answer</ThemedText>
                <ThemedText style={styles.answerText}>
                  {selectedDiscussion.answer}
                </ThemedText>
              </ScrollView>
            </View>
          </Animated.View>
        </Pressable>
      )}
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
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  articleTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    lineHeight: 22,
    color: "#111827",
  },
  articleDescription: {
    fontSize: 12,
    color: "#888888",
    lineHeight: 18,
  },
  discussionItem: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
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
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    color: "#1A1A1A",
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
  contactSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
  },
  cleanButtonContainer: {
    elevation: 6,
    shadowColor: "#00A8A8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  cleanButton: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: 16,
    backgroundColor: "#17A2A2",
  },
  cleanButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: SCREEN_WIDTH - 32,
    maxHeight: SCREEN_WIDTH * 1.4,
    borderRadius: 24,
    overflow: "hidden",
  },
  modalContent: {
    borderRadius: 24,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  modalAvatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 20,
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: SCREEN_WIDTH,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 26,
    marginBottom: 12,
  },
  modalMeta: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  modalCategory: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4F46E5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#F0E7FF",
    borderRadius: 6,
  },
  modalDate: {
    fontSize: 12,
    color: "#999999",
    paddingVertical: 4,
  },
  answerDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 16,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1A1A1A",
  },
  answerText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#666666",
    marginBottom: 20,
  },
});
