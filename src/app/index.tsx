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
const difficulties: CommitmentDifficulty[] = [1, 2, 3];

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function cycleValue<T>(values: readonly T[], current: T) {
  const index = values.indexOf(current);
  return values[(index + 1) % values.length];
}

function difficultyLabel(value: CommitmentDifficulty) {
  if (value === 1) return 'Easy';
  if (value === 3) return 'Hard';
  return 'Medium';
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSystemMenu, setShowSystemMenu] = useState(false);
  const [showCommitmentList, setShowCommitmentList] = useState(false);
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
    setShowAdvanced(false);
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

  const activeCommitments = commitments.filter((item) => !item.completedAt);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { paddingBottom: bottomPadding }]}>
      <ScrollView
        ref={timelineScrollRef}
        bounces
        contentContainerStyle={styles.timelineScrollContent}
        onContentSizeChange={() => timelineScrollRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
        style={styles.timelineScroll}>
        <View style={styles.headerSafeSpace} />
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
        <Pressable accessibilityLabel="Menu" onPress={() => setShowSystemMenu(true)} style={[styles.menuButton, { top: topInset + 4 }]}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </Pressable>
        <TimeScaleSelector value={range} onChange={setRange} />
      </View>

      <View style={styles.bottomControls}>
        <Pressable accessibilityLabel="Commitment list" onPress={() => setShowCommitmentList(true)} style={styles.circleButton}>
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
                  <Text style={styles.modalSubtitle}>Only the essentials first.</Text>
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

              <Text style={styles.label}>Due</Text>
              <View style={styles.row}>
                <View style={styles.rowField}>
                  <TextInput
                    inputMode="numeric"
                    keyboardType="number-pad"
                    onChangeText={(value) => setDueInDays(value.replace(/[^0-9]/g, ''))}
                    placeholder="Days"
                    placeholderTextColor="#6E6E6E"
                    style={styles.input}
                    value={dueInDays}
                  />
                  <Text style={styles.inputHint}>days from now</Text>
                </View>
                <View style={styles.rowField}>
                  <TextInput
                    inputMode="numeric"
                    keyboardType="number-pad"
                    onChangeText={(value) => setDueHour(value.replace(/[^0-9]/g, ''))}
                    placeholder="Hour"
                    placeholderTextColor="#6E6E6E"
                    style={styles.input}
                    value={dueHour}
                  />
                  <Text style={styles.inputHint}>24h time</Text>
                </View>
              </View>

              <SettingRow label="Category" value={titleCase(category)} onPress={() => setCategory(cycleValue(categories, category))} />
              <SettingRow label="Priority" value={titleCase(priority)} onPress={() => setPriority(cycleValue(priorities, priority))} />

              <Pressable onPress={() => setShowAdvanced((value) => !value)} style={styles.moreButton}>
                <Text style={styles.moreButtonText}>{showAdvanced ? 'Hide options' : 'More options'}</Text>
                <Text style={styles.moreChevron}>{showAdvanced ? '−' : '+'}</Text>
              </Pressable>

              {showAdvanced ? (
                <View style={styles.advancedBlock}>
                  <SettingRow label="Difficulty" value={difficultyLabel(difficulty)} onPress={() => setDifficulty(cycleValue(difficulties, difficulty))} />
                  <SettingRow label="Flexibility" value={titleCase(flexibility)} onPress={() => setFlexibility(cycleValue(flexibilities, flexibility))} />
                </View>
              ) : null}

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable onPress={handleAdd} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Add to timeline</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" onRequestClose={() => setShowSystemMenu(false)} statusBarTranslucent transparent visible={showSystemMenu}>
        <View style={styles.sheetOverlay}>
          <Pressable onPress={() => setShowSystemMenu(false)} style={styles.modalBackdrop} />
          <View style={styles.sheetCard}>
            <View style={styles.sheetGrabber} />
            <Text style={styles.sheetTitle}>Workspace</Text>
            <MenuRow title="Connected sources" subtitle="Outlook, Teams and calendars" />
            <MenuRow title="Priorities" subtitle="Arrange your life modules" />
            <MenuRow title="Notifications" subtitle="Only meaningful workload changes" />
            <MenuRow title="Settings" subtitle="Preferences and appearance" />
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" onRequestClose={() => setShowCommitmentList(false)} statusBarTranslucent transparent visible={showCommitmentList}>
        <View style={styles.sheetOverlay}>
          <Pressable onPress={() => setShowCommitmentList(false)} style={styles.modalBackdrop} />
          <View style={[styles.sheetCard, styles.listSheet]}>
            <View style={styles.sheetGrabber} />
            <View style={styles.listHeader}>
              <View><Text style={styles.sheetTitle}>Commitments</Text><Text style={styles.sheetSubtitle}>{activeCommitments.length} active</Text></View>
              <Pressable onPress={() => setShowCommitmentList(false)} style={styles.closeIcon}><Text style={styles.closeIconText}>×</Text></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {activeCommitments.map((item) => (
                <View key={item.id} style={styles.commitmentRow}>
                  <View style={styles.commitmentCopy}>
                    <Text style={styles.commitmentTitle}>{item.title}</Text>
                    <Text style={styles.commitmentMeta}>{titleCase(item.category ?? 'personal')} · {titleCase(item.priority ?? 'medium')}</Text>
                  </View>
                  <Text style={styles.commitmentDue}>{new Date(item.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SettingRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingValueWrap}><Text style={styles.settingValue}>{value}</Text><Text style={styles.settingChevron}>›</Text></View>
    </Pressable>
  );
}

function MenuRow({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Pressable style={styles.menuRow}>
      <View><Text style={styles.menuRowTitle}>{title}</Text><Text style={styles.menuRowSubtitle}>{subtitle}</Text></View>
      <Text style={styles.settingChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#050505', flex: 1, paddingHorizontal: 12, position: 'relative' },
  timelineScroll: { flex: 1, minHeight: 0 },
  timelineScrollContent: { flexGrow: 1 },
  headerSafeSpace: { height: 112 },
  timelineCanvas: { minHeight: 920, width: '100%' },
  topOverlay: { alignItems: 'center', gap: 10, left: 0, paddingHorizontal: 20, position: 'absolute', right: 0, top: 0, zIndex: 30 },
  overlayMask: { backgroundColor: '#050505', bottom: -12, left: 0, opacity: 0.97, position: 'absolute', right: 0, top: 0 },
  title: { color: '#F1EFEC', fontSize: 14, fontWeight: '500', letterSpacing: 4.5, lineHeight: 26, textAlign: 'center', width: '100%', zIndex: 1 },
  menuButton: { gap: 4, padding: 8, position: 'absolute', right: 15, zIndex: 2 },
  menuLine: { backgroundColor: '#C8C5C1', height: 1.2, width: 22 },
  bottomControls: { alignItems: 'center', backgroundColor: '#050505', borderTopColor: '#171717', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 72, paddingHorizontal: 16, paddingTop: 12, zIndex: 20 },
  circleButton: { alignItems: 'center', borderColor: '#4A4A4A', borderRadius: 28, borderWidth: 1, height: 52, justifyContent: 'center', width: 52 },
  listGlyph: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 4, height: 22, width: 26 },
  listDot: { backgroundColor: '#D9D6D2', borderRadius: 2, height: 3, width: 3 },
  listBar: { backgroundColor: '#D9D6D2', height: 1.5, width: 18 },
  plus: { color: '#E8E5E1', fontSize: 30, fontWeight: '200', lineHeight: 34 },
  modalOverlay: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.74)', flex: 1, justifyContent: 'center', padding: 18 },
  modalBackdrop: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  modalCard: { backgroundColor: '#111111', borderColor: '#3C3C3C', borderRadius: 18, borderWidth: 1, maxHeight: '88%', maxWidth: 430, overflow: 'hidden', width: '100%' },
  modalContent: { padding: 18 },
  modalHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  modalTitle: { color: '#F3F0EC', fontSize: 18, fontWeight: '800' },
  modalSubtitle: { color: '#868686', fontSize: 11, marginTop: 4 },
  closeIcon: { alignItems: 'center', height: 28, justifyContent: 'center', width: 28 },
  closeIconText: { color: '#A3A3A3', fontSize: 24, fontWeight: '300', lineHeight: 24 },
  label: { color: '#8D8D8D', fontSize: 10, fontWeight: '700', letterSpacing: 0.6, marginBottom: 7, marginTop: 15, textTransform: 'uppercase' },
  input: { backgroundColor: '#171717', borderColor: '#3C3C3C', borderRadius: 10, borderWidth: 1, color: '#F4F1ED', fontSize: 14, paddingHorizontal: 12, paddingVertical: 11 },
  inputHint: { color: '#666', fontSize: 9, marginTop: 5 },
  row: { flexDirection: 'row', gap: 10 },
  rowField: { flex: 1 },
  settingRow: { alignItems: 'center', borderBottomColor: '#252525', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 48, paddingVertical: 8 },
  settingLabel: { color: '#D7D4D0', fontSize: 12.5, fontWeight: '650' },
  settingValueWrap: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  settingValue: { color: '#8D8D8D', fontSize: 12 },
  settingChevron: { color: '#666', fontSize: 20, fontWeight: '300' },
  moreButton: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingVertical: 10 },
  moreButtonText: { color: '#989898', fontSize: 11, fontWeight: '700' },
  moreChevron: { color: '#777', fontSize: 18 },
  advancedBlock: { borderTopColor: '#242424', borderTopWidth: 1 },
  error: { color: '#FF9B8B', fontSize: 11, marginTop: 12 },
  primaryButton: { alignItems: 'center', backgroundColor: '#F0EEEA', borderRadius: 10, marginTop: 18, paddingVertical: 13 },
  primaryButtonText: { color: '#171717', fontSize: 13, fontWeight: '800' },
  sheetOverlay: { backgroundColor: 'rgba(0,0,0,0.58)', flex: 1, justifyContent: 'flex-end' },
  sheetCard: { backgroundColor: '#101010', borderColor: '#343434', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 18 },
  listSheet: { maxHeight: '72%' },
  sheetGrabber: { alignSelf: 'center', backgroundColor: '#4B4B4B', borderRadius: 999, height: 3, marginBottom: 18, width: 36 },
  sheetTitle: { color: '#F0EDE9', fontSize: 18, fontWeight: '800' },
  sheetSubtitle: { color: '#777', fontSize: 11, marginTop: 3 },
  listHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  menuRow: { alignItems: 'center', borderBottomColor: '#252525', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 62, paddingVertical: 10 },
  menuRowTitle: { color: '#E4E1DD', fontSize: 13, fontWeight: '700' },
  menuRowSubtitle: { color: '#707070', fontSize: 10, marginTop: 4 },
  commitmentRow: { alignItems: 'center', borderBottomColor: '#242424', borderBottomWidth: 1, flexDirection: 'row', minHeight: 58, paddingVertical: 8 },
  commitmentCopy: { flex: 1 },
  commitmentTitle: { color: '#EAE7E3', fontSize: 13, fontWeight: '700' },
  commitmentMeta: { color: '#707070', fontSize: 10, marginTop: 4 },
  commitmentDue: { color: '#8B8B8B', fontSize: 10, fontWeight: '700' },
});