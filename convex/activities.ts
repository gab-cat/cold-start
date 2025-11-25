import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Log an activity
export const logActivity = mutation({
  args: {
    userId: v.id("users"),
    activityType: v.string(),
    activityName: v.string(),
    durationMinutes: v.optional(v.number()),
    distanceKm: v.optional(v.number()),
    caloriesBurned: v.optional(v.number()),
    intensity: v.optional(v.string()),
    hydrationMl: v.optional(v.number()),
    sleepHours: v.optional(v.number()),
    sleepQuality: v.optional(v.string()),
    mealType: v.optional(v.string()),
    mealDescription: v.optional(v.string()),
    mood: v.optional(v.string()),
    notes: v.string(),
    loggedAt: v.optional(v.number()),
    sourceType: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("activities", {
      userId: args.userId,
      activityType: args.activityType,
      activityName: args.activityName,
      durationMinutes: args.durationMinutes,
      distanceKm: args.distanceKm,
      caloriesBurned: args.caloriesBurned,
      intensity: args.intensity,
      hydrationMl: args.hydrationMl,
      sleepHours: args.sleepHours,
      sleepQuality: args.sleepQuality,
      mealType: args.mealType,
      mealDescription: args.mealDescription,
      mood: args.mood,
      notes: args.notes,
      loggedAt: args.loggedAt || now,
      sourceType: args.sourceType,
      createdAt: now,
    });
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

