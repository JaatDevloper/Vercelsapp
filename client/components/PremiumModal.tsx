import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe?: (plan: "monthly" | "yearly") => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PremiumFeature {
  icon: string;
  title: string;
  description: string;
}

const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    icon: "book-open",
    title: "Access All Quizzes",
    description: "Unlimited access to all quizzes in the app",
  },
  {
    icon: "edit-3",
    title: "Create Unlimited Quizzes",
    description: "Create and share as many quizzes as you want",
  },
  {
    icon: "trending-up",
    title: "Advanced Leaderboard",
    description: "Track detailed performance metrics and rankings",
  },
  {
    icon: "users",
    title: "Create Unlimited Rooms",
    description: "Host multiplayer quiz rooms with no restrictions",
  },
  {
    icon: "star",
    title: "Premium Features",
    description: "Access all exclusive app features",
  },
  {
    icon: "zap",
    title: "No Advertisements",
    description: "Enjoy ad-free experience",
  },
];

interface PricingData {
  monthlyPrice: number;
  yearlyPrice: number;
  eventName: string;
  eventActive: boolean;
  currency: string;
}

export default function PremiumModal({
  visible,
  onClose,
  onSubscribe,
}: PremiumModalProps) {
  const { theme, isDark } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "yearly"
  );
  const [pricingData, setPricingData] = useState<PricingData>({
    monthlyPrice: 99,
    yearlyPrice: 699,
    eventName: "",
    eventActive: false,
    currency: "INR",
  });
  const [loading, setLoading] = useState(false);
  const monthlyScale = useSharedValue(1);
  const yearlyScale = useSharedValue(1.05);
  const eventScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      fetchPricing();
      // Animate event badge
      eventScale.value = withRepeat(
        withSequence(
          withSpring(1.1, { damping: 8 }),
          withSpring(1, { damping: 8 })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const handlePlanSelect = (plan: "monthly" | "yearly") => {
    setSelectedPlan(plan);
    if (plan === "monthly") {
      monthlyScale.value = withSpring(1.05, { damping: 10 });
      yearlyScale.value = withSpring(1, { damping: 10 });
    } else {
      yearlyScale.value = withSpring(1.05, { damping: 10 });
      monthlyScale.value = withSpring(1, { damping: 10 });
    }
  };

  const monthlyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: monthlyScale.value }],
  }));

  const yearlyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: yearlyScale.value }],
  }));

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/premium/pricing", {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPricingData({
          monthlyPrice: data.monthlyPrice,
          yearlyPrice: data.yearlyPrice,
          eventName: data.eventName,
          eventActive: !!data.eventName,
          currency: data.currency || "INR",
        });
      }
    } catch (error) {
      console.error("Error fetching pricing:", error);
    } finally {
      setLoading(false);
    }
  };

  const eventAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: eventScale.value }],
  }));

  const handleSubscribe = () => {
    if (onSubscribe) {
      onSubscribe(selectedPlan);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Feather name="x" size={28} color={theme.text} />
          </Pressable>
          <ThemedText type="h2">Go Premium</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Header Section */}
          <View style={styles.illustrationContainer}>
            <View style={styles.badgeWrapper}>
              <LinearGradient
                colors={["#FF6B9D", "#C44569"]}
                style={styles.illustrationBadge}
              >
                <Feather name="crown" size={40} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.badgeRing} />
            </View>
            <View style={styles.illustrationText}>
              <ThemedText type="h2" style={styles.premiumText}>PREMIUM</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary, letterSpacing: 2 }}>REQUIRED</ThemedText>
            </View>
          </View>

          <LinearGradient
            colors={["#FF6B9D", "#C44569", "#6B2E5F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerSection}
          >
            <ThemedText
              type="h2"
              style={[styles.headerTitle, { color: "#FFFFFF" }]}
            >
              Unlock Everything
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.headerSubtitle, { color: "rgba(255,255,255,0.9)" }]}
            >
              Create quizzes, host rooms, and access all content
            </ThemedText>
          </LinearGradient>

          {/* Pricing Plans */}
          <View style={styles.pricingSection}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Choose Your Plan
            </ThemedText>

            {loading ? (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <ActivityIndicator size="large" color="#FF6B9D" />
              </View>
            ) : (
              <View style={styles.pricingPlans}>
                <AnimatedPressable
                  onPress={() => handlePlanSelect("monthly")}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor:
                        selectedPlan === "monthly"
                          ? "#FF6B9D"
                          : theme.backgroundSecondary,
                      borderWidth: 2,
                    },
                    monthlyAnimatedStyle,
                  ]}
                >
                  <ThemedText type="h4" style={styles.planLabel}>
                    Basic Pass
                  </ThemedText>

                  <View style={styles.priceContainer}>
                    <ThemedText
                      type="h2"
                      style={[
                        styles.price,
                        {
                          color:
                            selectedPlan === "monthly"
                              ? "#FF6B9D"
                              : theme.text,
                        },
                      ]}
                    >
                      {pricingData.currency === "INR" ? "₹" : "$"}{pricingData.monthlyPrice}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={[
                        styles.period,
                        { color: theme.textSecondary },
                      ]}
                    >
                      /month Only
                    </ThemedText>
                  </View>

                  <View
                    style={[
                      styles.checkmark,
                      {
                        backgroundColor:
                          selectedPlan === "monthly"
                            ? "#FF6B9D"
                            : "transparent",
                        borderColor:
                          selectedPlan === "monthly"
                            ? "#FF6B9D"
                            : theme.border,
                      },
                    ]}
                  >
                    {selectedPlan === "monthly" && (
                      <Feather name="check" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </AnimatedPressable>

                <AnimatedPressable
                  onPress={() => handlePlanSelect("yearly")}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor:
                        selectedPlan === "yearly"
                          ? "#FF6B9D"
                          : theme.backgroundSecondary,
                      borderWidth: 2,
                    },
                    yearlyAnimatedStyle,
                  ]}
                >
                  <LinearGradient
                    colors={["#FF6B9D", "#C44569"]}
                    style={styles.popularBadge}
                  >
                    <ThemedText style={styles.popularText}>
                      BEST VALUE
                    </ThemedText>
                  </LinearGradient>

                  <ThemedText type="h4" style={styles.planLabel}>
                    Pro Pass
                  </ThemedText>

                  <View style={styles.priceContainer}>
                    <ThemedText
                      type="h2"
                      style={[
                        styles.price,
                        {
                          color:
                            selectedPlan === "yearly"
                              ? "#FF6B9D"
                              : theme.text,
                        },
                      ]}
                    >
                      {pricingData.currency === "INR" ? "₹" : "$"}{pricingData.yearlyPrice}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={[
                        styles.period,
                        { color: theme.textSecondary },
                      ]}
                    >
                      /year Only
                    </ThemedText>
                  </View>

                  <ThemedText style={styles.savings}>
                    Best Value - Save More
                  </ThemedText>

                  <View
                    style={[
                      styles.checkmark,
                      {
                        backgroundColor:
                          selectedPlan === "yearly"
                            ? "#FF6B9D"
                            : "transparent",
                        borderColor:
                          selectedPlan === "yearly"
                            ? "#FF6B9D"
                            : theme.border,
                      },
                    ]}
                  >
                    {selectedPlan === "yearly" && (
                      <Feather name="check" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </AnimatedPressable>
              </View>
            )}

            {pricingData.eventActive && pricingData.eventName && (
              <Animated.View style={[styles.eventBadge, eventAnimatedStyle]}>
                <Feather name="gift" size={20} color="#FF6B9D" />
                <ThemedText type="body" style={{ color: "#FF6B9D", marginLeft: 8, fontWeight: "600" }}>
                  {pricingData.eventName}
                </ThemedText>
              </Animated.View>
            )}
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Premium Features
            </ThemedText>

            <View style={styles.featuresList}>
              {PREMIUM_FEATURES.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View
                    style={[
                      styles.featureIcon,
                      { backgroundColor: "rgba(255, 107, 157, 0.1)" },
                    ]}
                  >
                    <Feather name={feature.icon as any} size={20} color="#FF6B9D" />
                  </View>
                  <View style={styles.featureContent}>
                    <ThemedText type="body" style={styles.featureTitle}>
                      {feature.title}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={[
                        styles.featureDescription,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {feature.description}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Subscribe Button */}
          <Pressable
            onPress={handleSubscribe}
            style={({ pressed }) => [
              styles.subscribeButton,
              {
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <LinearGradient
              colors={["#FF6B9D", "#C44569"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeGradient}
            >
              <Feather name="lock-open" size={20} color="#FFFFFF" />
              <ThemedText
                type="body"
                style={{ color: "#FFFFFF", fontWeight: "600" }}
              >
                Subscribe Now
              </ThemedText>
            </LinearGradient>
          </Pressable>

          {/* Footer Text */}
          <ThemedText
            type="small"
            style={[
              styles.footerText,
              { color: theme.textSecondary, textAlign: "center" },
            ]}
          >
            7-day free trial included. Cancel anytime.
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerSection: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  illustrationContainer: {
    alignItems: "center",
    marginVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  badgeWrapper: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  illustrationBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    elevation: 5,
    shadowColor: "#FF6B9D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  badgeRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#FF6B9D",
    opacity: 0.2,
  },
  illustrationText: {
    alignItems: "center",
  },
  premiumText: {
    fontWeight: "900",
    letterSpacing: 1,
  },
  headerTitle: {
    color: "#FFFFFF",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.9)",
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
    fontWeight: "700",
  },
  pricingSection: {
    marginVertical: Spacing.lg,
  },
  pricingPlans: {
    gap: Spacing.md,
  },
  planCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    position: "relative",
    alignItems: "center",
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  popularText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  planLabel: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.xs,
    marginVertical: Spacing.md,
  },
  price: {
    fontWeight: "700",
  },
  period: {
    marginBottom: 4,
  },
  savings: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  featuresSection: {
    marginVertical: Spacing.lg,
  },
  featuresList: {
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  featureContent: {
    flex: 1,
    justifyContent: "center",
  },
  featureTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    lineHeight: 18,
  },
  subscribeButton: {
    marginVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  subscribeGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  footerText: {
    marginBottom: Spacing.lg,
  },
  eventBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 107, 157, 0.1)",
    marginTop: Spacing.lg,
    borderWidth: 2,
    borderColor: "#FF6B9D",
  },
});
