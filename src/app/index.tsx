import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { TimeScaleSelector } from '@/components/TimeScaleSelector';
import { VerticalTimeline } from '@/components/VerticalTimeline';
import { timelineTheme } from '@/constants/theme';
import { createMockCommitments } from '@/data/mockCommitments';
import { addDays, getVisibleWindow, startOfDay } from '@/domain/workload';
import type { Commitment, CommitmentDifficulty, TimeRange } from '@/types/commitment';

function atHour(date: Date, hour: number) {
  const next = new Date(date);
  next.setHours(hour, 0, 0, 0);
  return next;
}

export default function HomeScreen() {
  const [range, setRange] = useState<TimeRange>('week');
  const insets = useSafeAreaInsets();
  const now = useMemo(() => new Date(), []);
  const [commitments, setCommitments] = useState<Commitment[]>(() => createMockCommitments(now));
  const visibleWindow = useMemo(() => getVisibleWindow(range, now), [range, now]);
  const bottomPadding = Math.max(18, insets.bottom + 14);

  const topInset = insets.top;

  // Add modal state (in-memory only)
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<CommitmentDifficulty>(2);
  const [dueInDays, setDueInDays] = useState('3');
  const [dueHour, setDueHour] = useState('18');
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setTitle('');
    setDifficulty(2);
    setDueInDays('3');
    setDueHour('18');
    setError(null);
  }

  function handleAdd() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Title is required');
      return;
    }
    const days = Number.parseInt(dueInDays, 10);
    const hour = Number.parseInt(dueHour, 10);
    if (Number.isNaN(days) || days < 0 || days > 60) {
      setError('Due in days must be 0-60');
      return;
    }
    if (Number.isNaN(hour) || hour < 0 || hour > 23) {
      setError('Due hour must be 0-23');
      return;
    }

    const today = startOfDay(now);
    // Start now (so it appears as active/future correctly), due as today + days at hour
    const startAt = now.toISOString();
    const dueAt = atHour(addDays(today, days), hour).toISOString();

    if (new Date(dueAt).getTime() <= new Date(startAt).getTime()) {
      setError('Due date must be after now');
      return;
    }

    const newCommitment: Commitment = {
      id: `commitment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: trimmed,
      startAt,
      dueAt,
      difficulty,
    };

    setCommitments((prev) => [...prev, newCommitment]);
    setShowAdd(false);
    resetForm();
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { paddingBottom: bottomPadding }]}> 
      <VerticalTimeline
        commitments={commitments}
        now={now}
        range={range}
        windowEnd={visibleWindow.end}
        windowStart={visibleWindow.start}
      />

      <View pointerEvents="box-none" style={[styles.topOverlay, { paddingTop: topInset + 10 }]}>
        <View pointerEvents="none" style={[styles.overlayMask, { top: -topInset }]} />
        <Text style={styles.title}>D E A D L I N E S</Text>
        <Pressable accessibilityLabel="Menu" style={[styles.menuButton, { top: topInset + 7 }]}>
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
        <Pressable
          accessibilityLabel="Add commitment"
          onPress={() => {
            resetForm();
            setShowAdd(true);
          }}
          style={styles.circleButton}>
          <Text style={styles.plus}>+</Text>
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => {
          setShowAdd(false);
          resetForm();
        }}
        statusBarTranslucent
        transparent
        visible={showAdd}>
        <View style={styles.modalOverlay}>
          <Pressable
            onPress={() => {
              setShowAdd(false);
              resetForm();
            }}
            style={styles.modalBackdrop}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New commitment</Text>
            <Text style={styles.modalSubtitle}>In-memory only — appears instantly on the timeline</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput
              autoFocus
              onChangeText={(v) => {
                setTitle(v);
                if (error) setError(null);
              }}
              placeholder="e.g. Final essay"
              placeholderTextColor={timelineTheme.colors.mutedText}
              style={styles.input}
              value={title}
            />

            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.difficultyRow}>
              {([1, 2, 3] as CommitmentDifficulty[]).map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setDifficulty(level)}
                  style={[styles.difficultyButton, difficulty === level && styles.difficultyButtonActive]}>
                  <Text style={[styles.difficultyText, difficulty === level && styles.difficultyTextActive]}>
                    {level === 1 ? 'Easy' : level === 2 ? 'Medium' : 'Hard'} · {level}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.rowField}>
                <Text style={styles.label}>Due in (days)</Text>
                <TextInput
                  inputMode="numeric"
                  keyboardType="number-pad"
                  onChangeText={(v) => {
                    setDueInDays(v.replace(/[^0-9]/g, ''));
                    if (error) setError(null);
                  }}
                  style={styles.input}
                  value={dueInDays}
                />
              </View>
              <View style={styles.rowField}>
                <Text style={styles.label}>Due hour (0-23)</Text>
                <TextInput
                  inputMode="numeric"
                  keyboardType="number-pad"
                  onChangeText={(v) => {
                    setDueHour(v.replace(/[^0-9]/g, ''));
                    if (error) setError(null);
                  }}
                  style={styles.input}
                  value={dueHour}
                />
              </View>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setShowAdd(false);
                  resetForm();
                }}
                style={[styles.actionButton, styles.cancelButton]}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAdd} style={[styles.actionButton, styles.addButton]}>
                <Text style={styles.addText}>Add to timeline</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    gap: 10,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 30,
  },
  overlayMask: {
    backgroundColor: timelineTheme.colors.background,
    bottom: -10,
    left: 0,
    opacity: 0.96,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  title: {
    color: timelineTheme.colors.text,
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 28,
    paddingHorizontal: 48,
    textAlign: 'center',
    width: '100%',
    zIndex: 1,
  },
  menuButton: {
    gap: 5,
    padding: 8,
    position: 'absolute',
    right: 16,
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
    borderTopColor: 'rgba(75, 75, 75, 0.35)',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    minHeight: 66,
    paddingBottom: 4,
    paddingHorizontal: 18,
    paddingTop: 16,
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
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.62)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalBackdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modalCard: {
    backgroundColor: '#121212',
    borderColor: timelineTheme.colors.outline,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 420,
    padding: 18,
    width: '100%',
  },
  modalTitle: {
    color: timelineTheme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: timelineTheme.colors.mutedText,
    fontSize: 12,
    marginBottom: 16,
    marginTop: 4,
  },
  label: {
    color: timelineTheme.colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderColor: timelineTheme.colors.outline,
    borderRadius: 10,
    borderWidth: 1,
    color: timelineTheme.colors.text,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderColor: timelineTheme.colors.outline,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  difficultyButtonActive: {
    backgroundColor: timelineTheme.colors.text,
    borderColor: timelineTheme.colors.text,
  },
  difficultyText: {
    color: timelineTheme.colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyTextActive: {
    color: '#111111',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  error: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    paddingVertical: 13,
  },
  cancelButton: {
    backgroundColor: '#1A1A1A',
    borderColor: timelineTheme.colors.outline,
    borderWidth: 1,
  },
  cancelText: {
    color: timelineTheme.colors.text,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: timelineTheme.colors.text,
  },
  addText: {
    color: '#111111',
    fontWeight: '800',
  },
});
