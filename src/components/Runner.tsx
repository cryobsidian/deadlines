import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { timelineTheme } from '@/constants/theme';

type Props = {
  scale?: number;
  fatigue?: number;
};

export function Runner({ scale = 1, fatigue = 0 }: Props) {
  const motion = useRef(new Animated.Value(0)).current;
  const clampedFatigue = Math.max(0, Math.min(fatigue, 6));

  useEffect(() => {
    motion.setValue(0);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          duration: 900 + clampedFatigue * 120,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(motion, {
          duration: 900 + clampedFatigue * 120,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [clampedFatigue, motion]);

  // Deliberately subtle: the character should feel alive, not bounce like a game sprite.
  const lift = motion.interpolate({ inputRange: [0, 1], outputRange: [0, -0.7] });
  const armShift = motion.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] });
  const legShift = motion.interpolate({ inputRange: [0, 1], outputRange: ['5deg', '-5deg'] });
  const fatigueLean = Math.min(10, clampedFatigue * 1.4);
  const opacity = Math.max(0.52, 0.94 - clampedFatigue * 0.055);

  return (
    <Animated.View
      style={[
        styles.runner,
        {
          opacity,
          transform: [{ scale }, { translateY: lift }],
        },
      ]}>
      <View style={[styles.body, { transform: [{ rotate: `${fatigueLean}deg` }] }]}>
        <View style={styles.head} />
        <View style={styles.torso} />
        <Animated.View style={[styles.limb, styles.armBack, { transform: [{ rotate: armShift }] }]} />
        <Animated.View style={[styles.limb, styles.armFront, { transform: [{ rotate: armShift }] }]} />
        <Animated.View style={[styles.limb, styles.legBack, { transform: [{ rotate: legShift }] }]} />
        <Animated.View style={[styles.limb, styles.legFront, { transform: [{ rotate: legShift }] }]} />
      </View>
      <View style={styles.shadow} />
    </Animated.View>
  );
}

const lineColor = timelineTheme.colors.active;

const styles = StyleSheet.create({
  runner: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'flex-end',
    width: 34,
  },
  body: {
    height: 34,
    position: 'relative',
    width: 26,
  },
  head: {
    backgroundColor: lineColor,
    borderRadius: 4,
    height: 7,
    left: 15,
    position: 'absolute',
    top: 1,
    width: 7,
  },
  torso: {
    backgroundColor: lineColor,
    borderRadius: 999,
    height: 15,
    left: 12,
    position: 'absolute',
    top: 8,
    width: 1.6,
  },
  limb: {
    backgroundColor: lineColor,
    borderRadius: 999,
    position: 'absolute',
    width: 1.4,
  },
  armBack: {
    height: 12,
    left: 10,
    top: 10,
  },
  armFront: {
    height: 12,
    left: 15,
    top: 10,
  },
  legBack: {
    height: 14,
    left: 10,
    top: 21,
  },
  legFront: {
    height: 14,
    left: 15,
    top: 21,
  },
  shadow: {
    backgroundColor: lineColor,
    borderRadius: 999,
    height: 1,
    marginTop: 1,
    opacity: 0.14,
    width: 17,
  },
});
