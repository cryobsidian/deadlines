import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getCommitmentStatus, getTimePosition } from '@/domain/workload';
import type { Commitment, TimeRange } from '@/types/commitment';

type Props = {
  commitment: Commitment;
  now: Date;
  windowStart: Date;
  windowEnd: Date;
  height: number;
  topInset: number;
  activeCount: number;
  range: TimeRange;
  onPressLine: (commitment: Commitment) => void;
};

const categoryAccent: Record<string, string> = {
  university: '#E8B59E',
  work: '#9FC7E8',
  health: '#9DD2AD',
  personal: '#CBB1E6',
  social: '#E0C27D',
};

function getDropTrackY(date: Date, windowStart: Date, windowEnd: Date, height: number, topInset: number) {
  return topInset + (1 - getTimePosition(date, windowStart, windowEnd)) * height;
}

function titleCase(value?: string) {
  if (!value) return 'Personal';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function CommitmentLane({ commitment, now, windowStart, windowEnd, height, topInset, onPressLine }: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const status = getCommitmentStatus(commitment, now);
  if (status === 'completed') return null;

  const startY = getDropTrackY(new Date(commitment.startAt), windowStart, windowEnd, height, topInset);
  const dueY = getDropTrackY(new Date(commitment.dueAt), windowStart, windowEnd, height, topInset);
  const currentY = getDropTrackY(now, windowStart, windowEnd, height, topInset);
  const futureTop = Math.min(startY, dueY);
  const futureBottom = Math.max(startY, dueY);
  const activeTop = Math.min(dueY, currentY);
  const activeBottom = Math.max(dueY, currentY);

  const lineWidth = commitment.difficulty === 1 ? 0.9 : commitment.difficulty === 2 ? 1.2 : 1.55;
  const timelineHeight = height + topInset;
  const accent = categoryAccent[commitment.category ?? ''] ?? '#AAA6A1';
  const interactionTop = status === 'future' ? futureTop : activeTop;
  const interactionBottom = status === 'future' ? futureBottom : activeBottom;
  const previewTop = Math.max(topInset + 12, Math.min(dueY - 52, timelineHeight - 74));

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <Pressable
        accessibilityLabel={`Open ${commitment.title}`}
        delayLongPress={260}
        onHoverIn={() => setShowPreview(true)}
        onHoverOut={() => setShowPreview(false)}
        onLongPress={() => setShowPreview(true)}
        onPress={() => onPressLine(commitment)}
        onPressOut={() => setShowPreview(false)}
        style={[
          styles.interactionTrack,
          {
            height: Math.max(26, interactionBottom - interactionTop),
            left: '50%',
            marginLeft: -14,
            top: interactionTop,
          },
        ]}
      />

      {showPreview ? (
        <View pointerEvents="none" style={[styles.preview, { top: previewTop }]}>
          <View style={[styles.previewDot, { backgroundColor: accent }]} />
          <View style={styles.previewCopy}>
            <Text numberOfLines={1} style={styles.previewTitle}>{commitment.title}</Text>
            <Text numberOfLines={1} style={styles.previewMeta}>{titleCase(commitment.category)} · {titleCase(commitment.priority)}</Text>
          </View>
        </View>
      ) : null}

      <View pointerEvents="none" style={[styles.line, styles.futureLine, { height: Math.max(16, futureBottom - futureTop), left: '50%', marginLeft: -lineWidth / 2, top: futureTop, width: lineWidth }]} />
      {status !== 'future' && (
        <View pointerEvents="none" style={[styles.line, styles.activeLine, { height: Math.max(18, activeBottom - activeTop), left: '50%', marginLeft: -lineWidth / 2, top: activeTop, width: lineWidth }]} />
      )}
      {/* pole tip + horizontal finish cap */}
      <View
        pointerEvents="none"
        style={[
          styles.poleTip,
          {
            backgroundColor: '#EAE7E3',
            left: '50%',
            marginLeft: -lineWidth / 2,
            top: Math.max(0, dueY - 4),
            width: lineWidth,
          },
        ]}
      />
      <View pointerEvents="none" style={[styles.finishLine, { backgroundColor: '#EAE7E3', left: '50%', marginLeft: -7, top: Math.max(0, dueY - 0.9) }]} />
      {/* centered finish-line flag — black/white checkered, with V notch */}
      <View
        pointerEvents="none"
        style={[
          styles.finishFlag,
          {
            left: '50%',
            marginLeft: -10.25,
            top: Math.max(0, dueY - 10.5),
          },
        ]}>
        <View style={styles.flagInner}>
          <View style={styles.flagRow}>
            <View style={[styles.flagCell, { backgroundColor: '#F1EFEC' }]} />
            <View style={[styles.flagCell, { backgroundColor: '#111111' }]} />
            <View style={[styles.flagCell, { backgroundColor: '#F1EFEC' }]} />
            <View style={[styles.flagCell, { backgroundColor: '#111111' }]} />
            <View style={[styles.flagCell, { backgroundColor: '#F1EFEC' }]} />
          </View>
          <View style={styles.flagRow}>
            <View style={[styles.flagCell, { backgroundColor: '#111111' }]} />
            <View style={[styles.flagCell, { backgroundColor: '#F1EFEC' }]} />
            <View style={[styles.flagCell, { backgroundColor: '#111111' }]} />
            <View style={[styles.flagCell, { backgroundColor: '#F1EFEC' }]} />
            <View style={[styles.flagCell, { backgroundColor: '#111111' }]} />
          </View>
          <View style={styles.flagRow}>
            <View style={[styles.flagCell, { backgroundColor: '#F1EFEC' }]} />
            <View style={[styles.flagCell, { backgroundColor: '#111111' }]} />
            <View style={[styles.flagCell, { backgroundColor: '#F1EFEC' }]} />
            <View style={[styles.flagCell, { backgroundColor: '#111111' }]} />
            <View style={[styles.flagCell, { backgroundColor: '#F1EFEC' }]} />
          </View>
        </View>
        <View style={styles.flagNotch} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flex: 1, height: '100%', minWidth: 42, position: 'relative', zIndex: 5 },
  interactionTrack: { position: 'absolute', width: 28, zIndex: 12 },
  line: { borderRadius: 999, position: 'absolute', zIndex: 4 },
  futureLine: { backgroundColor: '#333333', opacity: 0.62 },
  activeLine: { backgroundColor: '#E3E0DC', opacity: 0.92, zIndex: 6 },
  poleTip: { borderRadius: 999, height: 6, position: 'absolute', zIndex: 9 },
  finishLine: { borderRadius: 1, height: 1.6, position: 'absolute', width: 14, zIndex: 9 },
  finishFlag: {
    backgroundColor: '#0C0C0C',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 1.2,
    borderWidth: 0.7,
    height: 10.5,
    overflow: 'hidden',
    position: 'absolute',
    width: 20.5,
    zIndex: 10,
  },
  flagInner: { flex: 1, paddingRight: 1.5 },
  flagRow: { flexDirection: 'row', flex: 1 },
  flagCell: { flex: 1 },
  flagNotch: {
    backgroundColor: '#050505',
    borderColor: 'rgba(255,255,255,0.18)',
    borderLeftWidth: 0.7,
    borderTopWidth: 0.7,
    height: 7,
    marginTop: -3.5,
    position: 'absolute',
    right: -3.8,
    top: '50%',
    transform: [{ rotate: '45deg' }],
    width: 7,
  },
  preview: { alignItems: 'center', backgroundColor: '#111111', borderColor: '#343434', borderRadius: 10, borderWidth: 1, flexDirection: 'row', gap: 7, left: '50%', marginLeft: -54, maxWidth: 132, minWidth: 108, paddingHorizontal: 9, paddingVertical: 7, position: 'absolute', zIndex: 30 },
  previewDot: { borderRadius: 99, height: 6, width: 6 },
  previewCopy: { flex: 1, minWidth: 0 },
  previewTitle: { color: '#F0EDE9', fontSize: 10, fontWeight: '700' },
  previewMeta: { color: '#7F7F7F', fontSize: 8.5, marginTop: 2 },
});