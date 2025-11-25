"use node";

import { internal } from "../_generated/api";
import { action } from "../_generated/server";


export const fetchAndCategorizeArticles = action({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      console.error("NEWS_API_KEY is not set");
      return;
    }

    const query = "fitness OR workout OR nutrition OR mental health OR wellness";
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      query
    )}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "ok") {
        console.error("NewsAPI error:", data.message);
        return;
      }

      const articles = data.articles.map((article: any) => {
        // Infer category
        let category = "general";
        const text = (article.title + " " + (article.description || "")).toLowerCase();

        if (text.includes("workout") || text.includes("exercise") || text.includes("gym") || text.includes("muscle")) {
          category = "workout";
        } else if (text.includes("nutrition") || text.includes("diet") || text.includes("food") || text.includes("recipe")) {
          category = "nutrition";
        } else if (text.includes("mental") || text.includes("stress") || text.includes("meditation") || text.includes("mindfulness")) {
          category = "mental_health";
        }

        return {
          title: article.title,
          description: article.description || undefined,
          url: article.url,
          urlToImage: article.urlToImage || undefined,
          content: article.content || undefined,
          author: article.author || undefined,
          publishedAt: article.publishedAt,
          source: {
            id: article.source.id || undefined,
            name: article.source.name,
          },
          category,
          fetchedAt: Date.now(),
        };
      });

      await ctx.runMutation(internal.articles.saveArticles, {
        articles,
      });
    } catch (error) {
      console.error("Failed to fetch articles:", error);
    }
  },
});
