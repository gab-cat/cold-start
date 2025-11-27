import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============ CORE USER DATA ============
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    displayName: v.string(),
    uniqueCode: v.string(), // Unique code for Messenger linking
    messengerPsid: v.optional(v.string()), // Facebook Page-Scoped ID
    healthProfile: v.object({
      age: v.optional(v.number()),
      gender: v.optional(v.string()),
      fitnessLevel: v.optional(v.string()), // 'beginner' | 'intermediate' | 'advanced'
      goals: v.optional(v.array(v.string())), // ['lose_weight', 'build_strength', 'improve_endurance']
      injuries: v.optional(v.string()),
      underlyingConditions: v.optional(v.string()),
      height: v.optional(v.number()), // Height in cm
      weight: v.optional(v.number()), // Weight in kg
      dailyCalorieGoal: v.optional(v.number()), // Daily calorie target (default 2000)
      dailyWaterGoal: v.optional(v.number()), // Daily water target in ml (default 2000)
      dailySleepGoal: v.optional(v.number()), // Daily sleep target in hours (default 8)
    }),
    preferences: v.object({
      preferredTimezone: v.optional(v.string()),
      preferredActivities: v.optional(v.array(v.string())),
      notificationTypes: v.optional(v.array(v.string())), // ['push'] | ['messenger'] | ['push', 'messenger'] | []
      language: v.optional(v.string()), // 'en' | 'tl' (Tagalog Phase 2)
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_unique_code", ["uniqueCode"])
    .index("by_messenger_psid", ["messengerPsid"]),

  // ============ ACTIVITY TRACKING ============
  activities: defineTable({
    userId: v.id("users"),
    // Activity type categories:
    // Exercise: 'workout' | 'walk' | 'run' | 'cycle' | 'swim' | 'yoga' | 'gym' | 'meditation' | 'stretch'
    // Wellness: 'sleep' | 'hydration' | 'meal' | 'weight_check'
    // Leisure: 'gaming' | 'computer' | 'reading' | 'tv' | 'music' | 'social' | 'hobby' | 'leisure'
    // Errands/Tasks: 'errand' | 'task' | 'shopping' | 'study'
    activityType: v.string(),
    activityName: v.string(), // 'Morning run', '8-hour sleep', '2L water', 'Gaming session', 'Weight Check', etc
    durationMinutes: v.optional(v.number()),
    distanceKm: v.optional(v.number()),
    caloriesBurned: v.optional(v.number()),
    caloriesConsumed: v.optional(v.number()), // For meal activities (separate from burned)
    intensity: v.optional(v.string()), // 'light' | 'moderate' | 'vigorous'
    hydrationMl: v.optional(v.number()),
    sleepHours: v.optional(v.number()),
    sleepQuality: v.optional(v.string()), // 'poor' | 'fair' | 'good' | 'excellent'
    mealType: v.optional(v.string()), // 'breakfast' | 'lunch' | 'dinner' | 'snack'
    mealDescription: v.optional(v.string()), // "Grilled chicken with rice"
    // Weight tracking fields
    weightKg: v.optional(v.number()), // Current weight measurement
    weightChange: v.optional(v.number()), // Weight change since last measurement (negative for loss)
    previousWeightKg: v.optional(v.number()), // Previous weight for reference
    // Leisure activity metrics
    screenTimeMinutes: v.optional(v.number()), // For gaming, computer, tv activities
    pagesRead: v.optional(v.number()), // For reading activities
    socialInteractions: v.optional(v.number()), // For social activities
    timeStarted: v.optional(v.number()), // When activity actually started
    timeEnded: v.optional(v.number()), // When activity actually ended
    mood: v.optional(v.string()), // 'bad' | 'neutral' | 'good' | 'excellent'
    // Image storage for meal photos
    imageId: v.optional(v.id("_storage")), // Convex file storage ID for compressed image
    originalImageUrl: v.optional(v.string()), // Original source URL (may expire)
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
    goalType: v.string(), // 'steps_daily' | 'workouts_weekly' | 'weight_loss' | 'sleep_target' | 'hydration_daily' | 'height_target'
    goalValue: v.number(), // 10000 steps, 3 workouts, 8 hours sleep, etc
    goalUnit: v.string(), // 'steps' | 'workouts' | 'kg' | 'hours' | 'ml' | 'cm'
    currentProgress: v.number(),
    targetDate: v.optional(v.string()), // 'YYYY-MM-DD'
    status: v.string(), // 'active' | 'completed' | 'paused'
    milestone: v.string(), // "Consistent 30-min walks for 3 weeks"
    aiAdjustable: v.boolean(), // Whether agent can auto-adjust this goal
    createdBy: v.string(), // 'user' | 'ai' - who created this goal
    sourceData: v.optional(v.object({
      reasoning: v.string(), // AI reasoning for goal creation
      basedOn: v.array(v.string()), // What data influenced the goal ('profile', 'activities', 'streaks', etc.)
      confidence: v.number(), // 0-1 confidence score
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_status", ["userId", "status"]),

  // ============ EMBEDDINGS CACHE (For RAG) ============
  embeddings: defineTable({
    userId: v.id("users"),
    contentType: v.string(), // 'activity_summary' | 'goal_context' | 'health_note' | 'preference' | 'profile_update' | 'goal_generation_context'
    contentChunk: v.string(), // Text to embed (limited size)
    embeddingVector: v.array(v.float64()), // Vector from Gemini (text-embedding-004 = 768 dimensions)
    metadata: v.object({
      date: v.string(),
      relatedActivityId: v.optional(v.string()),
      relatedGoalId: v.optional(v.string()),
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
        result: v.optional(v.any()), // Result from successful mutation (e.g., document ID)
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

  // ============ PROCESSED MESSAGE IDS (For deduplication) ============
  processedMessageIds: defineTable({
    messageId: v.string(), // Facebook message mid
    senderPsid: v.string(), // Sender's PSID for context
    processedAt: v.number(),
  })
    .index("by_message_id", ["messageId"])
    .index("by_processed_at", ["processedAt"]),

  // ============ AI RECOMMENDATIONS ============
  recommendations: defineTable({
    userId: v.id("users"),
    type: v.string(), // 'daily_insight' | 'weekly_recommendation' | 'goal_suggestion'
    title: v.string(),
    content: v.string(),
    generatedAt: v.number(),
    readAt: v.optional(v.number()),
    metadata: v.any(), // AI reasoning, related activities, etc.
  })
    .index("by_user_recent", ["userId", "generatedAt"])
    .index("by_user_unread", ["userId", "readAt"]),

  // ============ ARTICLES ============
  articles: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    url: v.string(),
    urlToImage: v.optional(v.string()),
    content: v.optional(v.string()),
    author: v.optional(v.string()),
    publishedAt: v.string(), // ISO date string
    source: v.object({
      id: v.optional(v.string()),
      name: v.string(),
    }),
    category: v.string(), // 'workout', 'nutrition', 'mental_health', 'general'
    fetchedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_publishedAt", ["publishedAt"]),

  // ============ DAILY STATS (Pre-computed for performance) ============
  dailyStats: defineTable({
    userId: v.id("users"),
    date: v.string(), // 'YYYY-MM-DD' format
    // Steps & Activity
    steps: v.number(),
    workoutCount: v.number(),
    workoutMinutes: v.number(),
    // Calories
    caloriesConsumed: v.number(),
    caloriesBurned: v.number(),
    netCalories: v.number(), // consumed - burned
    // Meal breakdown
    caloriesBreakfast: v.number(),
    caloriesLunch: v.number(),
    caloriesDinner: v.number(),
    caloriesSnacks: v.number(),
    // Wellness
    hydrationMl: v.number(),
    sleepHours: v.number(),
    sleepQuality: v.optional(v.string()),
    // Leisure & Screen time
    leisureMinutes: v.number(),
    screenTimeMinutes: v.number(),
    // Totals
    totalActivities: v.number(),
    // Metadata
    lastUpdatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user_recent", ["userId", "lastUpdatedAt"]),
});

