import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Generate an upload URL for client-side uploads
 * Use this when uploading directly from the app
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get the URL for a stored file by its storage ID
 * Returns null if the file doesn't exist
 */
export const getImageUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Get multiple image URLs at once for efficiency
 */
export const getImageUrls = query({
  args: {
    storageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const urls: Record<string, string | null> = {};
    
    await Promise.all(
      args.storageIds.map(async (id) => {
        urls[id] = await ctx.storage.getUrl(id);
      })
    );
    
    return urls;
  },
});

/**
 * Delete a stored file
 */
export const deleteFile = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
  },
});
