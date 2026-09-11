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
      <View style={styles.header}>
        <Text style={styles.title}>DEADLINES</Text>
        <Pressable accessibilityLabel="Menu" style={styles.menuButton}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </Pressable>
      </View>

      <TimeScaleSelector value={range} onChange={setRange} />

      <VerticalTimeline
        commitments={commitments}
        now={now}
        range={range}
        windowEnd={visibleWindow.end}
        windowStart={visibleWindow.start}
      />

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
    paddingHorizontal: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 68,
    position: 'relative',
  },
  title: {
    color: timelineTheme.colors.text,
    fontSize: 26,
    fontWeight: '400',
    letterSpacing: 0,
  },
  menuButton: {
    gap: 5,
    padding: 10,
    position: 'absolute',
    right: 8,
    top: 14,
  },
  menuLine: {
    backgroundColor: timelineTheme.colors.text,
    height: 2,
    width: 30,
  },
  bottomControls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 66,
    paddingHorizontal: 8,
    paddingTop: 8,
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
