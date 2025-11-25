"use node";

import { GoogleGenAI } from "@google/genai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";

interface UserContext {
  semanticContext: string;
  recentActivities: Doc<"activities">[];
  userGoals: Doc<"userGoals">[];
  userStreaks: Doc<"userStreaks">[];
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Internal action for RAG retrieval (needs Node.js for embedding generation)
export const retrieveUserContext = internalAction({
  args: {
    userId: v.id("users"),
    userQuery: v.string(),
  },
  handler: async (ctx, args): Promise<UserContext> => {
    // 1. Generate embedding for user query
    let queryVector: number[] = [];
    try {
      const embeddingResult = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: [{ parts: [{ text: args.userQuery }] }],
      });
      queryVector = embeddingResult.embeddings?.[0]?.values || [];
    } catch (error) {
      console.error("Error generating embedding:", error);
      // Fallback: use empty vector
    }

    // 2. Retrieve similar embeddings from database (RAG)
    const allEmbeddings: Doc<"embeddings">[] = await ctx.runQuery(internal.embeddings.getAllEmbeddingsForUser, {
      userId: args.userId,
    });

    // Simple cosine similarity search
    const scored = allEmbeddings.map((emb: Doc<"embeddings">) => ({
      ...emb,
      similarity: cosineSimilarity(queryVector, emb.embeddingVector),
    }));

    const topMatches = scored
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, 5); // Top 5 similar contexts

    // 3. Gather additional context from database
    const recentActivities: Doc<"activities">[] = await ctx.runQuery(internal.activities.getRecentActivitiesInternal, {
      userId: args.userId,
      limit: 10,
    });

    const userGoals: Doc<"userGoals">[] = await ctx.runQuery(internal.goals.getUserGoalsInternal, {
      userId: args.userId,
      status: "active",
    });

    const userStreaks: Doc<"userStreaks">[] = await ctx.runQuery(internal.streaks.getUserStreaksInternal, {
      userId: args.userId,
    });

    return {
      semanticContext: topMatches.map((m) => m.contentChunk).join("\n"),
      recentActivities,
      userGoals,
      userStreaks,
    };
  },
});

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length === 0 || vecB.length === 0) return 0;
  if (vecA.length !== vecB.length) return 0;

  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  if (magnA === 0 || magnB === 0) return 0;
  return dotProduct / (magnA * magnB);
}
