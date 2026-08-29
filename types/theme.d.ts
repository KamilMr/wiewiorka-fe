import {MD3Theme} from 'react-native-paper';

declare module 'react-native-paper' {
  interface MD3Colors {
    // Warm palette roles
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primaryForeground: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
    chart1: string;
    chart2: string;
    chart3: string;
    chart4: string;
    chart5: string;
    sidebar: string;
    sidebarForeground: string;
    sidebarPrimary: string;
    sidebarPrimaryForeground: string;
    sidebarAccent: string;
    sidebarAccentForeground: string;
    sidebarBorder: string;
    sidebarRing: string;
    cardSolid: string;
    cardBorder: string;
    inputBackground: string;
    danger: string;
    dangerBackground: string;
    decorPrimary: string;
    decorSecondary: string;

    // Compatibility aliases
    primaryLight: string;
    primaryDark: string;
    accentLight: string;
    accentDark: string;
    warmBeige: string;
    success: string;
    successLight: string;
    warning: string;
    warningLight: string;
    errorLight: string;
    info: string;
    infoLight: string;
    gold: string;
    warmOrange: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    onAccent: string;
  }

  interface MD3Theme {
    spacing: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      xxxl: number;
      cardPadding: number;
      sectionGap: number;
      componentGap: number;
      buttonPadding: number;
    };
    typography: {
      displayLarge: {fontSize: number; fontWeight: string; lineHeight: number};
      displayMedium: {fontSize: number; fontWeight: string; lineHeight: number};
      headlineLarge: {fontSize: number; fontWeight: string; lineHeight: number};
      headlineMedium: {
        fontSize: number;
        fontWeight: string;
        lineHeight: number;
      };
      titleLarge: {fontSize: number; fontWeight: string; lineHeight: number};
      titleMedium: {fontSize: number; fontWeight: string; lineHeight: number};
      titleSmall: {fontSize: number; fontWeight: string; lineHeight: number};
      bodyLarge: {fontSize: number; fontWeight: string; lineHeight: number};
      bodyMedium: {fontSize: number; fontWeight: string; lineHeight: number};
      bodySmall: {fontSize: number; fontWeight: string; lineHeight: number};
      labelLarge: {fontSize: number; fontWeight: string; lineHeight: number};
      labelMedium: {fontSize: number; fontWeight: string; lineHeight: number};
      labelSmall: {fontSize: number; fontWeight: string; lineHeight: number};
    };
    borderRadius: {
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
    shadows: {
      sm: {elevation: number; shadowRadius: number};
      md: {elevation: number; shadowRadius: number};
      lg: {elevation: number; shadowRadius: number};
    };
  }
}
