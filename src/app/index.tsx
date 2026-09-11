import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TimeScaleSelector } from '@/components/TimeScaleSelector';
import { VerticalTimeline } from '@/components/VerticalTimeline';
import { timelineTheme } from '@/constants/theme';
import { createMockCommitments } from '@/data/mockCommitments';
import { getVisibleWindow } from '@/domain/workload';
import type { Commitment, TimeRange } from '@/types/commitment';

export default function HomeScreen() {
  const [range, setRange] = useState<TimeRange>('week');
  const [selectedCommitment, setSelectedCommitment] = useState<Commitment | null>(null);
  const now = useMemo(() => new Date(), []);
  const commitments = useMemo(() => createMockCommitments(now), [now]);
  const visibleWindow = useMemo(() => getVisibleWindow(range, now), [range, now]);

  return (
    <SafeAreaView style={styles.screen}>
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
        onSelectCommitment={setSelectedCommitment}
        range={range}
        selectedCommitment={selectedCommitment}
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
    paddingBottom: 18,
    paddingHorizontal: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 76,
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
    top: 18,
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
    minHeight: 76,
    paddingHorizontal: 6,
  },
  circleButton: {
    alignItems: 'center',
    borderColor: timelineTheme.colors.outline,
    borderRadius: 34,
    borderWidth: 1,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  listLine: {
    backgroundColor: timelineTheme.colors.text,
    borderRadius: 2,
    height: 3,
    marginVertical: 3,
    width: 25,
  },
  plus: {
    color: timelineTheme.colors.text,
    fontSize: 42,
    fontWeight: '200',
    lineHeight: 46,
  },
});
