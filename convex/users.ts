import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { generateUniqueCode } from "./utils";

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
    const uniqueCode = generateUniqueCode();
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      displayName: args.displayName,
      uniqueCode,
      messengerPsid: args.messengerPsid,
      healthProfile: {
        age: undefined,
        gender: undefined,
        fitnessLevel: undefined,
        goals: undefined,
        injuries: undefined,
        underlyingConditions: undefined,
        height: undefined,
        weight: undefined,
      },
      preferences: {
        preferredTimezone: undefined,
        preferredActivities: undefined,
        notificationTypes: undefined,
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
        underlyingConditions: v.optional(v.string()),
        height: v.optional(v.number()),
        weight: v.optional(v.number()),
      })
    ),
    preferences: v.optional(
      v.object({
        preferredTimezone: v.optional(v.string()),
        preferredActivities: v.optional(v.array(v.string())),
        notificationTypes: v.optional(v.array(v.string())),
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

// Update current user profile (uses auth context)
export const updateCurrentUserProfile = mutation({
  args: {
    healthProfile: v.optional(
      v.object({
        age: v.optional(v.number()),
        gender: v.optional(v.string()),
        fitnessLevel: v.optional(v.string()),
        goals: v.optional(v.array(v.string())),
        injuries: v.optional(v.string()),
        underlyingConditions: v.optional(v.string()),
        height: v.optional(v.number()),
        weight: v.optional(v.number()),
      })
    ),
    preferences: v.optional(
      v.object({
        preferredTimezone: v.optional(v.string()),
        preferredActivities: v.optional(v.array(v.string())),
        notificationTypes: v.optional(v.array(v.string())),
        language: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Only update provided fields (partial update)
    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.healthProfile !== undefined) {
      updates.healthProfile = {
        ...user.healthProfile,
        ...args.healthProfile,
      };
    }

    if (args.preferences !== undefined) {
      updates.preferences = {
        ...user.preferences,
        ...args.preferences,
      };
    }

    await ctx.db.patch(user._id, updates);

    // Create profile embedding for RAG if health profile was updated
    if (args.healthProfile !== undefined) {
      await ctx.runMutation(internal.internalMutations.createProfileEmbedding, {
        userId: user._id,
      });
    }

    return user._id;
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

// Internal query: Get user by unique code
export const getUserByUniqueCode = internalQuery({
  args: { uniqueCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_unique_code", (q) => q.eq("uniqueCode", args.uniqueCode))
      .first();
  },
});

// Internal query: Get all users (for cron jobs and actions)
export const getAllUsersInternal = internalQuery({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db.query("users").collect();
  },
});

// Disconnect Messenger and regenerate unique code
export const disconnectMessengerAndRegenerateCode = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const newUniqueCode = generateUniqueCode();

    await ctx.db.patch(user._id, {
      messengerPsid: undefined,
      uniqueCode: newUniqueCode,
      updatedAt: Date.now(),
    });

    return { success: true, newCode: newUniqueCode };
  },
});

// Internal mutation: Link Messenger PSID by unique code
export const linkMessengerPsidByCode = internalMutation({
  args: {
    uniqueCode: v.string(),
    messengerPsid: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_unique_code", (q) => q.eq("uniqueCode", args.uniqueCode))
      .first();

    if (!user) {
      return { success: false, message: "Invalid code" };
    }

    // Check if this PSID is already linked to another user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_messenger_psid", (q) => q.eq("messengerPsid", args.messengerPsid))
      .first();

    if (existingUser && existingUser._id !== user._id) {
      // Unlink from old user
      await ctx.db.patch(existingUser._id, {
        messengerPsid: undefined,
        updatedAt: Date.now(),
      });
    }

    // Link to new user
    await ctx.db.patch(user._id, {
      messengerPsid: args.messengerPsid,
      updatedAt: Date.now(),
    });

    return { success: true, message: "Successfully linked!", userDisplayName: user.displayName };
  },
});

