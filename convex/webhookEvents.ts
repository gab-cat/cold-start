import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

// Store webhook event for audit trail
export const storeWebhookEvent = internalMutation({
  args: {
    messengerEventRaw: v.optional(v.any()),
    clerkEventRaw: v.optional(v.any()),
    processingStatus: v.string(),
    userId: v.optional(v.id("users")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("webhookEvents", {
      messengerEventRaw: args.messengerEventRaw,
      clerkEventRaw: args.clerkEventRaw,
      processingStatus: args.processingStatus,
      userId: args.userId,
      error: args.error,
      createdAt: Date.now(),
    });
  },
});

