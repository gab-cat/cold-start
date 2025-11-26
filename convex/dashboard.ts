import { v } from "convex/values";
import { query } from "./_generated/server";

// Get today's summary stats
export const getToday = query({
  args: { 
    userId: v.id("users"),
    // Client passes the start and end of "today" in their local timezone (as timestamps)
    localDayStart: v.optional(v.number()),
    localDayEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Use client-provided local day boundaries, or fall back to server time (UTC)
    let startOfDay: number;
    let endOfDay: number;
    
    if (args.localDayStart !== undefined && args.localDayEnd !== undefined) {
      startOfDay = args.localDayStart;
      endOfDay = args.localDayEnd;
    } else {
      // Fallback to server time (not ideal, but backwards compatible)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startOfDay = today.getTime();
      endOfDay = startOfDay + 86400000 - 1;
    }

    // Get user for custom goals
    const user = await ctx.db.get(args.userId);
    const dailyCalorieGoal = user?.healthProfile?.dailyCalorieGoal ?? 2000;
    const dailyWaterGoal = user?.healthProfile?.dailyWaterGoal ?? 2000;
    const dailySleepGoal = user?.healthProfile?.dailySleepGoal ?? 8;

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
    let workoutMinutes = 0;
    let water = 0;
    let sleep = 0;
    let caloriesBurned = 0;
    let caloriesConsumed = 0;
    let caloriesBreakfast = 0;
    let caloriesLunch = 0;
    let caloriesDinner = 0;
    let caloriesSnacks = 0;
    let leisureMinutes = 0;
    let screenTimeMinutes = 0;

    const leisureTypes = ['gaming', 'computer', 'reading', 'tv', 'music', 'social', 'hobby', 'leisure'];

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
        activity.activityType === "yoga" ||
        activity.activityType === "gym" ||
        activity.activityType === "cycle" ||
        activity.activityType === "swim"
      ) {
        workoutCount++;
        workoutMinutes += activity.durationMinutes || 0;
      }
      if (activity.activityType === "hydration") {
        water += activity.hydrationMl || 0;
      }
      if (activity.activityType === "sleep") {
        sleep += activity.sleepHours || 0;
      }
      if (activity.caloriesBurned) {
        caloriesBurned += activity.caloriesBurned;
      }
      if (activity.caloriesConsumed) {
        caloriesConsumed += activity.caloriesConsumed;
        
        // Breakdown by meal type
        const mealType = activity.mealType?.toLowerCase();
        if (mealType === "breakfast") {
          caloriesBreakfast += activity.caloriesConsumed;
        } else if (mealType === "lunch") {
          caloriesLunch += activity.caloriesConsumed;
        } else if (mealType === "dinner") {
          caloriesDinner += activity.caloriesConsumed;
        } else if (mealType === "snack" || mealType === "snacks") {
          caloriesSnacks += activity.caloriesConsumed;
        }
      }
      // Track leisure activities
      if (leisureTypes.includes(activity.activityType)) {
        leisureMinutes += activity.durationMinutes || 0;
        // Track screen time specifically for gaming, computer, tv
        if (['gaming', 'computer', 'tv'].includes(activity.activityType)) {
          screenTimeMinutes += activity.screenTimeMinutes || activity.durationMinutes || 0;
        }
      }
    }

    // Get step goal (default 10000)
    const stepGoal = 10000;
    const netCalories = caloriesConsumed - caloriesBurned;

    return {
      steps,
      stepGoal,
      workoutCount,
      workoutMinutes,
      water,
      waterGoal: dailyWaterGoal,
      sleep,
      sleepGoal: dailySleepGoal,
      calories: caloriesBurned, // Keep for backward compatibility
      caloriesBurned,
      caloriesConsumed,
      calorieGoal: dailyCalorieGoal,
      netCalories,
      // Meal breakdown
      caloriesBreakfast,
      caloriesLunch,
      caloriesDinner,
      caloriesSnacks,
      leisureMinutes,
      screenTimeMinutes,
      activities: todayActivities.length,
    };
  },
});

// Get weekly stats
export const getWeekly = query({
  args: { 
    userId: v.id("users"),
    timezoneOffsetMinutes: v.optional(v.number()), // Client's timezone offset in minutes (e.g., -480 for UTC+8)
  },
  handler: async (ctx, args) => {
    const { timezoneOffsetMinutes } = args;
    const offsetMs = (timezoneOffsetMinutes ?? 0) * 60 * 1000;
    
    // Calculate week boundaries in local timezone
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();

    const weeklyActivities = activities.filter(
      (a) => a.loggedAt >= weekAgo
    );

    // Group by day using local timezone
    const dailyStats: Record<string, any> = {};
    const leisureTypes = ['gaming', 'computer', 'reading', 'tv', 'music', 'social', 'hobby', 'leisure'];
    
    for (const activity of weeklyActivities) {
      // Convert loggedAt to local date by adjusting for timezone offset
      const localTime = new Date(activity.loggedAt - offsetMs);
      const date = localTime.toISOString().split("T")[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          workouts: 0,
          steps: 0,
          water: 0,
          sleep: 0,
          caloriesBurned: 0,
          caloriesConsumed: 0,
          leisureMinutes: 0,
          screenTimeMinutes: 0,
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
      if (activity.caloriesBurned) {
        dailyStats[date].caloriesBurned += activity.caloriesBurned;
      }
      if (activity.caloriesConsumed) {
        dailyStats[date].caloriesConsumed += activity.caloriesConsumed;
      }
      // Track leisure activities
      if (leisureTypes.includes(activity.activityType)) {
        dailyStats[date].leisureMinutes += activity.durationMinutes || 0;
        if (['gaming', 'computer', 'tv'].includes(activity.activityType)) {
          dailyStats[date].screenTimeMinutes += activity.screenTimeMinutes || activity.durationMinutes || 0;
        }
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

// Get daily stats for a specific date (always computed fresh from activities)
export const getDailyStats = query({
  args: { 
    userId: v.id("users"),
    date: v.string(), // 'YYYY-MM-DD' format
    timezoneOffsetMinutes: v.optional(v.number()), // Client's timezone offset in minutes (e.g., -480 for UTC+8)
  },
  handler: async (ctx, args) => {
    const { userId, date, timezoneOffsetMinutes } = args;
    
    // Get user for custom goals
    const user = await ctx.db.get(userId);
    const dailyCalorieGoal = user?.healthProfile?.dailyCalorieGoal ?? 2000;
    const dailyWaterGoal = user?.healthProfile?.dailyWaterGoal ?? 2000;
    const dailySleepGoal = user?.healthProfile?.dailySleepGoal ?? 8;
    
    // Always compute fresh from activities (Convex caches query results automatically)
    // Use timezone offset to match getWeekly's calculation
    const offsetMs = (timezoneOffsetMinutes ?? 0) * 60 * 1000;
    
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();
    
    // Filter activities that fall on the requested date in the user's local timezone
    // Same logic as getWeekly: convert loggedAt to local date by subtracting offset
    const dayActivities = activities.filter((a) => {
      const localTime = new Date(a.loggedAt - offsetMs);
      const activityDate = localTime.toISOString().split("T")[0];
      return activityDate === date;
    });
    
    // Calculate aggregated stats (same logic as internalMutations)
    let steps = 0;
    let workoutCount = 0;
    let workoutMinutes = 0;
    let caloriesConsumed = 0;
    let caloriesBurned = 0;
    let caloriesBreakfast = 0;
    let caloriesLunch = 0;
    let caloriesDinner = 0;
    let caloriesSnacks = 0;
    let hydrationMl = 0;
    let sleepHours = 0;
    let leisureMinutes = 0;
    let screenTimeMinutes = 0;
    let sleepQuality: string | undefined = undefined;
    
    const workoutTypes = ["workout", "run", "walk", "cycle", "swim", "yoga", "gym", "stretch"];
    const leisureTypes = ["gaming", "computer", "reading", "tv", "music", "social", "hobby", "leisure"];
    const screenTypes = ["gaming", "computer", "tv"];
    
    for (const activity of dayActivities) {
      if (activity.activityType === "walk" || activity.activityType === "run") {
        if (activity.distanceKm) {
          steps += Math.round(activity.distanceKm * 1300);
        }
      }
      
      if (workoutTypes.includes(activity.activityType)) {
        workoutCount++;
        workoutMinutes += activity.durationMinutes || 0;
      }
      
      if (activity.caloriesBurned) {
        caloriesBurned += activity.caloriesBurned;
      }
      
      if (activity.caloriesConsumed) {
        caloriesConsumed += activity.caloriesConsumed;
        const mealType = activity.mealType?.toLowerCase();
        if (mealType === "breakfast") {
          caloriesBreakfast += activity.caloriesConsumed;
        } else if (mealType === "lunch") {
          caloriesLunch += activity.caloriesConsumed;
        } else if (mealType === "dinner") {
          caloriesDinner += activity.caloriesConsumed;
        } else if (mealType === "snack" || mealType === "snacks") {
          caloriesSnacks += activity.caloriesConsumed;
        }
      }
      
      if (activity.activityType === "hydration" && activity.hydrationMl) {
        hydrationMl += activity.hydrationMl;
      }
      
      if (activity.activityType === "sleep") {
        sleepHours += activity.sleepHours || 0;
        if (activity.sleepQuality) {
          sleepQuality = activity.sleepQuality;
        }
      }
      
      if (leisureTypes.includes(activity.activityType)) {
        leisureMinutes += activity.durationMinutes || 0;
        if (screenTypes.includes(activity.activityType)) {
          screenTimeMinutes += activity.screenTimeMinutes || activity.durationMinutes || 0;
        }
      }
    }
    
    return {
      userId,
      date,
      steps,
      workoutCount,
      workoutMinutes,
      caloriesConsumed,
      caloriesBurned,
      netCalories: caloriesConsumed - caloriesBurned,
      caloriesBreakfast,
      caloriesLunch,
      caloriesDinner,
      caloriesSnacks,
      hydrationMl,
      sleepHours,
      sleepQuality,
      leisureMinutes,
      screenTimeMinutes,
      totalActivities: dayActivities.length,
      calorieGoal: dailyCalorieGoal,
      waterGoal: dailyWaterGoal,
      sleepGoal: dailySleepGoal,
    };
  },
});

// Get activities for a specific date (for timeline view)
export const getActivitiesForDate = query({
  args: { 
    userId: v.id("users"),
    date: v.string(), // 'YYYY-MM-DD' format
    timezoneOffsetMinutes: v.optional(v.number()), // Client's timezone offset in minutes (e.g., -480 for UTC+8)
  },
  handler: async (ctx, args) => {
    const { userId, date, timezoneOffsetMinutes } = args;
    
    // Use timezone offset consistent with getWeekly and getDailyStats
    const offsetMs = (timezoneOffsetMinutes ?? 0) * 60 * 1000;
    
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();
    
    // Filter activities that fall on the requested date in the user's local timezone
    // Same logic as getWeekly: convert loggedAt to local date by subtracting offset
    return activities
      .filter((a) => {
        const localTime = new Date(a.loggedAt - offsetMs);
        const activityDate = localTime.toISOString().split("T")[0];
        return activityDate === date;
      })
      .sort((a, b) => a.loggedAt - b.loggedAt);
  },
});

// Get historical daily stats for date range (last N days)
export const getHistoricalStats = query({
  args: { 
    userId: v.id("users"),
    days: v.optional(v.number()), // Default 30 days
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    const days = args.days ?? 30;
    
    // Get user for custom goals
    const user = await ctx.db.get(userId);
    const dailyCalorieGoal = user?.healthProfile?.dailyCalorieGoal ?? 2000;
    const dailyWaterGoal = user?.healthProfile?.dailyWaterGoal ?? 2000;
    const dailySleepGoal = user?.healthProfile?.dailySleepGoal ?? 8;
    
    // Get pre-computed daily stats
    const dailyStats = await ctx.db
      .query("dailyStats")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];
    
    // Filter to date range and sort
    const filteredStats = dailyStats
      .filter((s) => s.date >= startDateStr && s.date <= endDateStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((s) => ({
        ...s,
        calorieGoal: dailyCalorieGoal,
        waterGoal: dailyWaterGoal,
        sleepGoal: dailySleepGoal,
      }));
    
    return filteredStats;
  },
});

