import { PushNotifications } from "@convex-dev/expo-push-notifications";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { ActionCtx, internalAction, mutation, query } from "./_generated/server";

// Initialize the push notifications client with user ID type
const pushNotifications = new PushNotifications<Id<"users">>(
  components.pushNotifications,
  { logLevel: "DEBUG" }
);

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

// Record a push notification token for the current user
export const recordPushNotificationToken = mutation({
  args: {
    token: v.string(),
    tokenType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, message: "Not authenticated" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return { success: false, message: "User not found" };
    }

    try {
      await pushNotifications.recordToken(ctx, {
        userId: user._id,
        pushToken: args.token,
      });
      return { success: true, message: "Token recorded successfully" };
    } catch (error) {
      console.error("Error recording push token:", error);
      return { success: false, message: "Failed to record token" };
    }
  },
});

// Remove a push notification token
export const removePushNotificationToken = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, message: "Not authenticated" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return { success: false, message: "User not found" };
    }

    try {
      // Remove the token for the user
      await pushNotifications.removeToken(ctx, { userId: user._id });
      return { success: true, message: "Token removed successfully" };
    } catch (error) {
      console.error("Error removing push token:", error);
      return { success: false, message: "Failed to remove token" };
    }
  },
});

// Pause notifications for current user
export const pauseNotifications = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, message: "Not authenticated" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return { success: false, message: "User not found" };
    }

    try {
      await pushNotifications.pauseNotificationsForUser(ctx, { userId: user._id });
      return { success: true, message: "Notifications paused" };
    } catch (error) {
      console.error("Error pausing notifications:", error);
      return { success: false, message: "Failed to pause notifications" };
    }
  },
});

// Resume notifications for current user
export const resumeNotifications = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, message: "Not authenticated" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return { success: false, message: "User not found" };
    }

    try {
      await pushNotifications.unpauseNotificationsForUser(ctx, { userId: user._id });
      return { success: true, message: "Notifications resumed" };
    } catch (error) {
      console.error("Error resuming notifications:", error);
      return { success: false, message: "Failed to resume notifications" };
    }
  },
});

// Get notification status for current user
export const getNotificationStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    try {
      const status = await pushNotifications.getStatusForUser(ctx, { userId: user._id });
      return status;
    } catch (error) {
      console.error("Error getting notification status:", error);
      return null;
    }
  },
});

// Helper function to send push notification (used by internal actions)
async function sendPushNotificationHelper(
  ctx: ActionCtx,
  args: {
    userId: Id<"users">;
    title: string;
    body: string;
    notificationType: string;
    data?: Record<string, unknown>;
  }
): Promise<{ success: boolean; pushId?: string | null; error?: string }> {
  try {
    const pushId = await pushNotifications.sendPushNotification(ctx, {
      userId: args.userId,
      notification: {
        title: args.title,
        body: args.body,
        data: {
          type: args.notificationType,
          url: "/stats", // Navigate to stats screen on tap
          ...args.data,
        },
      },
      allowUnregisteredTokens: true,
    });
    console.log(`Push notification sent to user ${args.userId}, pushId: ${pushId}`);
    return { success: true, pushId };
  } catch (error) {
    console.error(`Error sending push notification to user ${args.userId}:`, error);
    return { success: false, error: String(error) };
  }
}

// Internal action to send daily insight notification
export const sendDailyInsightNotification = internalAction({
  args: {
    userId: v.id("users"),
    insightPreview: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; pushId?: string | null; error?: string }> => {
    return await sendPushNotificationHelper(ctx, {
      userId: args.userId,
      title: "🌅 Your Daily Insight",
      body: args.insightPreview.slice(0, 100) + (args.insightPreview.length > 100 ? "..." : ""),
      notificationType: NotificationTypes.DAILY_INSIGHT,
      data: { url: "/stats" },
    });
  },
});

// Internal action to send goal progress notification
export const sendGoalProgressNotification = internalAction({
  args: {
    userId: v.id("users"),
    goalName: v.string(),
    progressPercent: v.number(),
    isCompleted: v.boolean(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; pushId?: string | null; error?: string }> => {
    const title = args.isCompleted
      ? "🎉 Goal Achieved!"
      : "📊 Goal Progress Update";

    const body = args.isCompleted
      ? `Congratulations! You've completed your ${args.goalName} goal!`
      : `You're ${Math.round(args.progressPercent)}% towards your ${args.goalName} goal. Keep going!`;

    return await sendPushNotificationHelper(ctx, {
      userId: args.userId,
      title,
      body,
      notificationType: args.isCompleted
        ? NotificationTypes.GOAL_ACHIEVED
        : NotificationTypes.GOAL_PROGRESS,
      data: { url: "/stats" },
    });
  },
});

// Internal action to send streak notification
export const sendStreakNotification = internalAction({
  args: {
    userId: v.id("users"),
    streakType: v.string(),
    streakCount: v.number(),
    isAtRisk: v.boolean(),
    isMilestone: v.boolean(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; pushId?: string | null; error?: string }> => {
    let title: string;
    let body: string;
    let notificationType: NotificationType;

    if (args.isAtRisk) {
      title = "⚠️ Streak at Risk!";
      body = `Your ${args.streakCount}-day ${args.streakType} streak is waiting! Log an activity today to keep it going.`;
      notificationType = NotificationTypes.STREAK_AT_RISK;
    } else if (args.isMilestone) {
      title = "🔥 Streak Milestone!";
      body = `Amazing! You've hit a ${args.streakCount}-day ${args.streakType} streak! Keep the momentum going!`;
      notificationType = NotificationTypes.STREAK_MILESTONE;
    } else {
      title = "💪 Keep Your Streak Alive";
      body = `Don't forget to log your ${args.streakType} activity today!`;
      notificationType = NotificationTypes.ACTIVITY_REMINDER;
    }

    return await sendPushNotificationHelper(ctx, {
      userId: args.userId,
      title,
      body,
      notificationType,
      data: { url: "/stats", streakType: args.streakType },
    });
  },
});

// Internal action to send weekly summary notification
export const sendWeeklySummaryNotification = internalAction({
  args: {
    userId: v.id("users"),
    summaryPreview: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; pushId?: string | null; error?: string }> => {
    return await sendPushNotificationHelper(ctx, {
      userId: args.userId,
      title: "📈 Your Weekly Summary",
      body: args.summaryPreview.slice(0, 100) + (args.summaryPreview.length > 100 ? "..." : ""),
      notificationType: NotificationTypes.WEEKLY_SUMMARY,
      data: { url: "/stats" },
    });
  },
});
