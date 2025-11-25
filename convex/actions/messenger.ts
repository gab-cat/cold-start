"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { action } from "../_generated/server";
import { runAgentReasoning } from "../ai/agentReasoning";
import { parseUserIntent } from "../ai/intentParser";

export const processMessage = action({
  args: {
    senderPsid: v.string(),
    userMessage: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      // Step 1: Fetch or create user
      const user = await ctx.runQuery(
        internal.users.getUserByMessengerIdInternal,
        { messengerPsid: args.senderPsid }
      );

      if (!user) {
        // New user - send onboarding
        await sendMessengerMessage(
          args.senderPsid,
          "Welcome to WellBuddy! 🎉 I'm your AI wellness coach. Let's get started by saying what you're tracking today."
        );
        return;
      }

      // Step 2: Parse intent
      const intent = await parseUserIntent(args.userMessage);

      // Step 3: Retrieve user context via RAG
      const userContext = await ctx.runAction(
        internal.rag.retrieveUserContext,
        {
          userId: user._id,
          userQuery: args.userMessage,
        }
      );

      // Step 4: Run agentic reasoning
      const agentResponse = await runAgentReasoning(
        args.userMessage,
        intent,
        userContext,
        user
      );

      // Step 5: Execute actions via internal mutations
      const actionResults = [];
      for (const actionItem of agentResponse.actions) {
        try {
          const result = await ctx.runMutation(
            internal.internalMutations.executeAgentAction,
            {
              userId: user._id,
              actionMutation: actionItem.mutation,
              params: actionItem.params,
            }
          );
          actionResults.push({
            ...actionItem,
            success: true,
            result,
          });
        } catch (error: any) {
          actionResults.push({
            ...actionItem,
            success: false,
            error: error.message || String(error),
          });
        }
      }

      // Step 6: Store conversation + embeddings
      await ctx.runMutation(
        internal.messengerConversations.store,
        {
          userId: user._id,
          userMessage: args.userMessage,
          agentResponse: {
            text: agentResponse.response_text,
            type: agentResponse.type,
            structuredData: agentResponse,
            confidence: agentResponse.metadata.confidence,
          },
          actionsTaken: actionResults,
        }
      );

      // Step 7: Store embedding for RAG (async, don't wait)
      try {
        await ctx.runAction(internal.actions.embeddings.storeEmbeddingAction, {
          userId: user._id,
          contentType: "activity_summary",
          contentChunk: `${args.userMessage} - ${agentResponse.response_text}`,
        });
      } catch (error) {
        console.error("Error storing embedding:", error);
      }

      // Step 8: Send response back to Messenger
      await sendMessengerMessage(
        args.senderPsid,
        agentResponse.response_text
      );
    } catch (error: any) {
      console.error("Error processing message:", error);
      await sendMessengerMessage(
        args.senderPsid,
        "Sorry, I encountered an error. Please try again."
      );
    }
  },
});

async function sendMessengerMessage(psid: string, text: string) {
  const accessToken = process.env.ACCESS_TOKEN;

  if (!accessToken) {
    console.error("ACCESS_TOKEN not configured");
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: psid },
          message: { text },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Facebook API error:", errorText);
    }
  } catch (error) {
    console.error("Error sending Messenger message:", error);
  }
}

