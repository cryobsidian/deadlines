import { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddCommitmentModal } from '@/components/AddCommitmentModal';
import { CapacityCheckIn, CapacityPill, type DailyCapacity } from '@/components/CapacityCheckIn';
import { CapacityDecisionSheet, type ProtectedRecoveryWindow } from '@/components/CapacityDecisionSheet';
import { RecoveryMarker } from '@/components/RecoveryMarker';
import { TimeScaleSelector } from '@/components/TimeScaleSelector';
import { VerticalTimeline } from '@/components/VerticalTimeline';
import { WorkspaceSheet, type WorkspacePage } from '@/components/WorkspaceSheet';
import { createMockCommitments } from '@/data/mockCommitments';
import { getVisibleWindow, setWorkloadCapacity } from '@/domain/workload';
import type { Commitment, TimeRange } from '@/types/commitment';

function timelineContentHeight(range: TimeRange) {
  if (range === 'day') return 920;
  if (range === 'month') return 1480;
  return 1120;
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function HomeScreen() {
  const [range, setRange] = useState<TimeRange>('week');
  const insets = useSafeAreaInsets();
  const now = useMemo(() => new Date(), []);
  const [commitments, setCommitments] = useState<Commitment[]>(() => createMockCommitments(now));
  const visibleWindow = useMemo(() => getVisibleWindow(range, now), [range, now]);
  const scrollRef = useRef<ScrollView>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [workspacePage, setWorkspacePage] = useState<WorkspacePage>(null);
  const [showList, setShowList] = useState(false);
  const [selected, setSelected] = useState<Commitment | null>(null);
  const [capacity, setCapacity] = useState<DailyCapacity>('okay');
  const [showCapacity, setShowCapacity] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [protectedRecovery, setProtectedRecovery] = useState<ProtectedRecoveryWindow | null>(null);

  setWorkloadCapacity(capacity);

  function updateCommitment(id: string, patch: Partial<Commitment>) {
    setCommitments((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function moveCommitmentEarlier(id: string) {
    setCommitments((current) => current.map((item) => {
      if (item.id !== id) return item;
      const shift = 24 * 60 * 60 * 1000;
      const shifted = {
        ...item,
        startAt: new Date(new Date(item.startAt).getTime() - shift).toISOString(),
        dueAt: new Date(new Date(item.dueAt).getTime() - shift).toISOString(),
      };
      if (protectedRecovery) {
        const recoveryStart = new Date(protectedRecovery.start).getTime();
        const recoveryEnd = new Date(protectedRecovery.end).getTime();
        const shiftedStart = new Date(shifted.startAt).getTime();
        const shiftedEnd = new Date(shifted.dueAt).getTime();
        if (shiftedStart < recoveryEnd && shiftedEnd > recoveryStart) return item;
      }
      return shifted;
    }));
  }

  function handleCapacityChange(next: DailyCapacity) {
    setCapacity(next);
    setShowCapacity(false);
    setTimeout(() => setShowDecision(true), 180);
  }

  const activeCommitments = commitments.filter((item) => !item.completedAt);
  const canvasHeight = timelineContentHeight(range);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { paddingBottom: Math.max(16, insets.bottom + 10) }]}>
      <ScrollView
        ref={scrollRef}
        bounces
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}>
        <View style={styles.headerSafeSpace} />
        <View style={[styles.canvas, { height: canvasHeight }]}>
          <VerticalTimeline commitments={commitments} now={now} onUpdateCommitment={updateCommitment} range={range} windowEnd={visibleWindow.end} windowStart={visibleWindow.start} />
          <RecoveryMarker recovery={protectedRecovery} range={range} windowEnd={visibleWindow.end} windowStart={visibleWindow.start} height={canvasHeight} />
        </View>
      </ScrollView>

      <View pointerEvents="box-none" style={[styles.topOverlay, { paddingTop: insets.top + 6 }]}>
        <View pointerEvents="none" style={[styles.mask, { top: -insets.top }]} />
        <Text style={styles.title}>DEADLINES</Text>
        <Pressable onPress={() => setShowMenu(true)} style={[styles.menuButton, { top: insets.top + 4 }]}>
          <View style={styles.menuLine} /><View style={styles.menuLine} /><View style={styles.menuLine} />
        </Pressable>
        <TimeScaleSelector value={range} onChange={setRange} />
      </View>

      <View style={styles.bottomControls}>
        <Pressable onPress={() => setShowList(true)} style={styles.circleButton}>
          <View style={styles.listGlyph}>
            <View style={[styles.listStroke, { width: 16 }]} />
            <View style={[styles.listStroke, { width: 22 }]} />
            <View style={[styles.listStroke, { width: 13 }]} />
          </View>
        </Pressable>
        <CapacityPill onPress={() => setShowCapacity(true)} value={capacity} />
        <Pressable onPress={() => setShowAdd(true)} style={styles.circleButton}>
          <View style={styles.plusGlyph}><View style={styles.plusHorizontal} /><View style={styles.plusVertical} /></View>
        </Pressable>
      </View>

      <CapacityCheckIn onChange={handleCapacityChange} onClose={() => setShowCapacity(false)} value={capacity} visible={showCapacity} />
      <CapacityDecisionSheet
        capacity={capacity}
        commitments={commitments}
        now={now}
        onClose={() => setShowDecision(false)}
        onMoveEarlier={moveCommitmentEarlier}
        onProtectRecovery={setProtectedRecovery}
        visible={showDecision}
      />

      <AddCommitmentModal now={now} onAdd={(commitment) => setCommitments((current) => [...current, commitment])} onClose={() => setShowAdd(false)} visible={showAdd} />

      <Modal animationType="slide" onRequestClose={() => setShowMenu(false)} statusBarTranslucent transparent visible={showMenu}>
        <View style={styles.sheetOverlay}>
          <Pressable onPress={() => setShowMenu(false)} style={styles.backdrop} />
          <View style={styles.sheetCard}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>Workspace</Text>
            <MenuRow title="Connected sources" subtitle="Calendars, coursework and meetings" onPress={() => { setShowMenu(false); setWorkspacePage('sources'); }} />
            <MenuRow title="Priorities" subtitle="Arrange your life modules" onPress={() => { setShowMenu(false); setWorkspacePage('priorities'); }} />
            <MenuRow title="Notifications" subtitle="Only meaningful workload changes" onPress={() => { setShowMenu(false); setWorkspacePage('notifications'); }} />
            <MenuRow title="Settings" subtitle="Preferences and appearance" onPress={() => { setShowMenu(false); setWorkspacePage('settings'); }} />
          </View>
        </View>
      </Modal>

      <WorkspaceSheet page={workspacePage} onClose={() => setWorkspacePage(null)} />

      <Modal animationType="slide" onRequestClose={() => setShowList(false)} statusBarTranslucent transparent visible={showList}>
        <View style={styles.sheetOverlay}>
          <Pressable onPress={() => setShowList(false)} style={styles.backdrop} />
          <View style={[styles.sheetCard, styles.listSheet]}>
            <View style={styles.grabber} />
            <View style={styles.listHeader}>
              <View><Text style={styles.sheetTitle}>Commitments</Text><Text style={styles.sheetSubtitle}>{activeCommitments.length} active</Text></View>
              <Pressable onPress={() => setShowList(false)}><Text style={styles.close}>×</Text></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {activeCommitments.map((item) => (
                <Pressable key={item.id} onPress={() => { setShowList(false); setSelected(item); }} style={styles.commitmentRow}>
                  <View style={styles.commitmentCopy}><Text style={styles.commitmentTitle}>{item.title}</Text><Text style={styles.commitmentMeta}>{titleCase(item.category ?? 'personal')} · {titleCase(item.priority ?? 'medium')}</Text></View>
                  <Text style={styles.commitmentDue}>{new Date(item.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => setSelected(null)} statusBarTranslucent transparent visible={Boolean(selected)}>
        <View style={styles.detailOverlay}>
          <Pressable onPress={() => setSelected(null)} style={styles.backdrop} />
          {selected && (
            <View style={styles.detailCard}>
              <View style={styles.listHeader}><Text style={styles.detailTitle}>{selected.title}</Text><Pressable onPress={() => setSelected(null)}><Text style={styles.close}>×</Text></Pressable></View>
              <View style={styles.detailGrid}>
                <Detail label="Category" value={titleCase(selected.category ?? 'personal')} />
                <Detail label="Priority" value={titleCase(selected.priority ?? 'medium')} />
                <Detail label="Difficulty" value={selected.difficulty === 1 ? 'Easy' : selected.difficulty === 2 ? 'Medium' : 'Hard'} />
                <Detail label="Flexibility" value={titleCase(selected.flexibility ?? 'flexible')} />
                <Detail label="Due" value={new Date(selected.dueAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} />
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MenuRow({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.menuRow}><View><Text style={styles.menuRowTitle}>{title}</Text><Text style={styles.menuRowSubtitle}>{subtitle}</Text></View><Text style={styles.chevron}>›</Text></Pressable>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailItem}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#050505', flex: 1, paddingHorizontal: 12, position: 'relative' },
  scroll: { flex: 1, minHeight: 0 },
  scrollContent: { flexGrow: 1 },
  headerSafeSpace: { height: 112 },
  canvas: { minHeight: 920, position: 'relative', width: '100%' },
  topOverlay: { alignItems: 'center', gap: 10, left: 0, paddingHorizontal: 20, position: 'absolute', right: 0, top: 0, zIndex: 30 },
  mask: { backgroundColor: '#050505', bottom: -12, left: 0, opacity: 0.97, position: 'absolute', right: 0 },
  title: { color: '#F1EFEC', fontSize: 14, fontWeight: '500', letterSpacing: 4.5, lineHeight: 26, textAlign: 'center', width: '100%', zIndex: 1 },
  menuButton: { gap: 4, padding: 8, position: 'absolute', right: 15, zIndex: 2 },
  menuLine: { backgroundColor: '#C8C5C1', height: 1.2, width: 22 },
  bottomControls: { alignItems: 'center', backgroundColor: '#050505', borderTopColor: '#171717', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 62, paddingHorizontal: 16, paddingTop: 9 },
  circleButton: { alignItems: 'center', backgroundColor: '#090909', borderColor: '#333333', borderRadius: 23, borderWidth: 1, height: 46, justifyContent: 'center', width: 46 },
  listGlyph: { alignItems: 'flex-start', gap: 4, justifyContent: 'center', width: 23 },
  listStroke: { backgroundColor: '#D2CFCA', borderRadius: 2, height: 1.4 },
  plusGlyph: { height: 18, position: 'relative', width: 18 },
  plusHorizontal: { backgroundColor: '#DAD7D2', height: 1.35, left: 2, position: 'absolute', right: 2, top: 8.3 },
  plusVertical: { backgroundColor: '#DAD7D2', bottom: 2, left: 8.3, position: 'absolute', top: 2, width: 1.35 },
  sheetOverlay: { backgroundColor: 'rgba(0,0,0,0.58)', flex: 1, justifyContent: 'flex-end' },
  backdrop: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  sheetCard: { backgroundColor: '#101010', borderColor: '#343434', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 18 },
  listSheet: { maxHeight: '72%' },
  grabber: { alignSelf: 'center', backgroundColor: '#4B4B4B', borderRadius: 999, height: 3, marginBottom: 18, width: 36 },
  sheetTitle: { color: '#F0EDE9', fontSize: 18, fontWeight: '800' },
  sheetSubtitle: { color: '#777', fontSize: 11, marginTop: 3 },
  listHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  close: { color: '#A3A3A3', fontSize: 24, lineHeight: 24 },
  menuRow: { alignItems: 'center', borderBottomColor: '#252525', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 62, paddingVertical: 10 },
  menuRowTitle: { color: '#E4E1DD', fontSize: 13, fontWeight: '700' },
  menuRowSubtitle: { color: '#707070', fontSize: 10, marginTop: 4 },
  chevron: { color: '#666', fontSize: 20 },
  commitmentRow: { alignItems: 'center', borderBottomColor: '#242424', borderBottomWidth: 1, flexDirection: 'row', minHeight: 58, paddingVertical: 8 },
  commitmentCopy: { flex: 1 },
  commitmentTitle: { color: '#EAE7E3', fontSize: 13, fontWeight: '700' },
  commitmentMeta: { color: '#707070', fontSize: 10, marginTop: 4 },
  commitmentDue: { color: '#8B8B8B', fontSize: 10, fontWeight: '700' },
  detailOverlay: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.72)', flex: 1, justifyContent: 'center', padding: 18 },
  detailCard: { backgroundColor: '#101010', borderColor: '#393939', borderRadius: 18, borderWidth: 1, maxWidth: 430, padding: 18, width: '100%' },
  detailTitle: { color: '#F3F0EC', flex: 1, fontSize: 18, fontWeight: '800' },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 14 },
  detailItem: { flex: 1, minWidth: 125 },
  detailLabel: { color: '#747474', fontSize: 9, fontWeight: '700', letterSpacing: 0.6, marginBottom: 4, textTransform: 'uppercase' },
  detailValue: { color: '#E7E4E0', fontSize: 13, fontWeight: '600' },
});