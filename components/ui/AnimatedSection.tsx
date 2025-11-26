/* eslint-disable indent */
import { AnimationConfig } from '@/constants/theme';
import { AnimationPreset, AnimationPresets } from '@/hooks/use-entry-animations';
import React, { useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInLeft,
    FadeInRight,
    FadeInUp,
    ZoomIn,
} from 'react-native-reanimated';

interface AnimatedSectionProps {
  children: React.ReactNode;
  /** Index for staggered animations (each index adds AnimationConfig.stagger delay) */
  index?: number;
  /** Animation preset type */
  animation?: AnimationPreset;
  /** Base delay before animation starts (ms) */
  delay?: number;
  /** Whether to disable the animation */
  disabled?: boolean;
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
  /** Additional className for NativeWind */
  className?: string;
}

/**
 * Animated wrapper component for page sections.
 * Provides consistent entry animations with stagger support.
 * 
 * @example
 * // Basic usage with staggered sections
 * <AnimatedSection index={0}>
 *   <Header />
 * </AnimatedSection>
 * <AnimatedSection index={1}>
 *   <StatsGrid />
 * </AnimatedSection>
 * <AnimatedSection index={2}>
 *   <RecentActivity />
 * </AnimatedSection>
 */
export function AnimatedSection({
  children,
  index = 0,
  animation = 'fadeInUp',
  delay = 0,
  disabled = false,
  style,
  className,
}: AnimatedSectionProps) {
  const enteringAnimation = useMemo(() => {
    if (disabled) return undefined;

    const totalDelay = delay + index * AnimationConfig.stagger;

    switch (animation) {
    case 'fadeIn':
      return FadeIn
        .withInitialValues({ opacity: 0.5 })
        .delay(totalDelay)
        .duration(AnimationConfig.duration.normal);
      
    case 'fadeInUp':
      return FadeInDown
        .withInitialValues({ opacity: 0.5 })
        .delay(totalDelay)
        .duration(AnimationConfig.duration.normal);
      
    case 'fadeInDown':
      return FadeInUp
        .withInitialValues({ opacity: 0.5 })
        .delay(totalDelay)
        .duration(AnimationConfig.duration.normal);
      
    case 'fadeInLeft':
      return FadeInRight
        .withInitialValues({ opacity: 0.5 })
        .delay(totalDelay)
        .duration(AnimationConfig.duration.normal);
      
    case 'fadeInRight':
      return FadeInLeft
        .withInitialValues({ opacity: 0.5 })
        .delay(totalDelay)
        .duration(AnimationConfig.duration.normal);
      
    case 'scaleIn':
      return ZoomIn
        .withInitialValues({ opacity: 0.5 })
        .delay(totalDelay)
        .duration(AnimationConfig.duration.fast);
      
    case 'subtle':
      return FadeInDown
        .withInitialValues({
          opacity: 0.5,
          transform: [{ translateY: AnimationConfig.translateY.subtle }],
        })
        .delay(totalDelay)
        .duration(AnimationConfig.duration.normal);
      
    default:
      return FadeInDown
        .withInitialValues({ opacity: 0.5 })
        .delay(totalDelay)
        .duration(AnimationConfig.duration.normal);
    }
  }, [animation, delay, index, disabled]);

  return (
    <Animated.View 
      entering={enteringAnimation} 
      style={style}
      className={className}
    >
      {children}
    </Animated.View>
  );
}

interface AnimatedListItemProps {
  children: React.ReactNode;
  /** Index in the list for staggered animation */
  index: number;
  /** Maximum index to apply stagger delay (prevents excessive delays) */
  maxStaggerIndex?: number;
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
  /** Additional className */
  className?: string;
}

/**
 * Animated wrapper for list items with scroll-triggered animations.
 * Use this for FlatList/ScrollView items that should animate on scroll.
 * 
 * @example
 * // In a FlatList renderItem
 * const renderItem = ({ item, index }) => (
 *   <AnimatedListItem index={index}>
 *     <ArticleCard article={item} />
 *   </AnimatedListItem>
 * );
 */
export function AnimatedListItem({
  children,
  index,
  maxStaggerIndex = 5,
  style,
  className,
}: AnimatedListItemProps) {
  const enteringAnimation = useMemo(() => {
    // Cap the stagger delay to prevent long waits for items far down the list
    const cappedIndex = Math.min(index, maxStaggerIndex);
    return AnimationPresets.listItem(cappedIndex);
  }, [index, maxStaggerIndex]);

  return (
    <Animated.View 
      entering={enteringAnimation}
      style={style}
      className={className}
    >
      {children}
    </Animated.View>
  );
}

interface AnimatedIconProps {
  children: React.ReactNode;
  /** Delay before animation starts */
  delay?: number;
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
  /** Additional className */
  className?: string;
}

/**
 * Animated wrapper for icons and badges with scale-in effect.
 * 
 * @example
 * <AnimatedIcon delay={200}>
 *   <IconSymbol name="star" size={24} />
 * </AnimatedIcon>
 */
export function AnimatedIcon({
  children,
  delay = 0,
  style,
  className,
}: AnimatedIconProps) {
  return (
    <Animated.View 
      entering={AnimationPresets.icon(delay)}
      style={style}
      className={className}
    >
      {children}
    </Animated.View>
  );
}
