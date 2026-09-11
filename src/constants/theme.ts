import { Platform } from 'react-native';

export const timelineTheme = {
  colors: {
    background: '#000000',
    text: '#F7F7F7',
    mutedText: '#A3A3A3',
    rail: '#5C5C5C',
    railDot: '#BDBDBD',
    future: '#3F3F3F',
    active: '#F5F5F5',
    selected: '#F3F3F3',
    selectedText: '#111111',
    outline: '#4B4B4B',
    overload: 'rgba(180, 180, 180, 0.12)',
    panel: 'rgba(18, 18, 18, 0.92)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
} as const;

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: timelineTheme.colors.text,
    background: timelineTheme.colors.background,
    backgroundElement: '#171717',
    backgroundSelected: '#2B2B2B',
    textSecondary: timelineTheme.colors.mutedText,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = 0;
export const MaxContentWidth = 800;

