import { WiseColors } from "@/constants/theme";
import React from "react";
import { Text, View } from "react-native";
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

interface ActivityDetailCardProps {
  activity: Activity;
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
    leisure: "sparkles",
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
    leisure: "#8B5CF6",
    // Errands and tasks
    shopping: "#F97316",
    errand: "#10B981",
    task: "#3B82F6",
    study: "#8B5CF6",
  };

  return colorMap[activityType] || WiseColors.primary;
};

const formatTime = (timestamp?: number): string => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDuration = (minutes?: number): string => {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
};

export function ActivityDetailCard({ activity }: ActivityDetailCardProps) {
  const icon = getActivityIcon(activity.activityType);
  const color = getActivityColor(activity.activityType);

  return (
    <Card className="mb-3" padding="sm">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: `${color}20` }}
          >
            <IconSymbol name={icon as keyof typeof IconSymbol} size={20} color={color} />
          </View>
          <View className="flex-1">
            <Text className="font-archivo-bold text-lg text-wise-text mb-1">
              {activity.activityName}
            </Text>
            <Text className="font-sans-medium text-sm text-wise-text-secondary capitalize">
              {activity.activityType}
            </Text>
          </View>
        </View>
        {activity.mood && (
          <View className="items-center">
            <Text className="text-2xl mb-1">
              {activity.mood === "excellent" ? "😊" :
                activity.mood === "good" ? "🙂" :
                  activity.mood === "neutral" ? "😐" :
                    activity.mood === "bad" ? "😞" : "😐"}
            </Text>
            <Text className="font-sans text-xs text-wise-text-secondary">
              {activity.mood}
            </Text>
          </View>
        )}
      </View>

      {/* Time Information */}
      {(activity.timeStarted || activity.timeEnded) && (
        <View className="mb-3">
          <View className="flex-row items-center justify-between">
            {activity.timeStarted && (
              <View className="flex-row items-center">
                <IconSymbol name="clock" size={14} color={WiseColors.textSecondary} />
                <Text className="font-sans-medium text-sm text-wise-text-secondary ml-1">
                  Started: {formatTime(activity.timeStarted)}
                </Text>
              </View>
            )}
            {activity.timeEnded && (
              <View className="flex-row items-center">
                <IconSymbol name="clock.fill" size={14} color={WiseColors.textSecondary} />
                <Text className="font-sans-medium text-sm text-wise-text-secondary ml-1">
                  Ended: {formatTime(activity.timeEnded)}
                </Text>
              </View>
            )}
          </View>
          {activity.durationMinutes && (
            <Text className="font-sans text-sm text-wise-text-secondary mt-1">
              Duration: {formatDuration(activity.durationMinutes)}
            </Text>
          )}
        </View>
      )}

      {/* Metrics Grid */}
      <View className="flex-row flex-wrap gap-3 mb-3">
        {/* Calories */}
        {activity.caloriesBurned && (
          <View className="flex-row items-center">
            <IconSymbol name="flame" size={14} color="#F59E0B" />
            <Text className="font-sans-medium text-sm text-wise-text ml-1">
              Burned: {activity.caloriesBurned} kcal
            </Text>
          </View>
        )}
        {activity.caloriesConsumed && (
          <View className="flex-row items-center">
            <IconSymbol name="fork.knife" size={14} color="#EF4444" />
            <Text className="font-sans-medium text-sm text-wise-text ml-1">
              Consumed: {activity.caloriesConsumed} kcal
            </Text>
          </View>
        )}

        {/* Distance */}
        {activity.distanceKm && (
          <View className="flex-row items-center">
            <IconSymbol name="map" size={14} color={WiseColors.primary} />
            <Text className="font-sans-medium text-sm text-wise-text ml-1">
              {activity.distanceKm} km
            </Text>
          </View>
        )}

        {/* Hydration */}
        {activity.hydrationMl && (
          <View className="flex-row items-center">
            <IconSymbol name="drop" size={14} color="#06B6D4" />
            <Text className="font-sans-medium text-sm text-wise-text ml-1">
              {activity.hydrationMl} ml
            </Text>
          </View>
        )}

        {/* Sleep */}
        {activity.sleepHours && (
          <View className="flex-row items-center">
            <IconSymbol name="moon.stars" size={14} color="#6366F1" />
            <Text className="font-sans-medium text-sm text-wise-text ml-1">
              {activity.sleepHours}h {activity.sleepQuality && `(${activity.sleepQuality})`}
            </Text>
          </View>
        )}

        {/* Intensity */}
        {activity.intensity && (
          <View className="flex-row items-center">
            <IconSymbol name="bolt" size={14} color="#F59E0B" />
            <Text className="font-sans-medium text-sm text-wise-text ml-1 capitalize">
              {activity.intensity}
            </Text>
          </View>
        )}

        {/* Leisure Metrics */}
        {activity.screenTimeMinutes && (
          <View className="flex-row items-center">
            <IconSymbol name="desktopcomputer" size={14} color="#64748B" />
            <Text className="font-sans-medium text-sm text-wise-text ml-1">
              {formatDuration(activity.screenTimeMinutes)} screen time
            </Text>
          </View>
        )}
        {activity.pagesRead && (
          <View className="flex-row items-center">
            <IconSymbol name="book" size={14} color="#A855F7" />
            <Text className="font-sans-medium text-sm text-wise-text ml-1">
              {activity.pagesRead} pages
            </Text>
          </View>
        )}
        {activity.socialInteractions && (
          <View className="flex-row items-center">
            <IconSymbol name="person.2" size={14} color="#14B8A6" />
            <Text className="font-sans-medium text-sm text-wise-text ml-1">
              {activity.socialInteractions} interactions
            </Text>
          </View>
        )}
      </View>

      {/* Meal Details */}
      {activity.activityType === "meal" && (
        <View className="mb-3">
          {activity.mealType && (
            <Text className="font-sans-medium text-sm text-wise-text-secondary capitalize mb-1">
              {activity.mealType}
            </Text>
          )}
          {activity.mealDescription && (
            <Text className="font-sans text-sm text-wise-text">
              {activity.mealDescription}
            </Text>
          )}
        </View>
      )}

      {/* Notes */}
      {activity.notes && activity.notes.trim() && (
        <View className="border-t border-wise-border pt-3">
          <Text className="font-sans-medium text-sm text-wise-text-secondary mb-1">
            Notes
          </Text>
          <Text className="font-sans text-sm text-wise-text">
            {activity.notes}
          </Text>
        </View>
      )}

      {/* Timestamp */}
      <View className="border-t border-wise-border pt-3 mt-3">
        <Text className="font-sans text-xs text-wise-text-secondary">
          Logged: {new Date(activity.loggedAt).toLocaleString()}
        </Text>
      </View>
    </Card>
  );
}
