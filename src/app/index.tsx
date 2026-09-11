import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { TimeScaleSelector } from '@/components/TimeScaleSelector';
import { VerticalTimeline } from '@/components/VerticalTimeline';
import { timelineTheme } from '@/constants/theme';
import { createMockCommitments } from '@/data/mockCommitments';
import { getVisibleWindow } from '@/domain/workload';
import type { TimeRange } from '@/types/commitment';

export default function HomeScreen() {
  const [range, setRange] = useState<TimeRange>('week');
  const insets = useSafeAreaInsets();
  const now = useMemo(() => new Date(), []);
  const commitments = useMemo(() => createMockCommitments(now), [now]);
  const visibleWindow = useMemo(() => getVisibleWindow(range, now), [range, now]);
  const bottomPadding = Math.max(18, insets.bottom + 14);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { paddingBottom: bottomPadding }]}> 
      <VerticalTimeline
        commitments={commitments}
        now={now}
        range={range}
        windowEnd={visibleWindow.end}
        windowStart={visibleWindow.start}
      />

      <View pointerEvents="box-none" style={styles.topOverlay}>
        <View pointerEvents="none" style={styles.overlayMask} />
        <Text style={styles.title}>D E A D L I N E S</Text>
        <Pressable accessibilityLabel="Menu" style={styles.menuButton}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </Pressable>
        <TimeScaleSelector value={range} onChange={setRange} />
      </View>

      <View style={styles.bottomControls}>
        <Pressable accessibilityLabel="Commitment list" style={styles.circleButton}>
          <View style={styles.listLine} />
          <View style={styles.listLine} />
          <View style={styles.listLine} />
        </Pressable>
        <Pressable accessibilityLabel="Add commitment" style={styles.circleButton}>
          <Text style={styles.plus}>+</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: timelineTheme.colors.background,
    flex: 1,
    paddingHorizontal: 8,
    position: 'relative',
  },
  topOverlay: {
    alignItems: 'flex-start',
    left: 92,
    paddingTop: 10,
    position: 'absolute',
    right: 16,
    top: 0,
    zIndex: 30,
  },
  overlayMask: {
    backgroundColor: timelineTheme.colors.background,
    bottom: -10,
    left: -14,
    opacity: 0.96,
    position: 'absolute',
    right: -16,
    top: 0,
  },
  title: {
    color: timelineTheme.colors.text,
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 28,
    marginLeft: 8,
    textAlign: 'left',
    zIndex: 1,
  },
  menuButton: {
    gap: 5,
    padding: 8,
    position: 'absolute',
    right: 0,
    top: 7,
    zIndex: 2,
  },
  menuLine: {
    backgroundColor: timelineTheme.colors.text,
    height: 2,
    width: 28,
  },
  bottomControls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 66,
    paddingHorizontal: 18,
    paddingTop: 8,
    zIndex: 20,
  },
  circleButton: {
    alignItems: 'center',
    borderColor: timelineTheme.colors.outline,
    borderRadius: 30,
    borderWidth: 1,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  listLine: {
    backgroundColor: timelineTheme.colors.text,
    borderRadius: 2,
    height: 3,
    marginVertical: 3,
    width: 24,
  },
  plus: {
    color: timelineTheme.colors.text,
    fontSize: 38,
    fontWeight: '200',
    lineHeight: 42,
  },
});
