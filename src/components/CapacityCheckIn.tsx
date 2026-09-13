import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export type DailyCapacity = 'low' | 'okay' | 'good';

const options: { value: DailyCapacity; title: string; detail: string }[] = [
  { value: 'low', title: 'Running low', detail: 'Keep today lighter where possible' },
  { value: 'okay', title: 'Okay', detail: 'A normal amount of room today' },
  { value: 'good', title: 'Good', detail: 'You have more room than usual' },
];

export function CapacityCheckIn({
  value,
  visible,
  onChange,
  onClose,
}: {
  value: DailyCapacity;
  visible: boolean;
  onChange: (value: DailyCapacity) => void;
  onClose: () => void;
}) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={styles.card}>
          <View style={styles.grabber} />
          <Text style={styles.eyebrow}>TODAY</Text>
          <Text style={styles.title}>How much do you have in you?</Text>
          <Text style={styles.subtitle}>One quick check-in helps Deadlines judge pressure against your actual capacity.</Text>

          <View style={styles.options}>
            {options.map((option) => {
              const selected = value === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    onClose();
                  }}
                  style={[styles.option, selected && styles.optionSelected]}>
                  <View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.radioCore} />}</View>
                  <View style={styles.copy}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDetail}>{option.detail}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.note}>No mood diary. No diagnosis. Just enough context to avoid treating every day as equal.</Text>
        </View>
      </View>
    </Modal>
  );
}

export function CapacityPill({ value, onPress }: { value: DailyCapacity; onPress: () => void }) {
  const label = value === 'low' ? 'RUNNING LOW' : value === 'good' ? 'GOOD' : 'OKAY';
  return (
    <Pressable accessibilityLabel="Update today's capacity" onPress={onPress} style={styles.pill}>
      <View style={[styles.pillDot, value === 'low' && styles.pillDotLow, value === 'good' && styles.pillDotGood]} />
      <Text style={styles.pillLabel}>TODAY · {label}</Text>
      <Text style={styles.pillChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(0,0,0,0.62)', flex: 1, justifyContent: 'flex-end' },
  backdrop: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  card: { backgroundColor: '#101010', borderColor: '#343434', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 20, paddingBottom: 28 },
  grabber: { alignSelf: 'center', backgroundColor: '#4B4B4B', borderRadius: 999, height: 3, marginBottom: 22, width: 36 },
  eyebrow: { color: '#777', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 },
  title: { color: '#F1EFEC', fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { color: '#858585', fontSize: 11, lineHeight: 17, marginTop: 7, maxWidth: 330 },
  options: { gap: 8, marginTop: 20 },
  option: { alignItems: 'center', borderColor: '#292929', borderRadius: 14, borderWidth: 1, flexDirection: 'row', minHeight: 62, paddingHorizontal: 14 },
  optionSelected: { backgroundColor: '#171717', borderColor: '#555' },
  radio: { alignItems: 'center', borderColor: '#555', borderRadius: 10, borderWidth: 1, height: 18, justifyContent: 'center', marginRight: 12, width: 18 },
  radioSelected: { borderColor: '#E8E5E1' },
  radioCore: { backgroundColor: '#E8E5E1', borderRadius: 4, height: 8, width: 8 },
  copy: { flex: 1 },
  optionTitle: { color: '#EAE7E3', fontSize: 13, fontWeight: '700' },
  optionDetail: { color: '#747474', fontSize: 10, marginTop: 4 },
  note: { color: '#5F5F5F', fontSize: 9, lineHeight: 14, marginTop: 18 },
  pill: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#0B0B0B', borderColor: '#292929', borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 7, minHeight: 30, paddingHorizontal: 12 },
  pillDot: { backgroundColor: '#969696', borderRadius: 3, height: 5, width: 5 },
  pillDotLow: { backgroundColor: '#F08A78' },
  pillDotGood: { backgroundColor: '#8FAF95' },
  pillLabel: { color: '#9A9A9A', fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  pillChevron: { color: '#666', fontSize: 15, marginLeft: 2 },
});
