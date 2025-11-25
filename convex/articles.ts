import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const getArticles = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    return await ctx.db
      .query("articles")
      .withIndex("by_publishedAt")
      .order("desc")
      .take(limit);
  },
});

export const getArticlesByCategory = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    return await ctx.db
      .query("articles")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .order("desc")
      .take(limit);
  },
});

export const saveArticles = internalMutation({
  args: {
    articles: v.array(v.object({
      title: v.string(),
      description: v.optional(v.string()),
      url: v.string(),
      urlToImage: v.optional(v.string()),
      content: v.optional(v.string()),
      author: v.optional(v.string()),
      publishedAt: v.string(),
      source: v.object({
        id: v.optional(v.string()),
        name: v.string(),
      }),
      category: v.string(),
      fetchedAt: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    for (const article of args.articles) {
      await ctx.db.insert("articles", {
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.urlToImage,
        content: article.content,
        author: article.author,
        publishedAt: article.publishedAt,
        source: article.source,
        category: article.category,
        fetchedAt: article.fetchedAt,
      });
    }
  },
});
