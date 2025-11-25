import { WiseColors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  textClassName?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className,
  textClassName,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getSizeClasses = () => {
    switch (size) {
    case 'sm':
      return 'py-1 px-4 min-h-[32px]';
    case 'lg':
      return 'py-4 px-8 min-h-[56px]';
    default:
      return 'py-3 px-6 min-h-[48px]';
    }
  };

  const getVariantClasses = () => {
    if (disabled) {
      return 'bg-wise-subtle border-wise-border';
    }
    switch (variant) {
    case 'primary':
      return 'bg-wise-primary rounded-full';
    case 'secondary':
      return 'bg-wise-primary-light';
    case 'outline':
      return 'bg-wise-surface border-[1.5px] border-wise-primary';
    case 'ghost':
      return 'bg-transparent';
    default:
      return '';
    }
  };

  const getTextColor = () => {
    if (disabled) return WiseColors.textSecondary;
    switch (variant) {
    case 'primary':
      return '#FFFFFF';
    case 'secondary':
      return WiseColors.primaryDark;
    case 'outline':
      return WiseColors.primary;
    case 'ghost':
      return WiseColors.text;
    default:
      return WiseColors.text;
    }
  };

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={getTextColor()} className="mr-2" />
      ) : (
        <>
          {icon && <View className='mr-2'>{icon}</View>}
          <Text 
            className={`font-sans-bold text-center ${size === 'sm' ? 'text-sm' : 'text-base'} ${textClassName}`}
            style={{ color: getTextColor() }}
          >
            {title}
          </Text>
        </>
      )}
    </>
  );

  if (variant === 'primary' && !disabled) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loading || disabled}
        style={animatedStyle}
        className={`rounded-full overflow-hidden ${className || ''}`}
      >
        <LinearGradient
          colors={[WiseColors.primary, WiseColors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className={`flex-row items-center justify-center rounded-full ${getSizeClasses()}`}
        >
          {content}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={loading || disabled}
      style={animatedStyle}
      className={`flex-row items-center justify-center rounded-full ${getSizeClasses()} ${getVariantClasses()} ${className}`}
    >
      {content}
    </AnimatedPressable>
  );
};
