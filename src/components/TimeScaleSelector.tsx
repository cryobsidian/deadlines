import { Pressable, StyleSheet, Text, View } from 'react-native';

import { timelineTheme } from '@/constants/theme';
import type { TimeRange } from '@/types/commitment';

const options: TimeRange[] = ['day', 'week', 'month'];

type Props = {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
};

export function TimeScaleSelector({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={option}
            onPress={() => onChange(option)}
            style={({ pressed }) => [styles.option, selected && styles.selected, pressed && styles.pressed]}>
            <Text style={[styles.label, selected && styles.selectedLabel]}>{option.toUpperCase()}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    backgroundColor: 'rgba(8,8,8,0.78)',
    borderColor: '#303030',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    height: 38,
    padding: 2,
    width: 216,
  },
  option: {
    alignItems: 'center',
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: '#F2F0ED',
  },
  pressed: {
    opacity: 0.76,
  },
  label: {
    color: timelineTheme.colors.mutedText,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.35,
  },
  selectedLabel: {
    color: '#141414',
    fontWeight: '800',
  },
});
