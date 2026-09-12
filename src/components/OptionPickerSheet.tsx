import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type Option<T extends string | number> = { label: string; value: T };

type Props<T extends string | number> = {
  title: string;
  visible: boolean;
  value: T;
  options: Option<T>[];
  onSelect: (value: T) => void;
  onClose: () => void;
};

export function OptionPickerSheet<T extends string | number>({ title, visible, value, options, onSelect, onClose }: Props<T>) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={styles.card}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{title}</Text>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <Pressable key={String(option.value)} onPress={() => onSelect(option.value)} style={styles.row}>
                <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
                <Text style={styles.check}>{selected ? '✓' : ''}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(0,0,0,0.58)', flex: 1, justifyContent: 'flex-end' },
  backdrop: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  card: { backgroundColor: '#101010', borderColor: '#343434', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 18, paddingBottom: 24 },
  grabber: { alignSelf: 'center', backgroundColor: '#4B4B4B', borderRadius: 999, height: 3, marginBottom: 18, width: 36 },
  title: { color: '#F0EDE9', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  row: { alignItems: 'center', borderBottomColor: '#252525', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 52 },
  label: { color: '#B0B0B0', fontSize: 13 },
  labelSelected: { color: '#F0EDE9', fontWeight: '800' },
  check: { color: '#F0EDE9', fontSize: 14, fontWeight: '800' },
});
