import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Get user goals
export const getUserGoals = query({
  args: {
    userId: v.id("users"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("userGoals")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", args.userId).eq("status", args.status!)
        )
        .collect();
    }
    // Get all goals if no status filter
    const allGoals = await ctx.db
      .query("userGoals")
      .withIndex("by_user_status", (q) => q.eq("userId", args.userId))
      .collect();
    return allGoals;
  },
});

// Create a goal
export const createGoal = mutation({
  args: {
    userId: v.id("users"),
    goalType: v.string(),
    goalValue: v.number(),
    goalUnit: v.string(),
    milestone: v.string(),
    targetDate: v.optional(v.string()),
    aiAdjustable: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("userGoals", {
      userId: args.userId,
      goalType: args.goalType,
      goalValue: args.goalValue,
      goalUnit: args.goalUnit,
      currentProgress: 0,
      targetDate: args.targetDate,
      status: "active",
      milestone: args.milestone,
      aiAdjustable: args.aiAdjustable ?? false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update goal progress
export const updateGoalProgress = mutation({
  args: {
    goalId: v.id("userGoals"),
    progress: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.goalId, {
      currentProgress: args.progress,
      updatedAt: Date.now(),
    });
  },
});

// Adjust goal value (for AI adjustments)
export const adjustGoal = mutation({
  args: {
    goalId: v.id("userGoals"),
    newValue: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.goalId, {
      goalValue: args.newValue,
      updatedAt: Date.now(),
    });
  },
});

// Update goal status
export const updateGoalStatus = mutation({
  args: {
    goalId: v.id("userGoals"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.goalId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Internal query: Get user goals
export const getUserGoalsInternal = internalQuery({
  args: {
    userId: v.id("users"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("userGoals")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", args.userId).eq("status", args.status!)
        )
        .collect();
    }
    // Get all goals if no status filter
    const allGoals = await ctx.db
      .query("userGoals")
      .withIndex("by_user_status", (q) => q.eq("userId", args.userId))
      .collect();
    return allGoals;
  },
});

