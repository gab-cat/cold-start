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
    foodCalorieData: z.optional(z.array(z.object({
      foodName: z.string(),
      caloriesPerServing: z.number(),
      servingSize: z.string(),
      source: z.string(),
      confidence: z.number(),
    }))),
  }),
});

export type StructuredAgentResponse = z.infer<typeof StructuredAgentResponseSchema>;

export async function runAgentReasoning(
  userMessage: string,
  intent: any,
  userContext: any,
  userProfile: any,
  currentTime?: {
    timestamp: number;
    isoString: string;
    localTime: string;
    dayOfWeek: string;
    hour: number;
    timezone: string;
  }
): Promise<StructuredAgentResponse> {

  // Default current time if not provided
  const timeContext = currentTime || {
    timestamp: Date.now(),
    isoString: new Date().toISOString(),
    localTime: new Date().toLocaleString(),
    dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    hour: new Date().getHours(),
    timezone: "UTC",
  };

  const contextSummary = `
CURRENT TIME CONTEXT:
- Current Timestamp: ${timeContext.timestamp}
- Current Date/Time (ISO): ${timeContext.isoString}
- Local Time: ${timeContext.localTime}
- Day of Week: ${timeContext.dayOfWeek}
- Current Hour: ${timeContext.hour}
- User Timezone: ${timeContext.timezone}

USER PROFILE:
- Name: ${userProfile.displayName || "User"}
- Age: ${userProfile.healthProfile?.age || "Not set"}
- Gender: ${userProfile.healthProfile?.gender || "Not set"}
- Height: ${userProfile.healthProfile?.height ? `${userProfile.healthProfile.height} cm` : "Not set"}
- Weight: ${userProfile.healthProfile?.weight ? `${userProfile.healthProfile.weight} kg` : "Not set"}
- Fitness Level: ${userProfile.healthProfile?.fitnessLevel || "Not set"}
- Underlying Conditions: ${userProfile.healthProfile?.underlyingConditions || "None"}
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
- "userActivity.log": Log a new activity
  REQUIRED params: activityType (e.g., "run", "walk", "sleep", "meal", "shopping", "study", "errand", "task", "weight_check"), activityName (e.g., "Morning Run", "Evening Walk", "Shopping Trip", "Study Session", "Weight Check")
  OPTIONAL params: durationMinutes?, distanceKm?, caloriesBurned?, caloriesConsumed?, intensity?, hydrationMl?, sleepHours?, sleepQuality?, mealType?, mealDescription?, timeStarted?, timeEnded?, mood?, notes?, loggedAt?, weightKg?, weightChange?
  IMPORTANT: activityName is REQUIRED and must be a descriptive human-readable name for the activity.
  
  ACTIVITY TYPE MAPPING:
  - Shopping/errands: Use activityType "shopping" or "errand" for activities like "went shopping", "grocery shopping", "running errands"
  - Study/learning: Use activityType "study" or "task" for activities like "studied", "studying", "learning", "homework"
  - Exercise: "run", "walk", "workout", "yoga", "cycle", "swim", "gym", "meditation", "stretch"
  - Wellness: "sleep", "hydration", "meal", "weight_check"
  - Leisure: "gaming", "computer", "reading", "tv", "music", "social", "hobby", "leisure"
  
  WEIGHT CHECK ACTIVITY:
  - Use activityType "weight_check" for weight measurements, weight loss/gain reporting
  - Examples: "checked my weight", "lost 2kg", "gained 1kg", "weighed myself at 75kg", "I'm now 70kg"
  - Include weightKg (current weight) and/or weightChange (positive for gain, negative for loss)
  - For relative changes like "lost 2kg", set weightChange: -2. The system will calculate new weight from profile.
  - For absolute weights like "I'm 75kg now", set weightKg: 75
  - Always ALSO call "userProfile.updateWeight" to update the user's profile weight
  
  METRICS EXTRACTION:
  - Duration: Extract duration from phrases like "for 30 mins", "for 1 hour", "for 2 hours" → durationMinutes
  - Calories burned: If user mentions calories burned or you can estimate from activity type and duration, include caloriesBurned
    - Shopping/errands: Estimate ~100-150 calories per hour (light activity)
    - Study: Estimate ~50-80 calories per hour (sedentary)
    - Walking during shopping: Estimate ~200-300 calories per hour
  - Steps: If user mentions steps or walking distance, convert to distanceKm (roughly 1km = 1300 steps)
    - If user says "walked 5000 steps", calculate: distanceKm = 5000 / 1300 ≈ 3.85
  - Distance: Extract from phrases like "walked 2km", "walked 1 mile" (convert miles to km: 1 mile = 1.609 km)
  
  For MEAL activities: Include caloriesConsumed (calories from food), mealDescription (detailed description), mealType ('breakfast'|'lunch'|'dinner'|'snack')
  
  TIME FORMAT AND INFERENCE RULES:
  CRITICAL: ALWAYS try to generate timeStarted and timeEnded for EVERY activity. This is extremely important for tracking.
  
  Supported time formats for timeStarted and timeEnded:
    - Relative times: "an hour ago", "30 minutes ago", "2 hours ago", "just now", "yesterday", "this morning", "last night", "earlier today"
    - Natural language: "1pm", "2pm", "1:30pm", "13:00", "noon", "midnight"
    - ISO date strings: "2024-01-01T13:00:00Z"
    - Timestamps (numbers): 1704110400000
  
  TIME INFERENCE GUIDELINES (use current time context above):
  1. When user says "just finished" or "just did" → timeEnded = "just now", calculate timeStarted based on typical duration
  2. When user says "an hour ago" → Use that as timeStarted, calculate timeEnded based on duration or assume activity just ended
  3. When user mentions "for X minutes/hours" → Use duration to calculate timeEnded from timeStarted
  4. When user says "from X to Y" → Extract both times directly
  5. When user gives only one time → Infer the other based on activity type and duration
  
  ACTIVITY-BASED TIME GUESSING (when no explicit time given, use current hour to make educated guesses):
  - "morning run/walk/workout" → timeStarted: "7am", duration: 30-45 mins
  - "lunch" → timeStarted: "12pm", duration: 30 mins
  - "breakfast" → timeStarted: "8am", duration: 20 mins
  - "dinner" → timeStarted: "7pm", duration: 45 mins
  - "went to bed" / "slept" → If current hour is morning, assume last night around 10-11pm
  - "afternoon workout" → timeStarted: "3pm", duration: 45 mins
  - "evening walk" → timeStarted: "6pm", duration: 30 mins
  - Shopping/errands without time → If logged during day, assume started 1-2 hours ago
  - Study session → If logged now, assume it just ended, started based on duration mentioned
  
  RELATIVE TIME CALCULATION (always calculate from CURRENT TIME above):
  - "an hour ago" → Current timestamp - 1 hour = timeStarted
  - "30 minutes ago" → Current timestamp - 30 mins = timeStarted  
  - "this morning" → 7:00 AM today
  - "earlier today" → 2 hours before current time
  - "yesterday" → Same time yesterday
  - "last night" → 10:00 PM yesterday
  
  ALWAYS include both timeStarted and timeEnded when possible. Even if guessing, provide your best estimate based on context.
  
  Examples:
    - "Just finished a 30 min run" → timeStarted: "30 minutes ago", timeEnded: "just now", durationMinutes: 30
    - "Went running an hour ago" → timeStarted: "an hour ago", timeEnded: "30 minutes ago" (assume 30 min run)
    - "Had breakfast" (logged at 9am) → timeStarted: "8am", timeEnded: "8:30am", durationMinutes: 30
    - "Morning run" (no time given) → timeStarted: "7am", timeEnded: "7:45am", durationMinutes: 45
    - "Studied for 2 hours" → timeStarted: "2 hours ago", timeEnded: "just now", durationMinutes: 120
- "userStreaks.update": Update streak count (params: streakType)
- "userGoals.adjust": Adjust goal values (params: goalId, newValue)
- "userProfile.updateContext": Update user context (no params needed)
- "userProfile.updateWeight": Update user's weight in their profile (params: weightKg?, weightChange?)
  - Use weightKg for absolute weight (e.g., "I'm 75kg now")
  - Use weightChange for relative weight changes (negative for loss, positive for gain)
  - This also updates any active weight_loss goals automatically

For MEAL activities, try to extract calorie information from the food description. Use Google Search to find accurate calorie data when possible.

AVAILABLE MUTATIONS (for taking actions):
- "userActivity.log": Log a new activity
- "userGoals.generateAIGoals": Generate personalized AI goals for the user
- "userGoals.createGoal": Create a manual goal

AVAILABLE QUERY FUNCTIONS (for answering user questions):
- "agentQueries.getUserProfile": Get user profile information (health goals, preferences)
- "agentQueries.getUserActivities": Get user activities with date filtering (startDate?, endDate?, limit?)
- "agentQueries.getUserGoals": Get user's active and completed goals
- "agentQueries.getUserStreaks": Get user's current streaks
- "agentQueries.getActivityStats": Get aggregated stats (days?, default 30 days)
- "agentQueries.getRecentConversations": Get recent chat history (limit?, default 10)
- "agentQueries.getUserRecommendations": Get user's AI recommendations

When answering questions about user data, first use the appropriate query function to get current information, then provide the answer based on that data.

Now reason through:
1. What is the user trying to accomplish?
2. Do I need to query user data to answer their question?
3. What does their recent behavior tell us?
4. What advice or action is most relevant right now?
5. Are there any concerns (burnout, plateauing, inconsistency)?
6. What specific mutations/actions should we execute?
7. For meals, should I search for calorie information?

Return structured response data with foodCalorieData if meal calories were looked up.
`;

  try {
    const jsonSchema = zodToJsonSchema(StructuredAgentResponseSchema);

    // Check if this might be a meal-related query to enable Google Search
    const isMealRelated = intent?.type === 'meal' ||
                         userMessage.toLowerCase().includes('eat') ||
                         userMessage.toLowerCase().includes('food') ||
                         userMessage.toLowerCase().includes('calories');

    const config: any = {
      responseMimeType: "application/json",
      responseJsonSchema: jsonSchema,
    };

    // Enable Google Search for meal-related queries
    if (isMealRelated) {
      config.tools = [{ googleSearch: {} }];
    }

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: reasoningPrompt,
      config,
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

