import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Check if a message has already been processed (to prevent duplicate processing)
 * Returns true if the message was already processed, false if it's new
 */
export const checkAndMarkMessageProcessed = internalMutation({
  args: {
    messageId: v.string(),
    senderPsid: v.string(),
  },
  handler: async (ctx, args): Promise<boolean> => {
    // Check if this message ID already exists
    const existing = await ctx.db
      .query("processedMessageIds")
      .withIndex("by_message_id", (q) => q.eq("messageId", args.messageId))
      .first();

    if (existing) {
      // Message was already processed
      console.log(`Duplicate message detected: ${args.messageId}`);
      return true;
    }

    // Mark as processed
    await ctx.db.insert("processedMessageIds", {
      messageId: args.messageId,
      senderPsid: args.senderPsid,
      processedAt: Date.now(),
    });

    return false;
  },
});

/**
 * Clean up old processed message IDs (called by cron job)
 * Removes entries older than 24 hours to prevent table bloat
 */
export const cleanupOldProcessedMessages = internalMutation({
  args: {},
  handler: async (ctx): Promise<number> => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const oldMessages = await ctx.db
      .query("processedMessageIds")
      .withIndex("by_processed_at", (q) => q.lt("processedAt", oneDayAgo))
      .collect();

    for (const msg of oldMessages) {
      await ctx.db.delete(msg._id);
    }

    console.log(`Cleaned up ${oldMessages.length} old processed message IDs`);
    return oldMessages.length;
  },
});

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

