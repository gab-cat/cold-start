import { WiseColors } from "@/constants/theme";
import React from "react";
import { Text, View } from "react-native";
import { Card } from "./ui/Card";
import { IconSymbol } from "./ui/icon-symbol";

interface DailyCalorieBreakdownProps {
  caloriesConsumed: number;
  caloriesBurned: number;
  netCalories: number;
  caloriesBreakfast: number;
  caloriesLunch: number;
  caloriesDinner: number;
  caloriesSnacks: number;
  calorieGoal: number;
}

interface CalorieRowProps {
  label: string;
  value: number;
  icon: string;
  iconColor: string;
  isSubtraction?: boolean;
}

const CalorieRow = ({ label, value, icon, iconColor, isSubtraction }: CalorieRowProps) => (
  <View className="flex-row items-center justify-between py-2">
    <View className="flex-row items-center">
      <View
        className="w-8 h-8 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: `${iconColor}20` }}
      >
        <IconSymbol name={icon as any} size={16} color={iconColor} />
      </View>
      <Text className="font-sans-medium text-base text-wise-text">{label}</Text>
    </View>
    <Text
      className="font-archivo-bold text-base"
      style={{ color: isSubtraction ? "#10B981" : WiseColors.text }}
    >
      {isSubtraction ? "-" : "+"}{value} kcal
    </Text>
  </View>
);

export function DailyCalorieBreakdown({
  caloriesConsumed,
  caloriesBurned,
  netCalories,
  caloriesBreakfast,
  caloriesLunch,
  caloriesDinner,
  caloriesSnacks,
  calorieGoal,
}: DailyCalorieBreakdownProps) {
  const netCalorieColor = netCalories > calorieGoal 
    ? "#EF4444" // Red - over goal
    : netCalories > calorieGoal * 0.8 
      ? "#F59E0B" // Amber - approaching goal
      : "#10B981"; // Green - under goal

  const percentOfGoal = Math.round((netCalories / calorieGoal) * 100);

  return (
    <Card padding="lg">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="font-archivo-bold text-lg text-wise-text">
          Calorie Balance
        </Text>
        <View className="flex-row items-center">
          <IconSymbol name="flame" size={18} color="#F59E0B" />
          <Text className="font-sans-medium text-sm text-wise-text-secondary ml-1">
            Goal: {calorieGoal} kcal
          </Text>
        </View>
      </View>

      {/* Net Calories Display */}
      <View 
        className="rounded-xl p-4 mb-4 items-center"
        style={{ backgroundColor: `${netCalorieColor}15` }}
      >
        <Text className="font-sans-medium text-sm text-wise-text-secondary mb-1">
          Net Calories
        </Text>
        <Text 
          className="font-archivo-bold text-3xl"
          style={{ color: netCalorieColor }}
        >
          {netCalories} kcal
        </Text>
        <Text 
          className="font-sans text-sm mt-1"
          style={{ color: netCalorieColor }}
        >
          {percentOfGoal}% of daily goal
        </Text>
      </View>

      {/* Consumed Section */}
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          <IconSymbol name="arrow.up.circle.fill" size={20} color="#EF4444" />
          <Text className="font-archivo-bold text-base text-wise-text ml-2">
            Consumed: {caloriesConsumed} kcal
          </Text>
        </View>
        
        <View className="ml-4 border-l-2 border-wise-border pl-4">
          {caloriesBreakfast > 0 && (
            <CalorieRow 
              label="Breakfast" 
              value={caloriesBreakfast} 
              icon="sunrise" 
              iconColor="#F59E0B" 
            />
          )}
          {caloriesLunch > 0 && (
            <CalorieRow 
              label="Lunch" 
              value={caloriesLunch} 
              icon="sun.max" 
              iconColor="#F97316" 
            />
          )}
          {caloriesDinner > 0 && (
            <CalorieRow 
              label="Dinner" 
              value={caloriesDinner} 
              icon="moon.stars" 
              iconColor="#8B5CF6" 
            />
          )}
          {caloriesSnacks > 0 && (
            <CalorieRow 
              label="Snacks" 
              value={caloriesSnacks} 
              icon="takeoutbag.and.cup.and.straw" 
              iconColor="#EC4899" 
            />
          )}
          {caloriesConsumed === 0 && (
            <Text className="font-sans text-sm text-wise-text-secondary py-2">
              No meals logged yet
            </Text>
          )}
        </View>
      </View>

      {/* Burned Section */}
      <View>
        <View className="flex-row items-center mb-2">
          <IconSymbol name="arrow.down.circle.fill" size={20} color="#10B981" />
          <Text className="font-archivo-bold text-base text-wise-text ml-2">
            Burned: {caloriesBurned} kcal
          </Text>
        </View>
        
        {caloriesBurned > 0 ? (
          <View className="ml-4 border-l-2 border-wise-border pl-4">
            <CalorieRow 
              label="Exercise" 
              value={caloriesBurned} 
              icon="figure.run" 
              iconColor="#10B981"
              isSubtraction
            />
          </View>
        ) : (
          <View className="ml-4 border-l-2 border-wise-border pl-4">
            <Text className="font-sans text-sm text-wise-text-secondary py-2">
              No workouts logged yet
            </Text>
          </View>
        )}
      </View>

      {/* Summary Formula */}
      <View className="mt-4 pt-4 border-t border-wise-border">
        <View className="flex-row items-center justify-center">
          <Text className="font-sans text-sm text-wise-text-secondary">
            {caloriesConsumed} consumed
          </Text>
          <Text className="font-sans text-sm text-wise-text-secondary mx-2">−</Text>
          <Text className="font-sans text-sm text-wise-text-secondary">
            {caloriesBurned} burned
          </Text>
          <Text className="font-sans text-sm text-wise-text-secondary mx-2">=</Text>
          <Text 
            className="font-archivo-bold text-sm"
            style={{ color: netCalorieColor }}
          >
            {netCalories} net
          </Text>
        </View>
      </View>
    </Card>
  );
}
