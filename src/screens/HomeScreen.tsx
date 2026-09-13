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
import { calculateWorkloadScore, getVisibleWindow, getWorkloadBand, setWorkloadCapacity } from '@/domain/workload';
import type { Commitment, TimeRange, WorkloadBand } from '@/types/commitment';

function timelineContentHeight(range: TimeRange) {
  if (range === 'day') return 920;
  if (range === 'month') return 1480;
  return 1120;
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function workloadLabel(band: WorkloadBand) {
  if (band === 'overloaded') return 'OVERLOADED';
  if (band === 'strained') return 'STRAINED';
  if (band === 'busy') return 'BUSY';
  return 'MANAGEABLE';
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
  const [showCompleted, setShowCompleted] = useState(false);
  const [selected, setSelected] = useState<Commitment | null>(null);
  const [capacity, setCapacity] = useState<DailyCapacity>('okay');
  const [showCapacity, setShowCapacity] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialPage, setTutorialPage] = useState(0);
  const [protectedRecovery, setProtectedRecovery] = useState<ProtectedRecoveryWindow | null>(null);

  setWorkloadCapacity(capacity);

  function updateCommitment(id: string, patch: Partial<Commitment>) {
    setCommitments((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function completeCommitment(id: string) {
    updateCommitment(id, { completedAt: new Date().toISOString() });
    if (selected?.id === id) setSelected(null);
  }

  function restoreCommitment(id: string) {
    updateCommitment(id, { completedAt: undefined });
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
  const completedCommitments = commitments.filter((item) => Boolean(item.completedAt));
  const currentScore = calculateWorkloadScore(commitments, now);
  const currentBand = getWorkloadBand(currentScore, now);
  const canvasHeight = timelineContentHeight(range);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { paddingBottom: Math.max(16, insets.bottom + 10) }]}>
      <ScrollView ref={scrollRef} bounces contentContainerStyle={styles.scrollContent} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })} showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.headerSafeSpace} />
        <View style={[styles.canvas, { height: canvasHeight }]}>
          <VerticalTimeline commitments={commitments} now={now} onUpdateCommitment={updateCommitment} range={range} windowEnd={visibleWindow.end} windowStart={visibleWindow.start} />
          <RecoveryMarker recovery={protectedRecovery} range={range} windowEnd={visibleWindow.end} windowStart={visibleWindow.start} height={canvasHeight} />
        </View>
      </ScrollView>

      <View pointerEvents="box-none" style={[styles.topOverlay, { paddingTop: insets.top + 6 }]}>
        <View pointerEvents="none" style={[styles.mask, { top: -insets.top }]} />
        <Text style={styles.title}>DEADLINES</Text>
        <Pressable accessibilityLabel="Open tutorial" onPress={() => { setTutorialPage(0); setShowTutorial(true); }} style={[styles.helpButton, { top: insets.top + 4 }]}>
          <Text style={styles.helpText}>?</Text>
        </Pressable>
        <Pressable onPress={() => setShowMenu(true)} style={[styles.menuButton, { top: insets.top + 4 }]}>
          <View style={styles.menuLine} /><View style={styles.menuLine} /><View style={styles.menuLine} />
        </Pressable>
        <View style={styles.topControlsRow}>
          <TimeScaleSelector value={range} onChange={setRange} />
          <Pressable onPress={() => setShowDecision(true)} style={styles.forecastStatus}>
            <View style={[styles.forecastDot, currentBand === 'busy' && styles.forecastBusy, currentBand === 'strained' && styles.forecastStrained, currentBand === 'overloaded' && styles.forecastOverloaded]} />
            <Text style={styles.forecastLabel}>{workloadLabel(currentBand)}</Text>
            <Text style={styles.forecastScore}>{currentScore}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.bottomControls}>
        <Pressable onPress={() => setShowList(true)} style={styles.circleButton}>
          <View style={styles.listGlyph}><View style={[styles.listStroke, { width: 16 }]} /><View style={[styles.listStroke, { width: 22 }]} /><View style={[styles.listStroke, { width: 13 }]} /></View>
        </Pressable>
        <CapacityPill onPress={() => setShowCapacity(true)} value={capacity} />
        <Pressable onPress={() => setShowAdd(true)} style={styles.circleButton}>
          <View style={styles.plusGlyph}><View style={styles.plusHorizontal} /><View style={styles.plusVertical} /></View>
        </Pressable>
      </View>

      <CapacityCheckIn onChange={handleCapacityChange} onClose={() => setShowCapacity(false)} value={capacity} visible={showCapacity} />
      <CapacityDecisionSheet capacity={capacity} commitments={commitments} now={now} onClose={() => setShowDecision(false)} onMoveEarlier={moveCommitmentEarlier} onProtectRecovery={setProtectedRecovery} visible={showDecision} />

      <Modal animationType="fade" onRequestClose={() => setShowTutorial(false)} statusBarTranslucent transparent visible={showTutorial}>
        <View style={styles.tutorialOverlay}>
          <Pressable onPress={() => setShowTutorial(false)} style={styles.backdrop} />
          <View style={styles.tutorialCard}>
            <View style={styles.grabber} />
            <View style={styles.tutorialHeader}>
              <View style={styles.tutorialHeaderLeft}>
                <Text style={styles.tutorialTitle}>How to use Deadlines</Text>
                <Text style={styles.tutorialCounter}>{tutorialPage + 1} / 6</Text>
              </View>
              <Pressable accessibilityLabel="Close tutorial" onPress={() => setShowTutorial(false)}><Text style={styles.close}>×</Text></Pressable>
            </View>

            <View style={styles.tutorialTabs}>
              {[
                { key: 'Lines', label: 'Lines' },
                { key: 'Runner', label: 'Runner' },
                { key: 'Energy', label: 'Energy' },
                { key: 'Pressure', label: 'Pressure' },
                { key: 'Recovery', label: 'Recovery' },
                { key: 'Manage', label: 'Manage' },
              ].map((tab, idx) => (
                <Pressable key={tab.key} onPress={() => setTutorialPage(idx)} style={[styles.tutorialTab, tutorialPage === idx && styles.tutorialTabActive]}>
                  <Text style={[styles.tutorialTabText, tutorialPage === idx && styles.tutorialTabTextActive]}>{tab.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.tutorialBody}>
              {tutorialPage === 0 && (
                <View style={styles.tutorialSection}>
                  <Text style={styles.tutorialSectionEyebrow}>SECTION 1 · THE TIMELINE</Text>
                  <Text style={styles.tutorialSectionTitle}>White vs grey, flag on top</Text>
                  <Text style={styles.tutorialSectionDesc}>Each vertical pole is one commitment from start to deadline. Colour tells you its state.</Text>
                  <View style={styles.tutorialVisual}>
                    <View style={styles.legendRow}><View style={[styles.legendSwatch, { backgroundColor: '#EAE7E3' }]} /><Text style={styles.legendText}><Text style={styles.legendBold}>White line</Text> — ongoing (active now, counts toward workload)</Text></View>
                    <View style={styles.legendRow}><View style={[styles.legendSwatch, { backgroundColor: '#333333' }]} /><Text style={styles.legendText}><Text style={styles.legendBold}>Grey line</Text> — upcoming (future, not yet started)</Text></View>
                    <View style={styles.legendRow}><View style={[styles.legendFlag]}><View style={styles.miniFlagRow}><View style={[styles.miniCell, { backgroundColor: '#F1EFEC' }]} /><View style={[styles.miniCell, { backgroundColor: '#111' }]} /><View style={[styles.miniCell, { backgroundColor: '#F1EFEC' }]} /></View><View style={styles.miniFlagRow}><View style={[styles.miniCell, { backgroundColor: '#111' }]} /><View style={[styles.miniCell, { backgroundColor: '#F1EFEC' }]} /><View style={[styles.miniCell, { backgroundColor: '#111' }]} /></View></View><Text style={styles.legendText}><Text style={styles.legendBold}>Checkered flag + cap</Text> — deadline at the tip, centered on the pole</Text></View>
                  </View>
                  <Text style={styles.tutorialHint}>Thicker pole = harder (1 thin · 2 medium · 3 thick). Tap a pole to see its details.</Text>
                </View>
              )}
              {tutorialPage === 1 && (
                <View style={styles.tutorialSection}>
                  <Text style={styles.tutorialSectionEyebrow}>SECTION 2 · THE HUMAN</Text>
                  <Text style={styles.tutorialSectionTitle}>The runner is you</Text>
                  <Text style={styles.tutorialSectionDesc}>Left gutter, just right of the dates. It mirrors live pressure instantly.</Text>
                  <View style={styles.tutorialVisual}>
                    <View style={styles.healthRow}><View style={styles.healthDotHealthy} /><Text style={styles.legendText}><Text style={styles.legendBold}>Healthy — Manageable / Busy</Text>: upright (−4°), bright (opacity 0.9)</Text></View>
                    <View style={styles.healthRow}><View style={styles.healthDotTired} /><Text style={styles.legendText}><Text style={styles.legendBold}>Strained</Text>: leans 13°, fades to 0.7</Text></View>
                    <View style={styles.healthRow}><View style={styles.healthDotExhausted} /><Text style={styles.legendText}><Text style={styles.legendBold}>Overloaded</Text>: hunches 22°, dims to 0.48</Text></View>
                  </View>
                  <Text style={styles.tutorialHint}>Watch the lean and fade: healthy → tired → unhealthy as workload climbs.</Text>
                </View>
              )}
              {tutorialPage === 2 && (
                <View style={styles.tutorialSection}>
                  <Text style={styles.tutorialSectionEyebrow}>SECTION 3 · TODAY'S ENERGY</Text>
                  <Text style={styles.tutorialSectionTitle}>Bottom middle pill</Text>
                  <Text style={styles.tutorialSectionDesc}>Tap TODAY · RUNNING LOW / OKAY / GOOD (bottom center) to set today's capacity. Not a mood diary — it tunes how strict today's pressure feels.</Text>
                  <View style={styles.tutorialVisual}>
                    <View style={styles.energyRow}><View style={[styles.energyDot, { backgroundColor: '#F08A78' }]} /><Text style={styles.legendText}><Text style={styles.legendBold}>Running low</Text>: busy 2 · strained 4 · overloaded 7</Text></View>
                    <View style={styles.energyRow}><View style={[styles.energyDot, { backgroundColor: '#969696' }]} /><Text style={styles.legendText}><Text style={styles.legendBold}>Okay</Text>: 4 · 7 · 10 (baseline)</Text></View>
                    <View style={styles.energyRow}><View style={[styles.energyDot, { backgroundColor: '#8FAF95' }]} /><Text style={styles.legendText}><Text style={styles.legendBold}>Good</Text>: 5 · 8 · 11 (roomier)</Text></View>
                  </View>
                  <Text style={styles.tutorialHint}>Only today changes — future days keep the normal forecast. Low days hit strain sooner.</Text>
                </View>
              )}
              {tutorialPage === 3 && (
                <View style={styles.tutorialSection}>
                  <Text style={styles.tutorialSectionEyebrow}>SECTION 4 · PRESSURE & ADJUST</Text>
                  <Text style={styles.tutorialSectionTitle}>High-pressure zones</Text>
                  <Text style={styles.tutorialSectionDesc}>Red blocks = where 3-5 commitments converge. Tap a block to drill down.</Text>
                  <View style={styles.tutorialVisual}>
                    <View style={styles.bulletRow}><View style={styles.bulletDot} /><Text style={styles.legendText}>See which commitments cause it, sorted by priority & difficulty</Text></View>
                    <View style={styles.bulletRow}><View style={styles.bulletDot} /><Text style={styles.legendText}>Preview the move before you commit: <Text style={styles.legendBold}>BEFORE 8 OVERLOADED → AFTER 5 STRAINED</Text></Text></View>
                    <View style={styles.bulletRow}><View style={styles.bulletDot} /><Text style={styles.legendText}>Only flexible / droppable work is suggested; fixed stays put</Text></View>
                  </View>
                  <Text style={styles.tutorialHint}>Use Preview → Apply inside the pressure sheet. Change is 24h earlier, skipping protected recovery.</Text>
                </View>
              )}
              {tutorialPage === 4 && (
                <View style={styles.tutorialSection}>
                  <Text style={styles.tutorialSectionEyebrow}>SECTION 5 · RECOVERY</Text>
                  <Text style={styles.tutorialSectionTitle}>3 hours, protected</Text>
                  <Text style={styles.tutorialSectionDesc}>After the nearest peak, Deadlines scans 7 days ahead for the first stable window.</Text>
                  <View style={styles.tutorialVisual}>
                    <View style={styles.bulletRow}><View style={[styles.bulletDot, { backgroundColor: '#8FAF95' }]} /><Text style={styles.legendText}>Window = <Text style={styles.legendBold}>3 hours</Text> (start → middle +1.5h → end) all below Busy and no critical hard work</Text></View>
                    <View style={styles.bulletRow}><View style={[styles.bulletDot, { backgroundColor: '#8FAF95' }]} /><Text style={styles.legendText}>Shown as green <Text style={styles.legendBold}>RECOVERY · PROTECTED</Text> marker on the timeline</Text></View>
                    <View style={styles.bulletRow}><View style={[styles.bulletDot, { backgroundColor: '#8FAF95' }]} /><Text style={styles.legendText}>Tap <Text style={styles.legendBold}>Protect this time</Text> — future moves will avoid filling it</Text></View>
                  </View>
                  <Text style={styles.tutorialHint}>Recovery is found in 3h steps (3h, 6h, 9h... ahead) until stable. Guard it, don’t refill.</Text>
                </View>
              )}
              {tutorialPage === 5 && (
                <View style={styles.tutorialSection}>
                  <Text style={styles.tutorialSectionEyebrow}>SECTION 6 · MANAGE</Text>
                  <Text style={styles.tutorialSectionTitle}>List & add</Text>
                  <Text style={styles.tutorialSectionDesc}>Bottom bar holds your two daily tools.</Text>
                  <View style={styles.tutorialVisual}>
                    <View style={styles.legendRow}><View style={styles.manageIcon}><View style={[styles.listStroke, { width: 10 }]} /><View style={[styles.listStroke, { width: 14 }]} /><View style={[styles.listStroke, { width: 8 }]} /></View><Text style={styles.legendText}><Text style={styles.legendBold}>Bottom left</Text> — list all commitments: active with due dates → tap for details & <Text style={styles.legendBold}>Mark as complete</Text>; expand Completed to Restore</Text></View>
                    <View style={styles.legendRow}><View style={styles.manageIconPlus}><View style={styles.plusHorizontalMini} /><View style={styles.plusVerticalMini} /></View><Text style={styles.legendText}><Text style={styles.legendBold}>Bottom right (+)</Text> — add commitment: title, category, priority, difficulty 1-3, flexibility (fixed/flexible/droppable), start & due</Text></View>
                  </View>
                  <Text style={styles.tutorialHint}>Switch DAY / WEEK / MONTH at the top. The forecast pill (top, next to time scale) shows live score · band.</Text>
                </View>
              )}
            </View>

            <View style={styles.tutorialNav}>
              <View style={styles.tutorialDots}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={[styles.tutorialDot, tutorialPage === i && styles.tutorialDotActive]} />
                ))}
              </View>
              <View style={styles.tutorialNavButtons}>
                <Pressable disabled={tutorialPage === 0} onPress={() => setTutorialPage((p) => Math.max(0, p - 1))} style={[styles.tutorialBack, tutorialPage === 0 && styles.tutorialBackDisabled]}><Text style={[styles.tutorialBackText, tutorialPage === 0 && styles.tutorialBackTextDisabled]}>Back</Text></Pressable>
                {tutorialPage < 5 ? (
                  <Pressable onPress={() => setTutorialPage((p) => Math.min(5, p + 1))} style={styles.tutorialNext}><Text style={styles.tutorialNextText}>Next</Text></Pressable>
                ) : (
                  <Pressable onPress={() => setShowTutorial(false)} style={styles.tutorialNext}><Text style={styles.tutorialNextText}>Got it</Text></Pressable>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>

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
              <View><Text style={styles.sheetTitle}>Commitments</Text><Text style={styles.sheetSubtitle}>{activeCommitments.length} active · {completedCommitments.length} completed</Text></View>
              <Pressable onPress={() => setShowList(false)}><Text style={styles.close}>×</Text></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {activeCommitments.map((item) => (
                <View key={item.id} style={styles.commitmentRow}>
                  <Pressable onPress={() => { setShowList(false); setSelected(item); }} style={styles.commitmentCopy}>
                    <Text style={styles.commitmentTitle}>{item.title}</Text>
                    <Text style={styles.commitmentMeta}>{titleCase(item.category ?? 'personal')} · {titleCase(item.priority ?? 'medium')}</Text>
                  </Pressable>
                  <Text style={styles.commitmentDue}>{new Date(item.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                  <Pressable accessibilityLabel={`Mark ${item.title} complete`} hitSlop={8} onPress={() => completeCommitment(item.id)} style={styles.completeButton}>
                    <View style={styles.completeRing}><View style={styles.completeTickA} /><View style={styles.completeTickB} /></View>
                  </Pressable>
                </View>
              ))}

              {completedCommitments.length > 0 ? (
                <View style={styles.completedSection}>
                  <Pressable onPress={() => setShowCompleted((value) => !value)} style={styles.completedHeader}>
                    <View><Text style={styles.completedLabel}>COMPLETED</Text><Text style={styles.completedCount}>{completedCommitments.length} archived</Text></View>
                    <Text style={styles.completedChevron}>{showCompleted ? '−' : '+'}</Text>
                  </Pressable>
                  {showCompleted ? completedCommitments.map((item) => (
                    <View key={item.id} style={[styles.commitmentRow, styles.completedRow]}>
                      <View style={styles.commitmentCopy}>
                        <Text style={styles.completedTitle}>{item.title}</Text>
                        <Text style={styles.commitmentMeta}>Completed {item.completedAt ? new Date(item.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</Text>
                      </View>
                      <Pressable onPress={() => restoreCommitment(item.id)} style={styles.restoreButton}><Text style={styles.restoreText}>Restore</Text></Pressable>
                    </View>
                  )) : null}
                </View>
              ) : null}
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
                <Detail label="Starts from" value={new Date(selected.startAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} />
                <Detail label="Due" value={new Date(selected.dueAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} />
              </View>
              <Pressable onPress={() => completeCommitment(selected.id)} style={styles.completeAction}>
                <Text style={styles.completeActionText}>Mark as complete</Text>
              </Pressable>
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
  topOverlay: { alignItems: 'center', gap: 7, left: 0, paddingHorizontal: 20, position: 'absolute', right: 0, top: 0, zIndex: 30 },
  mask: { backgroundColor: '#050505', bottom: -10, left: 0, opacity: 0.97, position: 'absolute', right: 0 },
  title: { color: '#F1EFEC', fontSize: 14, fontWeight: '500', letterSpacing: 4.5, lineHeight: 26, textAlign: 'center', width: '100%', zIndex: 1 },
  helpButton: { alignItems: 'center', backgroundColor: '#0A0A0A', borderColor: '#2A2A2A', borderRadius: 14, borderWidth: 1, height: 28, justifyContent: 'center', position: 'absolute', right: 52, width: 28, zIndex: 2 },
  helpText: { color: '#EAE7E3', fontSize: 14, fontWeight: '800', lineHeight: 16, textAlign: 'center' },
  menuButton: { gap: 4, padding: 8, position: 'absolute', right: 15, zIndex: 2 },
  menuLine: { backgroundColor: '#C8C5C1', height: 1.2, width: 22 },
  topControlsRow: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'center', width: '100%', zIndex: 1 },
  forecastStatus: { alignItems: 'center', backgroundColor: 'rgba(12,12,12,0.72)', borderColor: '#232323', borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 5, paddingHorizontal: 8, paddingVertical: 5 },
  forecastDot: { backgroundColor: '#78907D', borderRadius: 4, height: 5, width: 5 },
  forecastBusy: { backgroundColor: '#B5A06F' },
  forecastStrained: { backgroundColor: '#D98673' },
  forecastOverloaded: { backgroundColor: '#F16F5D' },
  forecastLabel: { color: '#D8D5D0', fontSize: 8.2, fontWeight: '800', letterSpacing: 0.65 },
  forecastScore: { color: '#707070', fontSize: 8.2, fontWeight: '800' },
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
  listSheet: { maxHeight: '78%' },
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
  commitmentDue: { color: '#8B8B8B', fontSize: 10, fontWeight: '700', marginLeft: 10 },
  completeButton: { alignItems: 'center', height: 34, justifyContent: 'center', marginLeft: 8, width: 34 },
  completeRing: { borderColor: '#5A5A5A', borderRadius: 9, borderWidth: 1, height: 18, position: 'relative', width: 18 },
  completeTickA: { backgroundColor: '#B9C8BD', height: 1.4, left: 4, position: 'absolute', top: 9, transform: [{ rotate: '42deg' }], width: 5 },
  completeTickB: { backgroundColor: '#B9C8BD', height: 1.4, left: 7, position: 'absolute', top: 7, transform: [{ rotate: '-48deg' }], width: 8 },
  completedSection: { borderTopColor: '#2B2B2B', borderTopWidth: 1, marginTop: 12, paddingTop: 6 },
  completedHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 52 },
  completedLabel: { color: '#A3AAA5', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  completedCount: { color: '#606460', fontSize: 9, marginTop: 3 },
  completedChevron: { color: '#777', fontSize: 18 },
  completedRow: { opacity: 0.7 },
  completedTitle: { color: '#8C918D', fontSize: 12.5, fontWeight: '700', textDecorationLine: 'line-through' },
  restoreButton: { borderColor: '#3B463E', borderRadius: 8, borderWidth: 1, marginLeft: 10, paddingHorizontal: 10, paddingVertical: 7 },
  restoreText: { color: '#9EAEA2', fontSize: 9.5, fontWeight: '800' },
  detailOverlay: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.72)', flex: 1, justifyContent: 'center', padding: 18 },
  detailCard: { backgroundColor: '#101010', borderColor: '#393939', borderRadius: 18, borderWidth: 1, maxWidth: 430, padding: 18, width: '100%' },
  detailTitle: { color: '#F3F0EC', flex: 1, fontSize: 18, fontWeight: '800' },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 14 },
  detailItem: { flex: 1, minWidth: 125 },
  detailLabel: { color: '#747474', fontSize: 9, fontWeight: '700', letterSpacing: 0.6, marginBottom: 4, textTransform: 'uppercase' },
  detailValue: { color: '#E7E4E0', fontSize: 13, fontWeight: '600' },
  completeAction: { alignItems: 'center', borderColor: '#3A3A3A', borderRadius: 10, borderWidth: 1, marginTop: 18, paddingVertical: 12 },
  completeActionText: { color: '#DAD7D2', fontSize: 11, fontWeight: '800' },
  tutorialOverlay: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.62)', flex: 1, justifyContent: 'center', padding: 18 },
  tutorialCard: { backgroundColor: '#101010', borderColor: '#343434', borderRadius: 24, borderWidth: 1, maxHeight: '84%', maxWidth: 420, padding: 18, width: '100%' },
  tutorialHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  tutorialHeaderLeft: { gap: 2 },
  tutorialTitle: { color: '#F0EDE9', fontSize: 17, fontWeight: '800' },
  tutorialCounter: { color: '#6A6A6A', fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  tutorialTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  tutorialTab: { backgroundColor: '#151515', borderColor: '#242424', borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  tutorialTabActive: { backgroundColor: '#F0EEEA', borderColor: '#F0EEEA' },
  tutorialTabText: { color: '#8A8A8A', fontSize: 10, fontWeight: '800' },
  tutorialTabTextActive: { color: '#171717' },
  tutorialBody: { minHeight: 248 },
  tutorialSection: { gap: 8 },
  tutorialSectionEyebrow: { color: '#6A6A6A', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  tutorialSectionTitle: { color: '#F1EFEC', fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  tutorialSectionDesc: { color: '#9A9A9A', fontSize: 12, lineHeight: 17 },
  tutorialVisual: { backgroundColor: '#151515', borderColor: '#2A2A2A', borderRadius: 12, borderWidth: 1, gap: 9, marginTop: 6, padding: 12 },
  legendRow: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  legendSwatch: { borderRadius: 2, height: 9, width: 18 },
  legendFlag: { borderColor: 'rgba(255,255,255,0.18)', borderRadius: 1, borderWidth: 0.6, height: 10, overflow: 'hidden', width: 14 },
  miniFlagRow: { flex: 1, flexDirection: 'row' },
  miniCell: { flex: 1 },
  legendText: { color: '#9A9A9A', flex: 1, fontSize: 11, lineHeight: 14 },
  legendBold: { color: '#EDEAE6', fontWeight: '700' },
  healthRow: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  healthDotHealthy: { backgroundColor: '#EAE7E3', borderRadius: 4, height: 7, opacity: 0.9, width: 7 },
  healthDotTired: { backgroundColor: '#EAE7E3', borderRadius: 4, height: 7, opacity: 0.7, width: 7 },
  healthDotExhausted: { backgroundColor: '#EAE7E3', borderRadius: 4, height: 7, opacity: 0.48, width: 7 },
  energyRow: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  energyDot: { borderRadius: 3, height: 7, width: 7 },
  bulletRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 8 },
  bulletDot: { backgroundColor: '#5A5A5A', borderRadius: 3, height: 5, marginTop: 5, width: 5 },
  manageIcon: { alignItems: 'flex-start', backgroundColor: '#0A0A0A', borderColor: '#242424', borderRadius: 6, borderWidth: 1, gap: 3, height: 26, justifyContent: 'center', paddingHorizontal: 5, width: 26 },
  manageIconPlus: { alignItems: 'center', backgroundColor: '#0A0A0A', borderColor: '#242424', borderRadius: 13, borderWidth: 1, height: 26, justifyContent: 'center', width: 26 },
  plusHorizontalMini: { backgroundColor: '#DAD7D2', height: 1.2, position: 'absolute', width: 10 },
  plusVerticalMini: { backgroundColor: '#DAD7D2', height: 10, position: 'absolute', width: 1.2 },
  tutorialHint: { color: '#6E6E6E', fontSize: 10.5, fontStyle: 'italic', lineHeight: 14, marginTop: 2 },
  tutorialNav: { alignItems: 'center', gap: 12, marginTop: 16 },
  tutorialDots: { flexDirection: 'row', gap: 6 },
  tutorialDot: { backgroundColor: '#2A2A2A', borderRadius: 3, height: 5, width: 5 },
  tutorialDotActive: { backgroundColor: '#F0EEEA', width: 16 },
  tutorialNavButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  tutorialBack: { alignItems: 'center', borderColor: '#2A2A2A', borderRadius: 10, borderWidth: 1, flex: 1, paddingVertical: 11 },
  tutorialBackDisabled: { borderColor: '#1A1A1A', opacity: 0.45 },
  tutorialBackText: { color: '#9A9A9A', fontSize: 12, fontWeight: '800' },
  tutorialBackTextDisabled: { color: '#555' },
  tutorialNext: { alignItems: 'center', backgroundColor: '#F0EEEA', borderRadius: 10, flex: 1.2, paddingVertical: 11 },
  tutorialNextText: { color: '#171717', fontSize: 12, fontWeight: '900' },
});