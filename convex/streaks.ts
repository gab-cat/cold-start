import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Get user streaks
export const getUserStreaks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userStreaks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get streak by type
export const getStreakByType = query({
  args: {
    userId: v.id("users"),
    streakType: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userStreaks")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", args.userId).eq("streakType", args.streakType)
      )
      .first();
  },
});

// Update streak count
export const updateStreak = mutation({
  args: {
    userId: v.id("users"),
    streakType: v.string(),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];

    const existing = await ctx.db
      .query("userStreaks")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", args.userId).eq("streakType", args.streakType)
      )
      .first();

    if (!existing) {
      // Create new streak
      return await ctx.db.insert("userStreaks", {
        userId: args.userId,
        streakType: args.streakType,
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
      return existing;
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

    return await ctx.db.get(existing._id);
  },
});

// Reset streak (if user breaks it)
export const resetStreak = mutation({
  args: {
    userId: v.id("users"),
    streakType: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userStreaks")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", args.userId).eq("streakType", args.streakType)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        currentCount: 0,
      });
    }
  },
});

// Internal query: Get user streaks
export const getUserStreaksInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userStreaks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

