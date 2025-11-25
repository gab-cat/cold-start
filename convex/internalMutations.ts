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
      // Fallback: Generate activityName from activityType if missing
      const activityName = params.activityName ||
          generateActivityName(params.activityType);

      // Convert time strings to timestamps if needed
      let timeStarted = params.timeStarted;
      let timeEnded = params.timeEnded;
      
      if (typeof timeStarted === "string") {
        // Try parsing as natural language time string first (e.g., "1pm", "2pm")
        const parsedTime = parseTimeString(timeStarted);
        if (parsedTime !== null) {
          timeStarted = parsedTime;
        } else {
          // Fallback to ISO date string parsing
          const isoDate = new Date(timeStarted).getTime();
          timeStarted = isNaN(isoDate) ? undefined : isoDate;
        }
      }
      
      if (typeof timeEnded === "string") {
        // Try parsing as natural language time string first (e.g., "1pm", "2pm")
        const parsedTime = parseTimeString(timeEnded);
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
        timeStarted,
        timeEnded,
        mood: params.mood,
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

      return activityId;

    case "userStreaks.update":
      return await updateStreakCount(ctx, userId, params.streakType);

    case "userGoals.adjust":
      return await adjustGoal(ctx, userId, params.goalId, params.newValue);

    case "userProfile.updateContext":
      return await ctx.db.patch(userId, {
        updatedAt: Date.now(),
      });

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

