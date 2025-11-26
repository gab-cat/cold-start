"use node";

import { GoogleGenAI } from "@google/genai";
import { v } from "convex/values";
import { action } from "../_generated/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export interface FoodCalorieInfo {
  foodName: string;
  caloriesPerServing: number;
  servingSize: string;
  source: string;
  confidence: number;
}

// Search for food calorie information using Google Search grounding
export const searchFoodCalories = action({
  args: {
    foodName: v.string(),
    servingSize: v.optional(v.string()),
  },
  handler: async (_, args): Promise<FoodCalorieInfo | null> => {
    try {
      const query = `${args.foodName} calories per serving${args.servingSize ? ` ${args.servingSize}` : ""}`;

      // Step 1: Search with Google grounding (no JSON mode - incompatible)
      const searchResult = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            parts: [
              {
                text: `Search for accurate calorie information for: ${query}. Find data from nutrition websites, USDA, or reputable sources. Focus on calories per serving and serving size. Provide the food name, calories per serving as a number, serving size, and source.`,
              },
            ],
          },
        ],
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const searchText = searchResult.text;
      if (!searchText) {
        console.error("Empty response from Google Search API");
        return null;
      }

      // Step 2: Parse the search result into structured JSON
      const parseResult = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            parts: [
              {
                text: `Extract calorie information from this text and return as JSON:

${searchText}

Return JSON with: foodName (string), caloriesPerServing (number), servingSize (string), source (string), confidence (number 0-1).`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: {
            type: "object",
            properties: {
              foodName: { type: "string" },
              caloriesPerServing: { type: "number" },
              servingSize: { type: "string" },
              source: { type: "string" },
              confidence: { type: "number" },
            },
            required: [
              "foodName",
              "caloriesPerServing",
              "servingSize",
              "source",
              "confidence",
            ],
          },
        },
      });

      const responseText = parseResult.text;
      if (!responseText) {
        console.error("Empty response from parsing step");
        return null;
      }

      const parsedResult = JSON.parse(responseText);

      // Validate the response has the expected structure
      if (
        !parsedResult.foodName ||
        typeof parsedResult.caloriesPerServing !== "number"
      ) {
        console.error(
          "Invalid response structure from Google Search API:",
          parsedResult
        );
        return null;
      }

      return parsedResult as FoodCalorieInfo;
    } catch (error) {
      console.error("Error searching for food calories:", error);
      return null;
    }
  },
});

// Helper function to extract calories from meal description
export function extractFoodItemsFromMeal(mealDescription: string): string[] {
  // Simple extraction - split by common separators and clean up
  const separators = /[,&+and]+/;
  const foods = mealDescription
    .split(separators)
    .map(item => item.trim().toLowerCase())
    .filter(item => item.length > 2) // Filter out very short items
    .map(item => {
      // Remove common adjectives and quantities
      return item.replace(/^\d+\s*(cups?|tbsp?|tsp?|oz|grams?|pieces?|slices?)\s*/i, "");
    });

  return foods.filter(food => food.length > 0);
}
