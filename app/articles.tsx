import { AIBackground } from "@/components/ui/AIBackground";
import { AnimatedListItem, AnimatedSection } from "@/components/ui/AnimatedSection";
import { Card } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WiseColors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useAction, useQuery } from "convex/react";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ArticlesScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchArticlesAction = useAction(api.actions.articles.fetchAndCategorizeArticles);
  
  const allArticles = useQuery(
    api.articles.getArticles,
    selectedCategory === null ? { limit: 50 } : "skip"
  );
  
  const categoryArticles = useQuery(
    api.articles.getArticlesByCategory,
    selectedCategory !== null ? { category: selectedCategory, limit: 50 } : "skip"
  );
  
  const articles = selectedCategory ? categoryArticles : allArticles;

  const categories = [
    { id: "all", label: "All" },
    { id: "workout", label: "Workouts" },
    { id: "nutrition", label: "Nutrition" },
    { id: "mental_health", label: "Mental Health" },
    { id: "general", label: "General" },
  ];

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchArticlesAction({});
    } catch (error) {
      console.error("Failed to refresh articles:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchArticlesAction]);

  // Initial fetch if empty
  useEffect(() => {
    if (articles && articles.length === 0) {
      handleRefresh();
    }
  }, [articles, handleRefresh]);

  const openArticle = (url: string) => {
    Linking.openURL(url);
  };

  const renderArticle = ({ item, index }: { item: any; index: number }) => (
    <AnimatedListItem index={index}>
      <TouchableOpacity
        onPress={() => openArticle(item.url)}
        className="mb-4"
        activeOpacity={0.8}
      >
        <Card padding="none" className="overflow-hidden">
          {item.urlToImage && (
            <Image
              source={{ uri: item.urlToImage }}
              className="w-full h-48"
              resizeMode="cover"
            />
          )}
          <View className="p-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs font-sans-medium text-wise-primary uppercase">
                {item.category.replace("_", " ")}
              </Text>
              <Text className="text-xs font-sans text-wise-text-secondary">
                {new Date(item.publishedAt).toLocaleDateString()}
              </Text>
            </View>
            <Text className="text-lg font-archivo-bold text-wise-text mb-2 leading-6">
              {item.title}
            </Text>
            {item.description && (
              <Text
                className="text-sm font-sans text-wise-text-secondary leading-5"
                numberOfLines={3}
              >
                {item.description}
              </Text>
            )}
            <View className="flex-row justify-between items-center mt-3">
              <Text className="text-xs font-sans text-wise-text-tertiary">
                {item.source.name}
              </Text>
              <IconSymbol name="arrow.up.right" size={16} color={WiseColors.primary} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </AnimatedListItem>
  );

  return (
    <View className="flex-1 bg-wise-background">
      <Stack.Screen options={{ headerShown: false }} />
      <AIBackground className="flex-1">
        <Header
          title="Fitness Articles"
          subtitle="Latest health & wellness news"
          showAvatar={false}
          rightAction={
            <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing}>
              <IconSymbol
                name="arrow.clockwise"
                size={20}
                color={isRefreshing ? WiseColors.textSecondary : WiseColors.text}
              />
            </TouchableOpacity>
          }
        />

        {/* Categories */}
        <AnimatedSection index={0} className="px-6 mb-4">
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item.id === "all" ? null : item.id)}
                className={`mr-3 px-4 py-2 rounded-full border ${
                  (selectedCategory === item.id) || (selectedCategory === null && item.id === "all")
                    ? "bg-wise-primary border-wise-primary"
                    : "bg-transparent border-wise-border"
                }`}
              >
                <Text
                  className={`font-sans-medium text-sm ${
                    (selectedCategory === item.id) || (selectedCategory === null && item.id === "all")
                      ? "text-white"
                      : "text-wise-text-secondary"
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </AnimatedSection>

        {/* Articles List */}
        {articles === undefined ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={WiseColors.primary} />
          </View>
        ) : (
          <FlatList
            data={articles}
            renderItem={renderArticle}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <IconSymbol
                  name="doc.text.magnifyingglass"
                  size={48}
                  color={WiseColors.textSecondary}
                />
                <Text className="font-archivo-bold text-lg text-wise-text-secondary mt-4">
                  No articles found
                </Text>
                <Text className="font-sans text-sm text-wise-text-secondary text-center mt-2 px-8">
                  Try refreshing or checking back later for new content.
                </Text>
              </View>
            }
          />
        )}
      </AIBackground>
    </View>
  );
}
