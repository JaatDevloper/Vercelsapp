import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Alert,
  Image,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useQuizHistory } from "@/hooks/useQuizHistory";
import { useProfile } from "@/hooks/useProfile";
import { useOwnerProfile } from "@/hooks/useOwnerProfile";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import VerificationBadgesModal, { 
  VerificationBadgeIcon, 
  VERIFICATION_BADGES,
  type VerificationBadge 
} from "@/components/VerificationBadgesModal";
import LogoutConfirmationModal from "@/components/LogoutConfirmationModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface QuickActionProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress?: () => void;
  theme: any;
}

function QuickAction({ icon, label, onPress, theme }: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: `${theme.primary}15` }]}>
        <Feather name={icon} size={20} color={theme.primary} />
      </View>
      <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

interface MenuItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress?: () => void;
  theme: any;
  showBorder?: boolean;
}

function MenuItem({ icon, label, onPress, theme, showBorder = true }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        showBorder && { borderBottomWidth: 1, borderBottomColor: theme.border },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.menuItemLeft}>
        <Feather name={icon} size={20} color={theme.textSecondary} />
        <ThemedText type="body" style={{ marginLeft: Spacing.md }}>{label}</ThemedText>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { getStats } = useQuizHistory();
  const { profile, isLoading, profileNotFound, refetch, updatePhoto, isUpdatingPhoto, logout, updateBadge, updateFrame } = useProfile();
  const { ownerProfile } = useOwnerProfile();

  const stats = getStats();
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [badgesModalVisible, setBadgesModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleOpenNotifications = () => {
    setNotificationsModalVisible(true);
    fetchNotifications();
  };
  
  // Initialize from profile if available
  const [selectedBadge, setSelectedBadge] = useState<VerificationBadge>(
    profile?.selectedBadgeId 
      ? VERIFICATION_BADGES.find(b => b.id === profile.selectedBadgeId) || VERIFICATION_BADGES[0]
      : VERIFICATION_BADGES[0]
  );

  // Sync state when profile loads
  React.useEffect(() => {
    if (profile?.selectedBadgeId) {
      const badge = VERIFICATION_BADGES.find(b => b.id === profile.selectedBadgeId);
      if (badge) setSelectedBadge(badge);
    }
  }, [profile?.selectedBadgeId]);

  const handleAbout = () => {
    setAboutModalVisible(true);
  };

  const handleBadgesQuickAction = () => {
    navigation.navigate("Badges");
  };

  const handleSelectBadge = (badge: VerificationBadge) => {
    setSelectedBadge(badge);
    updateBadge(badge.id);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // Add a small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 500));
      setLogoutModalVisible(false);
      // Navigate to home screen after logout to completely prevent auto-login
      navigation.navigate("Discover");
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const aboutFeatures = [
    { icon: "compass" as const, title: "Discover Quizzes", desc: "Explore thousands of quizzes" },
    { icon: "users" as const, title: "Join Rooms", desc: "Play with friends in real-time" },
    { icon: "bar-chart-2" as const, title: "Track Progress", desc: "Monitor your quiz scores" },
    { icon: "award" as const, title: "Leaderboard", desc: "Compete and climb the ranks" },
    { icon: "moon" as const, title: "Dark Mode", desc: "Easy on your eyes" },
  ];

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to change your profile photo."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        updatePhoto(base64Image, {
          onError: (error: Error) => {
            Alert.alert("Upload Failed", error.message || "Failed to update profile photo. Please try again.");
          },
          onSuccess: () => {
            Alert.alert("Success", "Profile photo updated successfully!");
          },
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };
  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;
  const successColor = isDark ? Colors.dark.success : Colors.light.success;
  const errorColor = isDark ? Colors.dark.error : Colors.light.error;

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText type="body" style={{ marginTop: Spacing.lg, color: theme.textSecondary }}>
          Loading profile...
        </ThemedText>
      </ThemedView>
    );
  }

  if (profileNotFound || !profile) {
    return (
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={isDark ? ["#1a1a2e", "#16213e"] : ["#2C3E50", "#3498db"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.createProfileHeader, { paddingTop: insets.top + Spacing.xl }]}
        >
          <ThemedText type="h2" style={styles.headerWhiteText}>Profile</ThemedText>
        </LinearGradient>

        <View style={[styles.createProfileContent, { flex: 1 }]}>
          <Animated.View
            entering={FadeIn.delay(200).duration(400)}
            style={[styles.createProfileCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <View style={[styles.createAvatar, { backgroundColor: `${primaryColor}20` }]}>
              <Feather name="user-plus" size={50} color={primaryColor} />
            </View>
            <ThemedText type="h3" style={{ marginTop: Spacing.lg, textAlign: "center" }}>
              Create Your Profile
            </ThemedText>
            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}
            >
              Set up your profile to track your progress and personalize your experience
            </ThemedText>
            <Pressable
              onPress={() => navigation.navigate("CreateProfile")}
              style={({ pressed }) => [
                styles.createProfileButton,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <LinearGradient
                colors={isDark ? [primaryColor, "#5B8DEE"] : ["#2C3E50", "#3498db"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Feather name="plus" size={20} color="#FFFFFF" />
                <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "700" }}>
                  Create Profile
                </ThemedText>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate("LoginProfile")}
              style={({ pressed }) => [
                styles.loginProfileButton,
                { 
                  opacity: pressed ? 0.8 : 1,
                  borderColor: primaryColor,
                },
              ]}
            >
              <Feather name="log-in" size={20} color={primaryColor} />
              <ThemedText type="body" style={{ color: primaryColor, fontWeight: "700" }}>
                Login to Existing Profile
              </ThemedText>
            </Pressable>
          </Animated.View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarHeight + Spacing.xl + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={isDark ? ["#1a1a2e", "#16213e"] : ["#2C3E50", "#3498db"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top + Spacing.md }]}
        >
          <View style={styles.headerTop}>
            <ThemedText type="h3" style={styles.headerWhiteText}>Cards</ThemedText>
            <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Feather name="settings" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={[styles.profileCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <View style={styles.avatarContainer}>
              <Pressable onPress={pickImage} disabled={isUpdatingPhoto}>
                <View style={styles.avatar}>
                  {/* Avatar Border/Frame */}
                  <LinearGradient
                    colors={
                      profile?.selectedFrameId === "frame_gold" ? ["#FFD700", "#FFA500"] : 
                      profile?.selectedFrameId === "frame_silver" ? ["#C0C0C0", "#A8A8A8"] :
                      profile?.selectedFrameId === "frame_bronze" ? ["#CD7F32", "#B8860B"] :
                      profile?.selectedFrameId === "frame_diamond" ? ["#B9F2FF", "#00CED1"] :
                      profile?.selectedFrameId === "frame_legendary" ? ["#8B5CF6", "#EC4899"] :
                      profile?.selectedFrameId === "frame_platinum" ? ["#E5E4E2", "#BCC6CC"] :
                      profile?.selectedFrameId === "frame_champion" ? ["#EF4444", "#F59E0B"] :
                      ["#FFFFFF", "#FFFFFF"] // Default to white if no frame
                    }
                    style={styles.avatarFrame}
                  >
                    <View style={styles.avatarImageWrapper}>
                      {isUpdatingPhoto ? (
                        <View style={styles.avatarPlaceholder}>
                          <ActivityIndicator size="small" color={primaryColor} />
                        </View>
                      ) : profile?.avatarUrl && profile.avatarUrl.startsWith("data:image") ? (
                        <Image
                          source={{ uri: profile.avatarUrl }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: primaryColor }]}>
                          <ThemedText type="h2" style={{ color: "#FFFFFF" }}>
                            {profile?.name?.charAt(0).toUpperCase() || "?"}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </View>
                <View style={[styles.cameraButton, { backgroundColor: theme.primary }]}>
                  <Feather name="camera" size={16} color="#FFFFFF" />
                </View>
              </Pressable>
            </View>

            <View style={styles.nameRow}>
              <ThemedText type="h3">{profile.name}</ThemedText>
              <VerificationBadgeIcon 
                badge={selectedBadge} 
                size={22} 
                onPress={() => setBadgesModalVisible(true)} 
              />
            </View>

            {profile.email ? (
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {profile.email}
              </ThemedText>
            ) : null}

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statArrow}>
                  <Feather name="arrow-up" size={14} color={successColor} />
                </View>
                <View>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>Quizzes</ThemedText>
                  <ThemedText type="h4" style={{ color: successColor }}>{stats.totalQuizzes}</ThemedText>
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.statArrow}>
                  <Feather name="arrow-down" size={14} color={errorColor} />
                </View>
                <View>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>Avg Score</ThemedText>
                  <ThemedText type="h4" style={{ color: errorColor }}>{stats.averageScore}%</ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.quickActionsRow}>
              <QuickAction icon="trending-up" label="Stats" theme={theme} />
              <QuickAction icon="award" label="Badges" theme={theme} onPress={handleBadgesQuickAction} />
              <QuickAction icon="share-2" label="Share" theme={theme} />
              <QuickAction icon="gift" label="Rewards" theme={theme} />
            </View>
          </Animated.View>
        </LinearGradient>

        <View style={styles.menuSection}>
          <ThemedText type="small" style={[styles.menuSectionTitle, { color: theme.textSecondary }]}>
            GENERAL
          </ThemedText>

          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={[styles.menuCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <MenuItem icon="user" label="Profile Settings" theme={theme} />
            <MenuItem icon="lock" label="Change Password" theme={theme} />
            <MenuItem 
              icon="bell" 
              label="Notification" 
              theme={theme} 
              onPress={handleOpenNotifications}
            />
            <MenuItem icon="clock" label="Quiz History" theme={theme} showBorder={false} />
          </Animated.View>
        </View>

        <View style={[styles.menuSection, { marginTop: Spacing.lg }]}>
          <ThemedText type="small" style={[styles.menuSectionTitle, { color: theme.textSecondary }]}>
            ADMIN
          </ThemedText>

          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            style={[styles.menuCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <MenuItem 
              icon="shield" 
              label="Owner Login" 
              onPress={() => navigation.navigate("OwnerLogin")} 
              theme={theme}
              showBorder={true}
            />
            <MenuItem 
              icon="log-out" 
              label="Logout" 
              onPress={() => setLogoutModalVisible(true)} 
              theme={theme}
              showBorder={false}
            />
          </Animated.View>
        </View>

        <View style={[styles.menuSection, { marginTop: Spacing.lg }]}>
          <ThemedText type="small" style={[styles.menuSectionTitle, { color: theme.textSecondary }]}>
            SUPPORT
          </ThemedText>

          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            style={[styles.menuCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <MenuItem icon="help-circle" label="Help & Support" onPress={() => navigation.navigate("HelpSupport")} theme={theme} />
            <MenuItem icon="shield" label="Privacy Policy" onPress={() => navigation.navigate("PrivacyPolicy")} theme={theme} />
            <MenuItem icon="info" label="About TestOne" onPress={handleAbout} theme={theme} showBorder={false} />
          </Animated.View>
        </View>
      </ScrollView>

      <LogoutConfirmationModal
        visible={logoutModalVisible}
        isLoading={isLoggingOut}
        isDark={isDark}
        onConfirm={handleLogout}
        onCancel={() => {
          setLogoutModalVisible(false);
          setIsLoggingOut(false);
        }}
        theme={theme}
      />

      <Modal
        visible={aboutModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <Pressable 
          style={styles.aboutModalOverlay}
          onPress={() => setAboutModalVisible(false)}
        >
          <Pressable 
            style={[styles.aboutModalContent, { backgroundColor: theme.backgroundDefault }]}
            onPress={(e) => e.stopPropagation()}
          >
            <LinearGradient
              colors={isDark ? ["#6366F1", "#8B5CF6"] : ["#2C3E50", "#3498db"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aboutHeader}
            >
              <View style={styles.aboutLogoContainer}>
                <View style={styles.aboutLogo}>
                  <Feather name="zap" size={32} color="#FFFFFF" />
                </View>
              </View>
              <ThemedText type="h2" style={styles.aboutTitle}>TestOne</ThemedText>
              <ThemedText type="body" style={styles.aboutSubtitle}>Your Ultimate Quiz Companion</ThemedText>
              
              <Pressable 
                style={styles.aboutCloseBtn}
                onPress={() => setAboutModalVisible(false)}
              >
                <Feather name="x" size={24} color="#FFFFFF" />
              </Pressable>
            </LinearGradient>

            <ScrollView style={styles.aboutBody} showsVerticalScrollIndicator={false}>
              <ThemedText type="small" style={[styles.aboutSectionTitle, { color: theme.textSecondary }]}>
                FEATURES
              </ThemedText>
              
              {aboutFeatures.map((feature, index) => (
                <View 
                  key={index} 
                  style={[styles.aboutFeatureItem, { borderBottomColor: theme.border }]}
                >
                  <View style={[styles.aboutFeatureIcon, { backgroundColor: `${primaryColor}15` }]}>
                    <Feather name={feature.icon} size={20} color={primaryColor} />
                  </View>
                  <View style={styles.aboutFeatureText}>
                    <ThemedText type="body" style={{ fontWeight: "600" }}>{feature.title}</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>{feature.desc}</ThemedText>
                  </View>
                </View>
              ))}

              <ThemedText type="small" style={[styles.aboutSectionTitle, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
                DEVELOPER
              </ThemedText>

              <View style={[styles.ownerProfileCard, { backgroundColor: theme.backgroundSecondary }]}>
                <View style={styles.ownerHeader}>
                  {ownerProfile?.imageUrl ? (
                    <Image
                      source={{ uri: ownerProfile.imageUrl }}
                      style={styles.ownerAvatar}
                    />
                  ) : (
                    <LinearGradient
                      colors={isDark ? ["#6366F1", "#8B5CF6"] : ["#2C3E50", "#3498db"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.ownerAvatarPlaceholder}
                    >
                      <Feather name="user" size={32} color="#FFFFFF" />
                    </LinearGradient>
                  )}
                  <View style={styles.ownerInfo}>
                    <View style={styles.ownerNameRow}>
                      <ThemedText type="h4" style={{ fontWeight: "700" }}>
                        {ownerProfile?.name || "Govind Chowdhury"}
                      </ThemedText>
                      <View style={styles.creatorBadges}>
                        <LinearGradient
                          colors={["#FFB800", "#FF9500"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.creatorBadge}
                        >
                          <Feather name="check" size={8} color="#FFFFFF" />
                        </LinearGradient>
                        <LinearGradient
                          colors={["#6366F1", "#8B5CF6"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.creatorBadge}
                        >
                          <Feather name="award" size={8} color="#FFFFFF" />
                        </LinearGradient>
                        <LinearGradient
                          colors={["#10B981", "#059669"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.creatorBadge}
                        >
                          <Feather name="star" size={8} color="#FFFFFF" />
                        </LinearGradient>
                      </View>
                    </View>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {ownerProfile?.title || "App Developer & Creator"}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.socialLinks}>
                  <Pressable style={[styles.socialButton, { backgroundColor: "#1769FF" }]}>
                    <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>Be</ThemedText>
                  </Pressable>
                  <Pressable style={[styles.socialButton, { backgroundColor: "#EA4C89" }]}>
                    <Feather name="dribbble" size={14} color="#FFFFFF" />
                  </Pressable>
                  <Pressable style={[styles.socialButton, { backgroundColor: "#0A66C2" }]}>
                    <Feather name="linkedin" size={14} color="#FFFFFF" />
                  </Pressable>
                  <Pressable style={[styles.socialButton, { backgroundColor: "#E4405F" }]}>
                    <Feather name="instagram" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>

                {ownerProfile?.skills && ownerProfile.skills.length > 0 && (
                  <View style={styles.skillsSection}>
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
                      Skills
                    </ThemedText>
                    <View style={styles.skillsRow}>
                      {ownerProfile.skills.slice(0, 4).map((skill, index) => (
                        <View key={index} style={[styles.skillBadge, { backgroundColor: `${primaryColor}15` }]}>
                          <ThemedText type="small" style={{ color: primaryColor, fontWeight: "600" }}>
                            {skill}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {ownerProfile?.profession && (
                  <View style={styles.professionSection}>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Profession
                    </ThemedText>
                    <ThemedText type="body" style={{ fontWeight: "600", marginTop: 4 }}>
                      {ownerProfile.profession}
                    </ThemedText>
                  </View>
                )}

                {ownerProfile?.experience && ownerProfile.experience.length > 0 && (
                  <View style={styles.experienceSection}>
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
                      Experience
                    </ThemedText>
                    {ownerProfile.experience.slice(0, 2).map((exp, index) => (
                      <View key={index} style={[styles.experienceItem, { backgroundColor: theme.backgroundDefault }]}>
                        <View style={styles.experienceDot} />
                        <View style={styles.experienceContent}>
                          <ThemedText type="body" style={{ fontWeight: "600" }}>
                            {exp.title}
                          </ThemedText>
                          <ThemedText type="small" style={{ color: theme.textSecondary }}>
                            {exp.company} • {exp.period}
                          </ThemedText>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <ThemedText type="small" style={[styles.aboutVersion, { color: theme.textSecondary }]}>
                Version 1.0.0
              </ThemedText>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <VerificationBadgesModal
        visible={badgesModalVisible}
        onClose={() => setBadgesModalVisible(false)}
        selectedBadge={selectedBadge}
        onSelectBadge={handleSelectBadge}
      />

      {/* Notifications Modal */}
      <Modal
        visible={notificationsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <View style={styles.aboutModalOverlay}>
          <View style={[styles.aboutModalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <ThemedText type="h2">Notifications</ThemedText>
              <Pressable onPress={() => setNotificationsModalVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {notificationsLoading ? (
              <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            ) : (
              <ScrollView style={{ padding: Spacing.md }} showsVerticalScrollIndicator={false}>
                {notifications.length === 0 ? (
                  <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
                    <Feather name="bell-off" size={48} color={theme.textSecondary} style={{ marginBottom: Spacing.md }} />
                    <ThemedText style={{ color: theme.textSecondary }}>No new notifications</ThemedText>
                  </View>
                ) : (
                  notifications.map((notif, index) => (
                    <Animated.View 
                      key={notif._id || index}
                      entering={FadeInDown.delay(index * 100)}
                      style={[
                        styles.notificationCard, 
                        { backgroundColor: theme.backgroundSecondary }
                      ]}
                    >
                      <View style={[styles.notificationIcon, { backgroundColor: `${theme.primary}15` }]}>
                        <Feather name="zap" size={20} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="body" style={{ fontWeight: '700' }}>{notif.title}</ThemedText>
                        <ThemedText type="small" style={{ marginTop: 4, lineHeight: 18 }}>{notif.message}</ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 8, fontSize: 10 }}>
                          {new Date(notif.createdAt).toLocaleString()}
                        </ThemedText>
                      </View>
                    </Animated.View>
                  ))
                )}
                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  headerGradient: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 60,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  headerWhiteText: {
    color: "#FFFFFF",
  },
  profileCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginTop: Spacing.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: Spacing.md,
    marginTop: -Spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarFrame: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    padding: 4, // This creates the "thickness" of the frame
  },
  avatarImageWrapper: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
    justifyContent: "center",
  },
  statArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginHorizontal: Spacing.lg,
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: Spacing.xl,
    width: "100%",
  },
  quickAction: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.xl,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm,
  },
  menuCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  createProfileHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  createProfileContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  createProfileCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing["2xl"],
    alignItems: "center",
  },
  createAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  createProfileButton: {
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    width: "100%",
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  loginProfileButton: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    paddingVertical: Spacing.lg,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  aboutModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  aboutModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    overflow: "hidden",
  },
  aboutHeader: {
    paddingTop: Spacing["2xl"],
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  aboutLogoContainer: {
    marginBottom: Spacing.md,
  },
  aboutLogo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  aboutTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  aboutSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: Spacing.xs,
  },
  aboutCloseBtn: {
    position: "absolute",
    top: Spacing.lg,
    right: Spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  aboutBody: {
    padding: Spacing.lg,
  },
  aboutSectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  aboutFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  aboutFeatureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  aboutFeatureText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  aboutCreator: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  aboutCreatorInfo: {
    flex: 1,
  },
  aboutCreatorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 2,
  },
  creatorBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: Spacing.xs,
  },
  creatorBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  aboutVersion: {
    textAlign: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  ownerProfileCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  ownerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  ownerAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  ownerAvatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  ownerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  ownerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  socialLinks: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  socialButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  skillsSection: {
    marginBottom: Spacing.md,
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  skillBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  professionSection: {
    marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
  },
  experienceSection: {
    marginTop: Spacing.sm,
  },
  experienceItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  experienceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6366F1",
    marginTop: 6,
    marginRight: Spacing.sm,
  },
  experienceContent: {
    flex: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
});
