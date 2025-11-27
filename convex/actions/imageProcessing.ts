"use node";

import { v } from "convex/values";
import { Jimp } from "jimp";
import { internalAction } from "../_generated/server";

// Target max file size after compression (500KB)
const MAX_FILE_SIZE_BYTES = 500 * 1024;
// Max dimensions for resizing
const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;

export interface ImageProcessingResult {
  success: boolean;
  storageId?: string;
  format: "jpeg" | "png" | "original";
  sizeBytes?: number;
  error?: string;
}

/**
 * Download an image from a URL, compress it using Jimp,
 * and store it in Convex file storage.
 * 
 * Compression strategy:
 * 1. Resize to max dimensions while maintaining aspect ratio
 * 2. Compress as JPEG with quality adjustment
 * 3. If still too large, reduce quality further
 * 4. Store original if all compression fails
 */
export const processAndStoreImage = internalAction({
  args: {
    imageUrl: v.string(),
  },
  handler: async (ctx, args): Promise<ImageProcessingResult> => {
    try {
      // Step 1: Download and load the image with Jimp
      console.log(`Fetching image from: ${args.imageUrl}`);
      
      const response = await fetch(args.imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const originalBuffer = Buffer.from(arrayBuffer);
      const originalSize = originalBuffer.length;

      console.log(`Downloaded image: ${originalSize} bytes`);

      // Step 2: Load image with Jimp
      const image = await Jimp.read(originalBuffer);
      
      // Step 3: Crop to square (center anchor) and resize
      const { width, height } = image;
      
      // Crop to square from center
      const squareSize = Math.min(width, height);
      const cropX = Math.round((width - squareSize) / 2);
      const cropY = Math.round((height - squareSize) / 2);
      image.crop({ x: cropX, y: cropY, w: squareSize, h: squareSize });
      console.log(`Cropped to square: ${squareSize}x${squareSize} from center`);
      
      // Resize if needed
      const targetSize = Math.min(MAX_WIDTH, MAX_HEIGHT);
      if (squareSize > targetSize) {
        image.resize({ w: targetSize, h: targetSize });
        console.log(`Resized to ${targetSize}x${targetSize}`);
      }

      // Step 4: Compress as JPEG
      let format: "jpeg" | "png" | "original" = "jpeg";
      let quality = 75;
      let compressedBuffer = await image.getBuffer("image/jpeg", { quality });

      console.log(`JPEG compressed (quality ${quality}): ${compressedBuffer.length} bytes`);

      // If still too large, try lower quality
      if (compressedBuffer.length > MAX_FILE_SIZE_BYTES && quality > 40) {
        quality = 50;
        compressedBuffer = await image.getBuffer("image/jpeg", { quality });
        console.log(`JPEG re-compressed (quality ${quality}): ${compressedBuffer.length} bytes`);
      }

      // If still too large, try even lower quality
      if (compressedBuffer.length > MAX_FILE_SIZE_BYTES && quality > 30) {
        quality = 35;
        compressedBuffer = await image.getBuffer("image/jpeg", { quality });
        console.log(`JPEG re-compressed (quality ${quality}): ${compressedBuffer.length} bytes`);
      }

      // Step 5: Upload to Convex storage
      const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
      const uint8Array = new Uint8Array(compressedBuffer);
      const blob = new Blob([uint8Array], { type: mimeType });
      const storageId = await ctx.storage.store(blob);

      console.log(`Stored image: ${storageId} (${format}, ${compressedBuffer.length} bytes)`);

      return {
        success: true,
        storageId,
        format,
        sizeBytes: compressedBuffer.length,
      };
    } catch (error: any) {
      console.error("Error processing image:", error);
      return {
        success: false,
        format: "original",
        error: error.message || String(error),
      };
    }
  },
});
