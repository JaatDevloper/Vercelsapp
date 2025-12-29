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
import { Colors, Spacing, Shadows, Typography } from '@/constants/theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { ThemedText } from './ThemedText';

const { width } = Dimensions.get('window');

export default function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme, isDark } = useTheme();
  const TAB_WIDTH = width / state.routes.length;
  
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

        return (
          <TabItem
            key={route.key}
            isFocused={isFocused}
            onPress={onPress}
            Icon={Icon}
            label={label}
            isDark={isDark}
            theme={theme}
          />
        );
      })}
    </View>
  );
}

function TabItem({ isFocused, onPress, Icon, label, isDark, theme }: any) {
  const animatedValue = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    animatedValue.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 100,
    });
  }, [isFocused]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: isFocused 
        ? (isDark ? Colors.dark.primary + '20' : Colors.light.primary + '20')
        : 'transparent',
      paddingHorizontal: interpolate(animatedValue.value, [0, 1], [0, 12], Extrapolate.CLAMP),
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      height: 40,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      opacity: animatedValue.value,
      width: interpolate(animatedValue.value, [0, 1], [0, 70], Extrapolate.CLAMP),
      marginLeft: interpolate(animatedValue.value, [0, 1], [0, 6], Extrapolate.CLAMP),
    };
  });

  return (
    <Pressable onPress={onPress} style={styles.tabItem}>
      <Animated.View style={containerStyle}>
        {Icon && Icon({
          focused: isFocused,
          color: isFocused 
            ? (isDark ? Colors.dark.primary : Colors.light.primary) 
            : theme.tabIconDefault,
          size: 22
        })}
        <Animated.View style={[textStyle, { overflow: 'hidden' }]}>
          <ThemedText 
            numberOfLines={1}
            style={{ 
              color: isFocused ? (isDark ? Colors.dark.primary : Colors.light.primary) : theme.tabIconDefault,
              fontWeight: '600',
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
    height: 70,
    borderTopWidth: 0,
    elevation: 20,
    ...Shadows.card,
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 10,
    left: 20,
    right: 20,
    borderRadius: 35,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
