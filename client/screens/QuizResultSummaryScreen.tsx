import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, ScrollView, Linking, Share } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getDeviceId } from "@/lib/deviceId";

export default function QuizResultSummaryScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { quizId, score, totalQuestions, correctAnswers, incorrectAnswers, duration, answers } = route.params;

  const [rank, setRank] = useState<number | null>(null);
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100) || 0;

  useEffect(() => {
    const submitAndFetchRank = async () => {
      try {
        const deviceId = await getDeviceId();
        const response = await fetch("/api/livequiz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizId,
            score,
            correctAnswers,
            incorrectAnswers,
            deviceId,
            userName: "Student"
          })
        });
        if (response.ok) {
          const data = await response.json();
          setRank(data.rank);
        }
      } catch (e) {
        console.error("Error submitting result:", e);
      }
    };

    submitAndFetchRank();
  }, []);

  const handleShareWhatsApp = () => {
    const text = `I scored ${score} in the QuizzyEdu Live Test! Accuracy: ${accuracy}%. Join me on QuizzyEdu!`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}`);
  };

  const handleShareGeneric = async () => {
    try {
      await Share.share({
        message: `I scored ${score} in the QuizzyEdu Live Test! Accuracy: ${accuracy}%. Join me on QuizzyEdu!`,
      });
    } catch (e) {}
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.congratsCard, { backgroundColor: theme.backgroundSecondary, shadowColor: theme.text }]}>
          <View style={styles.medalContainer}>
             <Feather name="award" size={100} color="#FBBF24" />
          </View>
          
          <ThemedText type="h1" style={[styles.title, { color: theme.text }]}>Congratulations!</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>You are doing better than 70% students</ThemedText>
          
          <View style={[styles.rankBadge, { backgroundColor: theme.primary }]}>
            <Feather name="star" size={20} color="white" />
            <ThemedText style={styles.rankText}>Topic Rank - #{rank || "..."}</ThemedText>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: '#8B5CF6' }]}>
               <Feather name="target" size={28} color="white" />
               <ThemedText style={styles.statValue}>{accuracy}%</ThemedText>
               <ThemedText style={styles.statLabel}>Accuracy</ThemedText>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#10B981' }]}>
               <Feather name="zap" size={28} color="white" />
               <ThemedText style={styles.statValue}>100</ThemedText>
               <ThemedText style={styles.statLabel}>Speed</ThemedText>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#F43F5E' }]}>
               <Feather name="trending-up" size={28} color="white" />
               <ThemedText style={styles.statValue}>{score}</ThemedText>
               <ThemedText style={styles.statLabel}>Score</ThemedText>
            </View>
          </View>

          <View style={styles.dividerLine} />

          <View style={styles.footerRow}>
            <View style={styles.footerStat}>
                <ThemedText style={[styles.footerValue, { color: theme.text }]}>{totalQuestions}</ThemedText>
                <ThemedText style={[styles.footerLabel, { color: theme.textSecondary }]}>Questions</ThemedText>
            </View>
            <View style={styles.footerStat}>
                <ThemedText style={[styles.footerValue, { color: '#10B981' }]}>{correctAnswers}</ThemedText>
                <ThemedText style={[styles.footerLabel, { color: theme.textSecondary }]}>Correct</ThemedText>
            </View>
            <View style={styles.footerStat}>
                <ThemedText style={[styles.footerValue, { color: '#F43F5E' }]}>{incorrectAnswers}</ThemedText>
                <ThemedText style={[styles.footerLabel, { color: theme.textSecondary }]}>Incorrect</ThemedText>
            </View>
          </View>

          <ThemedText style={[styles.copyright, { color: theme.textSecondary }]}>© 2025 QuizzyEdu. All right reserved!</ThemedText>
        </View>

        <Pressable 
            onPress={() => navigation.navigate("Results", { 
              quizId, score, totalQuestions, correctCount: correctAnswers, 
              incorrectCount: incorrectAnswers, unansweredCount: totalQuestions - (correctAnswers + incorrectAnswers),
              negativeMarking: 0.66, finalScore: score, answers, timeTaken: 0 
            })}
            style={[styles.solutionButton, { backgroundColor: theme.primary }]}
        >
          <ThemedText style={styles.solutionText}>Detailed Solution</ThemedText>
        </Pressable>

        <View style={styles.socialRow}>
          <Pressable onPress={handleShareWhatsApp} style={[styles.whatsappButton, { backgroundColor: '#DCF8C6' }]}>
            <Feather name="message-circle" size={20} color="#075E54" />
            <ThemedText style={styles.whatsappText}>Whatsapp Status</ThemedText>
          </Pressable>
          <Pressable onPress={handleShareGeneric} style={[styles.shareButton, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="share-2" size={24} color={theme.text} />
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingTop: 60 },
  congratsCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  medalContainer: { marginBottom: Spacing.md },
  title: { fontSize: 28, fontWeight: '800', marginBottom: Spacing.xs },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: Spacing.xl },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    marginBottom: Spacing.xl,
  },
  rankText: { color: 'white', marginLeft: 8, fontWeight: '700', fontSize: 18 },
  statsGrid: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  statBox: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
  },
  statValue: { color: 'white', fontWeight: '800', fontSize: 22 },
  statLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
  dividerLine: { width: '100%', height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: Spacing.xl },
  footerRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginBottom: Spacing.xl },
  footerStat: { alignItems: 'center' },
  footerValue: { fontSize: 20, fontWeight: '800' },
  footerLabel: { fontSize: 12, marginTop: 4 },
  copyright: { fontSize: 12, opacity: 0.5 },
  solutionButton: {
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    elevation: 2,
  },
  solutionText: { color: 'white', fontWeight: '800', fontSize: 18 },
  socialRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 8,
  },
  whatsappText: { color: '#075E54', fontWeight: '700', fontSize: 14 },
  shareButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  }
});
