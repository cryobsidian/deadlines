import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { timelineTheme } from '@/constants/theme';

type Props = {
  scale?: number;
  fatigue?: number;
};

export function Runner({ scale = 1, fatigue = 0 }: Props) {
  const cycle = useRef(new Animated.Value(0)).current;
  const clampedFatigue = Math.max(0, Math.min(fatigue, 6));

  useEffect(() => {
    cycle.setValue(0);
    const duration = 760 + clampedFatigue * 130;
    const animation = Animated.loop(
      Animated.timing(cycle, {
        duration,
        toValue: 1,
        useNativeDriver: true,
      }),
    );

    animation.start();
    return () => animation.stop();
  }, [clampedFatigue, cycle]);

  const bodyY = cycle.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -1.4, 0, -1.1, 0],
  });
  const bodyLean = cycle.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-3deg', '2deg', '-3deg'],
  });
  const frontLegRotate = cycle.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-24deg', '24deg', '-24deg'],
  });
  const backLegRotate = cycle.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['24deg', '-24deg', '24deg'],
  });
  const frontArmRotate = cycle.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['28deg', '-28deg', '28deg'],
  });
  const backArmRotate = cycle.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-28deg', '28deg', '-28deg'],
  });

  const postureOffset = useMemo(() => Math.min(4, clampedFatigue * 0.55), [clampedFatigue]);
  const opacity = Math.max(0.58, 1 - clampedFatigue * 0.055);

  return (
    <Animated.View
      style={[
        styles.runner,
        {
          opacity,
          transform: [{ scale }, { translateY: bodyY }],
        },
      ]}>
      <Animated.View
        style={[
          styles.body,
          {
            transform: [{ translateY: postureOffset }, { rotate: bodyLean }],
          },
        ]}>
        <View style={styles.head} />
        <View style={styles.torso} />

        <Animated.View style={[styles.limb, styles.armBack, { transform: [{ rotate: backArmRotate }] }]} />
        <Animated.View style={[styles.limb, styles.armFront, { transform: [{ rotate: frontArmRotate }] }]} />
        <Animated.View style={[styles.limb, styles.legBack, { transform: [{ rotate: backLegRotate }] }]} />
        <Animated.View style={[styles.limb, styles.legFront, { transform: [{ rotate: frontLegRotate }] }]} />
      </Animated.View>
      <View style={[styles.shadow, { opacity: 0.18 + clampedFatigue * 0.02 }]} />
    </Animated.View>
  );
}

const lineColor = timelineTheme.colors.active;

const styles = StyleSheet.create({
  runner: {
    alignItems: 'center',
    height: 52,
    justifyContent: 'flex-end',
    width: 48,
  },
  body: {
    height: 42,
    position: 'relative',
    width: 32,
  },
  head: {
    backgroundColor: 'transparent',
    borderColor: lineColor,
    borderRadius: 5,
    borderWidth: 1.5,
    height: 10,
    left: 18,
    position: 'absolute',
    top: 1,
    width: 10,
  },
  torso: {
    backgroundColor: lineColor,
    borderRadius: 2,
    height: 20,
    left: 15,
    position: 'absolute',
    top: 11,
    width: 2.2,
  },
  limb: {
    backgroundColor: lineColor,
    borderRadius: 2,
    height: 18,
    position: 'absolute',
    transformOrigin: 'top center',
    width: 2,
  },
  armBack: {
    left: 13,
    top: 14,
  },
  armFront: {
    left: 18,
    top: 14,
  },
  legBack: {
    height: 20,
    left: 14,
    top: 29,
  },
  legFront: {
    height: 20,
    left: 18,
    top: 29,
  },
  shadow: {
    backgroundColor: lineColor,
    borderRadius: 999,
    height: 1,
    marginTop: 1,
    width: 24,
  },
});
