import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ConfettiCelebration from "@/components/ConfettiCelebration";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { Participant } from "@/types/room";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

type MultiplayerResultsRouteProp = RouteProp<RootStackParamList, "MultiplayerResults">;

const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "http://localhost:5000";
};

const API_BASE = getApiBase();

export default function MultiplayerResultsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<MultiplayerResultsRouteProp>();

  const { roomCode, odId, playerName, score, correctAnswers, totalQuestions, answers } = route.params;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/rooms/${roomCode}`);
      if (response.ok) {
        const data = await response.json();
        // Extract and format participants from the server data
        const players = data.participants || [];
        const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
        setParticipants(sorted);

        const myIndex = sorted.findIndex(p => p.odId === odId);
        if (myIndex === 0 && sorted.length > 0) {
          setShowConfetti(true);
        }
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoHome = () => {
    navigation.popToTop();
  };

  const handlePlayAgain = () => {
    navigation.popToTop();
  };

  const handleReviewQuiz = () => {
    setShowReview(true);
  };

  const handleBackToResults = () => {
    setShowReview(false);
  };

  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;
  const successColor = isDark ? Colors.dark.success : Colors.light.success;
  const errorColor = isDark ? Colors.dark.error : Colors.light.error;
  const warningColor = isDark ? Colors.dark.warning : Colors.light.warning;
  const gradientColors = isDark 
    ? ["#1e3a5f", "#0d1b2a"] as const
    : ["#4facfe", "#00f2fe"] as const;

  const myRank = participants.length > 0 ? participants.findIndex(p => p.odId === odId) + 1 : 0;
  const isWinner = myRank === 1;

  const renderParticipant = ({ item, index }: { item: Participant; index: number }) => {
    const isMe = item.odId === odId;
    const rank = index + 1;
    
    let medalColor = theme.textSecondary;
    let medalIcon: "award" | "star" | "circle" = "circle";
    
    if (rank === 1) {
      medalColor = "#FFD700";
      medalIcon = "award";
    } else if (rank === 2) {
      medalColor = "#C0C0C0";
      medalIcon = "award";
    } else if (rank === 3) {
      medalColor = "#CD7F32";
      medalIcon = "award";
    }

    return (
      <Animated.View 
        entering={FadeIn.delay(index * 100)}
        style={[
          styles.participantCard, 
          { 
            backgroundColor: isMe ? `${primaryColor}15` : theme.backgroundDefault,
            borderColor: isMe ? primaryColor : "transparent",
            borderWidth: isMe ? 2 : 0,
          }
        ]}
      >
        <View style={styles.rankContainer}>
          <Feather name={medalIcon} size={24} color={medalColor} />
          <ThemedText type="h4" style={{ color: medalColor }}>
            #{rank}
          </ThemedText>
        </View>
        
        <View style={[styles.avatar, { backgroundColor: isMe ? primaryColor : theme.border }]}>
          <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
            {(item.name || "P").charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        
        <View style={styles.participantInfo}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {item.name || "Anonymous Player"} {isMe && "(You)"}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.correctAnswers || 0}/{item.totalQuestions || totalQuestions} correct
          </ThemedText>
        </View>
        
        <View style={styles.scoreContainer}>
          <ThemedText type="h3" style={{ color: primaryColor }}>
            {item.score || 0}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            pts
          </ThemedText>
        </View>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText type="body" style={{ marginTop: Spacing.lg }}>
          Loading results...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ConfettiCelebration visible={showConfetti} />
      
      <LinearGradient
        colors={gradientColors}
        style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.headerContent}>
          {isWinner ? (
            <>
              <Feather name="award" size={64} color="#FFD700" />
              <ThemedText type="h1" style={styles.headerTitle}>
                You Won!
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText type="h1" style={styles.headerTitle}>
                #{myRank} Place
              </ThemedText>
            </>
          )}
          <ThemedText type="body" style={styles.headerSubtitle}>
            {correctAnswers}/{totalQuestions} correct answers
          </ThemedText>
          <View style={styles.myScoreContainer}>
            <ThemedText type="h1" style={styles.myScore}>
              {score}
            </ThemedText>
            <ThemedText type="body" style={styles.headerSubtitle}>
              points
            </ThemedText>
          </View>
        </Animated.View>
      </LinearGradient>

      {showReview && answers && answers.length > 0 ? (
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.reviewHeader}>
            <Pressable onPress={handleBackToResults} style={styles.backButton}>
              <Feather name="arrow-left" size={20} color={theme.text} />
            </Pressable>
            <ThemedText type="h4">Review Answers</ThemedText>
            <View style={{ width: 20 }} />
          </Animated.View>

          <ScrollView 
            style={styles.reviewScrollView}
            contentContainerStyle={styles.reviewContent}
            showsVerticalScrollIndicator={false}
          >
            {answers.map((answer, index) => {
              const isSkipped = answer.selectedAnswer === -1;
              
              let statusColor = successColor;
              let statusIcon: "check-circle" | "x-circle" | "minus-circle" = "check-circle";
              let statusText = "Correct";
              
              if (isSkipped) {
                statusColor = warningColor;
                statusIcon = "minus-circle";
                statusText = "Skipped";
              } else if (!answer.isCorrect) {
                statusColor = errorColor;
                statusIcon = "x-circle";
                statusText = "Incorrect";
              }

              return (
                <Animated.View
                  key={answer.questionId}
                  entering={FadeInDown.delay(index * 50).duration(400)}
                  style={[styles.reviewCard, { backgroundColor: theme.backgroundDefault }]}
                >
                  <View style={styles.reviewCardHeader}>
                    <View style={[styles.questionNumberBadge, { backgroundColor: statusColor }]}>
                      <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "700" }}>
                        Q{index + 1}
                      </ThemedText>
                    </View>
                    <View style={styles.resultBadge}>
                      <Feather name={statusIcon} size={20} color={statusColor} />
                      <ThemedText type="small" style={{ color: statusColor, fontWeight: "600" }}>
                        {statusText}
                      </ThemedText>
                    </View>
                  </View>

                  <ThemedText type="body" style={styles.reviewQuestion}>
                    {answer.question}
                  </ThemedText>

                  <View style={styles.reviewOptions}>
                    {answer.options.map((option, optIndex) => {
                      const isCorrectOption = optIndex === answer.correctAnswer;
                      const isSelectedOption = optIndex === answer.selectedAnswer;
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
                        <View key={optIndex} style={[styles.reviewOption, optionStyle]}>
                          <View style={[
                            styles.reviewOptionLetter,
                            { backgroundColor: isCorrectOption ? successColor : isWrongSelection ? warningColor : theme.backgroundDefault }
                          ]}>
                            <ThemedText 
                              type="small" 
                              style={{ 
                                color: isCorrectOption || isWrongSelection ? "#FFFFFF" : theme.textSecondary,
                                fontWeight: "600" 
                              }}
                            >
                              {OPTION_LETTERS[optIndex]}
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
            })}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <Pressable
              onPress={handleBackToResults}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: primaryColor, opacity: pressed ? 0.8 : 1, flex: 1 },
              ]}
            >
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
              <ThemedText type="body" style={{ color: "#FFFFFF" }}>
                Back to Results
              </ThemedText>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.content}>
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
                Leaderboard
              </ThemedText>
            </Animated.View>

            <FlatList
              data={participants}
              keyExtractor={(item) => item.odId}
              renderItem={renderParticipant}
              contentContainerStyle={styles.participantsList}
              showsVerticalScrollIndicator={false}
            />
          </View>

          <Animated.View 
            entering={FadeInDown.delay(400).duration(400)}
            style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}
          >
            <View style={styles.buttonRow}>
              <Pressable
                onPress={handleGoHome}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { 
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Feather name="home" size={20} color={theme.text} />
                <ThemedText type="body">Home</ThemedText>
              </Pressable>

              {answers && answers.length > 0 && (
                <Pressable
                  onPress={handleReviewQuiz}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    { 
                      backgroundColor: theme.backgroundDefault,
                      borderColor: primaryColor,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Feather name="eye" size={20} color={primaryColor} />
                  <ThemedText type="body" style={{ color: primaryColor }}>Review</ThemedText>
                </Pressable>
              )}

              <Pressable
                onPress={handlePlayAgain}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: primaryColor, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Feather name="rotate-cw" size={20} color="#FFFFFF" />
                <ThemedText type="body" style={{ color: "#FFFFFF" }}>
                  Play Again
                </ThemedText>
              </Pressable>
            </View>
          </Animated.View>
        </>
      )}
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    marginTop: Spacing.md,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: Spacing.xs,
  },
  myScoreContainer: {
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  myScore: {
    color: "#FFFFFF",
    fontSize: 56,
    fontWeight: "800",
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
  participantsList: {
    gap: Spacing.md,
  },
  participantCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  rankContainer: {
    alignItems: "center",
    marginRight: Spacing.md,
    width: 40,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  participantInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  scoreContainer: {
    alignItems: "center",
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  backButton: {
    padding: Spacing.xs,
  },
  reviewScrollView: {
    flex: 1,
  },
  reviewContent: {
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  reviewCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  reviewCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  questionNumberBadge: {
    paddingHorizontal: Spacing.sm,
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
    lineHeight: 24,
  },
  reviewOptions: {
    gap: Spacing.sm,
  },
  reviewOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  reviewOptionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  reviewOptionText: {
    flex: 1,
  },
});
