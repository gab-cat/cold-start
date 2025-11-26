import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { getCurrentTimeInfo } from "./utils";

// Get current time context for AI agent
export const getCurrentTime = internalQuery({
  args: {
    timezone: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    return getCurrentTimeInfo(args.timezone);
  },
});

// Get user profile information for AI agent
export const getUserProfile = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      displayName: user.displayName,
      healthProfile: user.healthProfile,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
});

// Get user activities with date range filtering for AI agent
export const getUserActivities = internalQuery({
  args: {
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 50);

    // Filter by date range if provided
    let filteredActivities = activities;
    if (args.startDate || args.endDate) {
      filteredActivities = activities.filter(activity => {
        const loggedAt = activity.loggedAt;
        if (args.startDate && loggedAt < args.startDate) return false;
        if (args.endDate && loggedAt > args.endDate) return false;
        return true;
      });
    }

    return filteredActivities.map(activity => ({
      ...activity,
      _id: activity._id.toString(),
    }));
  },
});

// Get user goals for AI agent
export const getUserGoals = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("userGoals")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId)
      )
      .collect();

    return goals.map(goal => ({
      ...goal,
      _id: goal._id.toString(),
    }));
  },
});

// Get user streaks for AI agent
export const getUserStreaks = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const streaks = await ctx.db
      .query("userStreaks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return streaks.map(streak => ({
      ...streak,
      _id: streak._id.toString(),
    }));
  },
});

// Get aggregated statistics for AI agent
export const getActivityStats = internalQuery({
  args: {
    userId: v.id("users"),
    days: v.optional(v.number()), // Number of days to look back (default: 30)
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();

    const recentActivities = activities.filter(a => a.loggedAt >= startDate);

    // Calculate statistics
    const stats = {
      totalActivities: recentActivities.length,
      workoutsCount: 0,
      mealsCount: 0,
      sleepCount: 0,
      hydrationCount: 0,
      totalCaloriesBurned: 0,
      totalCaloriesConsumed: 0,
      totalDistanceKm: 0,
      totalHydrationMl: 0,
      totalSleepHours: 0,
      averageMood: null as string | null,
      activityTypes: {} as Record<string, number>,
      daysWithActivities: new Set<string>(),
    };

    const moodCounts: Record<string, number> = {};

    for (const activity of recentActivities) {
      // Count by activity type
      stats.activityTypes[activity.activityType] =
        (stats.activityTypes[activity.activityType] || 0) + 1;

      // Add day to active days
      const day = new Date(activity.loggedAt).toISOString().split('T')[0];
      stats.daysWithActivities.add(day);

      // Count specific types
      if (['workout', 'run', 'walk', 'cycle', 'swim', 'yoga', 'gym'].includes(activity.activityType)) {
        stats.workoutsCount++;
      } else if (activity.activityType === 'meal') {
        stats.mealsCount++;
      } else if (activity.activityType === 'sleep') {
        stats.sleepCount++;
      } else if (activity.activityType === 'hydration') {
        stats.hydrationCount++;
      }

      // Sum metrics
      if (activity.caloriesBurned) {
        stats.totalCaloriesBurned += activity.caloriesBurned;
      }
      if (activity.caloriesConsumed) {
        stats.totalCaloriesConsumed += activity.caloriesConsumed;
      }
      if (activity.distanceKm) {
        stats.totalDistanceKm += activity.distanceKm;
      }
      if (activity.hydrationMl) {
        stats.totalHydrationMl += activity.hydrationMl;
      }
      if (activity.sleepHours) {
        stats.totalSleepHours += activity.sleepHours;
      }

      // Count moods
      if (activity.mood) {
        moodCounts[activity.mood] = (moodCounts[activity.mood] || 0) + 1;
      }
    }

    // Calculate average mood
    if (Object.keys(moodCounts).length > 0) {
      const sortedMoods = Object.entries(moodCounts).sort(([,a], [,b]) => b - a);
      stats.averageMood = sortedMoods[0][0];
    }

    // Convert Set to number
    stats.daysWithActivities = stats.daysWithActivities.size as any;

    return stats;
  },
});

// Get recent conversations for context
export const getRecentConversations = internalQuery({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("messengerConversations")
      .withIndex("by_user_recent", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 10);

    return conversations.map(conv => ({
      userMessage: conv.userMessage,
      agentResponse: conv.agentResponse.text,
      createdAt: conv.createdAt,
      actionsTaken: conv.actionsTaken.length,
    }));
  },
});

// Get active recommendations for user
export const getUserRecommendations = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const recommendations = await ctx.db
      .query("recommendations")
      .withIndex("by_user_recent", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10);

    return recommendations.map(rec => ({
      ...rec,
      _id: rec._id.toString(),
    }));
  },
});
