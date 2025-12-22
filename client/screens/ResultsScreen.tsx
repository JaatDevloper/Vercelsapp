import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  FadeInDown,
  FadeIn,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type ResultsScreenRouteProp = RouteProp<RootStackParamList, "Results">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_SIZE = SCREEN_WIDTH * 0.55;
const CHART_STROKE_WIDTH = 25;
const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface DonutChartProps {
  correctPercent: number;
  incorrectPercent: number;
  unansweredPercent: number;
  overallPercent: number;
  isDark: boolean;
}

function DonutChart({ 
  correctPercent, 
  incorrectPercent, 
  unansweredPercent,
  overallPercent,
  isDark 
}: DonutChartProps) {
  const progress = useSharedValue(0);
  const center = CHART_SIZE / 2;
  const radius = (CHART_SIZE - CHART_STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;

  const successColor = isDark ? Colors.dark.success : Colors.light.success;
  const errorColor = isDark ? Colors.dark.error : Colors.light.error;
  const warningColor = isDark ? Colors.dark.warning : Colors.light.warning;
  const bgColor = isDark ? "#2A2A2A" : "#E8E8E8";

  useEffect(() => {
    progress.value = withDelay(300, withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) }));
  }, []);

  const correctOffset = circumference * (1 - correctPercent / 100);
  const incorrectOffset = circumference * (1 - incorrectPercent / 100);
  const unansweredOffset = circumference * (1 - unansweredPercent / 100);

  const correctRotation = 0;
  const incorrectRotation = (correctPercent / 100) * 360;
  const unansweredRotation = ((correctPercent + incorrectPercent) / 100) * 360;

  const animatedCorrectStyle = useAnimatedStyle(() => ({
    strokeDashoffset: interpolate(progress.value, [0, 1], [circumference, correctOffset]),
  }));

  const animatedIncorrectStyle = useAnimatedStyle(() => ({
    strokeDashoffset: interpolate(progress.value, [0, 1], [circumference, incorrectOffset]),
  }));

  const animatedUnansweredStyle = useAnimatedStyle(() => ({
    strokeDashoffset: interpolate(progress.value, [0, 1], [circumference, unansweredOffset]),
  }));

  return (
    <View style={styles.chartContainer}>
      <Svg width={CHART_SIZE} height={CHART_SIZE}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={bgColor}
          strokeWidth={CHART_STROKE_WIDTH}
          fill="transparent"
        />
        {unansweredPercent > 0 && (
          <G rotation={unansweredRotation - 90} origin={`${center}, ${center}`}>
            <AnimatedCircle
              cx={center}
              cy={center}
              r={radius}
              stroke={warningColor}
              strokeWidth={CHART_STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={circumference}
              strokeLinecap="round"
              animatedProps={animatedUnansweredStyle}
            />
          </G>
        )}
        {incorrectPercent > 0 && (
          <G rotation={incorrectRotation - 90} origin={`${center}, ${center}`}>
            <AnimatedCircle
              cx={center}
              cy={center}
              r={radius}
              stroke={errorColor}
              strokeWidth={CHART_STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={circumference}
              strokeLinecap="round"
              animatedProps={animatedIncorrectStyle}
            />
          </G>
        )}
        <G rotation={correctRotation - 90} origin={`${center}, ${center}`}>
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={successColor}
            strokeWidth={CHART_STROKE_WIDTH}
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
            animatedProps={animatedCorrectStyle}
          />
        </G>
      </Svg>
      <View style={styles.chartCenter}>
        <ThemedText type="h1" style={styles.chartPercent}>{Math.round(overallPercent)}%</ThemedText>
        <ThemedText type="small" style={styles.chartLabel}>Overall</ThemedText>
      </View>
    </View>
  );
}

interface StatItemProps {
  color: string;
  label: string;
  percent: string;
  delay: number;
}

function StatItem({ color, label, percent, delay }: StatItemProps) {
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).duration(400)}
      style={styles.statItem}
    >
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <ThemedText type="small" style={styles.statLabel}>{label}</ThemedText>
      <ThemedText type="body" style={[styles.statPercent, { color }]}>{percent}%</ThemedText>
    </Animated.View>
  );
}

interface QuestionReviewCardProps {
  questionNumber: number;
  question: string;
  options: string[];
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  delay: number;
}

function QuestionReviewCard({
  questionNumber,
  question,
  options,
  selectedAnswer,
  correctAnswer,
  isCorrect,
  delay,
}: QuestionReviewCardProps) {
  const { theme, isDark } = useTheme();
  const successColor = isDark ? Colors.dark.success : Colors.light.success;
  const errorColor = isDark ? Colors.dark.error : Colors.light.error;
  const warningColor = isDark ? Colors.dark.warning : Colors.light.warning;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={[styles.reviewCard, { backgroundColor: theme.backgroundDefault }]}
    >
      <View style={styles.reviewCardHeader}>
        <View style={[
          styles.questionNumberBadge,
          { backgroundColor: isCorrect ? successColor : selectedAnswer === -1 ? warningColor : errorColor }
        ]}>
          <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "700" }}>
            Q{questionNumber}
          </ThemedText>
        </View>
        <View style={styles.resultBadge}>
          {selectedAnswer === -1 ? (
            <>
              <Feather name="minus-circle" size={20} color={warningColor} />
              <ThemedText type="small" style={{ color: warningColor, fontWeight: "600" }}>
                Skipped
              </ThemedText>
            </>
          ) : isCorrect ? (
            <>
              <Feather name="check-circle" size={20} color={successColor} />
              <ThemedText type="small" style={{ color: successColor, fontWeight: "600" }}>
                Correct
              </ThemedText>
            </>
          ) : (
            <>
              <Feather name="x-circle" size={20} color={errorColor} />
              <ThemedText type="small" style={{ color: errorColor, fontWeight: "600" }}>
                Incorrect
              </ThemedText>
            </>
          )}
        </View>
      </View>

      <ThemedText type="body" style={styles.reviewQuestion}>
        {question}
      </ThemedText>

      <View style={styles.reviewOptions}>
        {options.map((option, index) => {
          const isCorrectOption = index === correctAnswer;
          const isSelectedOption = index === selectedAnswer;
          const isWrongSelection = isSelectedOption && !isCorrectOption;

          let optionStyle = {};
          let textColor = theme.textSecondary;
          let iconComponent = null;

          if (isCorrectOption) {
            optionStyle = {
              backgroundColor: `${successColor}15`,
              borderColor: successColor,
            };
            textColor = successColor;
            iconComponent = <Feather name="check" size={16} color={successColor} />;
          } else if (isWrongSelection) {
            optionStyle = {
              backgroundColor: `${warningColor}15`,
              borderColor: warningColor,
            };
            textColor = warningColor;
            iconComponent = <Feather name="x" size={16} color={warningColor} />;
          } else {
            optionStyle = {
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.border,
            };
          }

          return (
            <View
              key={index}
              style={[styles.reviewOption, optionStyle]}
            >
              <View style={[
                styles.reviewOptionLetter,
                { 
                  backgroundColor: isCorrectOption ? successColor : isWrongSelection ? warningColor : theme.backgroundDefault,
                }
              ]}>
                <ThemedText 
                  type="small" 
                  style={{ 
                    color: isCorrectOption || isWrongSelection ? "#FFFFFF" : theme.textSecondary,
                    fontWeight: "600" 
                  }}
                >
                  {OPTION_LETTERS[index]}
                </ThemedText>
              </View>
              <ThemedText 
                type="small" 
                style={[styles.reviewOptionText, { color: isCorrectOption || isWrongSelection ? textColor : theme.text }]}
              >
                {option}
              </ThemedText>
              {iconComponent}
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

interface BottomStatCardProps {
  icon: string;
  value: string;
  label: string;
  delay: number;
}

function BottomStatCard({ icon, value, label, delay }: BottomStatCardProps) {
  const { theme, isDark } = useTheme();
  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;

  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).duration(400)}
      style={[styles.bottomStatCard, { backgroundColor: theme.backgroundDefault }]}
    >
      <View style={[styles.bottomStatIcon, { backgroundColor: `${primaryColor}15` }]}>
        <Feather name={icon as any} size={18} color={primaryColor} />
      </View>
      <ThemedText type="h4" style={styles.bottomStatValue}>{value}</ThemedText>
      <ThemedText type="small" style={[styles.bottomStatLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
    </Animated.View>
  );
}

export default function ResultsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ResultsScreenRouteProp>();
  const [showReview, setShowReview] = useState(false);
  const [activeTab, setActiveTab] = useState<"performance" | "review">("performance");

  const { 
    score, 
    totalQuestions, 
    answers, 
    timeTaken,
    correctCount,
    incorrectCount,
    unansweredCount,
    negativeMarking,
    finalScore,
  } = route.params;

  const correctPercent = useMemo(() => (correctCount / totalQuestions) * 100, [correctCount, totalQuestions]);
  const incorrectPercent = useMemo(() => (incorrectCount / totalQuestions) * 100, [incorrectCount, totalQuestions]);
  const unansweredPercent = useMemo(() => (unansweredCount / totalQuestions) * 100, [unansweredCount, totalQuestions]);
  const attemptedCount = correctCount + incorrectCount;
  
  const avgSpeed = useMemo(() => {
    if (timeTaken === 0) return "0";
    const questionsPerHour = (attemptedCount / timeTaken) * 3600;
    return questionsPerHour >= 150 ? "150+" : Math.round(questionsPerHour).toString();
  }, [attemptedCount, timeTaken]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getScoreMessage = () => {
    if (score >= 90) return { title: "Outstanding!", subtitle: "You're a quiz master!", emoji: "🏆" };
    if (score >= 70) return { title: "Great Job!", subtitle: "Keep up the excellent work!", emoji: "🌟" };
    if (score >= 50) return { title: "Good Effort!", subtitle: "Room for improvement!", emoji: "💪" };
    return { title: "Keep Practicing!", subtitle: "You'll do better next time!", emoji: "📚" };
  };

  const message = getScoreMessage();
  const successColor = isDark ? Colors.dark.success : Colors.light.success;
  const errorColor = isDark ? Colors.dark.error : Colors.light.error;
  const warningColor = isDark ? Colors.dark.warning : Colors.light.warning;
  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;

  const handleRetake = () => {
    navigation.replace("Quiz", { quizId: route.params.quizId });
  };

  const handleDone = () => {
    navigation.navigate("Main");
  };

  const positiveMarks = correctCount * 2;
  const negativeMarks = (incorrectCount * negativeMarking).toFixed(2);

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={isDark ? ["#1a1a2e", "#16213e"] : ["#FF6B6B", "#FF8E53"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContent}>
          <Pressable
            onPress={handleDone}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <ThemedText type="h3" style={styles.headerTitle}>Analysis Report</ThemedText>
          <Pressable
            onPress={handleRetake}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="refresh-cw" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={styles.headerSubtitle}>
          <Feather name="bar-chart-2" size={16} color="rgba(255,255,255,0.8)" />
          <ThemedText type="small" style={styles.headerSubtitleText}>
            Track your learning performance and progress
          </ThemedText>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <Pressable
          onPress={() => setActiveTab("performance")}
          style={[
            styles.tab,
            activeTab === "performance" && { borderBottomColor: primaryColor, borderBottomWidth: 3 },
          ]}
        >
          <ThemedText 
            type="body" 
            style={[
              styles.tabText, 
              { color: activeTab === "performance" ? primaryColor : theme.textSecondary }
            ]}
          >
            Performance
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("review")}
          style={[
            styles.tab,
            activeTab === "review" && { borderBottomColor: primaryColor, borderBottomWidth: 3 },
          ]}
        >
          <ThemedText 
            type="body" 
            style={[
              styles.tabText, 
              { color: activeTab === "review" ? primaryColor : theme.textSecondary }
            ]}
          >
            Review
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "performance" ? (
          <>
            <Animated.View 
              entering={FadeIn.delay(200).duration(500)}
              style={[styles.messageCard, { backgroundColor: theme.backgroundDefault }]}
            >
              <ThemedText style={styles.messageEmoji}>{message.emoji}</ThemedText>
              <View>
                <ThemedText type="h4" style={{ marginBottom: 2 }}>{message.title}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>{message.subtitle}</ThemedText>
              </View>
            </Animated.View>

            <View style={[styles.chartSection, { backgroundColor: theme.backgroundDefault }]}>
              <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                OVERALL STATISTICS
              </ThemedText>
              <ThemedText type="h4" style={styles.sectionTitle}>Performance Overview</ThemedText>

              <View style={styles.chartWrapper}>
                <DonutChart
                  correctPercent={correctPercent}
                  incorrectPercent={incorrectPercent}
                  unansweredPercent={unansweredPercent}
                  overallPercent={score}
                  isDark={isDark}
                />
                <View style={styles.legendContainer}>
                  <StatItem color={successColor} label="Correct" percent={correctPercent.toFixed(0)} delay={400} />
                  <StatItem color={errorColor} label="Incorrect" percent={incorrectPercent.toFixed(0)} delay={500} />
                  {unansweredCount > 0 && (
                    <StatItem color={warningColor} label="Skipped" percent={unansweredPercent.toFixed(0)} delay={600} />
                  )}
                </View>
              </View>
            </View>

            <View style={[styles.scoreBreakdown, { backgroundColor: theme.backgroundDefault }]}>
              <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>Score Breakdown</ThemedText>
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLabel}>
                  <Feather name="plus-circle" size={18} color={successColor} />
                  <ThemedText type="body">Correct ({correctCount} × 2)</ThemedText>
                </View>
                <ThemedText type="body" style={{ color: successColor, fontWeight: "700" }}>+{positiveMarks}</ThemedText>
              </View>
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLabel}>
                  <Feather name="minus-circle" size={18} color={errorColor} />
                  <ThemedText type="body">Wrong ({incorrectCount} × -{negativeMarking})</ThemedText>
                </View>
                <ThemedText type="body" style={{ color: errorColor, fontWeight: "700" }}>-{negativeMarks}</ThemedText>
              </View>
              {unansweredCount > 0 && (
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownLabel}>
                    <Feather name="circle" size={18} color={warningColor} />
                    <ThemedText type="body">Skipped ({unansweredCount})</ThemedText>
                  </View>
                  <ThemedText type="body" style={{ color: warningColor, fontWeight: "700" }}>0</ThemedText>
                </View>
              )}
              <View style={[styles.totalScoreRow, { borderTopColor: theme.border }]}>
                <ThemedText type="h4">Final Score</ThemedText>
                <ThemedText type="h3" style={{ color: primaryColor }}>{finalScore.toFixed(2)}/{totalQuestions * 2}</ThemedText>
              </View>
            </View>

            <View style={styles.bottomStats}>
              <BottomStatCard 
                icon="check-circle" 
                value={`${correctCount}/${totalQuestions}`} 
                label="Correct" 
                delay={700} 
              />
              <BottomStatCard 
                icon="edit-3" 
                value={`${attemptedCount}/${totalQuestions}`} 
                label="Attempted" 
                delay={800} 
              />
              <BottomStatCard 
                icon="clock" 
                value={formatTime(timeTaken)} 
                label="Time Taken" 
                delay={900} 
              />
            </View>

            <View style={styles.actionButtons}>
              <Pressable
                onPress={handleRetake}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { borderColor: primaryColor, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Feather name="refresh-cw" size={18} color={primaryColor} />
                <ThemedText type="body" style={{ color: primaryColor, fontWeight: "600" }}>Retake Quiz</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleDone}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <LinearGradient
                  colors={isDark ? [primaryColor, "#5B8DEE"] : ["#FF6B6B", "#FF8E53"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Feather name="compass" size={18} color="#FFFFFF" />
                  <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>Explore More</ThemedText>
                </LinearGradient>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.reviewSection}>
            <View style={styles.reviewSummary}>
              <View style={[styles.reviewSummaryItem, { backgroundColor: `${successColor}15` }]}>
                <Feather name="check-circle" size={16} color={successColor} />
                <ThemedText type="small" style={{ color: successColor, fontWeight: "600" }}>{correctCount} Correct</ThemedText>
              </View>
              <View style={[styles.reviewSummaryItem, { backgroundColor: `${errorColor}15` }]}>
                <Feather name="x-circle" size={16} color={errorColor} />
                <ThemedText type="small" style={{ color: errorColor, fontWeight: "600" }}>{incorrectCount} Wrong</ThemedText>
              </View>
              {unansweredCount > 0 && (
                <View style={[styles.reviewSummaryItem, { backgroundColor: `${warningColor}15` }]}>
                  <Feather name="minus-circle" size={16} color={warningColor} />
                  <ThemedText type="small" style={{ color: warningColor, fontWeight: "600" }}>{unansweredCount} Skipped</ThemedText>
                </View>
              )}
            </View>

            {answers.map((answer, index) => (
              <QuestionReviewCard
                key={answer.questionId}
                questionNumber={index + 1}
                question={answer.question || `Question ${index + 1}`}
                options={answer.options || []}
                selectedAnswer={answer.selectedAnswer}
                correctAnswer={answer.correctAnswer ?? 0}
                isCorrect={answer.isCorrect}
                delay={index * 100}
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
  headerGradient: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  headerSubtitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerSubtitleText: {
    color: "rgba(255,255,255,0.8)",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    backgroundColor: "transparent",
    marginTop: -Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  messageCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  messageEmoji: {
    fontSize: 36,
  },
  chartSection: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 11,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  chartWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chartContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  chartCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  chartPercent: {
    fontSize: 32,
    fontWeight: "800",
  },
  chartLabel: {
    marginTop: -4,
    opacity: 0.7,
  },
  legendContainer: {
    flex: 1,
    marginLeft: Spacing.lg,
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statLabel: {
    flex: 1,
  },
  statPercent: {
    fontWeight: "700",
  },
  scoreBreakdown: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  breakdownLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  totalScoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.lg,
    marginTop: Spacing.md,
    borderTopWidth: 1,
  },
  bottomStats: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  bottomStatCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  bottomStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  bottomStatValue: {
    fontWeight: "700",
  },
  bottomStatLabel: {
    fontSize: 11,
  },
  actionButtons: {
    gap: Spacing.md,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  primaryButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  reviewSection: {
    flex: 1,
  },
  reviewSummary: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    flexWrap: "wrap",
  },
  reviewSummaryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  reviewCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  reviewCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  questionNumberBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  reviewQuestion: {
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  reviewOptions: {
    gap: Spacing.sm,
  },
  reviewOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  reviewOptionLetter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  reviewOptionText: {
    flex: 1,
  },
});
