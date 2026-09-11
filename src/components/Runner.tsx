import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { timelineTheme } from '@/constants/theme';

type Props = {
  scale?: number;
  fatigue?: number;
};

export function Runner({ scale = 1, fatigue = 0 }: Props) {
  const [bob] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          duration: 460 + fatigue * 140,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          duration: 460 + fatigue * 140,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [bob, fatigue]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const lean = bob.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '8deg'] });

  return (
    <Animated.View style={[styles.runner, { transform: [{ scale }, { translateY }] }]}>
      <Animated.View style={[styles.body, { transform: [{ rotate: lean }] }]}>
        <View style={styles.head} />
        <View style={styles.torso} />
        <View style={[styles.arm, styles.armBack]} />
        <View style={[styles.arm, styles.armFront]} />
        <View style={[styles.leg, styles.legBack]} />
        <View style={[styles.leg, styles.legFront]} />
      </Animated.View>
      <View style={styles.shadow} />
    </Animated.View>
  );
}

const lineColor = timelineTheme.colors.active;

const styles = StyleSheet.create({
  runner: {
    alignItems: 'center',
    height: 58,
    justifyContent: 'flex-end',
    width: 54,
  },
  body: {
    height: 48,
    position: 'relative',
    width: 40,
  },
  head: {
    backgroundColor: lineColor,
    borderRadius: 7,
    height: 13,
    left: 23,
    position: 'absolute',
    top: 1,
    width: 13,
  },
  torso: {
    backgroundColor: lineColor,
    borderRadius: 4,
    height: 25,
    left: 18,
    position: 'absolute',
    top: 13,
    width: 8,
  },
  arm: {
    backgroundColor: lineColor,
    borderRadius: 3,
    height: 22,
    position: 'absolute',
    top: 16,
    width: 5,
  },
  armBack: {
    left: 12,
    transform: [{ rotate: '34deg' }],
  },
  armFront: {
    left: 27,
    transform: [{ rotate: '-45deg' }],
  },
  leg: {
    backgroundColor: lineColor,
    borderRadius: 3,
    height: 26,
    position: 'absolute',
    top: 33,
    width: 6,
  },
  legBack: {
    left: 12,
    transform: [{ rotate: '42deg' }],
  },
  legFront: {
    left: 27,
    transform: [{ rotate: '-34deg' }],
  },
  shadow: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    height: 2,
    marginTop: 2,
    width: 42,
  },
});


