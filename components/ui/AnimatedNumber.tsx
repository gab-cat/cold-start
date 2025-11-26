import React, { useEffect } from 'react';
import { StyleProp, TextInput, TextStyle } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

interface AnimatedNumberProps {
  value: number;
  style?: StyleProp<TextStyle>;
  className?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  delay?: number;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  style,
  className,
  prefix = '',
  suffix = '',
  duration = 1500,
  delay = 0,
}) => {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withDelay(
      delay,
      withTiming(value, {
        duration,
        easing: Easing.out(Easing.exp),
      })
    );
  }, [value, delay, duration, animatedValue]);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: `${prefix}${Math.round(animatedValue.value).toLocaleString()}${suffix}`,
    } as any;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      value={`${prefix}0${suffix}`}
      className={`font-archivo-bold text-wise-text text-[32px] p-0 ${className}`}
      style={style}
      animatedProps={animatedProps}
    />
  );
};
