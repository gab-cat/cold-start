import { WiseColors } from "@/constants/theme";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { LinearGradient } from "react-native-linear-gradient";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Card } from "./ui/Card";

interface StreakBadgeProps {
  streakType: string;
  currentCount: number;
  maxCount: number;
}

export function StreakBadge({
  streakType,
  currentCount,
  maxCount,
}: StreakBadgeProps) {
  const displayName =
    streakType.charAt(0).toUpperCase() + streakType.slice(1).replace("_", " ");
  
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Card className="mb-4 overflow-hidden" padding="none">
      <LinearGradient
        colors={[WiseColors.surface, '#FFF8F0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-4"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="font-sans-medium text-sm text-wise-text-secondary mb-1 uppercase tracking-tight">
              {displayName}
            </Text>
            <View className="flex-row items-center mb-1">
              <Animated.Text className="text-2xl mr-2" style={animatedStyle}>
                🔥
              </Animated.Text>
              <Text className="font-archivo-bold text-2xl text-wise-warning">
                {currentCount} days
              </Text>
            </View>
            <Text className="font-sans text-sm text-wise-text-secondary">
              Personal best: {maxCount}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Card>
  );
}

