import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Store a new recommendation
export const storeRecommendation = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    content: v.string(),
    generatedAt: v.number(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recommendations", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      content: args.content,
      generatedAt: args.generatedAt,
      readAt: undefined,
      metadata: args.metadata || {},
    });
  },
});

// Mark recommendation as read
export const markAsRead = mutation({
  args: {
    recommendationId: v.id("recommendations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recommendationId, {
      readAt: Date.now(),
    });
  },
});

// Get user's unread recommendations
export const getUnreadRecommendations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const recommendations = await ctx.db
      .query("recommendations")
      .withIndex("by_user_recent", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("readAt"), undefined))
      .order("desc")
      .take(10);

    return recommendations.map(rec => ({
      ...rec,
      _id: rec._id.toString(),
    }));
  },
});

// Get user's recent recommendations
export const getRecentRecommendations = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const recommendations = await ctx.db
      .query("recommendations")
      .withIndex("by_user_recent", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 5);

    return recommendations.map(rec => ({
      ...rec,
      _id: rec._id.toString(),
    }));
  },
});
