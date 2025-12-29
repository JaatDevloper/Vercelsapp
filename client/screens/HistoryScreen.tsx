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
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  FadeIn, 
  FadeOut,
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  useSharedValue,
  withSpring
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import HistoryCard from "@/components/HistoryCard";
import { useTheme } from "@/hooks/useTheme";
import { useQuizHistory } from "@/hooks/useQuizHistory";
import { useProfile } from "@/hooks/useProfile";
import { useSilentAutoRefresh } from "@/hooks/useSilentAutoRefresh";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function FloatingIcon({ name, size, color, delay = 0 }: { name: any, size: number, color: string, delay?: number }) {
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000 + delay }),
        withTiming(0, { duration: 2000 + delay })
      ),
      -10
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <MaterialCommunityIcons name={name} size={size} color={color} />
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { history, clearHistory } = useQuizHistory();
  const { profile, isLoading: isProfileLoading, deviceId } = useProfile();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  useSilentAutoRefresh(["quiz-history", deviceId], 10000);

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

      {/* Premium Minimalist Login Required Modal */}
      <Modal
        visible={showLoginPrompt}
        transparent={true}
        animationType="none"
      >
        <Animated.View 
          entering={FadeIn}
          exiting={FadeOut}
          style={styles.modalOverlay}
        >
          <Animated.View 
            entering={FadeInDown.springify().damping(15)}
            style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}
          >
            {/* Illustration Area */}
            <View style={styles.illustrationContainer}>
              <View style={styles.illustrationBackground}>
                <View style={[styles.circle, { backgroundColor: `${primaryColor}10`, width: 140, height: 140 }]} />
                <View style={[styles.circle, { backgroundColor: `${primaryColor}05`, width: 180, height: 180 }]} />
              </View>
              
              <View style={styles.iconGroup}>
                <View style={styles.mainIconContainer}>
                  <LinearGradient
                    colors={[primaryColor, `${primaryColor}CC`]}
                    style={styles.mainIconGradient}
                  >
                    <Feather name="user" size={40} color="#FFFFFF" />
                  </LinearGradient>
                  <Animated.View entering={FadeIn.delay(400)} style={styles.lockBadge}>
                    <Feather name="lock" size={14} color="#FFFFFF" />
                  </Animated.View>
                </View>
                
                {/* Floating Elements */}
                <View style={[styles.floatingIcon, { top: -20, right: -40 }]}>
                  <FloatingIcon name="history" size={24} color={`${primaryColor}80`} delay={200} />
                </View>
                <View style={[styles.floatingIcon, { bottom: 0, left: -50 }]}>
                  <FloatingIcon name="trophy-outline" size={28} color={`${primaryColor}60`} delay={500} />
                </View>
              </View>
            </View>

            <View style={styles.modalBody}>
              <ThemedText type="h3" style={styles.modalTitle}>Join the Community</ThemedText>
              <ThemedText type="body" style={[styles.modalDesc, { color: theme.textSecondary }]}>
                Create a profile to unlock personalized history tracking and compete on the global leaderboard.
              </ThemedText>

              <Pressable
                onPress={() => {
                  setShowLoginPrompt(false);
                  navigation.navigate("Profile");
                }}
                style={({ pressed }) => [
                  styles.loginButton,
                  { backgroundColor: primaryColor, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
                ]}
              >
                <ThemedText style={styles.buttonText}>Get Started</ThemedText>
              </Pressable>

              <Pressable
                onPress={() => setShowLoginPrompt(false)}
                style={({ pressed }) => [
                  styles.laterButton,
                  { opacity: pressed ? 0.6 : 1 }
                ]}
              >
                <ThemedText style={[styles.laterText, { color: theme.textSecondary }]}>Maybe later</ThemedText>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
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
    backgroundColor: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(10px)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    borderRadius: 32,
    overflow: "hidden",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  illustrationContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  illustrationBackground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    borderRadius: 100,
    position: "absolute",
  },
  iconGroup: {
    position: "relative",
  },
  mainIconContainer: {
    width: 80,
    height: 80,
    position: "relative",
  },
  mainIconGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "-10deg" }],
  },
  lockBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#10B981",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  floatingIcon: {
    position: "absolute",
  },
  modalBody: {
    padding: Spacing.xl,
    paddingTop: 0,
    alignItems: "center",
  },
  modalTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  modalDesc: {
    textAlign: "center",
    marginBottom: Spacing["2xl"],
    lineHeight: 22,
    paddingHorizontal: Spacing.sm,
  },
  loginButton: {
    width: "100%",
    paddingVertical: Spacing.lg,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 17,
  },
  laterButton: {
    paddingVertical: Spacing.sm,
  },
  laterText: {
    fontWeight: "600",
    fontSize: 15,
  },
});
