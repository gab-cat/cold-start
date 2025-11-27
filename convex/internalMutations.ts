import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { internalMutation, MutationCtx } from "./_generated/server";
import { parseTimeString } from "./utils";

// Generic executor for agent-generated actions
export const executeAgentAction = internalMutation({
  args: {
    userId: v.id("users"),
    actionMutation: v.string(), // e.g., "userActivity.log"
    params: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, actionMutation, params } = args;

    switch (actionMutation) {
    case "userActivity.log":
      // Get user's timezone for proper time parsing
      const user = await ctx.db.get(userId);
      const userTimezone = user?.preferences?.preferredTimezone || "UTC";
      
      // Fallback: Generate activityName from activityType if missing
      const activityName = params.activityName ||
          generateActivityName(params.activityType);

      // Convert time strings to timestamps if needed
      // parseTimeString now handles relative times like "an hour ago", "just now", etc.
      // and properly converts times from user's timezone to UTC
      let timeStarted = params.timeStarted;
      let timeEnded = params.timeEnded;
      const now = new Date();
      
      if (typeof timeStarted === "string") {
        // Try parsing as natural language time string (includes relative times)
        const parsedTime = parseTimeString(timeStarted, now, userTimezone);
        if (parsedTime !== null) {
          timeStarted = parsedTime;
        } else {
          // Fallback to ISO date string parsing
          const isoDate = new Date(timeStarted).getTime();
          timeStarted = isNaN(isoDate) ? undefined : isoDate;
        }
      }
      
      if (typeof timeEnded === "string") {
        // Try parsing as natural language time string (includes relative times)
        const parsedTime = parseTimeString(timeEnded, now, userTimezone);
        if (parsedTime !== null) {
          timeEnded = parsedTime;
        } else {
          // Fallback to ISO date string parsing
          const isoDate = new Date(timeEnded).getTime();
          timeEnded = isNaN(isoDate) ? undefined : isoDate;
        }
      }
      
      // Validate timestamps are valid numbers (not NaN)
      if (timeStarted !== undefined && (typeof timeStarted !== "number" || isNaN(timeStarted))) {
        console.warn(`Invalid timeStarted value: ${params.timeStarted}, setting to undefined`);
        timeStarted = undefined;
      }
      if (timeEnded !== undefined && (typeof timeEnded !== "number" || isNaN(timeEnded))) {
        console.warn(`Invalid timeEnded value: ${params.timeEnded}, setting to undefined`);
        timeEnded = undefined;
      }

      // Auto-calculate duration from timeStarted and timeEnded if not provided
      let durationMinutes = params.durationMinutes;
      if (!durationMinutes && timeStarted && timeEnded) {
        durationMinutes = Math.round((timeEnded - timeStarted) / (1000 * 60));
      }

      // Convert loggedAt if it's an ISO string
      let loggedAt = params.loggedAt || Date.now();
      if (typeof loggedAt === "string") {
        loggedAt = new Date(loggedAt).getTime();
      }

      const activityId = await ctx.db.insert("activities", {
        userId,
        activityType: params.activityType,
        activityName,
        durationMinutes,
        distanceKm: params.distanceKm,
        caloriesBurned: params.caloriesBurned,
        caloriesConsumed: params.caloriesConsumed,
        intensity: params.intensity,
        hydrationMl: params.hydrationMl,
        sleepHours: params.sleepHours,
        sleepQuality: params.sleepQuality,
        mealType: params.mealType,
        mealDescription: params.mealDescription,
        weightKg: params.weightKg,
        weightChange: params.weightChange,
        previousWeightKg: params.previousWeightKg,
        timeStarted,
        timeEnded,
        mood: params.mood,
        imageId: params.imageId,
        originalImageUrl: params.originalImageUrl,
        notes: params.notes || "",
        loggedAt,
        sourceType: "messenger",
        createdAt: Date.now(),
      });

      // Update goal progress based on this activity
      try {
        await updateGoalProgressForActivity(
          ctx,
          userId,
          params.activityType,
          {
            sleepHours: params.sleepHours,
            hydrationMl: params.hydrationMl,
            distanceKm: params.distanceKm,
            caloriesBurned: params.caloriesBurned,
          },
          loggedAt
        );
      } catch (error) {
        // Log error but don't fail the activity insertion
        console.error("Error updating goal progress:", error);
      }

      // Trigger daily stats aggregation for this activity's date
      try {
        const activityDate = new Date(loggedAt).toISOString().split("T")[0];
        await ctx.scheduler.runAfter(0, internal.internalMutations.aggregateDailyStats, {
          userId,
          date: activityDate,
        });
      } catch (error) {
        console.error("Error scheduling daily stats aggregation:", error);
      }

      return activityId;

    case "userStreaks.update":
      return await updateStreakCount(ctx, userId, params.streakType);

    case "userGoals.adjust":
      return await adjustGoal(ctx, userId, params.goalId, params.newValue);

    case "userProfile.updateContext":
      return await ctx.db.patch(userId, {
        updatedAt: Date.now(),
      });

    case "userProfile.updateWeight":
      return await updateUserWeight(ctx, userId, params.weightKg, params.weightChange);

    default:
      throw new Error(`Unknown mutation: ${actionMutation}`);
    }
  },
});

// Helper: Update streak count
async function updateStreakCount(ctx: MutationCtx, userId: Id<"users">, streakType: string) {
  const today = new Date().toISOString().split("T")[0];

  const existing = await ctx.db
    .query("userStreaks")
    .withIndex("by_user_type", (q: any) =>
      q.eq("userId", userId).eq("streakType", streakType)
    )
    .first();

  if (!existing) {
    // Create new streak
    return await ctx.db.insert("userStreaks", {
      userId,
      streakType,
      currentCount: 1,
      maxCount: 1,
      lastActivityDate: today,
      lastActivityTimestamp: Date.now(),
      createdAt: Date.now(),
    });
  }

  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .split("T")[0];
  const isConsecutive = existing.lastActivityDate === yesterday;
  const isToday = existing.lastActivityDate === today;

  // If already logged today, don't increment
  if (isToday) {
    return existing._id;
  }

  // Update streak
  const newCount = isConsecutive ? existing.currentCount + 1 : 1;
  const newMax = Math.max(newCount, existing.maxCount);

  await ctx.db.patch(existing._id, {
    currentCount: newCount,
    maxCount: newMax,
    lastActivityDate: today,
    lastActivityTimestamp: Date.now(),
  });

  return existing._id;
}

// Helper: Adjust goal based on performance
async function adjustGoal(ctx: MutationCtx, userId: Id<"users">, goalIdOrType: any, newValue: number) {
  let validGoalId: Id<"userGoals">;
  
  // Check if goalIdOrType is a goal type string (e.g., "hydration_daily") rather than a Convex ID
  const goalTypes = ["steps_daily", "workouts_weekly", "weight_loss", "sleep_target", "hydration_daily", "height_target"];
  
  if (typeof goalIdOrType === "string" && goalTypes.includes(goalIdOrType)) {
    // It's a goal type, look up the user's active goal of this type
    const goal = await ctx.db
      .query("userGoals")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", "active")
      )
      .filter((q) => q.eq(q.field("goalType"), goalIdOrType))
      .first();
    
    if (!goal) {
      console.warn(`No active goal found for type: ${goalIdOrType}`);
      return null; // No goal to adjust
    }
    validGoalId = goal._id;
  } else if (typeof goalIdOrType === "string") {
    // Try to use it as a Convex ID
    try {
      const goal = await ctx.db.get(goalIdOrType as Id<"userGoals">);
      if (!goal) {
        throw new Error(`Goal with ID ${goalIdOrType} not found`);
      }
      validGoalId = goalIdOrType as Id<"userGoals">;
    } catch (error: any) {
      if (error.message?.includes("Invalid ID") || error.message?.includes("Unable to decode ID")) {
        console.warn(`Invalid goal ID format: ${goalIdOrType}. Skipping goal adjustment.`);
        return null;
      }
      throw error;
    }
  } else {
    // Already an ID type, verify it exists
    const goal = await ctx.db.get(goalIdOrType);
    if (!goal) {
      throw new Error(`Goal with ID ${goalIdOrType} not found`);
    }
    validGoalId = goalIdOrType;
  }

  await ctx.db.patch(validGoalId, {
    goalValue: newValue,
    updatedAt: Date.now(),
  });
  return validGoalId;
}

// Helper: Update user weight in profile and update weight goals
async function updateUserWeight(
  ctx: MutationCtx,
  userId: Id<"users">,
  weightKg?: number,
  weightChange?: number
): Promise<{ newWeight: number; previousWeight?: number; goalUpdated: boolean }> {
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const previousWeight = user.healthProfile?.weight;
  let newWeight: number;

  // Calculate new weight
  if (weightKg !== undefined) {
    // Absolute weight provided
    newWeight = weightKg;
  } else if (weightChange !== undefined && previousWeight) {
    // Relative change provided (negative for loss, positive for gain)
    newWeight = previousWeight + weightChange;
  } else if (weightChange !== undefined) {
    // Weight change provided but no previous weight - can't calculate
    throw new Error("Cannot calculate new weight: no previous weight on record. Please provide your current weight.");
  } else {
    throw new Error("Either weightKg or weightChange must be provided");
  }

  // Update user profile with new weight
  await ctx.db.patch(userId, {
    healthProfile: {
      ...user.healthProfile,
      weight: newWeight,
    },
    updatedAt: Date.now(),
  });

  // Update any active weight_loss goals
  let goalUpdated = false;
  const weightGoal = await ctx.db
    .query("userGoals")
    .withIndex("by_user_status", (q) =>
      q.eq("userId", userId).eq("status", "active")
    )
    .filter((q) => q.eq(q.field("goalType"), "weight_loss"))
    .first();

  if (weightGoal) {
    await ctx.db.patch(weightGoal._id, {
      currentProgress: newWeight,
      updatedAt: Date.now(),
    });
    goalUpdated = true;

    // Check if goal is completed (current weight <= target weight for weight loss)
    if (newWeight <= weightGoal.goalValue) {
      await ctx.db.patch(weightGoal._id, {
        status: "completed",
        updatedAt: Date.now(),
      });
    }
  }

  console.log(`Updated weight for user ${userId}: ${previousWeight}kg → ${newWeight}kg (goal updated: ${goalUpdated})`);

  return { newWeight, previousWeight, goalUpdated };
}

// Helper: Update goal progress based on activity
async function updateGoalProgressForActivity(
  ctx: MutationCtx,
  userId: Id<"users">,
  activityType: string,
  activityData: {
    sleepHours?: number;
    hydrationMl?: number;
    distanceKm?: number;
    caloriesBurned?: number;
  },
  loggedAt: number
) {
  // Map activity types to goal types
  const activityToGoalTypeMap: Record<string, string[]> = {
    sleep: ["sleep_target"],
    hydration: ["hydration_daily"],
    walk: ["steps_daily"],
    run: ["steps_daily", "workouts_weekly"],
    workout: ["workouts_weekly"],
    cycle: ["workouts_weekly"],
    swim: ["workouts_weekly"],
    yoga: ["workouts_weekly"],
    gym: ["workouts_weekly"],
  };

  const relevantGoalTypes = activityToGoalTypeMap[activityType] || [];
  if (relevantGoalTypes.length === 0) {
    return; // No relevant goals for this activity type
  }

  // Get all active goals for this user
  const allGoals = await ctx.db
    .query("userGoals")
    .withIndex("by_user_status", (q) =>
      q.eq("userId", userId).eq("status", "active")
    )
    .collect();

  // Filter to relevant goals
  const relevantGoals = allGoals.filter((goal) =>
    relevantGoalTypes.includes(goal.goalType)
  );

  if (relevantGoals.length === 0) {
    return; // No relevant active goals
  }

  // Calculate date range based on goal type
  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfDay = today.getTime();
  const endOfDay = startOfDay + 86400000 - 1;

  // For weekly goals, calculate start of week (Monday)
  const startOfWeek = new Date(today);
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfWeekTimestamp = startOfWeek.getTime();

  // Get all activities for the user
  const allActivities = await ctx.db
    .query("activities")
    .withIndex("by_user_date", (q) => q.eq("userId", userId))
    .collect();

  // Update each relevant goal
  for (const goal of relevantGoals) {
    let newProgress = 0;

    if (goal.goalType === "sleep_target") {
      // Sum sleep hours for today
      const todaySleepActivities = allActivities.filter(
        (a) =>
          a.activityType === "sleep" &&
          a.loggedAt >= startOfDay &&
          a.loggedAt <= endOfDay
      );
      newProgress = todaySleepActivities.reduce(
        (sum, a) => sum + (a.sleepHours || 0),
        0
      );
    } else if (goal.goalType === "hydration_daily") {
      // Sum hydration ml for today
      const todayHydrationActivities = allActivities.filter(
        (a) =>
          a.activityType === "hydration" &&
          a.loggedAt >= startOfDay &&
          a.loggedAt <= endOfDay
      );
      newProgress = todayHydrationActivities.reduce(
        (sum, a) => sum + (a.hydrationMl || 0),
        0
      );
    } else if (goal.goalType === "steps_daily") {
      // Calculate steps from walk/run activities today
      const todayWalkRunActivities = allActivities.filter(
        (a) =>
          (a.activityType === "walk" || a.activityType === "run") &&
          a.loggedAt >= startOfDay &&
          a.loggedAt <= endOfDay
      );
      // Estimate steps from distance (rough: 1km ≈ 1300 steps)
      newProgress = todayWalkRunActivities.reduce(
        (sum, a) => sum + Math.round((a.distanceKm || 0) * 1300),
        0
      );
    } else if (goal.goalType === "workouts_weekly") {
      // Count workouts this week
      const weekWorkoutActivities = allActivities.filter(
        (a) =>
          ["workout", "run", "cycle", "swim", "yoga", "gym"].includes(
            a.activityType
          ) &&
          a.loggedAt >= startOfWeekTimestamp &&
          a.loggedAt <= now
      );
      newProgress = weekWorkoutActivities.length;
    }

    // Update the goal's current progress
    await ctx.db.patch(goal._id, {
      currentProgress: newProgress,
      updatedAt: Date.now(),
    });
  }
}

// Helper: Generate activity name from activity type if missing
function generateActivityName(activityType: string): string {
  const typeMap: Record<string, string> = {
    run: "Run Activity",
    walk: "Walk Activity",
    cycle: "Cycling Activity",
    swim: "Swimming Activity",
    yoga: "Yoga Session",
    gym: "Gym Workout",
    sleep: "Sleep",
    meal: "Meal",
    hydration: "Hydration",
    meditation: "Meditation Session",
    stretch: "Stretching Session",
    shopping: "Shopping Trip",
    errand: "Errand",
    task: "Task",
    study: "Study Session",
    gaming: "Gaming Session",
    computer: "Computer Activity",
    reading: "Reading Session",
    tv: "TV Watching",
    music: "Music Listening",
    social: "Social Activity",
    hobby: "Hobby Activity",
    leisure: "Leisure Activity",
    weight_check: "Weight Check",
  };

  return typeMap[activityType.toLowerCase()] ||
    `${activityType.charAt(0).toUpperCase()}${activityType.slice(1)} Activity`;
}

// Create embedding for profile updates
export const createProfileEmbedding = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<void> => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    const profileText = `User profile: Age ${user.healthProfile?.age || 'unknown'}, Gender ${user.healthProfile?.gender || 'unknown'}, Height ${user.healthProfile?.height || 'unknown'}cm, Weight ${user.healthProfile?.weight || 'unknown'}kg, Fitness Level: ${user.healthProfile?.fitnessLevel || 'unknown'}, Goals: ${user.healthProfile?.goals?.join(', ') || 'none'}, Conditions: ${user.healthProfile?.underlyingConditions || 'none'}, Injuries: ${user.healthProfile?.injuries || 'none'}`;

    // Schedule the embedding action to run after this mutation completes
    await ctx.scheduler.runAfter(0, internal.actions.embeddings.storeEmbeddingAction, {
      userId: args.userId,
      contentType: "profile_update",
      contentChunk: profileText,
    });
  },
});

// Create embedding for activity summaries (weekly/monthly)
export const createActivitySummaryEmbedding = internalMutation({
  args: {
    userId: v.id("users"),
    period: v.string(), // 'weekly' | 'monthly'
    summaryData: v.any(),
  },
  handler: async (ctx, args): Promise<void> => {
    const summaryText = `Activity summary for ${args.period}: ${args.summaryData.totalActivities} total activities, ${args.summaryData.workoutsCount} workouts, ${args.summaryData.totalDistanceKm}km distance, ${args.summaryData.totalCaloriesBurned} calories burned, ${args.summaryData.totalSleepHours} hours sleep, average mood: ${args.summaryData.averageMood || 'unknown'}`;

    // Schedule the embedding action to run after this mutation completes
    await ctx.scheduler.runAfter(0, internal.actions.embeddings.storeEmbeddingAction, {
      userId: args.userId,
      contentType: "activity_summary",
      contentChunk: summaryText,
    });
  },
});

// Create embedding for goal context
export const createGoalContextEmbedding = internalMutation({
  args: {
    userId: v.id("users"),
    goalId: v.id("userGoals"),
    context: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    // Schedule the embedding action to run after this mutation completes
    await ctx.scheduler.runAfter(0, internal.actions.embeddings.storeEmbeddingAction, {
      userId: args.userId,
      contentType: "goal_context",
      contentChunk: args.context,
    });
  },
});

// Internal mutation to update goal progress for an activity
export const updateGoalProgressForActivityMutation = internalMutation({
  args: {
    userId: v.id("users"),
    activityType: v.string(),
    activityData: v.object({
      sleepHours: v.optional(v.number()),
      hydrationMl: v.optional(v.number()),
      distanceKm: v.optional(v.number()),
      caloriesBurned: v.optional(v.number()),
    }),
    loggedAt: v.number(),
  },
  handler: async (ctx, args) => {
    await updateGoalProgressForActivity(
      ctx,
      args.userId,
      args.activityType,
      args.activityData,
      args.loggedAt
    );
  },
});

// Create embedding for health notes
export const createHealthNotesEmbedding = internalMutation({
  args: {
    userId: v.id("users"),
    notes: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    // Schedule the embedding action to run after this mutation completes
    await ctx.scheduler.runAfter(0, internal.actions.embeddings.storeEmbeddingAction, {
      userId: args.userId,
      contentType: "health_note",
      contentChunk: `Health notes: ${args.notes}`,
    });
  },
});

// Delete all AI-generated goals for a user before regenerating new ones
export const deleteUserAIGoals = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<number> => {
    // Get all goals for this user that were created by AI
    const aiGoals = await ctx.db
      .query("userGoals")
      .withIndex("by_user_status", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("createdBy"), "ai"))
      .collect();

    // Delete each AI-generated goal
    for (const goal of aiGoals) {
      await ctx.db.delete(goal._id);
    }

    console.log(`Deleted ${aiGoals.length} AI-generated goals for user ${args.userId}`);
    return aiGoals.length;
  },
});

// Aggregate daily stats for a specific user and date
export const aggregateDailyStats = internalMutation({
  args: {
    userId: v.id("users"),
    date: v.string(), // 'YYYY-MM-DD' format
  },
  handler: async (ctx, args): Promise<void> => {
    const { userId, date } = args;
    
    // Parse date to get start and end of day in UTC
    const startOfDay = new Date(date + "T00:00:00Z").getTime();
    const endOfDay = new Date(date + "T23:59:59.999Z").getTime();
    
    // Get all activities for this user on this date
    const allActivities = await ctx.db
      .query("activities")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();
    
    const dayActivities = allActivities.filter(
      (a) => a.loggedAt >= startOfDay && a.loggedAt <= endOfDay
    );
    
    // Calculate aggregated stats
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
      // Steps from walk/run (1km ≈ 1300 steps)
      if (activity.activityType === "walk" || activity.activityType === "run") {
        if (activity.distanceKm) {
          steps += Math.round(activity.distanceKm * 1300);
        }
      }
      
      // Workout tracking
      if (workoutTypes.includes(activity.activityType)) {
        workoutCount++;
        workoutMinutes += activity.durationMinutes || 0;
      }
      
      // Calories burned (from workouts/exercise)
      if (activity.caloriesBurned) {
        caloriesBurned += activity.caloriesBurned;
      }
      
      // Calories consumed (from meals)
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
      
      // Hydration
      if (activity.activityType === "hydration" && activity.hydrationMl) {
        hydrationMl += activity.hydrationMl;
      }
      
      // Sleep
      if (activity.activityType === "sleep") {
        sleepHours += activity.sleepHours || 0;
        if (activity.sleepQuality) {
          sleepQuality = activity.sleepQuality; // Take the latest sleep quality
        }
      }
      
      // Leisure and screen time
      if (leisureTypes.includes(activity.activityType)) {
        leisureMinutes += activity.durationMinutes || 0;
        if (screenTypes.includes(activity.activityType)) {
          screenTimeMinutes += activity.screenTimeMinutes || activity.durationMinutes || 0;
        }
      }
    }
    
    const netCalories = caloriesConsumed - caloriesBurned;
    const now = Date.now();
    
    // Check if daily stats already exist for this date
    const existing = await ctx.db
      .query("dailyStats")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .first();
    
    const statsData = {
      userId,
      date,
      steps,
      workoutCount,
      workoutMinutes,
      caloriesConsumed,
      caloriesBurned,
      netCalories,
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
      lastUpdatedAt: now,
    };
    
    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, statsData);
    } else {
      // Insert new record
      await ctx.db.insert("dailyStats", {
        ...statsData,
        createdAt: now,
      });
    }
    
    console.log(`Aggregated daily stats for user ${userId} on ${date}: ${dayActivities.length} activities`);
  },
});

// Aggregate daily stats for all users for a specific date
export const aggregateDailyStatsForAllUsers = internalMutation({
  args: {
    date: v.string(), // 'YYYY-MM-DD' format
  },
  handler: async (ctx, args): Promise<{ usersProcessed: number }> => {
    const users = await ctx.db.query("users").collect();
    
    for (const user of users) {
      await ctx.scheduler.runAfter(0, internal.internalMutations.aggregateDailyStats, {
        userId: user._id,
        date: args.date,
      });
    }
    
    console.log(`Scheduled daily stats aggregation for ${users.length} users on ${args.date}`);
    return { usersProcessed: users.length };
  },
});

