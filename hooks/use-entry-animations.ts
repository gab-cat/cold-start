/* eslint-disable indent */
import { AnimationConfig } from '@/constants/theme';
import React, { useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
    FadeIn,
    FadeInDown,
    FadeInLeft,
    FadeInRight,
    FadeInUp,
    ZoomIn,
    type BaseAnimationBuilder
} from 'react-native-reanimated';

// Import React for the hook

export type AnimationPreset = 
  | 'fadeIn'
  | 'fadeInUp'
  | 'fadeInDown'
  | 'fadeInLeft'
  | 'fadeInRight'
  | 'scaleIn'
  | 'subtle';

export type AnimationDuration = 'fast' | 'normal' | 'slow';

interface AnimationOptions {
  /** Animation preset type */
  preset?: AnimationPreset;
  /** Delay before animation starts (ms) */
  delay?: number;
  /** Duration preset */
  duration?: AnimationDuration;
  /** Custom duration in ms (overrides preset) */
  customDuration?: number;
  /** Whether to use spring physics */
  springify?: boolean;
}

/**
 * Hook for creating consistent entry animations across the app.
 * Supports accessibility by checking for reduced motion preference.
 */
export function useEntryAnimations() {
  // Check for reduced motion preference
  const [reduceMotionEnabled, setReduceMotionEnabled] = React.useState(false);

  React.useEffect(() => {
    const checkReduceMotion = async () => {
      const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      setReduceMotionEnabled(isReduceMotionEnabled);
    };
    checkReduceMotion();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotionEnabled
    );

    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * Get an entering animation config for Animated.View
   */
  const getEnteringAnimation = useCallback(
    (options: AnimationOptions = {}): BaseAnimationBuilder | undefined => {
      // Skip animations if reduce motion is enabled
      if (reduceMotionEnabled) {
        return FadeIn.duration(0);
      }

      const {
        preset = 'fadeInUp',
        delay = 0,
        duration = 'normal',
        customDuration,
      } = options;

      const durationMs = customDuration ?? AnimationConfig.duration[duration];

      // Get the base animation
      let animation: BaseAnimationBuilder;
      
      switch (preset) {
      case 'fadeIn':
        animation = FadeIn.withInitialValues({ opacity: 0.5 });
        break;
      case 'fadeInUp':
        animation = FadeInDown.withInitialValues({ opacity: 0.5 }); // FadeInDown moves element UP into view
        break;
      case 'fadeInDown':
        animation = FadeInUp.withInitialValues({ opacity: 0.5 }); // FadeInUp moves element DOWN into view
        break;
      case 'fadeInLeft':
        animation = FadeInRight.withInitialValues({ opacity: 0.5 }); // FadeInRight moves element from LEFT
        break;
      case 'fadeInRight':
        animation = FadeInLeft.withInitialValues({ opacity: 0.5 }); // FadeInLeft moves element from RIGHT
        break;
      case 'scaleIn':
        animation = ZoomIn.withInitialValues({ opacity: 0.5 });
        break;
      case 'subtle':
        animation = FadeInDown.withInitialValues({
          opacity: 0.5,
          transform: [{ translateY: AnimationConfig.translateY.subtle }],
        });
        break;
      default:
        animation = FadeInDown.withInitialValues({ opacity: 0.5 });
      }

      // Apply delay and duration with linear easing
      animation = animation.delay(delay).duration(durationMs);

      return animation;
    },
    [reduceMotionEnabled]
  );

  /**
   * Get staggered animation delays for a list of items
   */
  const getStaggeredDelays = useCallback(
    (itemCount: number, baseDelay = 0): number[] => {
      return Array.from({ length: itemCount }, (_, i) => 
        baseDelay + i * AnimationConfig.stagger
      );
    },
    []
  );

  /**
   * Get animation config for a specific index in a staggered list
   */
  const getStaggeredAnimation = useCallback(
    (index: number, options: Omit<AnimationOptions, 'delay'> & { baseDelay?: number } = {}) => {
      const { baseDelay = 0, ...rest } = options;
      const delay = baseDelay + index * AnimationConfig.stagger;
      return getEnteringAnimation({ ...rest, delay });
    },
    [getEnteringAnimation]
  );

  return {
    getEnteringAnimation,
    getStaggeredDelays,
    getStaggeredAnimation,
    reduceMotionEnabled,
    config: AnimationConfig,
  };
}

/**
 * Pre-built animation configurations for common use cases
 */
export const AnimationPresets = {
  /** Subtle fade up for page sections */
  section: (index: number) => 
    FadeInDown
      .withInitialValues({ opacity: 0.5 })
      .delay(index * AnimationConfig.stagger)
      .duration(AnimationConfig.duration.normal),

  /** Quick fade for headers */
  header: () =>
    FadeIn
      .withInitialValues({ opacity: 0.5 })
      .duration(AnimationConfig.duration.fast),

  /** Scale in for icons and badges */
  icon: (delay = 0) =>
    ZoomIn
      .withInitialValues({ opacity: 0.5 })
      .delay(delay)
      .duration(AnimationConfig.duration.fast),

  /** Slide in from right for cards */
  cardSlide: (index: number) =>
    FadeInLeft
      .withInitialValues({ opacity: 0.5 })
      .delay(index * AnimationConfig.stagger)
      .duration(AnimationConfig.duration.normal),

  /** For list items that animate on scroll */
  listItem: (index: number) =>
    FadeInDown
      .withInitialValues({ opacity: 0.5 })
      .delay(Math.min(index, 5) * AnimationConfig.stagger) // Cap delay for long lists
      .duration(AnimationConfig.duration.normal),
} as const;
