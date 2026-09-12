import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { TimeScaleSelector } from '@/components/TimeScaleSelector';
import { VerticalTimeline } from '@/components/VerticalTimeline';
import { createMockCommitments } from '@/data/mockCommitments';
import { addDays, getVisibleWindow, startOfDay } from '@/domain/workload';
import type {
  Commitment,
  CommitmentCategory,
  CommitmentDifficulty,
  CommitmentFlexibility,
  CommitmentPriority,
  TimeRange,
} from '@/types/commitment';

function atHour(date: Date, hour: number) {
  const next = new Date(date);
  next.setHours(hour, 0, 0, 0);
  return next;
}

const categories: CommitmentCategory[] = ['university', 'work', 'health', 'personal', 'social'];
const priorities: CommitmentPriority[] = ['low', 'medium', 'high', 'critical'];
const flexibilities: CommitmentFlexibility[] = ['fixed', 'flexible', 'droppable'];

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function timelineContentHeight(range: TimeRange) {
  if (range === 'day') return 920;
  if (range === 'month') return 1480;
  return 1120;
}

export default function HomeScreen() {
  const [range, setRange] = useState<TimeRange>('week');
  const insets = useSafeAreaInsets();
  const now = useMemo(() => new Date(), []);
  const [commitments, setCommitments] = useState<Commitment[]>(() => createMockCommitments(now));
  const visibleWindow = useMemo(() => getVisibleWindow(range, now), [range, now]);
  const bottomPadding = Math.max(16, insets.bottom + 10);
  const topInset = insets.top;
  const timelineScrollRef = useRef<ScrollView>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CommitmentCategory>('university');
  const [priority, setPriority] = useState<CommitmentPriority>('medium');
  const [difficulty, setDifficulty] = useState<CommitmentDifficulty>(2);
  const [flexibility, setFlexibility] = useState<CommitmentFlexibility>('flexible');
  const [dueInDays, setDueInDays] = useState('3');
  const [dueHour, setDueHour] = useState('18');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      timelineScrollRef.current?.scrollToEnd({ animated: false });
    }, 60);
    return () => clearTimeout(timer);
  }, [range]);

  function resetForm() {
    setTitle('');
    setCategory('university');
    setPriority('medium');
    setDifficulty(2);
    setFlexibility('flexible');
    setDueInDays('3');
    setDueHour('18');
    setError(null);
  }

  function closeAdd() {
    setShowAdd(false);
    resetForm();
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
      setError('Due in days must be 0–60');
      return;
    }
    if (Number.isNaN(hour) || hour < 0 || hour > 23) {
      setError('Due hour must be 0–23');
      return;
    }

    const today = startOfDay(now);
    const startAt = now.toISOString();
    const dueAt = atHour(addDays(today, days), hour).toISOString();
    if (new Date(dueAt).getTime() <= new Date(startAt).getTime()) {
      setError('Due date must be after now');
      return;
    }

    setCommitments((prev) => [
      ...prev,
      {
        id: `commitment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: trimmed,
        startAt,
        dueAt,
        category,
        priority,
        difficulty,
        flexibility,
      },
    ]);
    closeAdd();
  }

  function updateCommitment(id: string, patch: Partial<Commitment>) {
    setCommitments((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { paddingBottom: bottomPadding }]}>
      <ScrollView
        ref={timelineScrollRef}
        bounces
        contentContainerStyle={styles.timelineScrollContent}
        onContentSizeChange={() => timelineScrollRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
        style={styles.timelineScroll}>
        <View style={[styles.timelineCanvas, { height: timelineContentHeight(range) }]}>
          <VerticalTimeline
            commitments={commitments}
            now={now}
            onUpdateCommitment={updateCommitment}
            range={range}
            windowEnd={visibleWindow.end}
            windowStart={visibleWindow.start}
          />
        </View>
      </ScrollView>

      <View pointerEvents="box-none" style={[styles.topOverlay, { paddingTop: topInset + 6 }]}>
        <View pointerEvents="none" style={[styles.overlayMask, { top: -topInset }]} />
        <Text style={styles.title}>DEADLINES</Text>
        <Pressable accessibilityLabel="Menu" style={[styles.menuButton, { top: topInset + 4 }]}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </Pressable>
        <TimeScaleSelector value={range} onChange={setRange} />
      </View>

      <View style={styles.bottomControls}>
        <Pressable accessibilityLabel="Commitment list" style={styles.circleButton}>
          <View style={styles.listGlyph}>
            <View style={styles.listDot} /><View style={styles.listBar} />
            <View style={styles.listDot} /><View style={styles.listBar} />
            <View style={styles.listDot} /><View style={styles.listBar} />
          </View>
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

      <Modal animationType="fade" onRequestClose={closeAdd} statusBarTranslucent transparent visible={showAdd}>
        <View style={styles.modalOverlay}>
          <Pressable onPress={closeAdd} style={styles.modalBackdrop} />
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>New commitment</Text>
                  <Text style={styles.modalSubtitle}>Add only what changes your workload.</Text>
                </View>
                <Pressable onPress={closeAdd} style={styles.closeIcon}><Text style={styles.closeIconText}>×</Text></Pressable>
              </View>

              <Text style={styles.label}>Title</Text>
              <TextInput
                autoFocus
                onChangeText={(value) => {
                  setTitle(value);
                  if (error) setError(null);
                }}
                placeholder="e.g. Final essay"
                placeholderTextColor="#6E6E6E"
                style={styles.input}
                value={title}
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.chipWrap}>
                {categories.map((item) => (
                  <ChoiceChip key={item} label={titleCase(item)} selected={category === item} onPress={() => setCategory(item)} />
                ))}
              </View>

              <Text style={styles.label}>Priority</Text>
              <View style={styles.chipRow}>
                {priorities.map((item) => (
                  <ChoiceChip key={item} label={titleCase(item)} selected={priority === item} onPress={() => setPriority(item)} />
                ))}
              </View>

              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.chipRow}>
                {([1, 2, 3] as CommitmentDifficulty[]).map((level) => (
                  <ChoiceChip
                    key={level}
                    label={level === 1 ? 'Easy' : level === 2 ? 'Medium' : 'Hard'}
                    selected={difficulty === level}
                    onPress={() => setDifficulty(level)}
                  />
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.rowField}>
                  <Text style={styles.label}>Due in days</Text>
                  <TextInput
                    inputMode="numeric"
                    keyboardType="number-pad"
                    onChangeText={(value) => setDueInDays(value.replace(/[^0-9]/g, ''))}
                    style={styles.input}
                    value={dueInDays}
                  />
                </View>
                <View style={styles.rowField}>
                  <Text style={styles.label}>Due hour</Text>
                  <TextInput
                    inputMode="numeric"
                    keyboardType="number-pad"
                    onChangeText={(value) => setDueHour(value.replace(/[^0-9]/g, ''))}
                    style={styles.input}
                    value={dueHour}
                  />
                </View>
              </View>

              <Text style={styles.label}>Flexibility</Text>
              <View style={styles.chipRow}>
                {flexibilities.map((item) => (
                  <ChoiceChip key={item} label={titleCase(item)} selected={flexibility === item} onPress={() => setFlexibility(item)} />
                ))}
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable onPress={handleAdd} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Add to timeline</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ChoiceChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#050505',
    flex: 1,
    paddingHorizontal: 12,
    position: 'relative',
  },
  timelineScroll: {
    flex: 1,
    minHeight: 0,
  },
  timelineScrollContent: {
    flexGrow: 1,
  },
  timelineCanvas: {
    minHeight: 920,
    width: '100%',
  },
  topOverlay: {
    alignItems: 'center',
    gap: 10,
    left: 0,
    paddingHorizontal: 20,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 30,
  },
  overlayMask: {
    backgroundColor: '#050505',
    bottom: -12,
    left: 0,
    opacity: 0.97,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  title: {
    color: '#F1EFEC',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 4.5,
    lineHeight: 26,
    textAlign: 'center',
    width: '100%',
    zIndex: 1,
  },
  menuButton: {
    gap: 4,
    padding: 8,
    position: 'absolute',
    right: 15,
    zIndex: 2,
  },
  menuLine: {
    backgroundColor: '#C8C5C1',
    height: 1.2,
    width: 22,
  },
  bottomControls: {
    alignItems: 'center',
    backgroundColor: '#050505',
    borderTopColor: '#171717',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 0,
    minHeight: 72,
    paddingHorizontal: 16,
    paddingTop: 12,
    zIndex: 20,
  },
  circleButton: {
    alignItems: 'center',
    borderColor: '#4A4A4A',
    borderRadius: 28,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  listGlyph: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    height: 22,
    width: 26,
  },
  listDot: { backgroundColor: '#D9D6D2', borderRadius: 2, height: 3, width: 3 },
  listBar: { backgroundColor: '#D9D6D2', height: 1.5, width: 18 },
  plus: { color: '#E8E5E1', fontSize: 30, fontWeight: '200', lineHeight: 34 },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.74)',
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  modalBackdrop: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  modalCard: {
    backgroundColor: '#111111',
    borderColor: '#3C3C3C',
    borderRadius: 18,
    borderWidth: 1,
    maxHeight: '88%',
    maxWidth: 430,
    overflow: 'hidden',
    width: '100%',
  },
  modalContent: { padding: 18 },
  modalHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  modalTitle: { color: '#F3F0EC', fontSize: 18, fontWeight: '800' },
  modalSubtitle: { color: '#868686', fontSize: 11, marginTop: 4 },
  closeIcon: { alignItems: 'center', height: 28, justifyContent: 'center', width: 28 },
  closeIconText: { color: '#A3A3A3', fontSize: 24, fontWeight: '300', lineHeight: 24 },
  label: {
    color: '#8D8D8D',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 7,
    marginTop: 15,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#171717',
    borderColor: '#3C3C3C',
    borderRadius: 10,
    borderWidth: 1,
    color: '#F4F1ED',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chipRow: { flexDirection: 'row', gap: 7 },
  chip: {
    alignItems: 'center',
    backgroundColor: '#171717',
    borderColor: '#353535',
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    minWidth: 70,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  chipSelected: { backgroundColor: '#F0EEEA', borderColor: '#F0EEEA' },
  chipText: { color: '#B7B7B7', fontSize: 11, fontWeight: '700' },
  chipTextSelected: { color: '#171717' },
  row: { flexDirection: 'row', gap: 10 },
  rowField: { flex: 1 },
  error: { color: '#FF9B8B', fontSize: 11, marginTop: 12 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#F0EEEA',
    borderRadius: 10,
    marginTop: 20,
    paddingVertical: 13,
  },
  primaryButtonText: { color: '#171717', fontSize: 13, fontWeight: '800' },
});