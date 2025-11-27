import { WiseColors } from "@/constants/theme";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Card } from "./ui/Card";
import { IconSymbol } from "./ui/icon-symbol";

interface Recommendation {
  _id: string;
  type: string;
  title: string;
  content: string;
  generatedAt: number;
  readAt?: number;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  onMarkAsRead?: (id: string) => void;
}

const getRecommendationIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    daily_insight: "lightbulb",
    weekly_recommendation: "calendar",
    goal_suggestion: "target",
  };

  return iconMap[type] || "star";
};

const getRecommendationColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    daily_insight: WiseColors.primary,
    weekly_recommendation: "#8B5CF6",
    goal_suggestion: "#F59E0B",
  };

  return colorMap[type] || WiseColors.primary;
};

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHours < 1) {
    return "Just now";
  } else if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`;
  } else if (diffDays < 7) {
    return `${Math.floor(diffDays)}d ago`;
  } else {
    return new Date(timestamp).toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });
  }
};

export function RecommendationCard({ recommendation, onMarkAsRead }: RecommendationCardProps) {
  const icon = getRecommendationIcon(recommendation.type);
  const color = getRecommendationColor(recommendation.type);
  const isUnread = !recommendation.readAt;

  const handleMarkAsRead = () => {
    if (onMarkAsRead && isUnread) {
      onMarkAsRead(recommendation._id);
    }
  };

  return (
    <Card
      className={`mb-3 ${isUnread ? 'border-l-4 border-wise-primary' : ''}`}
      padding="md"
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: `${color}20` }}
          >
            <IconSymbol name={icon as keyof typeof IconSymbol} size={16} color={color} />
          </View>
          <View className="flex-1">
            <Text className="font-archivo-bold text-base text-wise-text">
              {recommendation.title}
            </Text>
            <Text className="font-sans text-xs text-wise-text-secondary capitalize">
              {recommendation.type.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {isUnread && (
          <View className="w-2 h-2 rounded-full bg-wise-primary" />
        )}
      </View>

      {/* Content */}
      <Text className="font-sans text-sm text-wise-text-secondary leading-5 mb-3">
        {recommendation.content}
      </Text>

      {/* Footer */}
      <View className="flex-row items-center justify-between">
        <Text className="font-sans text-xs text-wise-text-secondary">
          {formatRelativeTime(recommendation.generatedAt)}
        </Text>

        {isUnread && onMarkAsRead && (
          <TouchableOpacity
            onPress={handleMarkAsRead}
            className="flex-row items-center"
          >
            <Text className="font-sans-medium text-xs text-wise-primary mr-1">
              Mark as read
            </Text>
            <IconSymbol name="checkmark" size={12} color={WiseColors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}
