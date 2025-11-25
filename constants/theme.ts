export const WiseColors = {
  primary: '#00B9A8',
  primaryDark: '#008B82',
  primaryLight: '#E6FAF8',
  background: '#FAFBFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  accent: '#FF6B6B',
  border: '#E5E7EB',
  subtle: '#F3F4F6',
};

// Colors object for useThemeColor hook compatibility
export const Colors = {
  light: {
    text: WiseColors.text,
    background: WiseColors.background,
    tint: WiseColors.primary,
    icon: WiseColors.textSecondary,
    tabIconDefault: WiseColors.textSecondary,
    tabIconSelected: WiseColors.primary,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: WiseColors.primary,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: WiseColors.primary,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
};
