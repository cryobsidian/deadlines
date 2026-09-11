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
            style={[styles.option, selected && styles.selected]}>
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
    borderColor: timelineTheme.colors.outline,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    height: 44,
    overflow: 'hidden',
    width: 260,
  },
  option: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: timelineTheme.colors.selected,
    borderRadius: 22,
  },
  label: {
    color: timelineTheme.colors.text,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0,
  },
  selectedLabel: {
    color: timelineTheme.colors.selectedText,
    fontWeight: '800',
  },
});


