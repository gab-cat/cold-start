export const WiseColors = {
  primary: '#2563EB',
  primaryDark: '#1E40AF',
  primaryLight: '#DBEAFE',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  success: '#10B981',
  warning: '#F97316',
  error: '#DC2626',
  accent: '#F97316',
  border: '#E2E8F0',
  subtle: '#F1F5F9',
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

// Animation constants for consistent entry animations
export const AnimationConfig = {
  // Duration presets (ms)
  duration: {
    fast: 250,
    normal: 400,
    slow: 600,
  },
  // Stagger delay between sequential items (ms)
  stagger: 80,
  // Spring physics for natural motion
  spring: {
    damping: 18,
    stiffness: 120,
    mass: 0.8,
  },
  // Fade in vertical offset (pixels)
  translateY: {
    subtle: 12,
    normal: 20,
    pronounced: 32,
  },
  // Scale values for scale-in animations
  scale: {
    start: 0.92,
    end: 1,
  },
} as const;
