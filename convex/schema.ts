import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============ CORE USER DATA ============
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    displayName: v.string(),
    messengerPsid: v.optional(v.string()), // Facebook Page-Scoped ID
    healthProfile: v.object({
      age: v.optional(v.number()),
      gender: v.optional(v.string()),
      fitnessLevel: v.optional(v.string()), // 'beginner' | 'intermediate' | 'advanced'
      goals: v.optional(v.array(v.string())), // ['lose_weight', 'build_strength', 'improve_endurance']
      injuries: v.optional(v.string()),
    }),
    preferences: v.object({
      preferredTimezone: v.optional(v.string()),
      preferredActivities: v.optional(v.array(v.string())),
      notificationFrequency: v.optional(v.string()), // 'frequent' | 'moderate' | 'rare'
      language: v.optional(v.string()), // 'en' | 'tl' (Tagalog Phase 2)
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_messenger_psid", ["messengerPsid"]),

  // ============ ACTIVITY TRACKING ============
  activities: defineTable({
    userId: v.id("users"),
    activityType: v.string(), // 'workout' | 'walk' | 'run' | 'yoga' | 'sleep' | 'hydration' | 'meal'
    activityName: v.string(), // 'Morning run', '8-hour sleep', '2L water', etc
    durationMinutes: v.optional(v.number()),
    distanceKm: v.optional(v.number()),
    caloriesBurned: v.optional(v.number()),
    intensity: v.optional(v.string()), // 'light' | 'moderate' | 'vigorous'
    hydrationMl: v.optional(v.number()),
    sleepHours: v.optional(v.number()),
    sleepQuality: v.optional(v.string()), // 'poor' | 'fair' | 'good' | 'excellent'
    mealType: v.optional(v.string()), // 'breakfast' | 'lunch' | 'dinner' | 'snack'
    mealDescription: v.optional(v.string()), // "Grilled chicken with rice"
    mood: v.optional(v.string()), // 'bad' | 'neutral' | 'good' | 'excellent'
    notes: v.string(), // "Felt great today", etc
    loggedAt: v.number(), // Timestamp user provided (might be past)
    sourceType: v.string(), // 'messenger' | 'dashboard' | 'wearable'
    createdAt: v.number(),
  })
    .index("by_user_date", ["userId", "loggedAt"])
    .index("by_user_type", ["userId", "activityType"]),

  // ============ STREAKS & BADGES ============
  userStreaks: defineTable({
    userId: v.id("users"),
    streakType: v.string(), // 'workouts' | 'steps' | 'hydration' | 'sleep' | 'logging_consistency'
    currentCount: v.number(), // Days in a row
    maxCount: v.number(), // Personal best
    lastActivityDate: v.string(), // ISO date 'YYYY-MM-DD'
    lastActivityTimestamp: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "streakType"]),

  // ============ GOALS ============
  userGoals: defineTable({
    userId: v.id("users"),
    goalType: v.string(), // 'steps_daily' | 'workouts_weekly' | 'weight_loss' | 'sleep_target' | 'hydration_daily'
    goalValue: v.number(), // 10000 steps, 3 workouts, 8 hours sleep, etc
    goalUnit: v.string(), // 'steps' | 'workouts' | 'kg' | 'hours' | 'ml'
    currentProgress: v.number(),
    targetDate: v.optional(v.string()), // 'YYYY-MM-DD'
    status: v.string(), // 'active' | 'completed' | 'paused'
    milestone: v.string(), // "Consistent 30-min walks for 3 weeks"
    aiAdjustable: v.boolean(), // Whether agent can auto-adjust this goal
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_status", ["userId", "status"]),

  // ============ EMBEDDINGS CACHE (For RAG) ============
  embeddings: defineTable({
    userId: v.id("users"),
    contentType: v.string(), // 'activity_summary' | 'goal_context' | 'health_note' | 'preference'
    contentChunk: v.string(), // Text to embed (limited size)
    embeddingVector: v.array(v.float64()), // Vector from Gemini (text-embedding-004 = 768 dimensions)
    metadata: v.object({
      date: v.string(),
      relatedActivityId: v.optional(v.string()),
      confidence: v.number(), // 0-1
    }),
    createdAt: v.number(),
  })
    .index("by_user_content", ["userId", "contentType"])
    .index("by_user_date", ["userId", "createdAt"])
    .vectorIndex("by_embedding", {
      vectorField: "embeddingVector",
      dimensions: 768, // Google text-embedding-004 produces 768-dimensional vectors
      filterFields: ["userId", "contentType"],
    }),

  // ============ MESSENGER CONVERSATION ============
  messengerConversations: defineTable({
    userId: v.id("users"),
    userMessage: v.string(),
    userMessageEmbedding: v.optional(v.array(v.float64())), // For semantic search (768 dimensions)
    agentResponse: v.object({
      text: v.string(),
      type: v.string(), // 'recommendation' | 'confirmation' | 'alert' | 'question'
      structuredData: v.any(), // { type, actions: [...], metadata }
      confidence: v.number(),
    }),
    actionsTaken: v.array(
      v.object({
        mutation: v.string(), // 'userActivity.log', 'userStreaks.update', etc
        params: v.any(),
        success: v.boolean(),
        error: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_user_recent", ["userId", "createdAt"])
    .vectorIndex("by_message_embedding", {
      vectorField: "userMessageEmbedding",
      dimensions: 768, // Google text-embedding-004 produces 768-dimensional vectors
      filterFields: ["userId"],
    }),

  // ============ AUDIT TRAIL ============
  webhookEvents: defineTable({
    messengerEventRaw: v.optional(v.any()), // Raw Facebook webhook payload
    clerkEventRaw: v.optional(v.any()), // Raw Clerk webhook payload
    processingStatus: v.string(), // 'received' | 'processing' | 'completed' | 'failed'
    userId: v.optional(v.id("users")),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_status", ["processingStatus"])
    .index("by_user", ["userId"]),
});

