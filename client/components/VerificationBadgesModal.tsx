import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Path, Circle } from "react-native-svg";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type BadgeShape = "circle" | "scalloped" | "gear" | "shield" | "star" | "diamond" | "hexagon" | "rounded";

export interface VerificationBadge {
  id: string;
  name: string;
  icon: string;
  colors: string[];
  description: string;
  isUnlocked: boolean;
  shape: BadgeShape;
}

const getScallopedPath = (size: number, points: number = 8): string => {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 1;
  const innerR = outerR * 0.85;
  let path = "";
  
  for (let i = 0; i < points; i++) {
    const angle1 = (i * 2 * Math.PI) / points - Math.PI / 2;
    const angle2 = ((i + 0.5) * 2 * Math.PI) / points - Math.PI / 2;
    const x1 = cx + outerR * Math.cos(angle1);
    const y1 = cy + outerR * Math.sin(angle1);
    const x2 = cx + innerR * Math.cos(angle2);
    const y2 = cy + innerR * Math.sin(angle2);
    
    if (i === 0) {
      path += `M ${x1} ${y1}`;
    }
    path += ` Q ${cx + outerR * 0.95 * Math.cos((angle1 + angle2) / 2)} ${cy + outerR * 0.95 * Math.sin((angle1 + angle2) / 2)} ${x2} ${y2}`;
    
    const angle3 = ((i + 1) * 2 * Math.PI) / points - Math.PI / 2;
    const x3 = cx + outerR * Math.cos(angle3);
    const y3 = cy + outerR * Math.sin(angle3);
    path += ` Q ${cx + outerR * 0.95 * Math.cos((angle2 + angle3) / 2)} ${cy + outerR * 0.95 * Math.sin((angle2 + angle3) / 2)} ${x3} ${y3}`;
  }
  path += " Z";
  return path;
};

const getGearPath = (size: number, teeth: number = 10): string => {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 1;
  const innerR = outerR * 0.78;
  let path = "";
  
  for (let i = 0; i < teeth; i++) {
    const angle1 = (i * 2 * Math.PI) / teeth - Math.PI / 2;
    const angle2 = ((i + 0.35) * 2 * Math.PI) / teeth - Math.PI / 2;
    const angle3 = ((i + 0.65) * 2 * Math.PI) / teeth - Math.PI / 2;
    const angle4 = ((i + 1) * 2 * Math.PI) / teeth - Math.PI / 2;
    
    const x1 = cx + outerR * Math.cos(angle1);
    const y1 = cy + outerR * Math.sin(angle1);
    const x2 = cx + outerR * Math.cos(angle2);
    const y2 = cy + outerR * Math.sin(angle2);
    const x3 = cx + innerR * Math.cos(angle3);
    const y3 = cy + innerR * Math.sin(angle3);
    const x4 = cx + innerR * Math.cos(angle4);
    const y4 = cy + innerR * Math.sin(angle4);
    
    if (i === 0) {
      path += `M ${x1} ${y1}`;
    }
    path += ` L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4}`;
  }
  path += " Z";
  return path;
};

const getStarPath = (size: number, points: number = 6): string => {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 1;
  const innerR = outerR * 0.55;
  let path = "";
  
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    
    if (i === 0) {
      path += `M ${x} ${y}`;
    } else {
      path += ` L ${x} ${y}`;
    }
  }
  path += " Z";
  return path;
};

const getShieldPath = (size: number): string => {
  const w = size;
  const h = size;
  return `M ${w * 0.5} ${h * 0.05} L ${w * 0.9} ${h * 0.2} L ${w * 0.9} ${h * 0.55} Q ${w * 0.9} ${h * 0.8} ${w * 0.5} ${h * 0.95} Q ${w * 0.1} ${h * 0.8} ${w * 0.1} ${h * 0.55} L ${w * 0.1} ${h * 0.2} Z`;
};

const getDiamondPath = (size: number): string => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;
  return `M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`;
};

const getHexagonPath = (size: number): string => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 1;
  let path = "";
  
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    
    if (i === 0) {
      path += `M ${x} ${y}`;
    } else {
      path += ` L ${x} ${y}`;
    }
  }
  path += " Z";
  return path;
};

const getRoundedPath = (size: number): string => {
  const r = size / 2 - 1;
  const cx = size / 2;
  const cy = size / 2;
  return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
};

interface BadgeShapeRendererProps {
  shape: BadgeShape;
  colors: string[];
  size: number;
  icon: string;
  id: string;
}

function BadgeShapeRenderer({ shape, colors, size, icon, id }: BadgeShapeRendererProps) {
  const getPath = () => {
    switch (shape) {
      case "scalloped":
        return getScallopedPath(size, 8);
      case "gear":
        return getGearPath(size, 12);
      case "star":
        return getStarPath(size, 5);
      case "shield":
        return getShieldPath(size);
      case "diamond":
        return getDiamondPath(size);
      case "hexagon":
        return getHexagonPath(size);
      case "rounded":
        return getRoundedPath(size);
      case "circle":
      default:
        return null;
    }
  };

  const gradientId = `grad-${id}`;
  const pathData = getPath();
  const iconSize = size * 0.5;
  const iconOffset = (size - iconSize) / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors[0]} />
            <Stop offset="100%" stopColor={colors[1]} />
          </SvgLinearGradient>
        </Defs>
        {shape === "circle" ? (
          <Circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill={`url(#${gradientId})`} />
        ) : (
          <Path d={pathData!} fill={`url(#${gradientId})`} />
        )}
      </Svg>
      <View style={[StyleSheet.absoluteFill, { justifyContent: "center", alignItems: "center" }]}>
        <Feather name={icon as any} size={iconSize} color="#FFFFFF" />
      </View>
    </View>
  );
}

const VERIFICATION_BADGES: VerificationBadge[] = [
  {
    id: "verified_basic",
    name: "Verified",
    icon: "check",
    colors: ["#3B82F6", "#1D4ED8"],
    description: "Basic verification badge",
    isUnlocked: true,
    shape: "scalloped",
  },
  {
    id: "verified_gold",
    name: "Gold Verified",
    icon: "check",
    colors: ["#FFB800", "#FF9500"],
    description: "Gold tier verification",
    isUnlocked: true,
    shape: "gear",
  },
  {
    id: "verified_cyan",
    name: "Cyan Verified",
    icon: "check",
    colors: ["#22D3EE", "#06B6D4"],
    description: "Cyan verification badge",
    isUnlocked: true,
    shape: "scalloped",
  },
  {
    id: "verified_emerald",
    name: "Emerald Verified",
    icon: "check",
    colors: ["#10B981", "#059669"],
    description: "Emerald verification badge",
    isUnlocked: true,
    shape: "gear",
  },
  {
    id: "verified_teal",
    name: "Teal Verified",
    icon: "check",
    colors: ["#14B8A6", "#0D9488"],
    description: "Teal verification badge",
    isUnlocked: true,
    shape: "scalloped",
  },
  {
    id: "verified_sky",
    name: "Sky Verified",
    icon: "check",
    colors: ["#38BDF8", "#0EA5E9"],
    description: "Sky blue verification",
    isUnlocked: true,
    shape: "circle",
  },
  {
    id: "verified_indigo",
    name: "Indigo Verified",
    icon: "check",
    colors: ["#818CF8", "#6366F1"],
    description: "Indigo verification badge",
    isUnlocked: true,
    shape: "scalloped",
  },
  {
    id: "verified_purple",
    name: "Purple Verified",
    icon: "check",
    colors: ["#A855F7", "#9333EA"],
    description: "Purple verification badge",
    isUnlocked: true,
    shape: "gear",
  },
  {
    id: "verified_orange",
    name: "Orange Verified",
    icon: "check",
    colors: ["#FB923C", "#F97316"],
    description: "Orange verification badge",
    isUnlocked: true,
    shape: "star",
  },
  {
    id: "verified_amber",
    name: "Amber Verified",
    icon: "check",
    colors: ["#FBBF24", "#F59E0B"],
    description: "Amber verification badge",
    isUnlocked: true,
    shape: "gear",
  },
  {
    id: "verified_lime",
    name: "Lime Verified",
    icon: "check",
    colors: ["#84CC16", "#65A30D"],
    description: "Lime green verification",
    isUnlocked: true,
    shape: "scalloped",
  },
  {
    id: "verified_rose",
    name: "Rose Verified",
    icon: "check",
    colors: ["#FB7185", "#F43F5E"],
    description: "Rose pink verification",
    isUnlocked: true,
    shape: "scalloped",
  },
  {
    id: "verified_navy",
    name: "Navy Verified",
    icon: "check",
    colors: ["#1E40AF", "#1E3A8A"],
    description: "Navy blue verification",
    isUnlocked: true,
    shape: "circle",
  },
  {
    id: "verified_slate",
    name: "Slate Verified",
    icon: "check",
    colors: ["#64748B", "#475569"],
    description: "Slate gray verification",
    isUnlocked: true,
    shape: "rounded",
  },
  {
    id: "verified_pro",
    name: "Pro Verified",
    icon: "award",
    colors: ["#6366F1", "#8B5CF6"],
    description: "Professional quiz master",
    isUnlocked: true,
    shape: "shield",
  },
  {
    id: "verified_elite",
    name: "Elite",
    icon: "star",
    colors: ["#10B981", "#059669"],
    description: "Elite quiz champion",
    isUnlocked: true,
    shape: "hexagon",
  },
  {
    id: "verified_crown",
    name: "Crown",
    icon: "zap",
    colors: ["#F59E0B", "#D97706"],
    description: "Quiz royalty status",
    isUnlocked: true,
    shape: "star",
  },
  {
    id: "verified_diamond",
    name: "Diamond",
    icon: "hexagon",
    colors: ["#06B6D4", "#0891B2"],
    description: "Diamond tier achiever",
    isUnlocked: true,
    shape: "diamond",
  },
  {
    id: "verified_fire",
    name: "On Fire",
    icon: "activity",
    colors: ["#EF4444", "#DC2626"],
    description: "Blazing hot streak",
    isUnlocked: true,
    shape: "gear",
  },
  {
    id: "verified_sapphire",
    name: "Sapphire",
    icon: "shield",
    colors: ["#2563EB", "#60A5FA"],
    description: "Sapphire rank achiever",
    isUnlocked: true,
    shape: "shield",
  },
  {
    id: "verified_ruby",
    name: "Ruby",
    icon: "heart",
    colors: ["#DC2626", "#F87171"],
    description: "Ruby tier verified",
    isUnlocked: true,
    shape: "hexagon",
  },
  {
    id: "verified_rainbow",
    name: "Rainbow",
    icon: "layers",
    colors: ["#EC4899", "#8B5CF6"],
    description: "Colorful quiz master",
    isUnlocked: false,
    shape: "scalloped",
  },
  {
    id: "verified_legendary",
    name: "Legendary",
    icon: "shield",
    colors: ["#1E40AF", "#3B82F6"],
    description: "Legendary status achieved",
    isUnlocked: false,
    shape: "shield",
  },
  {
    id: "verified_cosmic",
    name: "Cosmic",
    icon: "sun",
    colors: ["#7C3AED", "#A855F7"],
    description: "Cosmic tier achiever",
    isUnlocked: false,
    shape: "star",
  },
  {
    id: "verified_phoenix",
    name: "Phoenix",
    icon: "sunrise",
    colors: ["#F97316", "#FBBF24"],
    description: "Phoenix rank verified",
    isUnlocked: false,
    shape: "gear",
  },
];

interface VerificationBadgeItemProps {
  badge: VerificationBadge;
  isSelected: boolean;
  onSelect: (badge: VerificationBadge) => void;
  theme: any;
  index: number;
}

function VerificationBadgeItem({ badge, isSelected, onSelect, theme, index }: VerificationBadgeItemProps) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <Pressable
        onPress={() => badge.isUnlocked && onSelect(badge)}
        style={({ pressed }) => [
          styles.badgeItem,
          {
            backgroundColor: theme.backgroundDefault,
            opacity: badge.isUnlocked ? (pressed ? 0.8 : 1) : 0.5,
            borderWidth: isSelected ? 2 : 0,
            borderColor: isSelected ? badge.colors[0] : "transparent",
          },
        ]}
      >
        <View style={styles.badgeIconContainer}>
          <BadgeShapeRenderer
            shape={badge.shape}
            colors={badge.colors}
            size={48}
            icon={badge.icon}
            id={badge.id}
          />
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Feather name="check" size={10} color="#FFFFFF" />
            </View>
          )}
        </View>
        <View style={styles.badgeInfo}>
          <View style={styles.badgeNameRow}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {badge.name}
            </ThemedText>
            {!badge.isUnlocked && (
              <View style={[styles.lockBadge, { backgroundColor: theme.textSecondary }]}>
                <Feather name="lock" size={10} color="#FFFFFF" />
              </View>
            )}
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {badge.description}
          </ThemedText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

interface VerificationBadgesModalProps {
  visible: boolean;
  onClose: () => void;
  selectedBadge: VerificationBadge | null;
  onSelectBadge: (badge: VerificationBadge) => void;
}

export default function VerificationBadgesModal({
  visible,
  onClose,
  selectedBadge,
  onSelectBadge,
}: VerificationBadgesModalProps) {
  const { theme, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}
          onPress={(e) => e.stopPropagation()}
        >
          <LinearGradient
            colors={isDark ? ["#6366F1", "#8B5CF6"] : ["#2C3E50", "#3498db"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerIcon}>
                <Feather name="award" size={28} color="#FFFFFF" />
              </View>
              <ThemedText type="h3" style={styles.headerTitle}>
                Verification Badges
              </ThemedText>
              <ThemedText type="small" style={styles.headerSubtitle}>
                Choose your profile verification badge
              </ThemedText>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </Pressable>
          </LinearGradient>

          <ScrollView
            style={styles.badgesList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.badgesListContent}
          >
            <ThemedText
              type="small"
              style={[styles.sectionTitle, { color: theme.textSecondary }]}
            >
              AVAILABLE BADGES
            </ThemedText>
            {VERIFICATION_BADGES.map((badge, index) => (
              <VerificationBadgeItem
                key={badge.id}
                badge={badge}
                isSelected={selectedBadge?.id === badge.id}
                onSelect={onSelectBadge}
                theme={theme}
                index={index}
              />
            ))}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.doneButton,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <LinearGradient
                colors={isDark ? ["#6366F1", "#8B5CF6"] : ["#2C3E50", "#3498db"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.doneButtonGradient}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  Done
                </ThemedText>
              </LinearGradient>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function VerificationBadgeIcon({
  badge,
  size = 20,
  onPress,
}: {
  badge: VerificationBadge | null;
  size?: number;
  onPress?: () => void;
}) {
  const defaultBadge = VERIFICATION_BADGES[0];
  const activeBadge = badge || defaultBadge;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <BadgeShapeRenderer
        shape={activeBadge.shape}
        colors={activeBadge.colors}
        size={size}
        icon={activeBadge.icon}
        id={activeBadge.id}
      />
    </Pressable>
  );
}

export { VERIFICATION_BADGES };

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    overflow: "hidden",
  },
  header: {
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    alignItems: "center",
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginTop: Spacing.xs,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: Spacing.xs,
  },
  closeButton: {
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
  badgesList: {
    flex: 1,
  },
  badgesListContent: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  badgeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  badgeIconContainer: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedIndicator: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  badgeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  lockBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  doneButton: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  doneButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
});
