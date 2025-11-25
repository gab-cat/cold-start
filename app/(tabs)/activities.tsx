import { ActivityDetailCard } from "@/components/ActivityDetailCard";
import { DailyActivityTimeline } from "@/components/DailyActivityTimeline";
import { AIBackground } from "@/components/ui/AIBackground";
import { Card } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WiseColors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ActivitiesScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"timeline" | "cards">("timeline");

  // Get current user
  const currentUser = useQuery(api.users.getCurrentUser);

  // Get activities for selected date
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const activities = useQuery(
    api.activities.getActivitiesByDateRange,
    currentUser ? {
      userId: currentUser._id,
      startDate: startOfDay.getTime(),
      endDate: endOfDay.getTime(),
    } : "skip"
  );

  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateShort = (date: Date): string => {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });
  };

  if (!currentUser) {
    return (
      <View className="flex-1 justify-center items-center bg-wise-background">
        <Text className="font-sans-medium text-base text-wise-text-secondary">
          Loading activities...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-wise-background">
      <AIBackground className="flex-1">
        <Header title="Activities" subtitle="Your daily log" showAvatar={false} />


        <ScrollView
          className="flex-1 mb-24 mt-8"
          showsVerticalScrollIndicator={false}
        >
          {/* Date Navigation */}
          <View className="px-4 mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={() => navigateDate(-1)}
                className="w-10 h-10 rounded-full bg-wise-surface items-center justify-center"
              >
                <IconSymbol name="chevron.left" size={20} color={WiseColors.text} />
              </TouchableOpacity>

              <View className="flex-1 mx-4">
                <Text className="font-archivo-bold text-xl text-wise-text text-center">
                  {formatDateShort(selectedDate)}
                </Text>
                <Text className="font-sans text-sm text-wise-text-secondary text-center">
                  {formatDate(selectedDate)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => navigateDate(1)}
                className="w-10 h-10 rounded-full bg-wise-surface items-center justify-center"
              >
                <IconSymbol name="chevron.right" size={20} color={WiseColors.text} />
              </TouchableOpacity>
            </View>

            {/* Today button */}
            <TouchableOpacity
              onPress={() => setSelectedDate(new Date())}
              className="items-center py-2"
            >
              <Text className="font-sans-medium text-sm text-wise-primary">
                Today
              </Text>
            </TouchableOpacity>
          </View>

          {/* View Mode Toggle */}
          <View className="px-4 mb-6">
            <View className="flex-row bg-wise-surface rounded-lg p-1">
              <TouchableOpacity
                onPress={() => setViewMode("timeline")}
                className={`flex-1 py-2 px-4 rounded-md ${
                  viewMode === "timeline" ? "bg-wise-primary" : ""
                }`}
              >
                <Text className={`font-sans-medium text-sm text-center ${
                  viewMode === "timeline" ? "text-wise-surface" : "text-wise-text"
                }`}>
                  Timeline
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode("cards")}
                className={`flex-1 py-2 px-4 rounded-md ${
                  viewMode === "cards" ? "bg-wise-primary" : ""
                }`}
              >
                <Text className={`font-sans-medium text-sm text-center ${
                  viewMode === "cards" ? "text-wise-surface" : "text-wise-text"
                }`}>
                  Details
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Activities Content */}
          {activities ? (
            viewMode === "timeline" ? (
              <DailyActivityTimeline
                activities={activities}
                date={selectedDate.toISOString().split('T')[0]}
              />
            ) : (
              <View className="px-4">
                <Text className="font-archivo-bold text-xl text-wise-text mb-4">
                  Activity Details
                </Text>
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <ActivityDetailCard
                      key={activity._id}
                      activity={activity}
                    />
                  ))
                ) : (
                  <Card padding="md">
                    <View className="items-center justify-center py-8">
                      <IconSymbol
                        name="calendar.badge.exclamationmark"
                        size={48}
                        color={WiseColors.textSecondary}
                      />
                      <Text className="font-archivo-bold text-lg text-wise-text-secondary mt-4 mb-2">
                        No activities
                      </Text>
                      <Text className="font-sans text-sm text-wise-text-secondary text-center">
                        No activities logged for this date.
                      </Text>
                    </View>
                  </Card>
                )}
              </View>
            )
          ) : (
            <View className="px-4">
              <Card padding="md">
                <View className="items-center justify-center py-8">
                  <IconSymbol
                    name="clock"
                    size={48}
                    color={WiseColors.textSecondary}
                  />
                  <Text className="font-sans-medium text-base text-wise-text-secondary">
                    Loading activities...
                  </Text>
                </View>
              </Card>
            </View>
          )}

          {/* Activity Summary */}
          {activities && activities.length > 0 && (
            <View className="px-4 mt-6">
              <Card padding="md">
                <Text className="font-archivo-bold text-lg text-wise-text mb-4">
                  Day Summary
                </Text>

                <View className="flex-row flex-wrap gap-4">
                  <View className="flex-row items-center">
                    <IconSymbol name="circle.fill" size={8} color={WiseColors.primary} />
                    <Text className="font-sans text-sm text-wise-text ml-2">
                      {activities.filter(a => ['workout', 'run', 'walk', 'cycle', 'swim', 'yoga', 'gym'].includes(a.activityType)).length} workouts
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <IconSymbol name="circle.fill" size={8} color="#EF4444" />
                    <Text className="font-sans text-sm text-wise-text ml-2">
                      {activities.filter(a => a.activityType === 'meal').length} meals
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <IconSymbol name="circle.fill" size={8} color="#06B6D4" />
                    <Text className="font-sans text-sm text-wise-text ml-2">
                      {activities.filter(a => a.activityType === 'hydration').length} water logs
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <IconSymbol name="circle.fill" size={8} color="#6366F1" />
                    <Text className="font-sans text-sm text-wise-text ml-2">
                      {activities.filter(a => a.activityType === 'sleep').length} sleep logs
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <IconSymbol name="circle.fill" size={8} color="#7C3AED" />
                    <Text className="font-sans text-sm text-wise-text ml-2">
                      {activities.filter(a => ['gaming', 'computer', 'reading', 'tv', 'music', 'social', 'hobby', 'leisure'].includes(a.activityType)).length} leisure
                    </Text>
                  </View>
                </View>

                {/* Calories summary */}
                <View className="border-t border-wise-border pt-4 mt-4">
                  <View className="flex-row justify-between">
                    <Text className="font-sans-medium text-sm text-wise-text">
                      Calories burned: {activities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0)} kcal
                    </Text>
                    <Text className="font-sans-medium text-sm text-wise-text">
                      Calories consumed: {activities.reduce((sum, a) => sum + (a.caloriesConsumed || 0), 0)} kcal
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
          )}

          <View className="h-10" />
        </ScrollView>
      </AIBackground>
    </View>
  );
}
