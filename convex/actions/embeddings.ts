"use node";

import { GoogleGenAI } from "@google/genai";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { action, internalAction } from "../_generated/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Generate embedding for text using GoogleGenAI
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const embeddingResult = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: [{ parts: [{ text }] }],
    });
    return embeddingResult.embeddings?.[0]?.values || [];
  } catch (error) {
    console.error("Error generating embedding:", error);
    return [];
  }
}

// Public action: Store an embedding for RAG
export const storeEmbedding = action({
  args: {
    userId: v.id("users"),
    contentType: v.string(),
    contentChunk: v.string(),
    relatedActivityId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"embeddings"> | null> => {
    // Generate embedding using Gemini
    const embeddingVector = await generateEmbedding(args.contentChunk);
    
    if (embeddingVector.length === 0) {
      console.error("Failed to generate embedding");
      return null;
    }

    // Store via internal mutation
    return await ctx.runMutation(internal.embeddings.storeEmbeddingInternal, {
      userId: args.userId,
      contentType: args.contentType,
      contentChunk: args.contentChunk,
      embeddingVector,
      relatedActivityId: args.relatedActivityId,
    });
  },
});

// Internal action: Store embedding (for use by other internal actions)
export const storeEmbeddingAction = internalAction({
  args: {
    userId: v.id("users"),
    contentType: v.string(),
    contentChunk: v.string(),
    relatedActivityId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"embeddings"> | null> => {
    // Generate embedding using Gemini
    const embeddingVector = await generateEmbedding(args.contentChunk);
    
    if (embeddingVector.length === 0) {
      console.error("Failed to generate embedding");
      return null;
    }

    // Store via internal mutation
    return await ctx.runMutation(internal.embeddings.storeEmbeddingInternal, {
      userId: args.userId,
      contentType: args.contentType,
      contentChunk: args.contentChunk,
      embeddingVector,
      relatedActivityId: args.relatedActivityId,
    });
  },
});

// Action: Query similar embeddings using vector search
export const querySimilarEmbeddings = action({
  args: {
    userId: v.id("users"),
    queryText: v.string(),
    contentType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{contentChunk: string; contentType: string; metadata: { date: string; relatedActivityId?: string; confidence: number }}[]> => {
    // Generate embedding for query
    const queryVector = await generateEmbedding(args.queryText);

    if (queryVector.length === 0) {
      console.error("Failed to generate query embedding");
      return [];
    }

    // Use vector search via internal query
    const results: any = await ctx.runQuery(internal.embeddings.vectorSearchEmbeddings, {
      userId: args.userId,
      queryVector,
      contentType: args.contentType,
      limit: args.limit,
    });

    return results.map((e: { contentChunk: string; contentType: string; metadata: { date: string; relatedActivityId?: string; confidence: number } }) => ({
      contentChunk: e.contentChunk,
      contentType: e.contentType,
      metadata: e.metadata,
    }));
  },
});

