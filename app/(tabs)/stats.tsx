import { StatCard } from "@/components/StatCard";
import { AIBackground } from "@/components/ui/AIBackground";
import { Card } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { WiseColors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import React from "react";
import { ActivityIndicator, Dimensions, ScrollView, Text, View } from "react-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_HEIGHT = 200;
const CHART_PADDING = 40;

export default function StatsScreen() {
  // Get current user from Convex
  const currentUser = useQuery(api.users.getCurrentUser);

  // Get weekly stats
  const weeklyStats = useQuery(
    api.dashboard.getWeekly,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  if (!currentUser || !weeklyStats) {
    return (
      <View className="flex-1 justify-center items-center bg-wise-background">
        <ActivityIndicator size="large" color={WiseColors.primary} />
        <Text className="mt-4 font-sans-medium text-base text-wise-text-secondary">
          Loading stats...
        </Text>
      </View>
    );
  }

  // Calculate weekly totals
  const weeklyTotals = weeklyStats.reduce(
    (acc, day) => ({
      workouts: acc.workouts + day.workouts,
      steps: acc.steps + day.steps,
      water: acc.water + day.water,
      sleep: acc.sleep + day.sleep,
    }),
    { workouts: 0, steps: 0, water: 0, sleep: 0 }
  );

  const avgSleep = weeklyStats.length > 0 ? weeklyTotals.sleep / weeklyStats.length : 0;

  // Chart Data Preparation
  const maxSteps = Math.max(...weeklyStats.map(d => d.steps), 10000);
  const chartWidth = SCREEN_WIDTH - 24 * 2 - CHART_PADDING;
  const barWidth = (chartWidth / 7) * 0.6;
  const spacing = (chartWidth / 7) * 0.4;

  return (
    <View className="flex-1 bg-wise-background">
      <AIBackground className="flex-1">
        <Header title="Your Progress" subtitle="Weekly Overview" showAvatar={false} />
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Weekly Chart */}
          <Card className="mx-6 mb-6" padding="lg">
            <Text className="font-archivo-bold text-lg text-wise-text mb-4">
              Steps Activity
            </Text>
            <View className="items-center pb-2">
              <Svg height={CHART_HEIGHT} width={SCREEN_WIDTH - 24 * 2}>
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
                  <Line
                    key={i}
                    x1="0"
                    y1={CHART_HEIGHT - tick * CHART_HEIGHT}
                    x2={chartWidth}
                    y2={CHART_HEIGHT - tick * CHART_HEIGHT}
                    stroke={WiseColors.border}
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                ))}

                {/* Bars */}
                {weeklyStats.map((day, index) => {
                  const height = (day.steps / maxSteps) * (CHART_HEIGHT - 20);
                  const x = index * (barWidth + spacing);
                  return (
                    <React.Fragment key={index}>
                      <Rect
                        x={x}
                        y={CHART_HEIGHT - height}
                        width={barWidth}
                        height={height}
                        fill={WiseColors.primary}
                        rx={4}
                      />
                      <SvgText
                        x={x + barWidth / 2}
                        y={CHART_HEIGHT + 15}
                        fontSize="10"
                        fill={WiseColors.textSecondary}
                        textAnchor="middle"
                      >
                        {new Date(day.date).toLocaleDateString("en-US", { weekday: "narrow" })}
                      </SvgText>
                    </React.Fragment>
                  );
                })}
              </Svg>
            </View>
          </Card>

          {/* Weekly Totals Grid */}
          <View className="px-6 mb-6">
            <View className="flex-row gap-4 mb-4">
              <StatCard
                label="Total Steps"
                value={weeklyTotals.steps}
                unit="steps"
                color={WiseColors.primary}
              />
              <StatCard
                label="Workouts"
                value={weeklyTotals.workouts}
                unit="done"
                color={WiseColors.accent}
              />
            </View>
            <View className="flex-row gap-4">
              <StatCard
                label="Total Water"
                value={weeklyTotals.water}
                unit="ml"
                color="#3B82F6"
              />
              <StatCard
                label="Avg Sleep"
                value={Math.round(avgSleep * 10) / 10}
                unit="hrs"
                color="#8B5CF6"
              />
            </View>
          </View>

          {/* Daily Breakdown List */}
          <View className="px-6 mb-8">
            <Text className="font-archivo-bold text-xl text-wise-text mb-4">
              Daily Breakdown
            </Text>
            <Card padding="none" className="overflow-hidden">
              {weeklyStats.map((day, index) => (
                <View key={index} className={`flex-row p-4 items-center ${index !== weeklyStats.length - 1 ? 'border-b border-wise-border' : ''}`}>
                  <View className="w-[60px]">
                    <Text className="font-sans-bold text-base text-wise-text">
                      {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                    </Text>
                    <Text className="font-sans text-xs text-wise-text-secondary">
                      {new Date(day.date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                    </Text>
                  </View>
                  
                  <View className="flex-1 flex-row justify-end gap-6">
                    <View className="items-end">
                      <Text className="font-archivo-bold text-base text-wise-text">{day.steps}</Text>
                      <Text className="font-sans text-xs text-wise-text-secondary">steps</Text>
                    </View>
                    <View className="items-end">
                      <Text className="font-archivo-bold text-base text-wise-text">{day.workouts}</Text>
                      <Text className="font-sans text-xs text-wise-text-secondary">workouts</Text>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          </View>
          
          <View className="h-10" />
        </ScrollView>
      </AIBackground>
    </View>
  );
}

