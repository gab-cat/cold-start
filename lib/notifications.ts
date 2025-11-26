import * as Notifications from "expo-notifications";

// Notification types for the health/fitness app
export const NotificationTypes = {
  // Activity & Goals
  GOAL_ACHIEVED: "goal_achieved",
  GOAL_PROGRESS: "goal_progress",
  GOAL_REMINDER: "goal_reminder",

  // Streaks
  STREAK_MILESTONE: "streak_milestone",
  STREAK_AT_RISK: "streak_at_risk",
  STREAK_LOST: "streak_lost",

  // Insights & Recommendations
  DAILY_INSIGHT: "daily_insight",
  WEEKLY_SUMMARY: "weekly_summary",
  NEW_RECOMMENDATION: "new_recommendation",

  // Reminders
  ACTIVITY_REMINDER: "activity_reminder",
  HYDRATION_REMINDER: "hydration_reminder",
  SLEEP_REMINDER: "sleep_reminder",
} as const;

export type NotificationType = (typeof NotificationTypes)[keyof typeof NotificationTypes];

// Re-export the notification response listener for convenience
export const addNotificationResponseReceivedListener =
  Notifications.addNotificationResponseReceivedListener;

export const addNotificationReceivedListener =
  Notifications.addNotificationReceivedListener;

// Get route from notification type
export function getRouteFromNotificationType(type: NotificationType): string {
  switch (type) {
  case NotificationTypes.GOAL_ACHIEVED:
  case NotificationTypes.GOAL_PROGRESS:
  case NotificationTypes.GOAL_REMINDER:
  case NotificationTypes.STREAK_MILESTONE:
  case NotificationTypes.STREAK_AT_RISK:
  case NotificationTypes.STREAK_LOST:
  case NotificationTypes.DAILY_INSIGHT:
  case NotificationTypes.WEEKLY_SUMMARY:
  case NotificationTypes.NEW_RECOMMENDATION:
    return "/stats";

  case NotificationTypes.ACTIVITY_REMINDER:
    return "/activities";

  case NotificationTypes.HYDRATION_REMINDER:
  case NotificationTypes.SLEEP_REMINDER:
    return "/(tabs)";

  default:
    return "/stats";
  }
}
