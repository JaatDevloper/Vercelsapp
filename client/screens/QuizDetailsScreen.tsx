import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useProfile } from "@/hooks/useProfile";
import { useSilentAutoRefresh } from "@/hooks/useSilentAutoRefresh";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { Quiz } from "@/types/quiz";

type QuizDetailsRouteProp = RouteProp<RootStackParamList, "QuizDetails">;

const NEGATIVE_MARKING = 0.66;
const TIME_PER_QUESTION = 30;

export default function QuizDetailsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<QuizDetailsRouteProp>();

  const { deviceId } = useProfile();
  const { quizId } = route.params;

  const { data: quiz, isLoading } = useQuery<Quiz>({
    queryKey: ["/api/quizzes", quizId],
    enabled: !!quizId,
  });
  
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

  const totalQuestions = quiz?.questions?.length || 0;
  const estimatedTimeMinutes = Math.ceil((totalQuestions * TIME_PER_QUESTION) / 60);
  const negativeMarking = quiz?.negative_marking ?? NEGATIVE_MARKING;
  const isUserPremium = profile?.isPremium === true;

  const handleBack = () => {
    navigation.goBack();
  };

  const handleStartQuiz = () => {
    navigation.replace("Quiz", { quizId });
  };

  const handleInviteFriends = () => {
    navigation.navigate("CreateRoom", { quizId, quizTitle: quiz?.title || "Quiz" });
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText type="body" style={{ marginTop: Spacing.lg, color: theme.textSecondary }}>
          Loading quiz details...
        </ThemedText>
      </ThemedView>
    );
  }

  if (!quiz) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <Feather name="alert-circle" size={48} color={theme.error} />
        <ThemedText type="h4" style={{ marginTop: Spacing.lg }}>Quiz not found</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleBack}
        >
          <ThemedText type="body" style={{ color: "#FFFFFF" }}>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;
  const gradientColors = isDark 
    ? ["#1e3a5f", "#0d1b2a"] as const
    : ["#4facfe", "#00f2fe"] as const;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradientColors}
          style={[styles.headerGradient, { paddingTop: insets.top + Spacing.lg }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backIconButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>

          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <ThemedText type="h2" style={styles.quizTitle}>
              {quiz.title}
            </ThemedText>
            <ThemedText type="body" style={styles.earnPoints}>
              EARN {totalQuestions * 10} POINTS
            </ThemedText>
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.statsContainer}
          >
            <View style={styles.statBox}>
              <View style={styles.statIconContainer}>
                <Feather name="help-circle" size={24} color={primaryColor} />
              </View>
              <ThemedText type="h4" style={styles.statValue}>
                {totalQuestions} Questions
              </ThemedText>
              <ThemedText type="small" style={styles.statLabel}>
                {totalQuestions > 0 ? "2 marks for correct answer" : "No questions"}
              </ThemedText>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statIconContainer}>
                <Feather name="clock" size={24} color={primaryColor} />
              </View>
              <ThemedText type="h4" style={styles.statValue}>
                {estimatedTimeMinutes} Minutes
              </ThemedText>
              <ThemedText type="small" style={styles.statLabel}>
                Total duration of the quiz
              </ThemedText>
            </View>
          </Animated.View>
        </LinearGradient>

        <View style={styles.rulesContainer}>
          <Animated.View 
            entering={FadeInDown.delay(300).duration(400)}
            style={styles.ruleItem}
          >
            <View style={[styles.ruleBullet, { backgroundColor: primaryColor }]} />
            <ThemedText type="body" style={styles.ruleText}>
              1 mark awarded for a correct answer and {negativeMarking > 0 ? `-${negativeMarking}` : "no"} marks for an incorrect answer
            </ThemedText>
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(400).duration(400)}
            style={styles.ruleItem}
          >
            <View style={[styles.ruleBullet, { backgroundColor: primaryColor }]} />
            <ThemedText type="body" style={styles.ruleText}>
              Tap on options to select the correct answer
            </ThemedText>
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(500).duration(400)}
            style={styles.ruleItem}
          >
            <View style={[styles.ruleBullet, { backgroundColor: primaryColor }]} />
            <ThemedText type="body" style={styles.ruleText}>
              {TIME_PER_QUESTION} seconds timer for each question
            </ThemedText>
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(600).duration(400)}
            style={styles.ruleItem}
          >
            <View style={[styles.ruleBullet, { backgroundColor: primaryColor }]} />
            <ThemedText type="body" style={styles.ruleText}>
              Quiz auto-submits when time runs out
            </ThemedText>
          </Animated.View>
        </View>

        <Animated.View 
          entering={FadeInDown.delay(700).duration(400)}
          style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Feather name="layers" size={20} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Category</ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600" }}>{quiz.category || "General"}</ThemedText>
            </View>
            <View style={styles.infoItem}>
              <Feather name="minus-circle" size={20} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Negative Marking</ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600" }}>{negativeMarking > 0 ? `-${negativeMarking}` : "None"}</ThemedText>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Feather name="award" size={20} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Total Marks</ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600" }}>{totalQuestions}</ThemedText>
            </View>
            <View style={styles.infoItem}>
              <Feather name="clock" size={20} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Time per Question</ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600" }}>{TIME_PER_QUESTION} sec</ThemedText>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View 
        entering={FadeInDown.delay(800).duration(400)}
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}
      >
        <View style={styles.buttonRow}>
          <Pressable
            onPress={handleInviteFriends}
            style={({ pressed }) => [
              styles.inviteButton,
              { 
                backgroundColor: theme.backgroundDefault,
                borderColor: primaryColor,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="users" size={20} color={primaryColor} />
            <ThemedText type="body" style={{ color: primaryColor, fontWeight: "600" }}>
              Invite
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={handleStartQuiz}
            style={({ pressed }) => [
              styles.startButton,
              { 
                backgroundColor: primaryColor,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <ThemedText type="h4" style={styles.startButtonText}>
              Start Quiz
            </ThemedText>
          </Pressable>
        </View>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["3xl"],
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backIconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  quizTitle: {
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  earnPoints: {
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: Spacing.xl,
  },
  statsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "flex-start",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(79, 172, 254, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    color: "#1a1a1a",
    marginBottom: Spacing.xs,
  },
  statLabel: {
    color: "#666666",
  },
  rulesContainer: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  ruleBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  ruleText: {
    flex: 1,
    lineHeight: 22,
  },
  infoCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  startButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  backButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
});
