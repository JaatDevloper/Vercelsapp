import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useOwnerAuth } from "@/hooks/useOwnerAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AdminStats {
  totalUsers: number;
  totalQuizzes: number;
  totalRooms: number;
  activeRooms: number;
  avgScore: number;
  totalAttempts: number;
}

interface AdminUser {
  id: string;
  username: string;
  role: "admin" | "user" | "moderator";
  createdAt: string;
  quizCount: number;
  attempts: number;
  avatarUrl?: string;
}

interface Analytics {
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
  };
  quizStatistics: {
    completionRate: number;
    mostPopularCategory: string;
  };
  performance: {
    serverResponseTime: number;
    uptime: number;
  };
}

interface QuickStatProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string | number;
  theme: any;
}

function QuickStat({ icon, label, value, theme }: QuickStatProps) {
  return (
    <Animated.View entering={FadeInDown.delay(100)} style={[styles.statCard, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={[styles.statIcon, { backgroundColor: `${theme.primary}15` }]}>
        <Feather name={icon} size={24} color={theme.primary} />
      </View>
      <View style={styles.statContent}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {label}
        </ThemedText>
        <ThemedText type="h1" style={{ marginTop: Spacing.xs }}>
          {value}
        </ThemedText>
      </View>
    </Animated.View>
  );
}

interface ActionButtonProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  theme: any;
  color?: string;
}

function ActionButton({ icon, label, onPress, theme, color }: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: color || theme.primary, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Feather name={icon} size={18} color="white" />
      <ThemedText type="small" style={{ color: "white", marginLeft: Spacing.sm }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

interface AdminUserItemProps {
  user: AdminUser;
  theme: any;
  onPress: (user: AdminUser) => void;
}

function AdminUserItem({ user, theme, onPress }: AdminUserItemProps) {
  const roleColors = {
    admin: "#FF6B6B",
    moderator: "#4ECDC4",
    user: theme.textSecondary,
  };

  return (
    <Pressable
      onPress={() => onPress(user)}
      style={({ pressed }) => [
        styles.userItem,
        { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.userInfo}>
        <View style={[styles.userAvatar, { backgroundColor: `${theme.primary}25` }]}>
          {user.avatarUrl ? (
            <Image 
              source={{ uri: user.avatarUrl }} 
              style={{ width: "100%", height: "100%", borderRadius: 20 }}
              contentFit="cover"
            />
          ) : (
            <ThemedText type="small" style={{ color: theme.primary }}>
              {user.username.charAt(0).toUpperCase()}
            </ThemedText>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="body">{user.username}</ThemedText>
          <View style={styles.roleBadge}>
            <View style={[styles.roleDot, { backgroundColor: roleColors[user.role] }]} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
              {user.role} • {user.quizCount} quizzes • {user.attempts} attempts
            </ThemedText>
          </View>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

export default function AdminDashboardScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { isOwnerLoggedIn, ownerEmail, ownerLogout } = useOwnerAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();

  // Redirect if not owner
  React.useEffect(() => {
    if (!isOwnerLoggedIn) {
      navigation.goBack();
    }
  }, [isOwnerLoggedIn, navigation]);
  
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalQuizzes: 0,
    totalRooms: 0,
    activeRooms: 0,
    avgScore: 0,
    totalAttempts: 0,
  });

  // Update stats when data is fetched
  useEffect(() => {
    if (statsData) {
      setStats({
        totalUsers: statsData.totalUsers,
        totalQuizzes: statsData.totalQuizzes,
        totalRooms: statsData.totalRooms,
        activeRooms: statsData.activeRooms,
        avgScore: statsData.avgScore,
        totalAttempts: statsData.totalAttempts,
      });
    }
  }, [statsData]);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersModalVisible, setUsersModalVisible] = useState(false);
  const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [premiumUsers, setPremiumUsers] = useState<AdminUser[]>([]);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [premiumSearchQuery, setPremiumSearchQuery] = useState("");

  // Fetch users when modal opens
  useEffect(() => {
    if (usersModalVisible) {
      fetchUsers();
    }
  }, [usersModalVisible]);

  // Fetch premium users when modal opens
  useEffect(() => {
    if (premiumModalVisible) {
      fetchPremiumUsers();
    }
  }, [premiumModalVisible]);

  const fetchPremiumUsers = async () => {
    setPremiumLoading(true);
    try {
      const response = await fetch("/api/admin/users", {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPremiumUsers(data);
      }
    } catch (error) {
      console.error("Error fetching premium users:", error);
    } finally {
      setPremiumLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      console.log("Fetching users from relative API...");
      const response = await fetch("/api/admin/users", {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Users fetched successfully:", data.length);
        setUsers(data);
      } else {
        const text = await response.text();
        console.error("Failed to fetch users, status:", response.status, "body:", text);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewUsers = () => {
    setUsersModalVisible(true);
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch("/api/analytics");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleViewAnalytics = () => {
    setAnalyticsModalVisible(true);
    fetchAnalytics();
  };

  const handleUserPress = (user: AdminUser) => {
    setSelectedUser(user);
  };

  const [broadcastModalVisible, setBroadcastModalVisible] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      Alert.alert("Error", "Please enter a message");
      return;
    }

    setBroadcastLoading(true);
    try {
      const response = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: broadcastTitle || "System Update",
          message: broadcastMessage,
          type: "info",
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Broadcast sent successfully");
        setBroadcastModalVisible(false);
        setBroadcastTitle("");
        setBroadcastMessage("");
      } else {
        Alert.alert("Error", "Failed to send broadcast");
      }
    } catch (error) {
      console.error("Error sending broadcast:", error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setBroadcastLoading(false);
    }
  };

  const handleChangeUserRole = (newRole: "admin" | "moderator" | "user") => {
    if (selectedUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, role: newRole } : u
        )
      );
      setSelectedUser(null);
      Alert.alert("Success", `User role changed to ${newRole}`);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingBottom: Spacing.lg,
          paddingTop: Spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <LinearGradient
            colors={[theme.primary, theme.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientHeader}
          >
            <View style={styles.headerContent}>
              <View style={{ flex: 1 }}>
                <ThemedText type="h1" style={{ color: "white" }}>
                  Admin Dashboard
                </ThemedText>
                <ThemedText
                  type="small"
                  style={{ color: "rgba(255,255,255,0.8)", marginTop: Spacing.xs }}
                >
                  {ownerEmail}
                </ThemedText>
              </View>
              <Pressable
                onPress={async () => {
                  await ownerLogout();
                  navigation.goBack();
                }}
                style={[styles.adminBadge, { backgroundColor: "rgba(255,255,255,0.25)" }]}
              >
                <Feather name="log-out" size={20} color="white" />
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <ThemedText type="h2" style={{ marginBottom: Spacing.md }}>
            Platform Overview
          </ThemedText>
          {statsLoading ? (
            <View style={{ alignItems: "center", paddingVertical: Spacing.lg }}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText type="small" style={{ marginTop: Spacing.md, color: theme.textSecondary }}>
                Loading statistics...
              </ThemedText>
            </View>
          ) : (
            <>
              <QuickStat icon="users" label="Total Users" value={stats.totalUsers} theme={theme} />
              <QuickStat
                icon="file-text"
                label="Total Quizzes"
                value={stats.totalQuizzes}
                theme={theme}
              />
              <QuickStat
                icon="activity"
                label="Active Rooms"
                value={`${stats.activeRooms}/${stats.totalRooms}`}
                theme={theme}
              />
              <QuickStat
                icon="trending-up"
                label="Average Score"
                value={`${stats.avgScore}%`}
                theme={theme}
              />
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <ThemedText type="h2" style={{ marginBottom: Spacing.md }}>
            Management
          </ThemedText>
          <ActionButton
            icon="users"
            label="View & Manage Users"
            onPress={handleViewUsers}
            theme={theme}
          />
          <ActionButton
            icon="bar-chart-2"
            label="View Analytics"
            onPress={handleViewAnalytics}
            theme={theme}
          />
          <ActionButton
            icon="radio"
            label="Broadcast"
            onPress={() => setBroadcastModalVisible(true)}
            theme={theme}
            color="#8B5CF6"
          />
          <ActionButton
            icon="trash-2"
            label="Manage Quizzes"
            onPress={() => navigation.navigate("ManageQuizzes")}
            theme={theme}
            color="#FF6B6B"
          />
          <ActionButton
            icon="gift"
            label="Premium Management"
            onPress={() => setPremiumModalVisible(true)}
            theme={theme}
            color="#FF6B9D"
          />
          <ActionButton
            icon="settings"
            label="System Settings"
            onPress={() => Alert.alert("Coming Soon", "System configuration")}
            theme={theme}
            color="#A8DADC"
          />
        </View>

        {/* Recent Activity */}
        <View style={[styles.section, { marginBottom: Spacing.xl }]}>
          <ThemedText type="h2" style={{ marginBottom: Spacing.md }}>
            Recent Activity
          </ThemedText>
          <View
            style={[
              styles.activityItem,
              { backgroundColor: theme.backgroundSecondary, borderLeftColor: "#4ECDC4" },
            ]}
          >
            <ThemedText type="body">5 new users joined</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
              2 hours ago
            </ThemedText>
          </View>
          <View
            style={[
              styles.activityItem,
              { backgroundColor: theme.backgroundSecondary, borderLeftColor: "#FFD93D" },
            ]}
          >
            <ThemedText type="body">12 quizzes created</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
              5 hours ago
            </ThemedText>
          </View>
          <View
            style={[
              styles.activityItem,
              { backgroundColor: theme.backgroundSecondary, borderLeftColor: "#6BCB77" },
            ]}
          >
            <ThemedText type="body">3 rooms completed successfully</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
              1 day ago
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Premium Management Modal */}
      <Modal
        visible={premiumModalVisible}
        animationType="slide"
        onRequestClose={() => {
          setPremiumModalVisible(false);
          setPremiumSearchQuery("");
        }}
      >
        <ThemedView style={styles.container}>
          <View
            style={[styles.modalHeader, { backgroundColor: theme.backgroundSecondary }]}
          >
            <Pressable onPress={() => setPremiumModalVisible(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h2">Manage Premium</ThemedText>
            <View style={{ width: 24 }} />
          </View>

          <View style={[styles.searchBox, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="search" size={20} color={theme.textSecondary} />
            <TextInput
              placeholder="Search users..."
              value={premiumSearchQuery}
              onChangeText={setPremiumSearchQuery}
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>

          {premiumLoading ? (
            <View style={{ alignItems: "center", paddingVertical: Spacing.lg }}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText type="small" style={{ marginTop: Spacing.md, color: theme.textSecondary }}>
                Loading users...
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={premiumUsers.filter((u) =>
                u.username.toLowerCase().includes(premiumSearchQuery.toLowerCase())
              )}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.userItem,
                    { backgroundColor: theme.backgroundSecondary },
                  ]}
                >
                  <View style={styles.userInfo}>
                    <View style={[styles.userAvatar, { backgroundColor: "#FF6B9D25" }]}>
                      <ThemedText type="small" style={{ color: "#FF6B9D" }}>
                        {item.username.charAt(0).toUpperCase()}
                      </ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="body">{item.username}</ThemedText>
                      <ThemedText
                        type="small"
                        style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
                      >
                        {item.quizCount} quizzes • {item.attempts} attempts
                      </ThemedText>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                    <Pressable
                      onPress={async () => {
                        try {
                          const response = await fetch(`/api/admin/premium/grant`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: item.id }),
                          });
                          if (response.ok) {
                            Alert.alert("Success", `${item.username} is now premium`);
                            setPremiumModalVisible(false);
                          }
                        } catch (error) {
                          Alert.alert("Error", "Failed to grant premium");
                        }
                      }}
                      style={[
                        styles.premiumButton,
                        { backgroundColor: "#FF6B9D" },
                      ]}
                    >
                      <ThemedText type="small" style={{ color: "white" }}>
                        Get Premium
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={async () => {
                        try {
                          const response = await fetch(`/api/admin/premium/remove`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: item.id }),
                          });
                          if (response.ok) {
                            Alert.alert("Success", `Premium removed from ${item.username}`);
                            setPremiumModalVisible(false);
                          }
                        } catch (error) {
                          Alert.alert("Error", "Failed to remove premium");
                        }
                      }}
                      style={[
                        styles.premiumButton,
                        { backgroundColor: "#999" },
                      ]}
                    >
                      <ThemedText type="small" style={{ color: "white" }}>
                        Remove
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.usersList}
              scrollEnabled={true}
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingVertical: Spacing.lg }}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    No users found
                  </ThemedText>
                </View>
              }
            />
          )}
        </ThemedView>
      </Modal>

      {/* Users Management Modal */}
      <Modal
        visible={usersModalVisible}
        animationType="slide"
        onRequestClose={() => {
          setUsersModalVisible(false);
          setSearchQuery("");
        }}
      >
        <ThemedView style={styles.container}>
          <View
            style={[styles.modalHeader, { backgroundColor: theme.backgroundSecondary }]}
          >
            <Pressable onPress={() => setUsersModalVisible(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h2">Manage Users</ThemedText>
            <View style={{ width: 24 }} />
          </View>

          <View style={[styles.searchBox, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="search" size={20} color={theme.textSecondary} />
            <TextInput
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>

          {usersLoading ? (
            <View style={{ alignItems: "center", paddingVertical: Spacing.lg }}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText type="small" style={{ marginTop: Spacing.md, color: theme.textSecondary }}>
                Loading users...
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <AdminUserItem user={item} theme={theme} onPress={handleUserPress} />
              )}
              contentContainerStyle={styles.usersList}
              scrollEnabled={true}
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingVertical: Spacing.lg }}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    No users found
                  </ThemedText>
                </View>
              }
            />
          )}

          {selectedUser && (
            <Modal
              visible={!!selectedUser}
              transparent
              animationType="fade"
              onRequestClose={() => setSelectedUser(null)}
            >
              <View style={styles.modalOverlay}>
                <View
                  style={[styles.userDetailModal, { backgroundColor: theme.backgroundDefault }]}
                >
                  <Pressable
                    onPress={() => setSelectedUser(null)}
                    style={styles.closeButton}
                  >
                    <Feather name="x" size={28} color={theme.text} />
                  </Pressable>

                  <View style={[styles.userDetailAvatar, { backgroundColor: `${theme.primary}25` }]}>
                    <ThemedText
                      type="h1"
                      style={{ color: theme.primary, fontSize: 48 }}
                    >
                      {selectedUser.username.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>

                  <ThemedText type="h2" style={{ marginTop: Spacing.md }}>
                    {selectedUser.username}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
                  >
                    Joined {selectedUser.createdAt}
                  </ThemedText>

                  <View style={[styles.userStats, { backgroundColor: theme.backgroundSecondary }]}>
                    <View style={styles.userStatItem}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        Quizzes Created
                      </ThemedText>
                      <ThemedText type="h1">{selectedUser.quizCount}</ThemedText>
                    </View>
                    <View style={styles.userStatItem}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        Attempts
                      </ThemedText>
                      <ThemedText type="h1">{selectedUser.attempts}</ThemedText>
                    </View>
                  </View>

                  <ThemedText type="body" style={{ marginTop: Spacing.lg }}>
                    Quiz History
                  </ThemedText>

                  <View style={{ maxHeight: 200, width: "100%", marginTop: Spacing.sm }}>
                    <FlatList
                      data={(selectedUser as any).history || []}
                      keyExtractor={(_, index) => index.toString()}
                      renderItem={({ item }) => (
                        <View style={[styles.historyItem, { backgroundColor: theme.backgroundSecondary }]}>
                          <ThemedText type="small" style={{ fontWeight: "bold" }}>{item.quizTitle}</ThemedText>
                          <ThemedText type="small">{item.score}% • {item.correctAnswers}/{item.totalQuestions}</ThemedText>
                          <ThemedText type="small" style={{ color: theme.textSecondary }}>
                            {new Date(item.completedAt).toLocaleDateString()}
                          </ThemedText>
                        </View>
                      )}
                      ListEmptyComponent={<ThemedText type="small">No history found</ThemedText>}
                    />
                  </View>

                  <ThemedText type="body" style={{ marginTop: Spacing.lg }}>
                    Change Role
                  </ThemedText>

                  {(["admin", "moderator", "user"] as const).map((role) => (
                    <Pressable
                      key={role}
                      onPress={() => handleChangeUserRole(role)}
                      style={({ pressed }) => [
                        styles.roleOption,
                        {
                          backgroundColor:
                            selectedUser.role === role
                              ? theme.primary
                              : theme.backgroundSecondary,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <ThemedText
                        type="body"
                        style={{
                          color: selectedUser.role === role ? "white" : theme.text,
                        }}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Modal>
          )}
        </ThemedView>
      </Modal>

      {/* Broadcast Modal */}
      <Modal
        visible={broadcastModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setBroadcastModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.userDetailModal, { backgroundColor: theme.backgroundDefault, padding: Spacing.lg }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
              <ThemedText type="h2">Send Broadcast</ThemedText>
              <Pressable onPress={() => setBroadcastModalVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ThemedText type="small" style={{ marginBottom: Spacing.xs, color: theme.textSecondary }}>Title (Optional)</ThemedText>
            <TextInput
              placeholder="e.g. System Update"
              value={broadcastTitle}
              onChangeText={setBroadcastTitle}
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { 
                backgroundColor: theme.backgroundSecondary, 
                color: theme.text,
                borderRadius: BorderRadius.md,
                padding: Spacing.sm,
                marginBottom: Spacing.md,
                width: '100%'
              }]}
            />

            <ThemedText type="small" style={{ marginBottom: Spacing.xs, color: theme.textSecondary }}>Message</ThemedText>
            <TextInput
              placeholder="Enter your message here..."
              value={broadcastMessage}
              onChangeText={setBroadcastMessage}
              multiline
              numberOfLines={4}
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { 
                backgroundColor: theme.backgroundSecondary, 
                color: theme.text,
                borderRadius: BorderRadius.md,
                padding: Spacing.sm,
                height: 120,
                textAlignVertical: 'top',
                width: '100%'
              }]}
            />

            <Pressable
              onPress={handleSendBroadcast}
              disabled={broadcastLoading}
              style={({ pressed }) => [
                {
                  backgroundColor: theme.primary,
                  padding: Spacing.md,
                  borderRadius: BorderRadius.md,
                  alignItems: 'center',
                  marginTop: Spacing.lg,
                  opacity: pressed || broadcastLoading ? 0.8 : 1
                }
              ]}
            >
              {broadcastLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>Send Broadcast</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        visible={analyticsModalVisible}
        animationType="slide"
        onRequestClose={() => setAnalyticsModalVisible(false)}
      >
        <ThemedView style={styles.container}>
          <View
            style={[styles.modalHeader, { backgroundColor: theme.backgroundSecondary }]}
          >
            <Pressable onPress={() => setAnalyticsModalVisible(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h2">Analytics</ThemedText>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ padding: Spacing.md }}
          >
            <View
              style={[
                styles.analyticsCard,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <ThemedText type="h2">User Engagement</ThemedText>
              {analyticsLoading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <View style={styles.analyticsMetric}>
                    <ThemedText type="body">Daily Active Users</ThemedText>
                    <ThemedText type="h1" style={{ color: theme.primary }}>
                      {analytics?.userEngagement.dailyActiveUsers || 0}
                    </ThemedText>
                  </View>
                  <View style={styles.analyticsMetric}>
                    <ThemedText type="body">Weekly Active Users</ThemedText>
                    <ThemedText type="h1" style={{ color: theme.primary }}>
                      {analytics?.userEngagement.weeklyActiveUsers || 0}
                    </ThemedText>
                  </View>
                </>
              )}
            </View>

            <View
              style={[
                styles.analyticsCard,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <ThemedText type="h2">Quiz Statistics</ThemedText>
              {analyticsLoading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <View style={styles.analyticsMetric}>
                    <ThemedText type="body">Average Completion Rate</ThemedText>
                    <ThemedText type="h1" style={{ color: "#6BCB77" }}>
                      {analytics?.quizStatistics.completionRate || 0}%
                    </ThemedText>
                  </View>
                  <View style={styles.analyticsMetric}>
                    <ThemedText type="body">Most Popular Category</ThemedText>
                    <ThemedText type="h1" style={{ color: "#4ECDC4" }}>
                      {analytics?.quizStatistics.mostPopularCategory || "General"}
                    </ThemedText>
                  </View>
                </>
              )}
            </View>

            <View
              style={[
                styles.analyticsCard,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <ThemedText type="h2">Performance</ThemedText>
              {analyticsLoading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <View style={styles.analyticsMetric}>
                    <ThemedText type="body">Server Response Time</ThemedText>
                    <ThemedText type="h1" style={{ color: theme.primary }}>
                      {analytics?.performance.serverResponseTime || 0}ms
                    </ThemedText>
                  </View>
                  <View style={styles.analyticsMetric}>
                    <ThemedText type="body">Uptime</ThemedText>
                    <ThemedText type="h1" style={{ color: "#6BCB77" }}>
                      {analytics?.performance.uptime || 0}%
                    </ThemedText>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  gradientHeader: {
    padding: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
  },
  adminBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  statContent: {
    flex: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  activityItem: {
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.md,
    paddingRight: Spacing.md,
    borderLeftWidth: 4,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    paddingTop: Spacing.xl,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  usersList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  userDetailModal: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: "80%",
  },
  closeButton: {
    alignSelf: "flex-start",
    marginBottom: Spacing.md,
  },
  userDetailAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  userStats: {
    flexDirection: "row",
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  userStatItem: {
    flex: 1,
    alignItems: "center",
  },
  roleOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    alignItems: "center",
  },
  analyticsCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  analyticsMetric: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  historyItem: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    width: "100%",
  },
  premiumButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
});
