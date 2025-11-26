"use node";

import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { action } from "../_generated/server";
import { runAgentReasoning } from "../ai/agentReasoning";
import { parseUserIntent } from "../ai/intentParser";

type InAppChatResponse = {
  success: boolean;
  response: string;
  type?: string;
  confidence?: number;
  actionsExecuted?: number;
};

/**
 * Process an in-app chat message (similar to Messenger but for app users)
 * This allows users to chat with the AI directly in the app
 */
export const processInAppMessage = action({
  args: {
    userId: v.id("users"),
    userMessage: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args): Promise<InAppChatResponse> => {
    try {
      // Step 1: Fetch user
      const user: any = await ctx.runQuery(internal.users.getUserByIdInternal, {
        userId: args.userId,
      });

      if (!user) {
        return {
          success: false,
          response: "User not found. Please try again.",
        };
      }

      // Step 2: Parse intent
      const intent = await parseUserIntent(args.userMessage);

      // Step 3: Get current time context for the agent
      const userTimezone = user.preferences?.preferredTimezone || "UTC";
      const currentTime = await ctx.runQuery(
        internal.agentQueries.getCurrentTime,
        { timezone: userTimezone }
      );

      // Step 4: Retrieve user context via RAG
      const userContext = await ctx.runAction(
        internal.rag.retrieveUserContext,
        {
          userId: user._id,
          userQuery: args.userMessage,
        }
      );

      // Step 5: Run agentic reasoning with current time context
      const agentResponse = await runAgentReasoning(
        args.userMessage,
        intent,
        userContext,
        user,
        currentTime
      );

      // Step 6: Execute any data queries the agent requested
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

      // Step 7: Execute actions via internal mutations
      const actionResults = [];
      for (const actionItem of agentResponse.actions) {
        try {
          // For meal activities, try to get calorie information from Google Search
          if (
            actionItem.mutation === "userActivity.log" &&
            actionItem.params.activityType === "meal" &&
            actionItem.params.mealDescription &&
            !actionItem.params.caloriesConsumed
          ) {
            try {
              const calorieInfo = await ctx.runAction(
                api.actions.googleSearch.searchFoodCalories,
                {
                  foodName: actionItem.params.mealDescription,
                }
              );

              if (calorieInfo && calorieInfo.caloriesPerServing > 0) {
                actionItem.params.caloriesConsumed = calorieInfo.caloriesPerServing;
                console.log(
                  `Found calories for ${calorieInfo.foodName}: ${calorieInfo.caloriesPerServing} per ${calorieInfo.servingSize}`
                );
              }
            } catch (calorieError) {
              console.error("Error looking up food calories:", calorieError);
            }
          }

          const result: any = await ctx.runMutation(
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

      // Step 8: Store conversation + embeddings
      await ctx.runMutation(internal.messengerConversations.store, {
        userId: user._id,
        userMessage: args.userMessage,
        agentResponse: {
          text: agentResponse.response_text,
          type: agentResponse.type,
          structuredData: agentResponse,
          confidence: agentResponse.metadata.confidence,
        },
        actionsTaken: actionResults,
      });

      // Step 9: Store embedding for RAG (async, don't wait)
      try {
        await ctx.runAction(internal.actions.embeddings.storeEmbeddingAction, {
          userId: user._id,
          contentType: "activity_summary",
          contentChunk: `${args.userMessage} - ${agentResponse.response_text}`,
        });
      } catch (error) {
        console.error("Error storing embedding:", error);
      }

      // Step 10: Return response
      return {
        success: true,
        response: agentResponse.response_text,
        type: agentResponse.type,
        confidence: agentResponse.metadata.confidence,
        actionsExecuted: actionResults.length,
      };
    } catch (error: any) {
      console.error("Error processing in-app message:", error);
      return {
        success: false,
        response: "Sorry, I encountered an error. Please try again.",
      };
    }
  },
});
