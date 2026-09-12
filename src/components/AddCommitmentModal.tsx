import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { OptionPickerSheet } from '@/components/OptionPickerSheet';
import { addDays } from '@/domain/workload';
import type { Commitment, CommitmentCategory, CommitmentDifficulty, CommitmentFlexibility, CommitmentPriority } from '@/types/commitment';

const categoryOptions = ['university', 'work', 'health', 'personal', 'social'].map((value) => ({ label: titleCase(value), value: value as CommitmentCategory }));
const priorityOptions = ['low', 'medium', 'high', 'critical'].map((value) => ({ label: titleCase(value), value: value as CommitmentPriority }));
const difficultyOptions = [1, 2, 3].map((value) => ({ label: value === 1 ? 'Easy' : value === 2 ? 'Medium' : 'Hard', value: value as CommitmentDifficulty }));
const flexibilityOptions = ['fixed', 'flexible', 'droppable'].map((value) => ({ label: titleCase(value), value: value as CommitmentFlexibility }));

type Picker = 'category' | 'priority' | 'difficulty' | 'flexibility' | null;

type Props = {
  visible: boolean;
  now: Date;
  onClose: () => void;
  onAdd: (commitment: Commitment) => void;
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function AddCommitmentModal({ visible, now, onClose, onAdd }: Props) {
  const defaultDueDate = toDateInputValue(addDays(now, 3));
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CommitmentCategory>('university');
  const [priority, setPriority] = useState<CommitmentPriority>('medium');
  const [difficulty, setDifficulty] = useState<CommitmentDifficulty>(2);
  const [flexibility, setFlexibility] = useState<CommitmentFlexibility>('flexible');
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [dueTime, setDueTime] = useState('18:00');
  const [advanced, setAdvanced] = useState(false);
  const [picker, setPicker] = useState<Picker>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle('');
    setCategory('university');
    setPriority('medium');
    setDifficulty(2);
    setFlexibility('flexible');
    setDueDate(toDateInputValue(addDays(now, 3)));
    setDueTime('18:00');
    setAdvanced(false);
    setPicker(null);
    setError(null);
  }

  function close() {
    reset();
    onClose();
  }

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return setError('Title is required');

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return setError('Use date format YYYY-MM-DD');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(dueTime)) return setError('Use time format HH:MM');

    const [year, month, day] = dueDate.split('-').map(Number);
    const [hour, minute] = dueTime.split(':').map(Number);
    const due = new Date(year, month - 1, day, hour, minute, 0, 0);

    if (
      due.getFullYear() !== year ||
      due.getMonth() !== month - 1 ||
      due.getDate() !== day
    ) return setError('Enter a valid due date');

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
                <View style={[styles.field, styles.dateField]}>
                  <TextInput
                    autoCapitalize="none"
                    onChangeText={(value) => { setDueDate(value.replace(/[^0-9-]/g, '').slice(0, 10)); setError(null); }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#6E6E6E"
                    style={styles.input}
                    value={dueDate}
                  />
                  <Text style={styles.hint}>date</Text>
                </View>
                <View style={styles.timeField}>
                  <TextInput
                    autoCapitalize="none"
                    onChangeText={(value) => { setDueTime(value.replace(/[^0-9:]/g, '').slice(0, 5)); setError(null); }}
                    placeholder="18:00"
                    placeholderTextColor="#6E6E6E"
                    style={styles.input}
                    value={dueTime}
                  />
                  <Text style={styles.hint}>time</Text>
                </View>
              </View>

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
  dateField: { flex: 1.45 },
  timeField: { flex: 0.8 },
  hint: { color: '#666', fontSize: 9, marginTop: 5 },
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
