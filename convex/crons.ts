import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Daily insights generation - runs every day at 8 AM UTC
crons.cron(
  "generateDailyInsights",
  "0 8 * * *", // Every day at 8 AM UTC
  api.actions.recommendations.generateDailyInsightsForAllUsers
);

// Weekly summary generation - runs every Monday at 9 AM UTC
crons.cron(
  "generateWeeklySummaries",
  "0 9 * * 1", // Every Monday at 9 AM UTC
  api.actions.recommendations.generateWeeklySummariesForAllUsers
);

// Goal progress check - runs daily at 6 PM UTC
crons.cron(
  "checkGoalProgress",
  "0 18 * * *", // Every day at 6 PM UTC
  api.actions.recommendations.checkGoalProgressForAllUsers
);

// Streak maintenance - runs daily at midnight UTC
crons.cron(
  "maintainStreaks",
  "0 0 * * *", // Every day at midnight UTC
  api.actions.recommendations.maintainStreaksForAllUsers
);

export default crons;
