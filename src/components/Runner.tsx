import { StyleSheet, View } from 'react-native';

import { timelineTheme } from '@/constants/theme';

type Props = {
  scale?: number;
  fatigue?: number;
};

export function Runner({ scale = 1, fatigue = 0 }: Props) {
  const tired = fatigue >= 4;
  const exhausted = fatigue >= 6;
  const opacity = exhausted ? 0.5 : tired ? 0.72 : 0.94;
  const lean = exhausted ? '22deg' : tired ? '13deg' : '-5deg';

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
    height: 46,
    justifyContent: 'flex-end',
    width: 34,
  },
  figure: {
    height: 39,
    position: 'relative',
    width: 28,
  },
  head: {
    backgroundColor: ink,
    borderRadius: 5,
    height: 7,
    left: 17,
    position: 'absolute',
    top: 1,
    width: 7,
  },
  torso: {
    backgroundColor: ink,
    borderRadius: 999,
    height: 17,
    left: 14,
    position: 'absolute',
    top: 8,
    transform: [{ rotate: '8deg' }],
    width: 2,
  },
  arm: {
    backgroundColor: ink,
    borderRadius: 999,
    height: 15,
    position: 'absolute',
    top: 10,
    width: 1.8,
  },
  armRear: {
    left: 12,
    transform: [{ rotate: '42deg' }],
  },
  armFront: {
    left: 17,
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
    height: 18,
    position: 'absolute',
    top: 23,
    width: 2,
  },
  legRear: {
    left: 12,
    transform: [{ rotate: '34deg' }],
  },
  legFront: {
    left: 17,
    transform: [{ rotate: '-38deg' }],
  },
  legRearExhausted: {
    transform: [{ rotate: '18deg' }],
  },
  legFrontExhausted: {
    transform: [{ rotate: '-18deg' }],
  },
  ground: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    height: 1,
    width: 26,
  },
});
