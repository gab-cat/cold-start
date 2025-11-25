import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Store messenger conversation
export const store = internalMutation({
  args: {
    userId: v.id("users"),
    userMessage: v.string(),
    agentResponse: v.object({
      text: v.string(),
      type: v.string(),
      structuredData: v.any(),
      confidence: v.number(),
    }),
    actionsTaken: v.array(
      v.object({
        mutation: v.string(),
        params: v.any(),
        success: v.boolean(),
        error: v.optional(v.string()),
        result: v.optional(v.any()),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messengerConversations", {
      userId: args.userId,
      userMessage: args.userMessage,
      userMessageEmbedding: undefined,
      agentResponse: args.agentResponse,
      actionsTaken: args.actionsTaken,
      createdAt: Date.now(),
    });
  },
});

