import { StyleSheet, View } from 'react-native';

import { timelineTheme } from '@/constants/theme';

type Props = {
  scale?: number;
  fatigue?: number;
};

export function Runner({ scale = 1, fatigue = 0 }: Props) {
  const tired = fatigue >= 4;
  const exhausted = fatigue >= 6;
  const opacity = exhausted ? 0.48 : tired ? 0.7 : 0.9;
  const lean = exhausted ? '22deg' : tired ? '13deg' : '-4deg';

  return (
    <View style={[styles.runner, { opacity, transform: [{ scale }] }]}>
      <View style={[styles.figure, { transform: [{ rotate: lean }] }]}>
        <View style={styles.head} />
        <View style={styles.torso} />
        <View style={[styles.arm, styles.armRear, tired && styles.armRearTired]} />
        <View style={[styles.arm, styles.armFront, tired && styles.armFrontTired]} />
        <View style={[styles.leg, styles.legRear, exhausted && styles.legRearExhausted]} />
        <View style={[styles.leg, styles.legFront, exhausted && styles.legFrontExhausted]} />
      </View>
      <View style={styles.ground} />
    </View>
  );
}

const ink = timelineTheme.colors.active;

const styles = StyleSheet.create({
  runner: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'flex-end',
    width: 28,
  },
  figure: {
    height: 31,
    position: 'relative',
    width: 23,
  },
  head: {
    backgroundColor: ink,
    borderRadius: 4,
    height: 5.5,
    left: 14,
    position: 'absolute',
    top: 1,
    width: 5.5,
  },
  torso: {
    backgroundColor: ink,
    borderRadius: 999,
    height: 14,
    left: 11.5,
    position: 'absolute',
    top: 6.5,
    transform: [{ rotate: '8deg' }],
    width: 1.7,
  },
  arm: {
    backgroundColor: ink,
    borderRadius: 999,
    height: 12,
    position: 'absolute',
    top: 8,
    width: 1.5,
  },
  armRear: {
    left: 10,
    transform: [{ rotate: '42deg' }],
  },
  armFront: {
    left: 14,
    transform: [{ rotate: '-48deg' }],
  },
  armRearTired: {
    transform: [{ rotate: '18deg' }],
  },
  armFrontTired: {
    transform: [{ rotate: '-18deg' }],
  },
  leg: {
    backgroundColor: ink,
    borderRadius: 999,
    height: 14.5,
    position: 'absolute',
    top: 18.5,
    width: 1.7,
  },
  legRear: {
    left: 10,
    transform: [{ rotate: '34deg' }],
  },
  legFront: {
    left: 14,
    transform: [{ rotate: '-38deg' }],
  },
  legRearExhausted: {
    transform: [{ rotate: '18deg' }],
  },
  legFrontExhausted: {
    transform: [{ rotate: '-18deg' }],
  },
  ground: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    height: 1,
    width: 20,
  },
});
