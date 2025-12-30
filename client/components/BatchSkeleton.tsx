import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export const BatchSkeleton = () => {
  const { theme, isDark } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={[
      styles.card, 
      { backgroundColor: isDark ? theme.backgroundSecondary : '#fff' }
    ]}>
      <View style={styles.imagePlaceholder}>
        <Animated.View style={[
          styles.shimmer,
          { transform: [{ translateX }] }
        ]}>
          <LinearGradient
            colors={['transparent', isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <View style={styles.info}>
        <View style={[styles.titleLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
        <View style={[styles.descLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 200,
    borderRadius: 12,
    marginRight: Spacing.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  imagePlaceholder: {
    height: 120,
    width: '100%',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  info: {
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  titleLine: {
    height: 16,
    width: '80%',
    borderRadius: 4,
  },
  descLine: {
    height: 12,
    width: '60%',
    borderRadius: 4,
    marginTop: 4,
  },
});
