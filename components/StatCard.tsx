import { WiseColors } from "@/constants/theme";
import React from "react";
import { Text, View } from "react-native";
import { AnimatedNumber } from "./ui/AnimatedNumber";
import { Card } from "./ui/Card";
import { ProgressRing } from "./ui/ProgressRing";

interface StatCardProps {
  label: string;
  value: number;
  target?: number;
  unit: string;
  color?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, target, unit, color = WiseColors.primary, icon }: StatCardProps) {
  const percentage = target ? Math.min(value / target, 1) : 0;

  return (
    <Card className="flex-1 min-w-[45%] mb-4" padding="md">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="font-sans-medium text-sm text-wise-text-secondary uppercase tracking-tight">
          {label}
        </Text>
        {icon}
      </View>
      
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-1">
          <AnimatedNumber
            value={value}
            className="text-[32px] tracking-tighter leading-10"
            style={{ color }}
          />
          <Text className="font-sans-medium text-sm text-wise-text-secondary">
            {unit}
          </Text>
        </View>

        {target && (
          <View className="ml-4">
            <ProgressRing
              progress={percentage}
              size={60}
              strokeWidth={6}
              color={color}
            >
              <Text 
                className="font-sans-bold text-xs"
                style={{ color }}
              >
                {Math.round(percentage * 100)}%
              </Text>
            </ProgressRing>
          </View>
        )}
      </View>
      
      {target && (
        <Text className="font-sans text-xs text-wise-text-secondary mt-1">
          Goal: {target} {unit}
        </Text>
      )}
    </Card>
  );
}

