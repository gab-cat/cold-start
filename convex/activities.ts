import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalQuery, mutation, query } from "./_generated/server";

// Log an activity
export const logActivity = mutation({
  args: {
    userId: v.id("users"),
    activityType: v.string(),
    activityName: v.string(),
    durationMinutes: v.optional(v.number()),
    distanceKm: v.optional(v.number()),
    caloriesBurned: v.optional(v.number()),
    caloriesConsumed: v.optional(v.number()),
    intensity: v.optional(v.string()),
    hydrationMl: v.optional(v.number()),
    sleepHours: v.optional(v.number()),
    sleepQuality: v.optional(v.string()),
    mealType: v.optional(v.string()),
    mealDescription: v.optional(v.string()),
    weightKg: v.optional(v.number()),
    weightChange: v.optional(v.number()),
    previousWeightKg: v.optional(v.number()),
    timeStarted: v.optional(v.number()),
    timeEnded: v.optional(v.number()),
    mood: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    originalImageUrl: v.optional(v.string()),
    notes: v.string(),
    loggedAt: v.optional(v.number()),
    sourceType: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Auto-calculate duration from timeStarted and timeEnded if not provided
    let durationMinutes = args.durationMinutes;
    if (!durationMinutes && args.timeStarted && args.timeEnded) {
      durationMinutes = Math.round((args.timeEnded - args.timeStarted) / (1000 * 60));
    }

    const loggedAt = args.loggedAt || now;

    const activityId = await ctx.db.insert("activities", {
      userId: args.userId,
      activityType: args.activityType,
      activityName: args.activityName,
      durationMinutes,
      distanceKm: args.distanceKm,
      caloriesBurned: args.caloriesBurned,
      caloriesConsumed: args.caloriesConsumed,
      intensity: args.intensity,
      hydrationMl: args.hydrationMl,
      sleepHours: args.sleepHours,
      sleepQuality: args.sleepQuality,
      mealType: args.mealType,
      mealDescription: args.mealDescription,
      weightKg: args.weightKg,
      weightChange: args.weightChange,
      previousWeightKg: args.previousWeightKg,
      timeStarted: args.timeStarted,
      timeEnded: args.timeEnded,
      mood: args.mood,
      imageId: args.imageId,
      originalImageUrl: args.originalImageUrl,
      notes: args.notes,
      loggedAt,
      sourceType: args.sourceType,
      createdAt: now,
    });

    // Update goal progress based on this activity
    try {
      await ctx.runMutation(internal.internalMutations.updateGoalProgressForActivityMutation, {
        userId: args.userId,
        activityType: args.activityType,
        activityData: {
          sleepHours: args.sleepHours,
          hydrationMl: args.hydrationMl,
          distanceKm: args.distanceKm,
          caloriesBurned: args.caloriesBurned,
        },
        loggedAt,
      });
    } catch (error) {
      // Log error but don't fail the activity insertion
      console.error("Error updating goal progress:", error);
    }

    // Create activity summary embedding every ~10 activities or daily
    const userActivities = await ctx.db
      .query("activities")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();

    if (userActivities.length % 10 === 0) { // Every 10 activities
      const recentStats = await ctx.runQuery(internal.agentQueries.getActivityStats, {
        userId: args.userId,
        days: 7
      });

      await ctx.runMutation(internal.internalMutations.createActivitySummaryEmbedding, {
        userId: args.userId,
        period: "weekly",
        summaryData: recentStats,
      });
    }

    return activityId;
  },
});

// Get activities by user and date range
export const getActivitiesByDateRange = query({
  args: {
    userId: v.id("users"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();

    return activities.filter(
      (activity) =>
        activity.loggedAt >= args.startDate && activity.loggedAt <= args.endDate
    );
  },
});

// Get activities by type
export const getActivitiesByType = query({
  args: {
    userId: v.id("users"),
    activityType: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", args.userId).eq("activityType", args.activityType)
      )
      .order("desc")
      .take(args.limit || 50);

    return activities;
  },
});

// Get recent activities
export const getRecentActivities = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 10);

    return activities;
  },
});

// Internal query: Get recent activities
export const getRecentActivitiesInternal = internalQuery({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 10);

    return activities;
  },
});

