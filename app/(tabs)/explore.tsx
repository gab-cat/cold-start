import { AIBackground } from "@/components/ui/AIBackground";
import { Card } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WiseColors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import React, { useState } from "react";
import { ActivityIndicator, Image, Linking, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

const ARTICLE_CATEGORIES = [
  { id: "all", name: "All", icon: "list.bullet", color: WiseColors.primary },
  { id: "nutrition", name: "Nutrition", icon: "fork.knife", color: "#EF4444" },
  { id: "workout", name: "Workouts", icon: "figure.run", color: "#10B981" },
  { id: "mental_health", name: "Mental Health", icon: "brain.head.profile", color: "#8B5CF6" },
  { id: "general", name: "General", icon: "newspaper", color: "#6366F1" },
];

export default function ExploreScreen() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch articles from the database
  const allArticles = useQuery(api.articles.getArticles, { limit: 50 });
  const categoryArticles = useQuery(
    api.articles.getArticlesByCategory,
    selectedCategory !== "all" ? { category: selectedCategory, limit: 50 } : "skip"
  );

  // Use category-filtered articles if a category is selected, otherwise use all articles
  const articles = selectedCategory === "all" ? allArticles : categoryArticles;

  const filteredArticles = articles?.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (article.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesSearch;
  }) ?? [];

  const getCategoryColor = (categoryId: string) => {
    const category = ARTICLE_CATEGORIES.find(c => c.id === categoryId);
    return category?.color || WiseColors.primary;
  };

  const getCategoryName = (categoryId: string) => {
    const category = ARTICLE_CATEGORIES.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const getReadTime = (content?: string) => {
    if (!content) return "3 min read";
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  const handleArticlePress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View className="flex-1 bg-wise-background">
      <AIBackground className="flex-1">
        <Header title="Explore" subtitle="Fitness articles & tips" showAvatar={false} />
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Bar */}
          <View className="px-4 mb-6">
            <View className="flex-row items-center bg-wise-surface px-4 py-3 rounded-wise-lg shadow-sm">
              <IconSymbol name="magnifyingglass" size={20} color={WiseColors.textSecondary} />
              <TextInput 
                placeholder="Search articles..." 
                placeholderTextColor={WiseColors.textSecondary}
                className="flex-1 ml-3 font-sans text-base text-wise-text"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Categories */}
          <View className="mb-6">
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
            >
              {ARTICLE_CATEGORIES.map((cat) => (
                <TouchableOpacity 
                  key={cat.id} 
                  onPress={() => setSelectedCategory(cat.id)}
                  className={`flex-row items-center px-4 py-2 rounded-full ${
                    selectedCategory === cat.id ? "bg-wise-primary" : "bg-wise-surface"
                  }`}
                >
                  <IconSymbol 
                    name={cat.icon as any} 
                    size={16} 
                    color={selectedCategory === cat.id ? WiseColors.surface : cat.color} 
                  />
                  <Text className={`font-sans-medium text-sm ml-2 ${
                    selectedCategory === cat.id ? "text-wise-surface" : "text-wise-text"
                  }`}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Articles */}
          <View className="px-4">
            <Text className="font-archivo-bold text-xl text-wise-text mb-4">
              {selectedCategory === "all" ? "Latest Articles" : getCategoryName(selectedCategory)}
            </Text>

            {/* Loading State */}
            {articles === undefined && (
              <Card padding="lg">
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color={WiseColors.primary} />
                  <Text className="font-sans text-sm text-wise-text-secondary mt-4">
                    Loading articles...
                  </Text>
                </View>
              </Card>
            )}

            {/* Empty State */}
            {articles !== undefined && filteredArticles.length === 0 && (
              <Card padding="lg">
                <View className="items-center py-8">
                  <IconSymbol name="magnifyingglass" size={48} color={WiseColors.textSecondary} />
                  <Text className="font-archivo-bold text-lg text-wise-text-secondary mt-4">
                    No articles found
                  </Text>
                  <Text className="font-sans text-sm text-wise-text-secondary text-center mt-2">
                    Try adjusting your search or category filter.
                  </Text>
                </View>
              </Card>
            )}

            {/* Articles List */}
            {articles !== undefined && filteredArticles.length > 0 && (
              filteredArticles.map((article) => (
                <TouchableOpacity 
                  key={article._id} 
                  activeOpacity={0.9}
                  onPress={() => handleArticlePress(article.url)}
                >
                  <Card className="mb-4 overflow-hidden" padding="none">
                    {article.urlToImage && (
                      <Image 
                        source={{ uri: article.urlToImage }} 
                        className="w-full h-40"
                        resizeMode="cover"
                      />
                    )}
                    <View className="p-4">
                      <View className="flex-row items-center mb-2">
                        <View 
                          className="px-2 py-1 rounded-full mr-2"
                          style={{ backgroundColor: getCategoryColor(article.category) + "20" }}
                        >
                          <Text 
                            className="font-sans-medium text-xs"
                            style={{ color: getCategoryColor(article.category) }}
                          >
                            {getCategoryName(article.category)}
                          </Text>
                        </View>
                        <Text className="font-sans text-xs text-wise-text-secondary">
                          {getReadTime(article.content)}
                        </Text>
                        {article.source?.name && (
                          <Text className="font-sans text-xs text-wise-text-secondary ml-2">
                            • {article.source.name}
                          </Text>
                        )}
                      </View>
                      <Text className="font-archivo-bold text-lg text-wise-text mb-2">
                        {article.title}
                      </Text>
                      {article.description && (
                        <Text className="font-sans text-sm text-wise-text-secondary leading-5" numberOfLines={3}>
                          {article.description}
                        </Text>
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View className="h-10" />
        </ScrollView>
      </AIBackground>
    </View>
  );
}
