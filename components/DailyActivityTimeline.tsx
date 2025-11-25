import { WiseColors } from "@/constants/theme";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Card } from "./ui/Card";
import { IconSymbol } from "./ui/icon-symbol";

interface Activity {
  _id: string;
  activityType: string;
  activityName: string;
  durationMinutes?: number;
  distanceKm?: number;
  caloriesBurned?: number;
  caloriesConsumed?: number;
  intensity?: string;
  hydrationMl?: number;
  sleepHours?: number;
  sleepQuality?: string;
  mealType?: string;
  mealDescription?: string;
  // Leisure activity metrics
  screenTimeMinutes?: number;
  pagesRead?: number;
  socialInteractions?: number;
  timeStarted?: number;
  timeEnded?: number;
  mood?: string;
  notes: string;
  loggedAt: number;
}

interface DailyActivityTimelineProps {
  activities: Activity[];
  date: string; // ISO date string (YYYY-MM-DD)
}

const getActivityIcon = (activityType: string): string => {
  const iconMap: Record<string, string> = {
    // Exercise activities
    workout: "figure.run",
    run: "figure.run",
    walk: "figure.walk",
    cycle: "bicycle",
    swim: "figure.pool.swim",
    yoga: "figure.mind.and.body",
    gym: "dumbbell",
    meditation: "brain.head.profile",
    stretch: "figure.cooldown",
    // Wellness activities
    sleep: "moon.stars",
    meal: "fork.knife",
    hydration: "drop",
    // Leisure activities
    gaming: "gamecontroller",
    computer: "desktopcomputer",
    reading: "book",
    tv: "tv",
    music: "music.note",
    social: "person.2",
    hobby: "puzzlepiece",
    leisure: "gamecontroller",
    // Errands and tasks
    shopping: "cart.fill",
    errand: "list.bullet",
    task: "checkmark.circle",
    study: "book.closed",
  };

  return iconMap[activityType] || "circle";
};

const getActivityColor = (activityType: string): string => {
  const colorMap: Record<string, string> = {
    // Exercise activities
    workout: WiseColors.primary,
    run: WiseColors.primary,
    walk: "#10B981",
    cycle: "#3B82F6",
    swim: "#06B6D4",
    yoga: "#8B5CF6",
    gym: "#F59E0B",
    meditation: "#EC4899",
    stretch: "#84CC16",
    // Wellness activities
    sleep: "#6366F1",
    meal: "#EF4444",
    hydration: "#06B6D4",
    // Leisure activities
    gaming: "#7C3AED",
    computer: "#64748B",
    reading: "#A855F7",
    tv: "#F97316",
    music: "#EC4899",
    social: "#14B8A6",
    hobby: "#EAB308",
    leisure: "#EAB308",
    // Errands and tasks
    shopping: "#F97316",
    errand: "#10B981",
    task: "#3B82F6",
    study: "#8B5CF6",
  };

  return colorMap[activityType] || WiseColors.primary;
};

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const getActivityTime = (activity: Activity): number => {
  // Use timeStarted if available, otherwise use loggedAt
  // Adjust by -8 hours (UTC offset fix)
  const timestamp = activity.timeStarted || activity.loggedAt;
  return timestamp - (8 * 60 * 60 * 1000);
};

const sortActivitiesByTime = (activities: Activity[]): Activity[] => {
  return activities.sort((a, b) => getActivityTime(a) - getActivityTime(b));
};

const groupActivitiesByHour = (activities: Activity[]): Record<number, Activity[]> => {
  const grouped: Record<number, Activity[]> = {};

  activities.forEach(activity => {
    const hour = new Date(getActivityTime(activity)).getHours();
    if (!grouped[hour]) {
      grouped[hour] = [];
    }
    grouped[hour].push(activity);
  });

  return grouped;
};

const ActivityTimelineItem = ({ activity }: { activity: Activity }) => {
  const icon = getActivityIcon(activity.activityType);
  const color = getActivityColor(activity.activityType);
  
  const startTime = getActivityTime(activity);
  let timeDisplay = formatTime(startTime);
  
  if (activity.timeEnded) {
    // Adjust end time by -8 hours as well
    const adjustedEndTime = activity.timeEnded - (8 * 60 * 60 * 1000);
    timeDisplay = `${timeDisplay} - ${formatTime(adjustedEndTime)}`;
  }

  return (
    <View className="flex-row items-start mb-4">
      {/* Timeline dot and line */}
      <View className="mr-4 items-center">
        <View
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <View
          className="w-0.5 h-12 mt-2"
          style={{ backgroundColor: `${color}30` }}
        />
      </View>

      {/* Activity content */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: `${color}20` }}
            >
              <IconSymbol name={icon as any} size={16} color={color} />
            </View>
            <Text className="font-archivo-bold text-base text-wise-text">
              {activity.activityName}
            </Text>
          </View>
          <Text className="font-sans-medium text-sm text-wise-text-secondary">
            {timeDisplay}
          </Text>
        </View>

        {/* Key metrics */}
        <View className="flex-row flex-wrap gap-3 mb-2">
          {activity.caloriesBurned && (
            <View className="flex-row items-center">
              <IconSymbol name="flame" size={12} color="#F59E0B" />
              <Text className="font-sans text-sm text-wise-text ml-1">
                {activity.caloriesBurned} kcal
              </Text>
            </View>
          )}
          {activity.caloriesConsumed && (
            <View className="flex-row items-center">
              <IconSymbol name="fork.knife" size={12} color="#EF4444" />
              <Text className="font-sans text-sm text-wise-text ml-1">
                {activity.caloriesConsumed} kcal
              </Text>
            </View>
          )}
          {activity.distanceKm && (
            <View className="flex-row items-center">
              <IconSymbol name="map" size={12} color={WiseColors.primary} />
              <Text className="font-sans text-sm text-wise-text ml-1">
                {activity.distanceKm} km
              </Text>
            </View>
          )}
          {activity.durationMinutes && (
            <View className="flex-row items-center">
              <IconSymbol name="clock" size={12} color={WiseColors.textSecondary} />
              <Text className="font-sans text-sm text-wise-text ml-1">
                {activity.durationMinutes}m
              </Text>
            </View>
          )}
          {activity.hydrationMl && (
            <View className="flex-row items-center">
              <IconSymbol name="drop" size={12} color="#06B6D4" />
              <Text className="font-sans text-sm text-wise-text ml-1">
                {activity.hydrationMl} ml
              </Text>
            </View>
          )}
          {/* Leisure metrics */}
          {activity.screenTimeMinutes && (
            <View className="flex-row items-center">
              <IconSymbol name="desktopcomputer" size={12} color="#64748B" />
              <Text className="font-sans text-sm text-wise-text ml-1">
                {activity.screenTimeMinutes}m screen
              </Text>
            </View>
          )}
          {activity.pagesRead && (
            <View className="flex-row items-center">
              <IconSymbol name="book" size={12} color="#A855F7" />
              <Text className="font-sans text-sm text-wise-text ml-1">
                {activity.pagesRead} pages
              </Text>
            </View>
          )}
          {activity.socialInteractions && (
            <View className="flex-row items-center">
              <IconSymbol name="person.2" size={12} color="#14B8A6" />
              <Text className="font-sans text-sm text-wise-text ml-1">
                {activity.socialInteractions} people
              </Text>
            </View>
          )}
        </View>

        {/* Meal description */}
        {activity.activityType === "meal" && activity.mealDescription && (
          <Text className="font-sans text-sm text-wise-text-secondary italic">
            {activity.mealDescription}
          </Text>
        )}

        {/* Notes */}
        {activity.notes && activity.notes.trim() && (
          <Text className="font-sans text-sm text-wise-text-secondary mt-1">
            {activity.notes}
          </Text>
        )}
      </View>
    </View>
  );
};

export function DailyActivityTimeline({ activities, date }: DailyActivityTimelineProps) {
  const sortedActivities = sortActivitiesByTime(activities);
  const groupedActivities = groupActivitiesByHour(sortedActivities);

  if (activities.length === 0) {
    return (
      <Card className="mx-6" padding="lg">
        <View className="items-center justify-center py-8">
          <IconSymbol name="calendar.badge.exclamationmark" size={48} color={WiseColors.textSecondary} />
          <Text className="font-archivo-bold text-lg text-wise-text-secondary mt-4 mb-2">
            No activities logged
          </Text>
          <Text className="font-sans text-sm text-wise-text-secondary text-center">
            Start logging your activities to see your daily timeline here.
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <View className="mx-4">
      <Text className="font-archivo-bold text-xl text-wise-text mb-4">
        Daily Timeline
      </Text>

      <Card padding="lg">
        <ScrollView showsVerticalScrollIndicator={false}>
          {Object.entries(groupedActivities)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([hour, hourActivities]) => (
              <View key={hour}>
                {/* Hour header */}
                <View className="flex-row items-center mb-3">
                  <Text className="font-archivo-bold text-lg text-wise-text mr-3">
                    {parseInt(hour).toString().padStart(2, '0')}:00
                  </Text>
                  <View className="flex-1 h-px bg-wise-border" />
                </View>

                {/* Activities for this hour */}
                {hourActivities.map(activity => (
                  <ActivityTimelineItem key={activity._id} activity={activity} />
                ))}
              </View>
            ))}
        </ScrollView>

        {/* Summary */}
        <View className="border-t border-wise-border pt-4 mt-4">
          <View className="flex-row justify-between">
            <Text className="font-sans-medium text-sm text-wise-text-secondary">
              Total activities: {activities.length}
            </Text>
            <Text className="font-sans-medium text-sm text-wise-text-secondary">
              {new Date(date).toLocaleDateString([], {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
}
