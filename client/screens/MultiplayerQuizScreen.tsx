import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ProgressBar from "@/components/ProgressBar";
import AnswerOption from "@/components/AnswerOption";
import { useTheme } from "@/hooks/useTheme";
import { useSilentAutoRefresh } from "@/hooks/useSilentAutoRefresh";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { Quiz, Question } from "@/types/quiz";
import type { WebSocketMessage } from "@/types/room";

type MultiplayerQuizRouteProp = RouteProp<RootStackParamList, "MultiplayerQuiz">;

const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "http://localhost:5000";
};

const getWsBase = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `wss://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "ws://localhost:5000";
};

const API_BASE = getApiBase();
const WS_BASE = getWsBase();

const TIME_PER_QUESTION = 30;

export default function MultiplayerQuizScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<MultiplayerQuizRouteProp>();

  const { roomCode, odId, quizId, playerName } = route.params;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; selectedAnswer: number; correctAnswer: number; isCorrect: boolean; question: string; options: string[] }[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Refs to store latest values for WebSocket callback (fixes closure issue)
  const scoreRef = useRef(0);
  const correctCountRef = useRef(0);
  const totalQuestionsRef = useRef(0);
  const hasSubmittedRef = useRef(false);
  const answersRef = useRef<typeof answers>([]);

  const { data: quiz, isLoading } = useQuery<Quiz>({
    queryKey: ["/api/quizzes", quizId],
    enabled: !!quizId,
  });
  
  useSilentAutoRefresh(["/api/quizzes", quizId], 10000, { enabled: !!quizId });

  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // Keep refs in sync with state (for WebSocket callback)
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    correctCountRef.current = correctCount;
  }, [correctCount]);

  useEffect(() => {
    totalQuestionsRef.current = totalQuestions;
  }, [totalQuestions]);

  useEffect(() => {
    hasSubmittedRef.current = hasSubmitted;
  }, [hasSubmitted]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentQuestion && !isAnswerLocked) {
      setTimeLeft(TIME_PER_QUESTION);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [currentQuestionIndex, isAnswerLocked]);

  const connectWebSocket = () => {
    const ws = new WebSocket(`${WS_BASE}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join_room", roomCode }));
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        if (message.type === "player_finished" && message.allFinished) {
          if (hasSubmittedRef.current) {
            navigation.replace("MultiplayerResults", { 
              roomCode, 
              odId,
              playerName,
              score: scoreRef.current,
              correctAnswers: correctCountRef.current,
              totalQuestions: totalQuestionsRef.current,
              answers: answersRef.current,
            });
          }
        }
      } catch (e) {
        console.error("WebSocket message error:", e);
      }
    };
  };

  const handleTimeUp = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsAnswerLocked(true);
    
    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion?._id || `q-${currentQuestionIndex}`,
        selectedAnswer: -1,
        correctAnswer: currentQuestion?.correctAnswer ?? 0,
        isCorrect: false,
        question: currentQuestion?.question || '',
        options: currentQuestion?.options || [],
      },
    ]);

    setTimeout(() => {
      moveToNextQuestion();
    }, 1500);
  }, [currentQuestionIndex, currentQuestion]);

  const handleSelectAnswer = (index: number) => {
    if (isAnswerLocked) return;

    setSelectedAnswer(index);
    setIsAnswerLocked(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const isCorrect = index === currentQuestion?.correctAnswer;

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setCorrectCount((prev) => prev + 1);
    }

    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion?._id || `q-${currentQuestionIndex}`,
        selectedAnswer: index,
        correctAnswer: currentQuestion?.correctAnswer ?? 0,
        isCorrect,
        question: currentQuestion?.question || '',
        options: currentQuestion?.options || [],
      },
    ]);

    setTimeout(() => {
      moveToNextQuestion();
    }, 1500);
  };

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerLocked(false);
    } else {
      submitResults();
    }
  };

  const submitResults = async () => {
    if (hasSubmitted) return;
    setHasSubmitted(true);

    try {
      const response = await fetch(`${API_BASE}/api/rooms/${roomCode}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          odId,
          score,
          correctAnswers: correctCount,
          totalQuestions,
        }),
      });

      const data = await response.json();

      if (data.allFinished) {
        navigation.replace("MultiplayerResults", {
          roomCode,
          odId,
          playerName,
          score,
          correctAnswers: correctCount,
          totalQuestions,
          answers,
        });
      } else {
        // Start polling for room completion status
        // This is needed because Vercel serverless functions can't broadcast WebSocket messages
        pollIntervalRef.current = setInterval(async () => {
          try {
            const roomResponse = await fetch(`${API_BASE}/api/rooms/${roomCode}`);
            if (roomResponse.ok) {
              const roomData = await roomResponse.json();
              const allFinished = roomData.participants?.every((p: any) => p.finished);
              
              if (allFinished || roomData.status === "completed") {
                if (pollIntervalRef.current) {
                  clearInterval(pollIntervalRef.current);
                }
                navigation.replace("MultiplayerResults", {
                  roomCode,
                  odId,
                  playerName,
                  score,
                  correctAnswers: correctCount,
                  totalQuestions,
                  answers,
                });
              }
            }
          } catch (error) {
            console.error("Polling error:", error);
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting results:", error);
    }
  };

  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText type="body" style={{ marginTop: Spacing.lg, color: theme.textSecondary }}>
          Loading quiz...
        </ThemedText>
      </ThemedView>
    );
  }

  if (hasSubmitted) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <Feather name="check-circle" size={64} color={primaryColor} />
        <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>
          Quiz Completed!
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
          Waiting for other players to finish...
        </ThemedText>
        <ActivityIndicator size="small" color={primaryColor} style={{ marginTop: Spacing.xl }} />
      </ThemedView>
    );
  }

  if (!currentQuestion) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText type="body">No questions available</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.progressInfo}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Question {currentQuestionIndex + 1}/{totalQuestions}
          </ThemedText>
          <View style={styles.timerContainer}>
            <Feather name="clock" size={16} color={timeLeft <= 5 ? theme.error : theme.textSecondary} />
            <ThemedText 
              type="body" 
              style={{ 
                color: timeLeft <= 5 ? theme.error : theme.textSecondary,
                fontWeight: "600",
                marginLeft: 4,
              }}
            >
              {timeLeft}s
            </ThemedText>
          </View>
        </View>
        <ProgressBar 
          progress={(currentQuestionIndex + 1) / totalQuestions} 
        />
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(400)} key={currentQuestionIndex}>
          <View style={[styles.questionCard, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.questionText}>
              {currentQuestion.question}
            </ThemedText>
          </View>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <AnswerOption
                key={index}
                label={option}
                index={index}
                isSelected={selectedAnswer === index}
                showResult={isAnswerLocked}
                isCorrect={isAnswerLocked && index === currentQuestion.correctAnswer}
                isWrongSelection={isAnswerLocked && selectedAnswer === index && index !== currentQuestion.correctAnswer}
                disabled={isAnswerLocked}
                onPress={() => handleSelectAnswer(index)}
              />
            ))}
          </View>
        </Animated.View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Pressable
          onPress={moveToNextQuestion}
          disabled={isAnswerLocked}
          style={({ pressed }) => [
            styles.skipButton,
            { 
              backgroundColor: theme.backgroundSecondary,
              opacity: isAnswerLocked ? 0.4 : pressed ? 0.8 : 1,
            },
          ]}
        >
          <ThemedText type="body" style={{ color: theme.textSecondary }}>Skip</ThemedText>
          <Feather name="skip-forward" size={20} color={theme.textSecondary} />
        </Pressable>

        <View style={styles.scoreContainer}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>Score</ThemedText>
          <ThemedText type="h4" style={{ color: primaryColor }}>{score}</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: Spacing.lg,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  questionCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  questionText: {
    lineHeight: 28,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  footer: {
    padding: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  scoreContainer: {
    alignItems: "center",
  },
});
