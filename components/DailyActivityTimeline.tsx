import { WiseColors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
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
  // Image fields
  imageId?: Id<"_storage">;
  originalImageUrl?: string;
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

// Get device timezone with fallback
const getDeviceTimezone = (): string => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz !== 'UTC') {
      return tz;
    }
  } catch {
    // Intl not available
  }
  // Fallback: try to detect from date offset
  const offset = new Date().getTimezoneOffset();
  // Philippines is UTC+8, offset is -480 minutes
  if (offset === -480) {
    return 'Asia/Manila';
  }
  // Return undefined to let the system decide
  return 'Asia/Manila'; // Default to Manila for this app's primary users
};

const DEVICE_TIMEZONE = getDeviceTimezone();

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  // Use Intl.DateTimeFormat with explicit timezone for reliable conversion
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: DEVICE_TIMEZONE,
    }).format(date);
  } catch {
    // Fallback if Intl is not available - manually adjust for PH time (UTC+8)
    const phDate = new Date(timestamp + (8 * 60 * 60 * 1000));
    const hours = phDate.getUTCHours();
    const minutes = phDate.getUTCMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
};

const getActivityTime = (activity: Activity): number => {
  // Use timeStarted if available, otherwise use loggedAt
  // The timestamp is stored in UTC, formatTime will handle timezone conversion
  return activity.timeStarted || activity.loggedAt;
};

const getLocalHour = (timestamp: number): number => {
  // Get the hour in local timezone for grouping
  const date = new Date(timestamp);
  try {
    const timeString = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: DEVICE_TIMEZONE,
    }).format(date);
    return parseInt(timeString, 10);
  } catch {
    // Fallback: manually calculate PH hour (UTC+8)
    const phDate = new Date(timestamp + (8 * 60 * 60 * 1000));
    return phDate.getUTCHours();
  }
};

const sortActivitiesByTime = (activities: Activity[]): Activity[] => {
  return activities.sort((a, b) => getActivityTime(a) - getActivityTime(b));
};

const groupActivitiesByHour = (activities: Activity[]): Record<number, Activity[]> => {
  const grouped: Record<number, Activity[]> = {};

  activities.forEach(activity => {
    const hour = getLocalHour(getActivityTime(activity));
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
  
  // Fetch image URL from storage if imageId exists
  const imageUrl = useQuery(
    api.storage.getImageUrl,
    activity.imageId ? { storageId: activity.imageId } : "skip"
  );
  
  const startTime = getActivityTime(activity);
  let timeDisplay = formatTime(startTime);
  
  if (activity.timeEnded) {
    // Use timeEnded directly - toLocaleTimeString handles timezone
    timeDisplay = `${timeDisplay} - ${formatTime(activity.timeEnded)}`;
  }

  const hasImage = activity.activityType === "meal" && (imageUrl || activity.originalImageUrl);

  return (
    <View className="flex-row items-start mb-4">
      {/* Timeline dot and line */}
      <View className="mr-4 items-center">
      </View>

      {/* Activity content */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            {/* Image thumbnail for meals */}
            {hasImage ? (
              <View className="w-10 h-10 rounded-xl overflow-hidden mr-2">
                <Image
                  source={{ uri: imageUrl || activity.originalImageUrl }}
                  style={{ width: 40, height: 40 }}
                  contentFit="cover"
                  transition={200}
                />
              </View>
            ) : (
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-2"
                style={{ backgroundColor: `${color}20` }}
              >
                <IconSymbol name={icon as any} size={16} color={color} />
              </View>
            )}
            <Text className="font-archivo-bold text-base text-wise-text flex-1" numberOfLines={1}>
              {activity.activityName}
            </Text>
          </View>
          <Text className="font-sans-medium text-sm text-wise-text-secondary ml-2">
            {timeDisplay}
          </Text>
        </View>

        {/* Key metrics */}
        <View className="flex-row flex-wrap gap-3 mb-2">
          {!!activity.caloriesBurned && (
            <View className="flex-row items-center">
              <IconSymbol name="flame" size={12} color="#F59E0B" />
              <Text className="font-sans text-sm text-wise-text ml-1">
                {activity.caloriesBurned} kcal
              </Text>
            </View>
          )}
          {!!activity.caloriesConsumed && (
            <View className="flex-row items-center">
              <IconSymbol name="fork.knife" size={12} color="#EF4444" />
              <Text className="font-sans text-sm text-wise-text ml-1">
                {activity.caloriesConsumed} kcal
              </Text>
            </View>
          )}
          {!!activity.distanceKm && (
            <View className="flex-row items-center">
              <IconSymbol name="map" size={12} color={WiseColors.primary} />
              <Text className="font-sans text-sm text-wise-text ml-1">
                {activity.distanceKm} km
              </Text>
            </View>
          )}
          {!!activity.durationMinutes && (
            <View className="flex-row items-center">
              <IconSymbol name="clock" size={12} color={WiseColors.textSecondary} />
              <Text className="font-sans text-sm text-wise-text ml-1">
                {activity.durationMinutes}m
              </Text>
            </View>
          )}
          {!!activity.hydrationMl && (
            <View className="flex-row items-center">
              <IconSymbol name="drop" size={12} color="#06B6D4" />
              <Text className="font-sans text-sm text-wise-text ml-1">
                {activity.hydrationMl} ml
              </Text>
            </View>
          )}
          {/* Leisure metrics */}
          {!!activity.screenTimeMinutes && (
            <View className="flex-row items-center">
              <IconSymbol name="desktopcomputer" size={12} color="#64748B" />
              <Text className="font-sans text-sm text-wise-text ml-1">
                {activity.screenTimeMinutes}m screen
              </Text>
            </View>
          )}
          {!!activity.pagesRead && (
            <View className="flex-row items-center">
              <IconSymbol name="book" size={12} color="#A855F7" />
              <Text className="font-sans text-sm text-wise-text ml-1">
                {activity.pagesRead} pages
              </Text>
            </View>
          )}
          {!!activity.socialInteractions && (
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
