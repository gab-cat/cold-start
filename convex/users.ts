import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Get user by Messenger PSID
export const getUserByMessengerId = query({
  args: { messengerPsid: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_messenger_psid", (q) => q.eq("messengerPsid", args.messengerPsid))
      .first();
  },
});

// Get current user (from auth context)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});

// Create user
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    displayName: v.string(),
    messengerPsid: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      displayName: args.displayName,
      messengerPsid: args.messengerPsid,
      healthProfile: {
        age: undefined,
        gender: undefined,
        fitnessLevel: undefined,
        goals: undefined,
        injuries: undefined,
      },
      preferences: {
        preferredTimezone: undefined,
        preferredActivities: undefined,
        notificationFrequency: undefined,
        language: undefined,
      },
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update user
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    messengerPsid: v.optional(v.string()),
    healthProfile: v.optional(
      v.object({
        age: v.optional(v.number()),
        gender: v.optional(v.string()),
        fitnessLevel: v.optional(v.string()),
        goals: v.optional(v.array(v.string())),
        injuries: v.optional(v.string()),
      })
    ),
    preferences: v.optional(
      v.object({
        preferredTimezone: v.optional(v.string()),
        preferredActivities: v.optional(v.array(v.string())),
        notificationFrequency: v.optional(v.string()),
        language: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    await ctx.db.patch(userId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Link Messenger PSID to user
export const linkMessengerPsid = mutation({
  args: {
    userId: v.id("users"),
    messengerPsid: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      messengerPsid: args.messengerPsid,
      updatedAt: Date.now(),
    });
  },
});

// Internal query: Get user by Messenger PSID (for actions)
export const getUserByMessengerIdInternal = internalQuery({
  args: { messengerPsid: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_messenger_psid", (q) => q.eq("messengerPsid", args.messengerPsid))
      .first();
  },
});

