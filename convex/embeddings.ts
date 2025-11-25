import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { internalMutation, internalQuery } from "./_generated/server";

// Internal mutation: Store embedding (called by actions that generate embeddings)
export const storeEmbeddingInternal = internalMutation({
  args: {
    userId: v.id("users"),
    contentType: v.string(),
    contentChunk: v.string(),
    embeddingVector: v.array(v.float64()),
    relatedActivityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];

    return await ctx.db.insert("embeddings", {
      userId: args.userId,
      contentType: args.contentType,
      contentChunk: args.contentChunk,
      embeddingVector: args.embeddingVector,
      metadata: {
        date: today,
        relatedActivityId: args.relatedActivityId,
        confidence: 1.0,
      },
      createdAt: now,
    });
  },
});

// Internal query: Get all embeddings for a user
export const getAllEmbeddingsForUser = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("embeddings")
      .withIndex("by_user_content", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Internal query: Get embeddings by content type
export const getEmbeddingsByContentType = internalQuery({
  args: {
    userId: v.id("users"),
    contentType: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("embeddings")
      .withIndex("by_user_content", (q) =>
        q.eq("userId", args.userId).eq("contentType", args.contentType)
      )
      .order("desc")
      .take(args.limit || 10);
  },
});

// Internal query: Vector search for similar embeddings
export const vectorSearchEmbeddings = internalQuery({
  args: {
    userId: v.id("users"),
    queryVector: v.array(v.float64()),
    contentType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Use Convex's built-in vector search with vectorSearch method
    const results = await (ctx as any).vectorSearch("embeddings", "by_embedding", {
      vector: args.queryVector,
      limit: args.limit || 5,
      filter: (q: any) => q.eq("userId", args.userId),
    });

    // Fetch full documents
    const documents = await Promise.all(
      results.map(async (result: any) => {
        const doc = await ctx.db.get(result._id);
        return doc ? { ...doc, _score: result._score } : null;
      })
    );

    const validDocs = documents.filter((d): d is NonNullable<typeof d> => d !== null);

    if (args.contentType) {
      return validDocs.filter((e: Doc<"embeddings">) => e.contentType === args.contentType);
    }

    return validDocs;
  },
});
