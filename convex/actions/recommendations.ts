"use node";

import { GoogleGenAI } from "@google/genai";
import { api, internal } from "../_generated/api";
import { action, ActionCtx } from "../_generated/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Generate daily insights for all users (called by cron job)
export const generateDailyInsightsForAllUsers = action({
  args: {},
  handler: async (ctx: ActionCtx): Promise<{ success: boolean; usersProcessed: number }> => {
    console.log("Starting daily insights generation...");

    // Get all users
    const users: any[] = await ctx.runQuery(internal.users.getAllUsersInternal, {});

    for (const user of users) {
      try {
        await generateDailyInsightForUser(ctx, user._id);
      } catch (error) {
        console.error(`Error generating daily insight for user ${user._id}:`, error);
      }
    }

    console.log(`Generated daily insights for ${users.length} users`);
    return { success: true, usersProcessed: users.length };
  },
});

// Generate daily insight for a specific user
async function generateDailyInsightForUser(ctx: any, userId: any) {
  // Gather user data
  const userProfile = await ctx.runQuery(internal.agentQueries.getUserProfile, { userId });
  const recentActivities = await ctx.runQuery(internal.agentQueries.getUserActivities, {
    userId,
    limit: 20
  });
  const userGoals = await ctx.runQuery(internal.agentQueries.getUserGoals, { userId });
  const userStreaks = await ctx.runQuery(internal.agentQueries.getUserStreaks, { userId });
  const stats30d = await ctx.runQuery(internal.agentQueries.getActivityStats, {
    userId,
    days: 30
  });

  // Get yesterday's activities specifically
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStart = new Date(yesterday);
  yesterdayStart.setHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setHours(23, 59, 59, 999);

  const yesterdayActivities = await ctx.runQuery(internal.agentQueries.getUserActivities, {
    userId,
    startDate: yesterdayStart.getTime(),
    endDate: yesterdayEnd.getTime()
  });

  const insightPrompt = `
You are WellBuddy's AI coach. Generate a personalized daily insight for ${userProfile.displayName || 'the user'} based on their recent activity.

USER PROFILE:
- Fitness Level: ${userProfile.healthProfile?.fitnessLevel || 'Unknown'}
- Goals: ${userProfile.healthProfile?.goals?.join(', ') || 'Not set'}

YESTERDAY'S ACTIVITIES (${yesterday.toLocaleDateString()}):
${yesterdayActivities.slice(0, 10).map((a: any) =>
    `- ${a.activityName} (${a.activityType}): ${a.notes || 'No notes'}`
  ).join('\n') || 'No activities logged'}

CURRENT STREAKS:
${userStreaks.map((s: any) => `- ${s.streakType}: ${s.currentCount} days`).join('\n') || 'No active streaks'}

TODAY'S ACTIVITIES:
${recentActivities.slice(0, 10).map((a: any) =>
    `- ${a.activityName} (${a.activityType}): ${a.notes || 'No notes'}`
  ).join('\n') || 'No activities logged'}

ACTIVE GOALS:
${userGoals.filter((g: any) => g.status === 'active').map((g: any) =>
    `- ${g.milestone}: ${g.currentProgress}/${g.goalValue} ${g.goalUnit}`
  ).join('\n') || 'No active goals'}

30-DAY STATS:
- Total activities: ${stats30d.totalActivities}
- Workouts: ${stats30d.workoutsCount}
- Meals logged: ${stats30d.mealsCount}
- Average mood: ${stats30d.averageMood || 'Not tracked'}

Generate a brief, encouraging daily insight (2-3 sentences) that:
1. Acknowledges what they did yesterday
2. Provides one actionable suggestion for today
3. Includes a positive, motivational note

Keep it under 150 words and make it personal.
`;

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ parts: [{ text: insightPrompt }] }],
  });

  const insight = result.text?.trim() || "Keep up the great work with your daily activities!";

  // Store the recommendation
  await ctx.runMutation(api.recommendations.storeRecommendation, {
    userId,
    type: "daily_insight",
    title: "Daily Insight",
    content: insight,
    generatedAt: Date.now(),
  });

  return insight;
}

// Generate weekly summaries for all users (called by cron job)
export const generateWeeklySummariesForAllUsers = action({
  args: {},
  handler: async (ctx: ActionCtx): Promise<{ success: boolean; usersProcessed: number }> => {
    console.log("Starting weekly summary generation...");

    // Get all users
    const users: any[] = await ctx.runQuery(internal.users.getAllUsersInternal, {});

    for (const user of users) {
      try {
        await generateWeeklySummaryForUser(ctx, user._id);
      } catch (error) {
        console.error(`Error generating weekly summary for user ${user._id}:`, error);
      }
    }

    console.log(`Generated weekly summaries for ${users.length} users`);
    return { success: true, usersProcessed: users.length };
  },
});

// Generate weekly summary for a specific user
async function generateWeeklySummaryForUser(ctx: any, userId: any) {
  // Gather user data for the past week
  const userProfile = await ctx.runQuery(internal.agentQueries.getUserProfile, { userId });
  const weekActivities = await ctx.runQuery(internal.agentQueries.getUserActivities, {
    userId,
    startDate: Date.now() - (7 * 24 * 60 * 60 * 1000),
    limit: 100
  });
  const userGoals = await ctx.runQuery(internal.agentQueries.getUserGoals, { userId });
  const userStreaks = await ctx.runQuery(internal.agentQueries.getUserStreaks, { userId });
  const stats7d = await ctx.runQuery(internal.agentQueries.getActivityStats, {
    userId,
    days: 7
  });

  const summaryPrompt = `
You are WellBuddy's AI coach. Generate a personalized weekly summary for ${userProfile.displayName || 'the user'}.

THIS WEEK'S STATS:
- Activities logged: ${stats7d.totalActivities}
- Workouts completed: ${stats7d.workoutsCount}
- Meals tracked: ${stats7d.mealsCount}
- Active days: ${stats7d.daysWithActivities}
- Calories burned: ${stats7d.totalCaloriesBurned}
- Calories consumed: ${stats7d.totalCaloriesConsumed}

MOST ACTIVE DAYS:
${weekActivities.slice(0, 5).map((a: any) =>
    `- ${new Date(a.loggedAt).toLocaleDateString()}: ${a.activityName}`
  ).join('\n')}

GOAL PROGRESS:
${userGoals.filter((g: any) => g.status === 'active').map((g: any) =>
    `- ${g.milestone}: ${g.currentProgress}/${g.goalValue} ${g.goalUnit} (${Math.round((g.currentProgress / g.goalValue) * 100)}%)`
  ).join('\n')}

Generate a comprehensive weekly summary that includes:
1. Overall performance assessment
2. Key achievements and highlights
3. Areas for improvement
4. Next week's recommendations
5. Encouraging closing message

USER STREAKS:
${userStreaks.map((s: any) => `- ${s.streakType}: ${s.currentCount} days`).join('\n') || 'No active streaks'}

Keep it under 300 words and make it actionable and motivating.
`;

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ parts: [{ text: summaryPrompt }] }],
  });

  const summary = result.text?.trim() || "Great week of staying active! Keep building those healthy habits.";

  // Store the recommendation
  await ctx.runMutation(api.recommendations.storeRecommendation, {
    userId,
    type: "weekly_recommendation",
    title: "Weekly Summary",
    content: summary,
    generatedAt: Date.now(),
  });

  return summary;
}

// Check goal progress for all users (called by cron job)
export const checkGoalProgressForAllUsers = action({
  args: {},
  handler: async (ctx: ActionCtx): Promise<{ success: boolean; usersProcessed: number }> => {
    console.log("Starting goal progress check...");

    // Get all users
    const users: any[] = await ctx.runQuery(internal.users.getAllUsersInternal, {});

    for (const user of users) {
      try {
        await checkGoalProgressForUser(ctx, user._id);
      } catch (error) {
        console.error(`Error checking goal progress for user ${user._id}:`, error);
      }
    }

    console.log(`Checked goal progress for ${users.length} users`);
    return { success: true, usersProcessed: users.length };
  },
});

// Check goal progress for a specific user
async function checkGoalProgressForUser(ctx: any, userId: any) {
  const userGoals = await ctx.runQuery(internal.agentQueries.getUserGoals, { userId });

  for (const goal of userGoals) {
    if (goal.status === 'active') {
      const progressPercent = (goal.currentProgress / goal.goalValue) * 100;
      const daysLeft = goal.targetDate ?
        Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null;

      // If goal is behind schedule, generate a suggestion
      if (progressPercent < 50 && (!daysLeft || daysLeft < 7)) {
        const suggestion = `You're making progress on your ${goal.milestone} goal (${Math.round(progressPercent)}% complete). ${
          daysLeft ? `With ${daysLeft} days left, ` : ''
        }try increasing your daily activity to stay on track!`;

        await ctx.runMutation(api.recommendations.storeRecommendation, {
          userId,
          type: "goal_suggestion",
          title: "Goal Progress Check",
          content: suggestion,
          generatedAt: Date.now(),
        });
      }
    }
  }
}

// Maintain streaks for all users (called by cron job)
export const maintainStreaksForAllUsers = action({
  args: {},
  handler: async (ctx: ActionCtx): Promise<{ success: boolean; usersProcessed: number }> => {
    console.log("Starting streak maintenance...");

    // Get all users
    const users: any[] = await ctx.runQuery(internal.users.getAllUsersInternal, {});

    for (const user of users) {
      try {
        await maintainStreaksForUser(ctx, user._id);
      } catch (error) {
        console.error(`Error maintaining streaks for user ${user._id}:`, error);
      }
    }

    console.log(`Maintained streaks for ${users.length} users`);
    return { success: true, usersProcessed: users.length };
  },
});

// Maintain streaks for a specific user
async function maintainStreaksForUser(ctx: any, userId: any) {
  const userStreaks = await ctx.runQuery(internal.agentQueries.getUserStreaks, { userId });

  // Check if any streaks might be broken (no activity for 2+ days)
  for (const streak of userStreaks) {
    const daysSinceLastActivity = Math.floor(
      (Date.now() - streak.lastActivityTimestamp) / (24 * 60 * 60 * 1000)
    );

    if (daysSinceLastActivity >= 2) {
      // Generate encouragement to restart streak
      const encouragement = `Your ${streak.streakType} streak of ${streak.currentCount} days is waiting for you! Jump back in today and keep the momentum going.`;

      await ctx.runMutation(api.recommendations.storeRecommendation, {
        userId,
        type: "goal_suggestion",
        title: "Streak Recovery",
        content: encouragement,
        generatedAt: Date.now(),
      });
    }
  }
}
