import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function QuizResultSummaryScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { score, totalQuestions, correctAnswers, incorrectAnswers, duration } = route.params;

  const accuracy = Math.round((correctAnswers / totalQuestions) * 100) || 0;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.congratsCard}>
          <View style={styles.medalContainer}>
             <Feather name="award" size={80} color="#FBBF24" />
          </View>
          
          <ThemedText type="h1" style={styles.title}>Congratulations!</ThemedText>
          <ThemedText style={styles.subtitle}>You are doing better than 70% students</ThemedText>
          
          <View style={styles.rankBadge}>
            <Feather name="star" size={20} color="white" />
            <ThemedText style={styles.rankText}>Topic Rank - #983</ThemedText>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: '#8B5CF6' }]}>
               <Feather name="target" size={24} color="white" />
               <ThemedText style={styles.statValue}>{accuracy} %</ThemedText>
               <ThemedText style={styles.statLabel}>Accuracy</ThemedText>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#10B981' }]}>
               <Feather name="send" size={24} color="white" />
               <ThemedText style={styles.statValue}>100</ThemedText>
               <ThemedText style={styles.statLabel}>Speed</ThemedText>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#EF4444' }]}>
               <Feather name="bar-chart-2" size={24} color="white" />
               <ThemedText style={styles.statValue}>{score}</ThemedText>
               <ThemedText style={styles.statLabel}>Total Score</ThemedText>
            </View>
          </View>

          <View style={styles.footerRow}>
            <ThemedText style={styles.footerText}>Questions: {totalQuestions}</ThemedText>
            <ThemedText style={styles.footerText}>Correct: {correctAnswers}</ThemedText>
            <ThemedText style={styles.footerText}>Incorrect: {incorrectAnswers}</ThemedText>
          </View>

          <ThemedText style={styles.copyright}>© 2025 Testline. All right reserved!</ThemedText>
        </View>

        <Pressable 
            onPress={() => navigation.navigate("Home")}
            style={styles.solutionButton}
        >
          <ThemedText style={styles.solutionText}>Detailed Solution</ThemedText>
        </Pressable>

        <View style={styles.socialRow}>
          <Pressable style={styles.whatsappButton}>
            <Feather name="message-circle" size={20} color="#10B981" />
            <ThemedText style={styles.whatsappText}>Whatsapp status लगाने के लिए click करें...!</ThemedText>
          </Pressable>
          <Pressable style={styles.shareButton}>
            <Feather name="share-2" size={24} color="white" />
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { padding: Spacing.lg },
  congratsCard: {
    backgroundColor: '#1E293B',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  medalContainer: { marginBottom: Spacing.md },
  title: { color: 'white', marginBottom: Spacing.xs },
  subtitle: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: Spacing.lg },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: Spacing.xl,
  },
  rankText: { color: 'white', marginLeft: 8, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  statBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  footerRow: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.xl },
  footerText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  copyright: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  solutionButton: {
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  solutionText: { color: '#10B981', fontWeight: 'bold', fontSize: 16 },
  socialRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  whatsappText: { color: '#10B981', fontSize: 12 },
  shareButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
