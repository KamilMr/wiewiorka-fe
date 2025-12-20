import {MD3LightTheme as DefaultTheme, useTheme} from 'react-native-paper';

export const colorNames = {
  softLavender: '#E8DEF8',
  deepMaroon: '#400303',
  white: '#FFFFFF',
};

export const unifiedColors = {
  // Primary palette - Navy blue
  primary: '#003366', // Main brand color inspiring trust
  primaryLight: '#004080', // Lighter navy variant
  primaryDark: '#002244', // Darker variant for hover/active states

  // Accent colors - Amber
  accent: '#FFBF00', // Accent color symbolizing wealth
  accentLight: '#FFD633', // Lighter amber
  accentDark: '#E6AC00', // Darker amber

  // Background colors
  background: '#FFFFFF', // White background
  surface: '#FFFFFF', // White surfaces
  surfaceVariant: '#F8F9FA', // Light gray for sections
  warmBeige: '#FAF8F5', // Warm beige for highlights

  // Semantic colors
  success: '#28A745', // Confirmed transactions and positive balances
  successLight: '#D4EDDA', // Light background for success
  warning: '#FFC107', // Budget limit alerts
  warningLight: '#FFF3CD', // Light background for warnings
  error: '#DC3545', // Error messages and negative balances
  errorLight: '#F8D7DA', // Light background for errors
  info: '#17A2B8', // Financial advice and tips
  infoLight: '#D1ECF1', // Light background for info

  // Neutral palette
  textPrimary: '#212529', // Primary text
  textSecondary: '#6C757D', // Helper text and labels
  textTertiary: '#ADB5BD', // Separators and inactive elements
  outline: '#E9ECEF', // Borders and divider lines
  outlineVariant: '#DEE2E6', // Subtle borders

  // Additional accent colors
  gold: '#FFD700', // Luxury accent for premium features
  warmOrange: '#FFA726', // Warm accent for notifications

  // Text colors on surfaces
  onSurface: '#212529',
  onSurfaceVariant: '#6C757D',
  onPrimary: '#FFFFFF',
  onAccent: '#003366',
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
  xs: 1, // New: For fine adjustments
  sm: SM, // 2
  md: SM ** 2, // 4
  lg: SM ** 3, // 8
  xl: SM ** 4, // 16
  xxl: SM ** 5, // 32
  xxxl: SM ** 6, // 64
};

export const spacing = {
  ...sizes,
  // Semantic spacing
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
    ...colorNames,
    ...unifiedColors,
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
