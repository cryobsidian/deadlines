import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { OptionPickerSheet } from '@/components/OptionPickerSheet';
import type { Commitment, CommitmentCategory, CommitmentDifficulty, CommitmentFlexibility, CommitmentPriority } from '@/types/commitment';

const categoryOptions = ['university', 'work', 'health', 'personal', 'social'].map((value) => ({ label: titleCase(value), value: value as CommitmentCategory }));
const priorityOptions = ['low', 'medium', 'high', 'critical'].map((value) => ({ label: titleCase(value), value: value as CommitmentPriority }));
const difficultyOptions = [1, 2, 3].map((value) => ({ label: value === 1 ? 'Easy' : value === 2 ? 'Medium' : 'Hard', value: value as CommitmentDifficulty }));
const flexibilityOptions = ['fixed', 'flexible', 'droppable'].map((value) => ({ label: titleCase(value), value: value as CommitmentFlexibility }));

type Picker = 'category' | 'priority' | 'difficulty' | 'flexibility' | null;
type DuePicker = 'date' | 'time' | null;

type Props = {
  visible: boolean;
  now: Date;
  onClose: () => void;
  onAdd: (commitment: Commitment) => void;
};

function defaultDue(now: Date) {
  const due = new Date(now);
  due.setDate(due.getDate() + 3);
  due.setHours(18, 0, 0, 0);
  return due;
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function AddCommitmentModal({ visible, now, onClose, onAdd }: Props) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CommitmentCategory>('university');
  const [priority, setPriority] = useState<CommitmentPriority>('medium');
  const [difficulty, setDifficulty] = useState<CommitmentDifficulty>(2);
  const [flexibility, setFlexibility] = useState<CommitmentFlexibility>('flexible');
  const [due, setDue] = useState<Date>(() => defaultDue(now));
  const [advanced, setAdvanced] = useState(false);
  const [picker, setPicker] = useState<Picker>(null);
  const [duePicker, setDuePicker] = useState<DuePicker>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle('');
    setCategory('university');
    setPriority('medium');
    setDifficulty(2);
    setFlexibility('flexible');
    setDue(defaultDue(now));
    setAdvanced(false);
    setPicker(null);
    setDuePicker(null);
    setError(null);
  }

  function close() {
    reset();
    onClose();
  }

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return setError('Title is required');
    if (due.getTime() <= now.getTime()) return setError('Due date must be after now');

    onAdd({
      id: `commitment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: trimmed,
      startAt: now.toISOString(),
      dueAt: due.toISOString(),
      category,
      priority,
      difficulty,
      flexibility,
    });
    close();
  }

  function updateDueDate(next: Date) {
    const merged = new Date(due);
    merged.setFullYear(next.getFullYear(), next.getMonth(), next.getDate());
    setDue(merged);
    setError(null);
  }

  function updateDueTime(next: Date) {
    const merged = new Date(due);
    merged.setHours(next.getHours(), next.getMinutes(), 0, 0);
    setDue(merged);
    setError(null);
  }

  return (
    <>
      <Modal animationType="fade" onRequestClose={close} statusBarTranslucent transparent visible={visible}>
        <View style={styles.overlay}>
          <Pressable onPress={close} style={styles.backdrop} />
          <View style={styles.card}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <View><Text style={styles.title}>New commitment</Text><Text style={styles.subtitle}>Only the essentials first.</Text></View>
                <Pressable onPress={close}><Text style={styles.close}>×</Text></Pressable>
              </View>

              <Text style={styles.label}>Title</Text>
              <TextInput autoFocus onChangeText={(value) => { setTitle(value); setError(null); }} placeholder="e.g. Final essay" placeholderTextColor="#6E6E6E" style={styles.input} value={title} />

              <Text style={styles.label}>Due</Text>
              <View style={styles.row}>
                <Pressable onPress={() => setDuePicker('date')} style={[styles.pickerField, styles.field]}>
                  <Text style={styles.pickerValue}>{formatDate(due)}</Text>
                  <Text style={styles.hint}>date</Text>
                </Pressable>
                <Pressable onPress={() => setDuePicker('time')} style={[styles.pickerField, styles.field]}>
                  <Text style={styles.pickerValue}>{formatTime(due)}</Text>
                  <Text style={styles.hint}>time</Text>
                </Pressable>
              </View>

              {Platform.OS !== 'web' && duePicker ? (
                <DateTimePicker
                  display={Platform.OS === 'ios' ? 'compact' : 'default'}
                  minimumDate={duePicker === 'date' ? now : undefined}
                  mode={duePicker}
                  onChange={(_, selectedDate) => {
                    if (Platform.OS === 'android') setDuePicker(null);
                    if (!selectedDate) return;
                    if (duePicker === 'date') updateDueDate(selectedDate);
                    else updateDueTime(selectedDate);
                  }}
                  value={due}
                />
              ) : null}

              {Platform.OS === 'web' && duePicker ? (
                <View style={styles.webFallback}>
                  <Text style={styles.webFallbackText}>Native date/time picker is used on iOS and Android. For web preview, adjust with the quick controls below.</Text>
                  {duePicker === 'date' ? (
                    <View style={styles.quickRow}>
                      <QuickButton label="−1 day" onPress={() => setDue((current) => new Date(current.getTime() - 86400000))} />
                      <QuickButton label="+1 day" onPress={() => setDue((current) => new Date(current.getTime() + 86400000))} />
                    </View>
                  ) : (
                    <View style={styles.quickRow}>
                      <QuickButton label="−1 hr" onPress={() => setDue((current) => new Date(current.getTime() - 3600000))} />
                      <QuickButton label="+1 hr" onPress={() => setDue((current) => new Date(current.getTime() + 3600000))} />
                    </View>
                  )}
                  <Pressable onPress={() => setDuePicker(null)} style={styles.webDone}><Text style={styles.webDoneText}>Done</Text></Pressable>
                </View>
              ) : null}

              <SettingRow label="Category" value={titleCase(category)} onPress={() => setPicker('category')} />
              <SettingRow label="Priority" value={titleCase(priority)} onPress={() => setPicker('priority')} />

              <Pressable onPress={() => setAdvanced((value) => !value)} style={styles.more}><Text style={styles.moreText}>{advanced ? 'Hide options' : 'More options'}</Text><Text style={styles.moreIcon}>{advanced ? '−' : '+'}</Text></Pressable>

              {advanced && <View style={styles.advanced}><SettingRow label="Difficulty" value={difficultyLabel(difficulty)} onPress={() => setPicker('difficulty')} /><SettingRow label="Flexibility" value={titleCase(flexibility)} onPress={() => setPicker('flexibility')} /></View>}

              {error && <Text style={styles.error}>{error}</Text>}
              <Pressable onPress={submit} style={styles.primary}><Text style={styles.primaryText}>Add to timeline</Text></Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <OptionPickerSheet title="Category" visible={picker === 'category'} value={category} options={categoryOptions} onClose={() => setPicker(null)} onSelect={(value) => { setCategory(value); setPicker(null); }} />
      <OptionPickerSheet title="Priority" visible={picker === 'priority'} value={priority} options={priorityOptions} onClose={() => setPicker(null)} onSelect={(value) => { setPriority(value); setPicker(null); }} />
      <OptionPickerSheet title="Difficulty" visible={picker === 'difficulty'} value={difficulty} options={difficultyOptions} onClose={() => setPicker(null)} onSelect={(value) => { setDifficulty(value); setPicker(null); }} />
      <OptionPickerSheet title="Flexibility" visible={picker === 'flexibility'} value={flexibility} options={flexibilityOptions} onClose={() => setPicker(null)} onSelect={(value) => { setFlexibility(value); setPicker(null); }} />
    </>
  );
}

function SettingRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.setting}><Text style={styles.settingLabel}>{label}</Text><View style={styles.settingRight}><Text style={styles.settingValue}>{value}</Text><Text style={styles.chevron}>›</Text></View></Pressable>;
}

function QuickButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.quickButton}><Text style={styles.quickButtonText}>{label}</Text></Pressable>;
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function difficultyLabel(value: CommitmentDifficulty) {
  return value === 1 ? 'Easy' : value === 3 ? 'Hard' : 'Medium';
}

const styles = StyleSheet.create({
  overlay: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.74)', flex: 1, justifyContent: 'center', padding: 18 },
  backdrop: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  card: { backgroundColor: '#111111', borderColor: '#3C3C3C', borderRadius: 18, borderWidth: 1, maxHeight: '88%', maxWidth: 430, overflow: 'hidden', width: '100%' },
  content: { padding: 18 },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: '#F3F0EC', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#868686', fontSize: 11, marginTop: 4 },
  close: { color: '#A3A3A3', fontSize: 24, lineHeight: 24 },
  label: { color: '#8D8D8D', fontSize: 10, fontWeight: '700', letterSpacing: 0.6, marginBottom: 7, marginTop: 15, textTransform: 'uppercase' },
  input: { backgroundColor: '#171717', borderColor: '#3C3C3C', borderRadius: 10, borderWidth: 1, color: '#F4F1ED', fontSize: 14, paddingHorizontal: 12, paddingVertical: 11 },
  row: { flexDirection: 'row', gap: 10 },
  field: { flex: 1 },
  pickerField: { backgroundColor: '#171717', borderColor: '#3C3C3C', borderRadius: 10, borderWidth: 1, minHeight: 58, paddingHorizontal: 12, paddingVertical: 10 },
  pickerValue: { color: '#F4F1ED', fontSize: 13, fontWeight: '700' },
  hint: { color: '#666', fontSize: 9, marginTop: 5 },
  webFallback: { backgroundColor: '#151515', borderColor: '#303030', borderRadius: 12, borderWidth: 1, marginTop: 10, padding: 12 },
  webFallbackText: { color: '#7D7D7D', fontSize: 10, lineHeight: 15 },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  quickButton: { alignItems: 'center', borderColor: '#393939', borderRadius: 9, borderWidth: 1, flex: 1, paddingVertical: 9 },
  quickButtonText: { color: '#D9D6D2', fontSize: 10, fontWeight: '800' },
  webDone: { alignItems: 'center', marginTop: 8, paddingVertical: 7 },
  webDoneText: { color: '#A9A6A2', fontSize: 10, fontWeight: '800' },
  setting: { alignItems: 'center', borderBottomColor: '#252525', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 48, paddingVertical: 8 },
  settingLabel: { color: '#D7D4D0', fontSize: 12.5, fontWeight: '600' },
  settingRight: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  settingValue: { color: '#8D8D8D', fontSize: 12 },
  chevron: { color: '#666', fontSize: 20 },
  more: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingVertical: 10 },
  moreText: { color: '#989898', fontSize: 11, fontWeight: '700' },
  moreIcon: { color: '#777', fontSize: 18 },
  advanced: { borderTopColor: '#242424', borderTopWidth: 1 },
  error: { color: '#FF9B8B', fontSize: 11, marginTop: 12 },
  primary: { alignItems: 'center', backgroundColor: '#F0EEEA', borderRadius: 10, marginTop: 18, paddingVertical: 13 },
  primaryText: { color: '#171717', fontSize: 13, fontWeight: '800' },
});
