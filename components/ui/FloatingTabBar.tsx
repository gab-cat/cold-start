import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WiseColors } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 180,
  mass: 0.8,
};

const TAB_BAR_HEIGHT = 70;
const TAB_BAR_MARGIN = 16;
const PILL_PADDING = 6;

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const tabCount = state.routes.length;
  
  // Track container width for accurate pill positioning
  const [containerWidth, setContainerWidth] = useState(0);
  const tabWidth = containerWidth / tabCount;
  
  // Animated value for sliding pill position (0 to tabCount-1)
  const pillTranslateX = useSharedValue(0);
  
  // Update pill position when tab changes or container width changes
  useEffect(() => {
    if (containerWidth > 0) {
      pillTranslateX.value = withSpring(state.index * tabWidth, SPRING_CONFIG);
    }
  }, [state.index, tabWidth, containerWidth, pillTranslateX]);

  // Animated style for the sliding pill indicator
  const pillAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: pillTranslateX.value }],
    };
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, 12),
          marginHorizontal: TAB_BAR_MARGIN,
        },
      ]}
      onLayout={handleLayout}
    >
      {/* Background with blur or solid */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={90}
          tint="light"
          style={[StyleSheet.absoluteFill, styles.blurBackground]}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.solidBackground]} />
      )}

      {/* Sliding pill indicator */}
      {containerWidth > 0 && (
        <Animated.View 
          style={[
            styles.pillContainer, 
            { width: tabWidth - PILL_PADDING * 2 },
            pillAnimatedStyle,
          ]}
        >
          <View style={styles.pill} />
        </Animated.View>
      )}

      {/* Tab buttons */}
      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabButton
              key={route.key}
              options={options}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

interface TabButtonProps {
  options: BottomTabBarProps['descriptors'][string]['options'];
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function TabButton({ options, isFocused, onPress, onLongPress }: TabButtonProps) {
  // Scale animation on press
  const scale = useSharedValue(1);
  // Icon color interpolation
  const colorProgress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    colorProgress.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [isFocused, colorProgress]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 0.9 + colorProgress.value * 0.15 }, // Scale from 0.9 to 1.05
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.85, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  // Get icon color based on focus state
  const iconColor = isFocused ? WiseColors.primary : WiseColors.textSecondary;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarButtonTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tabButton, animatedContainerStyle]}
    >
      <Animated.View style={animatedIconStyle}>
        {options.tabBarIcon?.({
          focused: isFocused,
          color: iconColor,
          size: 26,
        })}
      </Animated.View>
      {isFocused && (
        <Animated.Text
          style={[
            styles.tabLabel,
            { color: WiseColors.primary },
          ]}
        >
          {options.title}
        </Animated.Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TAB_BAR_HEIGHT,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  blurBackground: {
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  solidBackground: {
    borderRadius: 9999,
    backgroundColor: WiseColors.surface,
    borderWidth: 0.5,
    borderColor: WiseColors.border,
  },
  pillContainer: {
    position: 'absolute',
    top: PILL_PADDING,
    bottom: PILL_PADDING,
    left: PILL_PADDING,
  },
  pill: {
    flex: 1,
    backgroundColor: WiseColors.primaryLight,
    borderRadius: 9999,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    marginTop: 2,
  },
});
