import React, { useEffect } from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue, 
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Shadows } from '@/constants/theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

export default function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme, isDark } = useTheme();
  const TAB_WIDTH = width / state.routes.length;
  const translateX = useSharedValue(state.index * TAB_WIDTH);

  useEffect(() => {
    translateX.value = withSpring(state.index * TAB_WIDTH, {
      damping: 15,
      stiffness: 100,
    });
  }, [state.index, TAB_WIDTH]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? theme.backgroundRoot : '#FFFFFF' }]}>
      <Animated.View 
        style={[
          styles.indicator, 
          { 
            width: TAB_WIDTH - Spacing.md,
            backgroundColor: isDark ? Colors.dark.primary + '20' : Colors.light.primary + '20',
          },
          animatedStyle
        ]} 
      />
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

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const Icon = options.tabBarIcon;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            {Icon && Icon({
              focused: isFocused,
              color: isFocused 
                ? (isDark ? Colors.dark.primary : Colors.light.primary) 
                : theme.tabIconDefault,
              size: 24
            })}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 0,
    elevation: 10,
    ...Shadows.card,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  indicator: {
    position: 'absolute',
    height: 45,
    borderRadius: 15,
    marginHorizontal: Spacing.sm / 2,
    left: Spacing.sm,
  },
});
