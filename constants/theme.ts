import {MD3LightTheme as DefaultTheme, useTheme} from 'react-native-paper';

import {warmColors} from './warmTheme';

export const colorNames = {
  softLavender: warmColors.accent,
  deepMaroon: warmColors.foreground,
  white: warmColors.primaryForeground,
};

export const unifiedColors = {
  // Compatibility aliases for the previous project theme
  primaryLight: warmColors.accent,
  primaryDark: warmColors.chart3,
  accent: warmColors.accent,
  accentLight: warmColors.secondary,
  accentDark: warmColors.chart3,
  warmBeige: warmColors.muted,

  // Existing semantic colors without supplied replacements
  success: '#28A745',
  successLight: '#D4EDDA',
  warning: '#FFC107',
  warningLight: '#FFF3CD',
  error: warmColors.destructive,
  errorLight: warmColors.accent,
  info: '#17A2B8',
  infoLight: '#D1ECF1',
  gold: '#FFD700',
  warmOrange: warmColors.primary,

  textPrimary: warmColors.foreground,
  textSecondary: warmColors.mutedForeground,
  textTertiary: warmColors.mutedForeground,
  onAccent: warmColors.accentForeground,
};

export const typography = {
  // Display text
  displayLarge: {fontSize: 32, fontWeight: '400' as const, lineHeight: 40},
  displayMedium: {fontSize: 28, fontWeight: '400' as const, lineHeight: 36},

  // Headlines
  headlineLarge: {fontSize: 24, fontWeight: '400' as const, lineHeight: 32},
  headlineMedium: {fontSize: 20, fontWeight: '400' as const, lineHeight: 28},

  // Titles
  titleLarge: {fontSize: 18, fontWeight: '500' as const, lineHeight: 24},
  titleMedium: {fontSize: 16, fontWeight: '500' as const, lineHeight: 22},
  titleSmall: {fontSize: 14, fontWeight: '500' as const, lineHeight: 20},

  // Body text
  bodyLarge: {fontSize: 16, fontWeight: '400' as const, lineHeight: 24},
  bodyMedium: {fontSize: 14, fontWeight: '400' as const, lineHeight: 20},
  bodySmall: {fontSize: 12, fontWeight: '400' as const, lineHeight: 16},

  // Labels
  labelLarge: {fontSize: 14, fontWeight: '500' as const, lineHeight: 20},
  labelMedium: {fontSize: 12, fontWeight: '500' as const, lineHeight: 16},
  labelSmall: {fontSize: 10, fontWeight: '500' as const, lineHeight: 14},
};

/**
 * Base size multiplier
 * @constant {number}
 */
export const SM: number = 2;

/**
 * Object containing size options with different scaling factors.
 * Each key represents a size (sm, md, lg, xl, xxl, xxxl) with values based on powers of SM.
 * - `xs`: 1
 * - `sm`: 2
 * - `md`: 4
 * - `lg`: 8
 * - `xl`: 16
 * - `xxl`: 32
 * - `xxxl`: 64
 *
 * @type {{ xs: 1, sm: 2, md: 4, lg: 8, xl: 16, xxl: 32, xxxl: 64 }}
 */
export const sizes: Record<
  'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl',
  number
> = {
  xs: 1,
  sm: SM,
  md: SM ** 2,
  lg: SM ** 3,
  xl: SM ** 4,
  xxl: SM ** 5,
  xxxl: SM ** 6,
};

export const spacing = {
  ...sizes,
  cardPadding: 16,
  sectionGap: 24,
  componentGap: 12,
  buttonPadding: 12,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

export const shadows = {
  sm: {elevation: 2, shadowRadius: 4},
  md: {elevation: 4, shadowRadius: 8},
  lg: {elevation: 8, shadowRadius: 16},
};

export const unifiedTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...warmColors,
    ...colorNames,
    ...unifiedColors,
    primary: warmColors.primary,
    primaryContainer: warmColors.accent,
    secondary: warmColors.secondary,
    secondaryContainer: warmColors.muted,
    tertiary: warmColors.accent,
    tertiaryContainer: warmColors.accent,
    surface: warmColors.card,
    surfaceVariant: warmColors.muted,
    surfaceDisabled: warmColors.muted,
    background: warmColors.background,
    error: warmColors.destructive,
    errorContainer: warmColors.muted,
    onPrimary: warmColors.primaryForeground,
    onPrimaryContainer: warmColors.foreground,
    onSecondary: warmColors.secondaryForeground,
    onSecondaryContainer: warmColors.foreground,
    onTertiary: warmColors.accentForeground,
    onTertiaryContainer: warmColors.accentForeground,
    onSurface: warmColors.foreground,
    onSurfaceVariant: warmColors.mutedForeground,
    onSurfaceDisabled: warmColors.mutedForeground,
    onError: warmColors.destructiveForeground,
    onErrorContainer: warmColors.foreground,
    onBackground: warmColors.foreground,
    outline: warmColors.border,
    outlineVariant: warmColors.input,
    inverseSurface: warmColors.foreground,
    inverseOnSurface: warmColors.background,
    inversePrimary: warmColors.primary,
    shadow: warmColors.foreground,
    scrim: warmColors.foreground,
    backdrop: warmColors.muted,
    elevation: {
      level0: warmColors.card,
      level1: warmColors.card,
      level2: warmColors.card,
      level3: warmColors.muted,
      level4: warmColors.muted,
      level5: warmColors.accent,
    },
  },
  spacing,
  typography,
  borderRadius,
  shadows,
};

// Keep paperTheme for backward compatibility
export const paperTheme = unifiedTheme;

export type AppTheme = typeof paperTheme;

export const useAppTheme = () => useTheme<AppTheme>();

export const SYNC_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 3 * 60 * 1000, // 3 minutes
  CLEANUP_DELAY: 5 * 60 * 1000, // 5 minutes
};
