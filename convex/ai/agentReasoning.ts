"use node";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Zod schema for structured agent response
const StructuredAgentResponseSchema = z.object({
  type: z.enum(["recommendation", "confirmation", "alert", "question"]),
  response_text: z.string(),
  actions: z.array(z.object({
    mutation: z.string(), // e.g., "userActivity.log"
    params: z.record(z.any()),
  })),
  metadata: z.object({
    reasoning: z.string(),
    confidence: z.number().min(0).max(1),
  }),
});

export type StructuredAgentResponse = z.infer<typeof StructuredAgentResponseSchema>;

export async function runAgentReasoning(
  userMessage: string,
  intent: any,
  userContext: any,
  userProfile: any
): Promise<StructuredAgentResponse> {

  const contextSummary = `
USER PROFILE:
- Name: ${userProfile.displayName || "User"}
- Fitness Level: ${userProfile.healthProfile?.fitnessLevel || "Not set"}
- Active Goals: ${userProfile.healthProfile?.goals?.join(", ") || "None yet"}

RECENT ACTIVITY (Last 7 days):
${userContext.recentActivities
    .slice(0, 5)
    .map(
      (a: any) =>
        `- ${a.activityName} (${a.activityType}): ${a.notes || ""} [${new Date(a.loggedAt).toLocaleDateString()}]`
    )
    .join("\n")}

CURRENT STREAKS:
${userContext.userStreaks
    .map((s: any) => `- ${s.streakType}: ${s.currentCount} days (max: ${s.maxCount})`)
    .join("\n") || "No active streaks"}

ACTIVE GOALS:
${userContext.userGoals
    .map(
      (g: any) =>
        `- ${g.milestone}: ${g.currentProgress}/${g.goalValue} ${g.goalUnit}`
    )
    .join("\n") || "No active goals"}

SEMANTIC CONTEXT (From RAG):
${userContext.semanticContext || "No relevant context found"}
`;

  const reasoningPrompt = `
You are WellBuddy, an AI fitness coach. Reason through this interaction step-by-step.

USER MESSAGE: "${userMessage}"
PARSED INTENT: ${JSON.stringify(intent)}

${contextSummary}

AVAILABLE FUNCTIONS (use these exact mutation names):
- "userActivity.log": Log a new activity (params: activityType, activityName, durationMinutes?, distanceKm?, caloriesBurned?, intensity?, hydrationMl?, sleepHours?, sleepQuality?, mealType?, mealDescription?, mood?, notes?, loggedAt?)
- "userStreaks.update": Update streak count (params: streakType)
- "userGoals.adjust": Adjust goal values (params: goalId, newValue)
- "userProfile.updateContext": Update user context (no params needed)

These functions will be executed via internal.internalMutations.executeAgentAction.

Now reason through:
1. What is the user trying to accomplish?
2. What does their recent behavior tell us?
3. What advice or action is most relevant right now?
4. Are there any concerns (burnout, plateauing, inconsistency)?
5. What specific mutations/actions should we execute?

Return structured response data.
`;

  try {
    const jsonSchema = zodToJsonSchema(StructuredAgentResponseSchema);

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: reasoningPrompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchema,
      },
    });

    const responseText = result.text;
    if (!responseText) {
      throw new Error("Empty response from AI model");
    }
    const parsedResult = JSON.parse(responseText);
    return StructuredAgentResponseSchema.parse(parsedResult);
  } catch (error) {
    console.error("Error in agent reasoning:", error);
    return {
      type: "confirmation",
      response_text: "Thanks for the update! I've logged your activity.",
      actions: [],
      metadata: {
        reasoning: "Fallback response - JSON parsing failed",
        confidence: 0.3,
      },
    };
  }
}

