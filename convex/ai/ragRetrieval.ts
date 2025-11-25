"use node";

import { GoogleGenAI } from "@google/genai";
import { Doc } from "../_generated/dataModel";
import { QueryCtx } from "../_generated/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export interface UserContext {
  semanticContext: string;
  recentActivities: any[];
  userGoals: any[];
  userStreaks: any[];
}

export async function retrieveUserContext(
  ctx: QueryCtx,
  userId: string,
  userQuery: string
): Promise<UserContext> {
  // 1. Generate embedding for user query
  let queryVector: number[] = [];
  try {
    const embeddingResult = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: [{ parts: [{ text: userQuery }] }],
    });
    queryVector = embeddingResult.embeddings?.[0]?.values || [];
  } catch (error) {
    console.error("Error generating embedding:", error);
    // Fallback: use empty vector
  }

  // 2. Retrieve similar embeddings from database (RAG)
  const allEmbeddings = await ctx.db
    .query("embeddings")
    .withIndex("by_user_content", (q: any) => q.eq("userId", userId as any))
    .collect();

  // Simple cosine similarity search
  const scored = allEmbeddings.map((emb: Doc<"embeddings">) => ({
    ...emb,
    similarity: cosineSimilarity(queryVector, emb.embeddingVector),
  }));

  const topMatches = scored
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, 5); // Top 5 similar contexts

  // 3. Gather additional context from database
  const recentActivities = await ctx.db
    .query("activities")
    .withIndex("by_user_date", (q: any) => q.eq("userId", userId as any))
    .order("desc")
    .take(10);

  const userGoals = await ctx.db
    .query("userGoals")
    .withIndex("by_user_status", (q: any) =>
      q.eq("userId", userId as any).eq("status", "active")
    )
    .collect();

  const userStreaks = await ctx.db
    .query("userStreaks")
    .withIndex("by_user", (q: any) => q.eq("userId", userId as any))
    .collect();

  return {
    semanticContext: topMatches.map((m: any) => m.contentChunk).join("\n"),
    recentActivities: recentActivities.map((a: Doc<"activities">) => ({
      ...a,
      _id: a._id.toString(),
    })),
    userGoals: userGoals.map((g: Doc<"userGoals">) => ({
      ...g,
      _id: g._id.toString(),
    })),
    userStreaks: userStreaks.map((s: Doc<"userStreaks">) => ({
      ...s,
      _id: s._id.toString(),
    })),
  };
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length === 0 || vecB.length === 0) return 0;
  if (vecA.length !== vecB.length) return 0;

  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  if (magnA === 0 || magnB === 0) return 0;
  return dotProduct / (magnA * magnB);
}

