import { DailyCalorieBreakdown } from "@/components/DailyCalorieBreakdown";
import { StatCard } from "@/components/StatCard";
import { AIBackground } from "@/components/ui/AIBackground";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Card } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WiseColors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_HEIGHT = 200;
const CHART_PADDING = 40;

// Helper to format date for display
const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateOnly = new Date(dateString + "T00:00:00");
  dateOnly.setHours(0, 0, 0, 0);
  
  if (dateOnly.getTime() === today.getTime()) {
    return "Today";
  }
  if (dateOnly.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }
  
  return date.toLocaleDateString("en-US", { 
    weekday: "short", 
    month: "short", 
    day: "numeric" 
  });
};

// Helper to get the last N dates
const getLastNDates = (n: number): string[] => {
  const dates: string[] = [];
  for (let i = 0; i < n; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
};

export default function StatsScreen() {
  // Get current user from Convex
  const currentUser = useQuery(api.users.getCurrentUser);

  // Date navigation state
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  
  // Get last 7 dates for horizontal scroll
  const recentDates = useMemo(() => getLastNDates(14), []);

  // Get timezone offset (in minutes, e.g., -480 for UTC+8)
  const timezoneOffsetMinutes = useMemo(() => new Date().getTimezoneOffset(), []);

  // Get weekly stats
  const weeklyStats = useQuery(
    api.dashboard.getWeekly,
    currentUser ? { userId: currentUser._id, timezoneOffsetMinutes } : "skip"
  );
  
  // Get daily stats for selected date
  const dailyStats = useQuery(
    api.dashboard.getDailyStats,
    currentUser ? { userId: currentUser._id, date: selectedDate, timezoneOffsetMinutes } : "skip"
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
      caloriesConsumed: acc.caloriesConsumed + day.caloriesConsumed,
      caloriesBurned: acc.caloriesBurned + day.caloriesBurned,
    }),
    { workouts: 0, steps: 0, water: 0, sleep: 0, caloriesConsumed: 0, caloriesBurned: 0 }
  );

  const avgSleep = weeklyStats.length > 0 ? weeklyTotals.sleep / weeklyStats.length : 0;

  // Chart Data Preparation
  const maxSteps = Math.max(...weeklyStats.map(d => d.steps), 10000);
  const chartWidth = SCREEN_WIDTH - 24 * 2 - CHART_PADDING;
  const barWidth = (chartWidth / 7) * 0.7;
  const spacing = (chartWidth / 7) * 0.3;


  return (
    <View className="flex-1 bg-wise-background">
      <AIBackground className="flex-1">
        <Header title="Your Progress" subtitle="Stats & History" showAvatar={false} />
        <ScrollView 
          className="flex-1 pt-2"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Date Selector */}
          <AnimatedSection index={0} className="mb-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            >
              {recentDates.map((date) => {
                const isSelected = date === selectedDate;
                const dayName = formatDateForDisplay(date);
                const dayNum = new Date(date + "T00:00:00").getDate();
                
                return (
                  <Pressable
                    key={date}
                    onPress={() => setSelectedDate(date)}
                    className={`px-4 py-3 rounded-xl min-w-[70px] items-center ${
                      isSelected ? "bg-wise-primary" : "bg-wise-background"
                    }`}
                    style={isSelected ? {} : { borderWidth: 1, borderColor: WiseColors.border }}
                  >
                    <Text
                      className={`font-sans text-xs mb-1 ${
                        isSelected ? "text-white" : "text-wise-text-secondary"
                      }`}
                    >
                      {dayName === "Today" || dayName === "Yesterday" 
                        ? dayName 
                        : new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })
                      }
                    </Text>
                    <Text
                      className={`font-archivo-bold text-lg ${
                        isSelected ? "text-white" : "text-wise-text"
                      }`}
                    >
                      {dayNum}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </AnimatedSection>

          {/* Selected Day Header */}
          <AnimatedSection index={1} className="px-6 mb-4">
            <Text className="font-archivo-bold text-xl text-wise-text">
              {formatDateForDisplay(selectedDate)}
            </Text>
            <Text className="font-sans text-sm text-wise-text-secondary">
              {dailyStats?.totalActivities || 0} activities logged
            </Text>
          </AnimatedSection>

          {/* Daily Stats Grid for Selected Date */}
          <AnimatedSection index={2}>
            {dailyStats === undefined ? (
              <View className="px-4 mb-2">
                <View className="flex-row gap-2">
                  <Card className="flex-1 h-24 justify-center items-center">
                    <ActivityIndicator size="small" color={WiseColors.primary} />
                  </Card>
                  <Card className="flex-1 h-24 justify-center items-center">
                    <ActivityIndicator size="small" color={WiseColors.accent} />
                  </Card>
                </View>
                <View className="flex-row gap-2 mt-2">
                  <Card className="flex-1 h-24 justify-center items-center">
                    <ActivityIndicator size="small" color="#3B82F6" />
                  </Card>
                  <Card className="flex-1 h-24 justify-center items-center">
                    <ActivityIndicator size="small" color="#8B5CF6" />
                  </Card>
                </View>
              </View>
            ) : (
              <View className="px-4 -mb-2">
                <View className="flex-row gap-2">
                  <StatCard
                    label="Steps"
                    value={dailyStats.steps}
                    target={10000}
                    unit="steps"
                    color={WiseColors.primary}
                  />
                  <StatCard
                    label="Workouts"
                    value={dailyStats.workoutCount}
                    unit="done"
                    color={WiseColors.accent}
                  />
                </View>
                <View className="flex-row gap-2 -mt-2">
                  <StatCard
                    label="Water"
                    value={dailyStats.hydrationMl}
                    target={dailyStats.waterGoal}
                    unit="ml"
                    color="#3B82F6"
                  />
                  <StatCard
                    label="Sleep"
                    value={dailyStats.sleepHours}
                    target={dailyStats.sleepGoal}
                    unit="hrs"
                    color="#8B5CF6"
                  />
                </View>
              </View>
            )}
          </AnimatedSection>

          {/* Calorie Breakdown for Selected Date */}
          <AnimatedSection index={3}>
            {dailyStats === undefined ? (
              <View className="px-4 mb-6">
                <Card className="h-48 justify-center items-center">
                  <ActivityIndicator size="large" color={WiseColors.primary} />
                  <Text className="mt-2 font-sans text-sm text-wise-text-secondary">
                    Loading calorie data...
                  </Text>
                </Card>
              </View>
            ) : (
              <View className="px-4 mb-6">
                <DailyCalorieBreakdown
                  caloriesConsumed={dailyStats.caloriesConsumed}
                  caloriesBurned={dailyStats.caloriesBurned}
                  netCalories={dailyStats.netCalories}
                  caloriesBreakfast={dailyStats.caloriesBreakfast}
                  caloriesLunch={dailyStats.caloriesLunch}
                  caloriesDinner={dailyStats.caloriesDinner}
                  caloriesSnacks={dailyStats.caloriesSnacks}
                  calorieGoal={dailyStats.calorieGoal}
                />
              </View>
            )}
          </AnimatedSection>

          {/* Weekly Overview Section */}
          <AnimatedSection index={4} className="px-4 mb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-lg bg-wise-accent/15 items-center justify-center mr-2">
                <IconSymbol name="chart.bar" size={18} color={WiseColors.accent} />
              </View>
              <Text className="font-archivo-bold text-xl text-wise-text">
                Weekly Overview
              </Text>
            </View>
          </AnimatedSection>

          {/* Weekly Chart */}
          <AnimatedSection index={5}>
            <Card className="mx-4 mb-2" padding="lg">
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
                      y1={CHART_HEIGHT - 40 - tick * (CHART_HEIGHT - 40)}
                      x2={chartWidth}
                      y2={CHART_HEIGHT - 40 - tick * (CHART_HEIGHT - 40)}
                      stroke={WiseColors.border}
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Bars */}
                  {weeklyStats.map((day, index) => {
                    const height = (day.steps / maxSteps) * (CHART_HEIGHT - 40);
                    const x = index * (barWidth + spacing);
                    const dayDate = new Date(day.date + "T00:00:00");
                    const weekday = dayDate.toLocaleDateString("en-US", { weekday: "short" });
                    const dayNum = dayDate.getDate();
                    return (
                      <React.Fragment key={index}>
                        <Rect
                          x={x}
                          y={CHART_HEIGHT - 40 - height}
                          width={barWidth}
                          height={height}
                          fill={WiseColors.primary}
                          rx={4}
                        />
                        <SvgText
                          x={x + barWidth / 2}
                          y={CHART_HEIGHT - 22}
                          fontSize="10"
                          fill={WiseColors.textSecondary}
                          textAnchor="middle"
                          fontWeight="500"
                        >
                          {weekday}
                        </SvgText>
                        <SvgText
                          x={x + barWidth / 2}
                          y={CHART_HEIGHT - 8}
                          fontSize="11"
                          fill={WiseColors.text}
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {dayNum}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                </Svg>
              </View>
            </Card>
          </AnimatedSection>

          {/* Weekly Totals Grid */}
          <AnimatedSection index={6} className="px-4 mb-2">
            <View className="flex-row gap-2 -mb-2">
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
            <View className="flex-row gap-2 -mb-2">
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
            {/* Weekly Calorie Summary */}
            <View className="flex-row gap-2">
              <StatCard
                label="Calories In"
                value={weeklyTotals.caloriesConsumed}
                unit="kcal"
                color="#F59E0B"
              />
              <StatCard
                label="Calories Out"
                value={weeklyTotals.caloriesBurned}
                unit="kcal"
                color="#10B981"
              />
            </View>
          </AnimatedSection>

          {/* Daily Breakdown List */}
          <AnimatedSection index={7} className="px-4 mb-8">
            <Text className="font-archivo-bold text-xl text-wise-text mb-4">
              Daily Breakdown
            </Text>
            <Card padding="none" className="overflow-hidden">
              {weeklyStats.map((day, index) => (
                <Animated.View 
                  key={index}
                  entering={FadeInDown.delay(index * 50)}
                >
                  <Pressable 
                    onPress={() => setSelectedDate(day.date)}
                    className={`flex-row p-4 items-center ${index !== weeklyStats.length - 1 ? 'border-b border-wise-border' : ''} ${day.date === selectedDate ? 'bg-wise-subtle' : ''}`}
                  >
                    <View className="w-[60px]">
                      <Text className="font-sans-bold text-base text-wise-text">
                        {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                      </Text>
                      <Text className="font-sans text-xs text-wise-text-secondary">
                        {new Date(day.date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                      </Text>
                    </View>
                    
                    <View className="flex-1 flex-row justify-end gap-4">
                      <View className="items-end">
                        <Text className="font-archivo-bold text-base text-wise-text">{day.steps}</Text>
                        <Text className="font-sans text-xs text-wise-text-secondary">steps</Text>
                      </View>
                      <View className="items-end">
                        <Text className="font-archivo-bold text-base text-wise-text">{day.workouts}</Text>
                        <Text className="font-sans text-xs text-wise-text-secondary">workouts</Text>
                      </View>
                      <View className="items-end">
                        <Text className="font-archivo-bold text-base" style={{ color: "#F59E0B" }}>
                          {day.caloriesConsumed - day.caloriesBurned}
                        </Text>
                        <Text className="font-sans text-xs text-wise-text-secondary">net cal</Text>
                      </View>
                    </View>
                    
                    <View className="ml-2">
                      <IconSymbol name="chevron.right" size={16} color={WiseColors.textSecondary} />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </Card>
          </AnimatedSection>
          
          <View className="h-10" />
        </ScrollView>
      </AIBackground>
    </View>
  );
}

