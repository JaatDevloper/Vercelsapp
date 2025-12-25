import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp, FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import HistoryCard from "@/components/HistoryCard";
import { useTheme } from "@/hooks/useTheme";
import { useQuizHistory } from "@/hooks/useQuizHistory";
import { useProfile } from "@/hooks/useProfile";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HistoryScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { history, clearHistory } = useQuizHistory();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!isProfileLoading && !profile) {
        setShowLoginPrompt(true);
      } else {
        setShowLoginPrompt(false);
      }
    }, [profile, isProfileLoading])
  );

  const handleRetakeQuiz = useCallback((quizId: string) => {
    navigation.navigate("QuizDetails", { quizId });
  }, [navigation]);

  const renderHeader = () => (
    <View style={styles.header}>
      <ThemedText type="h2">Quiz History</ThemedText>
      {history.length > 0 ? (
        <Pressable onPress={clearHistory} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <ThemedText type="small" style={{ color: theme.error }}>Clear All</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="clipboard" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText type="h4" style={styles.emptyTitle}>No quizzes taken yet</ThemedText>
      <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
        Start taking quizzes to see your history and track your progress
      </ThemedText>
      <Pressable
        style={({ pressed }) => [
          styles.ctaButton,
          { 
            backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={() => navigation.navigate("Main")}
      >
        <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
          Take a Quiz
        </ThemedText>
      </Pressable>
    </View>
  );

  const renderHistoryItem = useCallback(({ item }: { item: typeof history[0] }) => (
    <HistoryCard
      historyItem={item}
      onRetake={() => handleRetakeQuiz(item.quizId)}
    />
  ), [handleRetakeQuiz]);

  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl + 80,
          },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />

      {/* Login Required Modal */}
      <Modal
        visible={showLoginPrompt}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            entering={FadeInUp.springify()}
            style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}
          >
            <LinearGradient
              colors={isDark ? ["#1a1a2e", "#16213e"] : ["#2C3E50", "#3498db"]}
              style={styles.modalHeader}
            >
              <View style={styles.iconCircle}>
                <Feather name="lock" size={32} color="#FFFFFF" />
              </View>
            </LinearGradient>

            <View style={styles.modalBody}>
              <ThemedText type="h3" style={styles.modalTitle}>Login Required</ThemedText>
              <ThemedText type="body" style={styles.modalDesc}>
                If you want to track your quiz history and climb the leaderboard, please log in to your profile first.
              </ThemedText>

              <Pressable
                onPress={() => {
                  setShowLoginPrompt(false);
                  navigation.navigate("Profile");
                }}
                style={({ pressed }) => [
                  styles.loginButton,
                  { backgroundColor: primaryColor, opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <ThemedText style={styles.buttonText}>Login Now</ThemedText>
              </Pressable>

              <Pressable
                onPress={() => setShowLoginPrompt(false)}
                style={({ pressed }) => [
                  styles.laterButton,
                  { opacity: pressed ? 0.6 : 1 }
                ]}
              >
                <ThemedText style={[styles.laterText, { color: theme.textSecondary }]}>Maybe Later</ThemedText>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
    gap: Spacing.md,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    marginTop: Spacing.sm,
  },
  ctaButton: {
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    marginTop: Spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    maxWidth: 400,
  },
  modalHeader: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  modalBody: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  modalTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  modalDesc: {
    textAlign: "center",
    color: "#666",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  loginButton: {
    width: "100%",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  laterButton: {
    paddingVertical: Spacing.sm,
  },
  laterText: {
    fontWeight: "600",
  },
});
