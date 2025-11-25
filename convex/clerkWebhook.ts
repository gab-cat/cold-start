import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { generateUniqueCode } from "./utils";

// Handle user.created event from Clerk
export const handleUserCreated = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const displayName =
      args.firstName && args.lastName
        ? `${args.firstName} ${args.lastName}`
        : args.firstName || args.lastName || args.email.split("@")[0];

    const now = Date.now();

    const uniqueCode = generateUniqueCode();

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      displayName,
      uniqueCode,
      messengerPsid: undefined,
      healthProfile: {
        age: undefined,
        gender: undefined,
        fitnessLevel: undefined,
        goals: undefined,
        injuries: undefined,
        underlyingConditions: undefined,
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

// Handle user.updated event from Clerk
export const handleUserUpdated = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      console.warn(`User not found for clerkId: ${args.clerkId}`);
      return null;
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.email) {
      updates.email = args.email;
    }

    if (args.firstName || args.lastName) {
      const firstName = args.firstName || user.displayName.split(" ")[0];
      const lastName = args.lastName || user.displayName.split(" ").slice(1).join(" ");
      updates.displayName =
        firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || user.displayName;
    }

    await ctx.db.patch(user._id, updates);
    return user._id;
  },
});

// Handle user.deleted event from Clerk
export const handleUserDeleted = internalMutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      console.warn(`User not found for clerkId: ${args.clerkId}`);
      return null;
    }

    // Option 1: Soft delete - mark user as deleted
    // Option 2: Hard delete - remove all related data
    // For MVP, we'll do a soft delete by updating the email to mark as deleted
    await ctx.db.patch(user._id, {
      email: `deleted_${user._id}_${Date.now()}@deleted.local`,
      displayName: "Deleted User",
      updatedAt: Date.now(),
    });

    // Note: In production, you might want to delete related activities, streaks, goals, etc.
    // For now, we'll keep the data but mark the user as deleted

    return user._id;
  },
});

