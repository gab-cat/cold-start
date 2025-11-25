import { query } from "./_generated/server";
import { v } from "convex/values";

// Get today's summary stats
export const getToday = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();
    const endOfDay = startOfDay + 86400000 - 1;

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();

    const todayActivities = activities.filter(
      (a) => a.loggedAt >= startOfDay && a.loggedAt <= endOfDay
    );

    // Calculate stats
    let steps = 0;
    let workoutCount = 0;
    let water = 0;
    let sleep = 0;

    for (const activity of todayActivities) {
      if (activity.activityType === "walk" || activity.activityType === "run") {
        // Estimate steps from distance (rough: 1km ≈ 1300 steps)
        if (activity.distanceKm) {
          steps += Math.round(activity.distanceKm * 1300);
        }
      }
      if (
        activity.activityType === "workout" ||
        activity.activityType === "run" ||
        activity.activityType === "yoga"
      ) {
        workoutCount++;
      }
      if (activity.activityType === "hydration") {
        water += activity.hydrationMl || 0;
      }
      if (activity.activityType === "sleep") {
        sleep += activity.sleepHours || 0;
      }
    }

    // Get step goal (default 10000)
    const stepGoal = 10000;

    return {
      steps,
      stepGoal,
      workoutCount,
      water,
      sleep,
      activities: todayActivities.length,
    };
  },
});

// Get weekly stats
export const getWeekly = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();

    const weeklyActivities = activities.filter(
      (a) => a.loggedAt >= weekAgo
    );

    // Group by day
    const dailyStats: Record<string, any> = {};
    for (const activity of weeklyActivities) {
      const date = new Date(activity.loggedAt).toISOString().split("T")[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          workouts: 0,
          steps: 0,
          water: 0,
          sleep: 0,
        };
      }

      if (
        activity.activityType === "workout" ||
        activity.activityType === "run" ||
        activity.activityType === "yoga"
      ) {
        dailyStats[date].workouts++;
      }
      if (activity.activityType === "walk" || activity.activityType === "run") {
        if (activity.distanceKm) {
          dailyStats[date].steps += Math.round(activity.distanceKm * 1300);
        }
      }
      if (activity.activityType === "hydration") {
        dailyStats[date].water += activity.hydrationMl || 0;
      }
      if (activity.activityType === "sleep") {
        dailyStats[date].sleep += activity.sleepHours || 0;
      }
    }

    return Object.values(dailyStats).sort(
      (a, b) => a.date.localeCompare(b.date)
    );
  },
});

// Get current streaks
export const getStreaks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userStreaks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get active goals with progress
export const getGoals = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userGoals")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .collect();
  },
});

