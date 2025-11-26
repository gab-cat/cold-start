"use node";

import { v } from "convex/values";
import { api, internal } from "../_generated/api";
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
      let user = await ctx.runQuery(
        internal.users.getUserByMessengerIdInternal,
        { messengerPsid: args.senderPsid }
      );

      if (!user) {
        // Check if the message is a unique code (8 chars, alphanumeric)
        const potentialCode = args.userMessage.trim().toUpperCase();
        if (/^[A-Z0-9]{8}$/.test(potentialCode)) {
          // Attempt to link
          const linkResult = await ctx.runMutation(internal.users.linkMessengerPsidByCode, {
            uniqueCode: potentialCode,
            messengerPsid: args.senderPsid,
          });

          if (linkResult.success) {
            await sendMessengerMessage(
              args.senderPsid,
              `Welcome ${linkResult.userDisplayName}! 🎉 Your account has been successfully linked. I'm your AI wellness coach. How can I help you today?`
            );
            // Fetch the user again now that they are linked
            user = await ctx.runQuery(
              internal.users.getUserByMessengerIdInternal,
              { messengerPsid: args.senderPsid }
            );
          } else {
            await sendMessengerMessage(
              args.senderPsid,
              "That code doesn't seem to be valid. Please check your profile in the app and try again."
            );
            return;
          }
        } else {
          // New user - ask for code
          await sendMessengerMessage(
            args.senderPsid,
            "Welcome to WellBuddy! 👋 To get started, please enter the 8-character unique code from your profile in the app."
          );
          return;
        }
      }

      if (!user) {
        // Should not happen if linking was successful, but just in case
        return;
      }

      // Step 2: Parse intent
      const intent = await parseUserIntent(args.userMessage);

      // Step 2.5: Get current time context for the agent
      const userTimezone = user.preferences?.preferredTimezone || "UTC";
      const currentTime = await ctx.runQuery(
        internal.agentQueries.getCurrentTime,
        { timezone: userTimezone }
      );

      // Step 3: Retrieve user context via RAG
      const userContext = await ctx.runAction(
        internal.rag.retrieveUserContext,
        {
          userId: user._id,
          userQuery: args.userMessage,
        }
      );

      // Step 4: Run agentic reasoning with current time context
      const agentResponse = await runAgentReasoning(
        args.userMessage,
        intent,
        userContext,
        user,
        currentTime
      );

      // Step 4.5: Execute any data queries the agent requested
      let queryResults = {};
      if (agentResponse.actions && agentResponse.actions.length > 0) {
        for (const actionItem of agentResponse.actions) {
          if (actionItem.mutation.startsWith("agentQueries.")) {
            try {
              const queryName = actionItem.mutation.replace("agentQueries.", "");
              const result = await ctx.runQuery(
                `internal.agentQueries.${queryName}` as any,
                { userId: user._id, ...actionItem.params }
              );
              queryResults = { ...queryResults, [queryName]: result };
            } catch (queryError) {
              console.error(`Error executing query ${actionItem.mutation}:`, queryError);
            }
          }
        }
      }

      // Step 5: Execute actions via internal mutations
      const actionResults = [];
      for (const actionItem of agentResponse.actions) {
        try {
          // For meal activities, try to get calorie information from Google Search
          if (actionItem.mutation === "userActivity.log" &&
              actionItem.params.activityType === "meal" &&
              actionItem.params.mealDescription &&
              !actionItem.params.caloriesConsumed) {

            try {
              const calorieInfo = await ctx.runAction(
                api.actions.googleSearch.searchFoodCalories,
                {
                  foodName: actionItem.params.mealDescription,
                }
              );

              if (calorieInfo && calorieInfo.caloriesPerServing > 0) {
                actionItem.params.caloriesConsumed = calorieInfo.caloriesPerServing;
                console.log(`Found calories for ${calorieInfo.foodName}: ${calorieInfo.caloriesPerServing} per ${calorieInfo.servingSize}`);
              }
            } catch (calorieError) {
              console.error("Error looking up food calories:", calorieError);
              // Continue without calorie data - it's optional
            }
          }

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

