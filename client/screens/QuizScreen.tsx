import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  SlideInRight,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import AnswerOption from "@/components/AnswerOption";
import ProgressBar from "@/components/ProgressBar";
import ConfettiCelebration from "@/components/ConfettiCelebration";
import { useTheme } from "@/hooks/useTheme";
import { useQuizHistory } from "@/hooks/useQuizHistory";
import { useProfile } from "@/hooks/useProfile";
import { useSilentAutoRefresh } from "@/hooks/useSilentAutoRefresh";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { Quiz } from "@/types/quiz";

type QuizScreenRouteProp = RouteProp<RootStackParamList, "Quiz">;

const TIME_PER_QUESTION = 30;
const NEGATIVE_MARKING = 0.66;

export default function QuizScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<QuizScreenRouteProp>();
  const { addHistory } = useQuizHistory();
  const { profile } = useProfile();
  
  const { quizId } = route.params;
  const isRandom = quizId === "random";

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [startTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [showConfetti, setShowConfetti] = useState(false);
  const questionKey = useRef(0);
  const [randomQuizId, setRandomQuizId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: quizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
    enabled: isRandom,
  });
  
  useSilentAutoRefresh(["/api/quizzes"], 10000, { enabled: isRandom });

  React.useEffect(() => {
    if (isRandom && quizzes && quizzes.length > 0 && !randomQuizId) {
      const randomIndex = Math.floor(Math.random() * quizzes.length);
      setRandomQuizId(quizzes[randomIndex]._id);
    }
  }, [isRandom, quizzes, randomQuizId]);

  const actualQuizId = isRandom ? randomQuizId : quizId;

  const { data: quiz, isLoading: loadingQuiz } = useQuery<Quiz>({
    queryKey: ["/api/quizzes", actualQuizId],
    enabled: !!actualQuizId,
  });
  
  useSilentAutoRefresh(["/api/quizzes", actualQuizId], 10000, { enabled: !!actualQuizId });

  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (currentQuestionIndex + 1) / totalQuestions : 0;
  const negativeMarking = quiz?.negative_marking ?? NEGATIVE_MARKING;

  const hasAnsweredCurrentQuestion = selectedAnswers[currentQuestionIndex] !== undefined;

  useEffect(() => {
    setTimeLeft(TIME_PER_QUESTION);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (timeLeft === 0 && totalQuestions > 0) {
      if (currentQuestionIndex < totalQuestions - 1) {
        handleNext();
      } else {
        handleSubmit();
      }
    }
  }, [timeLeft, totalQuestions, currentQuestionIndex]);

  const handleSelectAnswer = useCallback((answerIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answerIndex,
    }));
    
    const isCorrect = answerIndex === currentQuestion?.correctAnswer;
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [currentQuestionIndex, currentQuestion]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      questionKey.current += 1;
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [currentQuestionIndex, totalQuestions]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      questionKey.current += 1;
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleSubmit = useCallback(() => {
    if (!quiz) return;

    if (timerRef.current) clearInterval(timerRef.current);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const answersArray = questions.map((q, index) => {
      const selected = selectedAnswers[index] ?? -1;
      const isCorrect = selected === q.correctAnswer;
      return {
        questionId: q._id || `q-${index}`,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        question: q.question,
        options: q.options,
      };
    });

    const correctCount = answersArray.filter((a) => a.isCorrect).length;
    const incorrectCount = answersArray.filter((a) => a.selectedAnswer !== -1 && !a.isCorrect).length;
    const unansweredCount = answersArray.filter((a) => a.selectedAnswer === -1).length;
    
    const positiveMarks = correctCount * 2;
    const negativeMarks = incorrectCount * negativeMarking;
    const finalScore = Math.max(0, positiveMarks - negativeMarks);
    const score = Math.round((correctCount / totalQuestions) * 100);

    addHistory({
      quizId: quiz._id,
      quizTitle: quiz.title,
      score,
      totalQuestions,
      correctAnswers: correctCount,
      completedAt: new Date().toISOString(),
      ...(profile?.name ? { userName: profile.name } : {}),
      ...(profile?.email ? { userEmail: profile.email } : {}),
    });

    navigation.replace("Results", {
      quizId: quiz._id,
      score,
      totalQuestions,
      correctCount,
      incorrectCount,
      unansweredCount,
      negativeMarking,
      finalScore,
      answers: answersArray,
      timeTaken,
    });
  }, [quiz, questions, selectedAnswers, totalQuestions, startTime, navigation, addHistory, negativeMarking, profile]);

  const handleClose = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    navigation.goBack();
  }, [navigation]);

  const getTimerColor = () => {
    if (timeLeft <= 5) return isDark ? Colors.dark.error : Colors.light.error;
    if (timeLeft <= 10) return isDark ? Colors.dark.warning : Colors.light.warning;
    return isDark ? Colors.dark.primary : Colors.light.primary;
  };

  if (loadingQuiz || (isRandom && !randomQuizId)) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText type="body" style={{ marginTop: Spacing.lg, color: theme.textSecondary }}>
          Loading quiz...
        </ThemedText>
      </ThemedView>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <Feather name="alert-circle" size={48} color={theme.error} />
        <ThemedText type="h4" style={{ marginTop: Spacing.lg }}>Quiz not found</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.closeButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleClose}
        >
          <ThemedText type="body" style={{ color: "#FFFFFF" }}>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const hasSelectedAnswer = selectedAnswers[currentQuestionIndex] !== undefined;
  const answeredCount = Object.keys(selectedAnswers).length;
  const allQuestionsAnswered = answeredCount === totalQuestions;

  return (
    <ThemedView style={styles.container}>
      <ConfettiCelebration 
        visible={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => [
            styles.headerButton,
            { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="x" size={20} color={theme.text} />
        </Pressable>

        <View style={styles.progressContainer}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {currentQuestionIndex + 1} of {totalQuestions}
          </ThemedText>
          <ProgressBar progress={progress} />
        </View>

        <View style={[styles.timerContainer, { backgroundColor: `${getTimerColor()}15` }]}>
          <Feather name="clock" size={16} color={getTimerColor()} />
          <ThemedText type="body" style={[styles.timerText, { color: getTimerColor() }]}>
            {timeLeft}s
          </ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        <ThemedText type="small" style={[styles.categoryBadge, { color: theme.primary }]}>
          {quiz.category || "General"}
        </ThemedText>

        <Animated.View
          key={questionKey.current}
          entering={SlideInRight.duration(300)}
          style={styles.questionContainer}
        >
          <ThemedText type="h3" style={styles.questionText}>
            {currentQuestion?.question}
          </ThemedText>

          <View style={styles.answersContainer}>
            {currentQuestion?.options?.map((option, index) => (
              <AnswerOption
                key={index}
                label={option}
                index={index}
                isSelected={selectedAnswers[currentQuestionIndex] === index}
                onPress={() => handleSelectAnswer(index)}
                showResult={hasAnsweredCurrentQuestion}
                isCorrect={hasAnsweredCurrentQuestion && index === currentQuestion.correctAnswer}
                isWrongSelection={hasAnsweredCurrentQuestion && selectedAnswers[currentQuestionIndex] === index && index !== currentQuestion.correctAnswer}
              />
            ))}
          </View>
        </Animated.View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Pressable
          onPress={handlePrevious}
          disabled={isFirstQuestion}
          style={({ pressed }) => [
            styles.navButton,
            { 
              backgroundColor: theme.backgroundDefault,
              opacity: isFirstQuestion ? 0.4 : pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="chevron-left" size={20} color={theme.text} />
          <ThemedText type="body">Previous</ThemedText>
        </Pressable>

        <Pressable
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.submitButton,
            { 
              backgroundColor: isDark ? Colors.dark.success : Colors.light.success,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
            Submit ({answeredCount}/{totalQuestions})
          </ThemedText>
        </Pressable>

        {!isLastQuestion && (
          <Pressable
            onPress={handleNext}
            disabled={!hasSelectedAnswer}
            style={({ pressed }) => [
              styles.navButton,
              { 
                backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
                opacity: !hasSelectedAnswer ? 0.5 : pressed ? 0.8 : 1,
              },
            ]}
          >
            <ThemedText type="body" style={{ color: "#FFFFFF" }}>Next</ThemedText>
            <Feather name="chevron-right" size={20} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  timerText: {
    fontWeight: "700",
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  categoryBadge: {
    fontWeight: "600",
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  questionContainer: {
    flex: 1,
  },
  questionText: {
    marginBottom: Spacing.xl,
  },
  answersContainer: {
    gap: Spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  submitButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  closeButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
});
