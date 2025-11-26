"use node";

import { GoogleGenAI } from "@google/genai";
import { api, internal } from "../_generated/api";
import { action } from "../_generated/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Generate personalized goals for a user
export const generatePersonalizedGoals = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; goalsCreated: number; message: string }> => {
    console.log("Starting personalized goal generation...");

    // Get all users (in production, this might be called for specific users)
    const users: any[] = await ctx.runQuery(internal.users.getAllUsersInternal, {});

    let totalGoalsCreated = 0;

    for (const user of users) {
      try {
        const goalsCreated = await generateGoalsForUser(ctx, user._id);
        totalGoalsCreated += goalsCreated;
      } catch (error) {
        console.error(`Error generating goals for user ${user._id}:`, error);
      }
    }

    console.log(`Generated ${totalGoalsCreated} personalized goals for ${users.length} users`);
    return {
      success: true,
      goalsCreated: totalGoalsCreated,
      message: `Successfully generated ${totalGoalsCreated} personalized goals`
    };
  },
});

// Generate goals for a specific user
async function generateGoalsForUser(ctx: any, userId: any): Promise<number> {
  // Delete old AI-generated goals before creating new ones
  const deletedCount = await ctx.runMutation(internal.internalMutations.deleteUserAIGoals, { userId });
  if (deletedCount > 0) {
    console.log(`Deleted ${deletedCount} old AI-generated goals for user ${userId}`);
  }

  // Gather comprehensive user data
  const userProfile = await ctx.runQuery(internal.agentQueries.getUserProfile, { userId });
  const recentActivities = await ctx.runQuery(internal.agentQueries.getUserActivities, {
    userId,
    startDate: Date.now() - (90 * 24 * 60 * 60 * 1000), // Last 90 days
    limit: 100
  });
  const userGoals = await ctx.runQuery(internal.agentQueries.getUserGoals, { userId });
  const userStreaks = await ctx.runQuery(internal.agentQueries.getUserStreaks, { userId });
  const activityStats = await ctx.runQuery(internal.agentQueries.getActivityStats, {
    userId,
    days: 90
  });

  // Get relevant embeddings for context
  const embeddings = await ctx.runQuery(internal.embeddings.getAllEmbeddingsForUser, { userId });
  const contextChunks = embeddings
    .filter((e: any) => e.contentType === 'profile_update' || e.contentType === 'activity_summary')
    .map((e: any) => e.contentChunk)
    .slice(0, 5); // Top 5 relevant chunks

  // Analyze existing goals to avoid duplicates
  const existingGoalTypes = userGoals.map((g: any) => g.goalType);

  // Build comprehensive context for AI
  const contextData = {
    profile: {
      age: userProfile.healthProfile?.age,
      gender: userProfile.healthProfile?.gender,
      fitnessLevel: userProfile.healthProfile?.fitnessLevel,
      height: userProfile.healthProfile?.height,
      weight: userProfile.healthProfile?.weight,
      underlyingConditions: userProfile.healthProfile?.underlyingConditions,
      injuries: userProfile.healthProfile?.injuries,
    },
    activities: {
      totalCount: activityStats.totalActivities,
      workoutsCount: activityStats.workoutsCount,
      averageMood: activityStats.averageMood,
      totalDistance: activityStats.totalDistanceKm,
      totalCaloriesBurned: activityStats.totalCaloriesBurned,
      totalSleepHours: activityStats.totalSleepHours,
      recentActivities: recentActivities.slice(0, 10).map((a: any) => ({
        type: a.activityType,
        name: a.activityName,
        duration: a.durationMinutes,
        calories: a.caloriesBurned,
        date: new Date(a.loggedAt).toISOString().split('T')[0]
      }))
    },
    currentGoals: userGoals.filter((g: any) => g.status === 'active'),
    streaks: userStreaks.map((s: any) => ({
      type: s.streakType,
      count: s.currentCount,
      maxCount: s.maxCount
    })),
    contextChunks
  };

  const goalGenerationPrompt = `
You are WellBuddy's AI goal coach. Based on the user's comprehensive data, suggest 2-4 personalized goals that would be most beneficial right now.

USER CONTEXT:
${JSON.stringify(contextData, null, 2)}

EXISTING GOAL TYPES (avoid duplicates):
${existingGoalTypes.join(', ')}

GOAL TYPES AVAILABLE:
- steps_daily: Daily step count goal (recommended: 7000-12000 based on activity level)
- workouts_weekly: Weekly workout frequency (recommended: 3-6 based on fitness level)
- weight_loss: Weight loss goal (only if BMI suggests need, and user has consistent activity)
- height_target: Height growth tracking (only for young users, not weight loss)
- sleep_target: Daily sleep hours (recommended: 7-9 hours)
- hydration_daily: Daily water intake (recommended: 2000-3500ml)

ANALYSIS REQUIREMENTS:
1. Consider user's current fitness level, activity patterns, and health profile
2. Suggest realistic, achievable goals based on their current performance
3. Prioritize goals that address gaps in their current routine
4. For weight goals, calculate BMI if height/weight available and consider if appropriate
5. Consider underlying conditions and injuries when suggesting goals
6. Base suggestions on their actual activity data, not assumptions

Return a JSON array of goal suggestions with this structure:
[{
  "goalType": "steps_daily",
  "goalValue": 10000,
  "goalUnit": "steps",
  "milestone": "Walk 10,000 steps daily for better cardiovascular health",
  "aiAdjustable": true,
  "reasoning": "Based on current activity of ${contextData.activities.totalCount} activities, user could benefit from consistent daily steps",
  "confidence": 0.85,
  "basedOn": ["activity_patterns", "fitness_level", "current_goals"]
}]

Only suggest goals that make sense for this user's current situation. Maximum 4 goals.
`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: goalGenerationPrompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = result.text?.trim();
    if (!responseText) {
      console.error("Empty response from AI for goal generation");
      return 0;
    }

    const goalSuggestions = JSON.parse(responseText);

    if (!Array.isArray(goalSuggestions)) {
      console.error("Invalid goal suggestions format");
      return 0;
    }

    let goalsCreated = 0;
    for (const suggestion of goalSuggestions.slice(0, 4)) { // Max 4 goals
      try {
        await ctx.runMutation(api.goals.createGoal, {
          userId,
          goalType: suggestion.goalType,
          goalValue: suggestion.goalValue,
          goalUnit: suggestion.goalUnit,
          milestone: suggestion.milestone,
          aiAdjustable: suggestion.aiAdjustable,
          createdBy: "ai",
          sourceData: {
            reasoning: suggestion.reasoning,
            basedOn: suggestion.basedOn,
            confidence: suggestion.confidence,
          },
        });

        // Create embedding for the goal creation context
        await ctx.runAction(internal.actions.embeddings.storeEmbeddingAction, {
          userId,
          contentType: "goal_context",
          contentChunk: `AI generated goal: ${suggestion.goalType} - ${suggestion.milestone}. Reasoning: ${suggestion.reasoning}`,
        });

        goalsCreated++;
      } catch (error) {
        console.error("Error creating goal:", error);
      }
    }

    return goalsCreated;
  } catch (error) {
    console.error("Error in AI goal generation:", error);
    return 0;
  }
}
