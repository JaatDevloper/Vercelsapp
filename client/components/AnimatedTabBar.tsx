import React, { useEffect } from 'react';
import { View, Pressable, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Shadows } from '@/constants/theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { ThemedText } from './ThemedText';

const { width } = Dimensions.get('window');

const TAB_COLORS = {
  Discover: '#10B981', // Green
  Offers: '#818CF8',   // Purple/Indigo
  History: '#6366F1',  // Blue
  Leaderboard: '#06B6D4', // Cyan
  Profile: '#F472B6',  // Pink
};

export default function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme, isDark } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: isDark ? theme.backgroundRoot : '#FFFFFF' }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const Icon = options.tabBarIcon;
        const label = options.title || route.name;
        const activeColor = TAB_COLORS[route.name as keyof typeof TAB_COLORS] || theme.primary;

        return (
          <TabItem
            key={route.key}
            isFocused={isFocused}
            onPress={onPress}
            Icon={Icon}
            label={label}
            isDark={isDark}
            theme={theme}
            activeColor={activeColor}
          />
        );
      })}
    </View>
  );
}

function TabItem({ isFocused, onPress, Icon, label, isDark, theme, activeColor }: any) {
  const animatedValue = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    animatedValue.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 100,
    });
  }, [isFocused]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: isFocused ? `${activeColor}15` : 'transparent',
      paddingHorizontal: interpolate(animatedValue.value, [0, 1], [10, 16], Extrapolate.CLAMP),
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      height: 42,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      opacity: animatedValue.value,
      maxWidth: interpolate(animatedValue.value, [0, 1], [0, 100], Extrapolate.CLAMP),
      marginLeft: interpolate(animatedValue.value, [0, 1], [0, 8], Extrapolate.CLAMP),
    };
  });

  return (
    <Pressable onPress={onPress} style={styles.tabItem}>
      <Animated.View style={containerStyle}>
        {Icon && Icon({
          focused: isFocused,
          color: isFocused ? activeColor : theme.tabIconDefault,
          size: 22
        })}
        <Animated.View style={[textStyle, { overflow: 'hidden' }]}>
          <ThemedText 
            numberOfLines={1}
            style={{ 
              color: isFocused ? activeColor : theme.tabIconDefault,
              fontWeight: '700',
              fontSize: 14
            }}
          >
            {label}
          </ThemedText>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 75,
    borderTopWidth: 0,
    elevation: 20,
    ...Shadows.card,
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 15,
    left: 15,
    right: 15,
    borderRadius: 38,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
