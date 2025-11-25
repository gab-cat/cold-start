import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

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
        return await ctx.db.insert("activities", {
          userId,
          activityType: params.activityType,
          activityName: params.activityName,
          durationMinutes: params.durationMinutes,
          distanceKm: params.distanceKm,
          caloriesBurned: params.caloriesBurned,
          intensity: params.intensity,
          hydrationMl: params.hydrationMl,
          sleepHours: params.sleepHours,
          sleepQuality: params.sleepQuality,
          mealType: params.mealType,
          mealDescription: params.mealDescription,
          mood: params.mood,
          notes: params.notes || "",
          loggedAt: params.loggedAt || Date.now(),
          sourceType: "messenger",
          createdAt: Date.now(),
        });

      case "userStreaks.update":
        return await updateStreakCount(ctx, userId, params.streakType);

      case "userGoals.adjust":
        return await adjustGoal(ctx, params.goalId, params.newValue);

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
async function updateStreakCount(ctx: any, userId: any, streakType: string) {
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
async function adjustGoal(ctx: any, goalId: any, newValue: number) {
  await ctx.db.patch(goalId, {
    goalValue: newValue,
    updatedAt: Date.now(),
  });
  return goalId;
}

