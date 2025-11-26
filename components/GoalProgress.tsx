import { WiseColors } from "@/constants/theme";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

interface GoalProgressProps {
  milestone: string;
  currentProgress: number;
  goalValue: number;
  goalUnit: string;
  createdBy?: "user" | "ai";
  sourceData?: {
    reasoning: string;
    basedOn: string[];
    confidence: number;
  };
}

export function GoalProgress({
  milestone,
  currentProgress,
  goalValue,
  goalUnit,
  createdBy,
  sourceData,
}: GoalProgressProps) {
  const percentage = Math.min((currentProgress / goalValue) * 100, 100);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withDelay(200, withTiming(percentage, { duration: 1000 }));
  }, [percentage, progressWidth]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
    };
  });

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-end mb-2">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-sans-bold text-base text-wise-text">
              {milestone}
            </Text>
            {createdBy === "ai" && (
              <View className="bg-wise-primary/20 px-2 py-0.5 rounded-full">
                <Text className="font-sans-bold text-xs text-wise-primary">AI</Text>
              </View>
            )}
          </View>
          {createdBy === "ai" && sourceData && (
            <Text className="font-sans text-xs text-wise-text-secondary mt-1">
              Based on: {sourceData.basedOn.join(", ")}
            </Text>
          )}
        </View>
        <Text className="text-right">
          <Text className="font-archivo-bold text-base text-wise-primary">
            {currentProgress}
          </Text>
          <Text className="font-sans-medium text-sm text-wise-text-secondary">
            /{goalValue} {goalUnit}
          </Text>
        </Text>
      </View>
      
      <View className="h-2 bg-wise-subtle rounded-full overflow-hidden">
        <Animated.View 
          className="h-full rounded-full"
          style={[animatedStyle, { backgroundColor: WiseColors.success }]} 
        />
      </View>
    </View>
  );
}

