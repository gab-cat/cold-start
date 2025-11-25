import { GoalProgress } from "@/components/GoalProgress";
import { RecommendationCard } from "@/components/RecommendationCard";
import { StatCard } from "@/components/StatCard";
import { StreakBadge } from "@/components/StreakBadge";
import { AIBackground } from "@/components/ui/AIBackground";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WiseColors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

export default function DashboardScreen() {

  // Get current user from Convex
  const currentUser = useQuery(api.users.getCurrentUser);

  // Calculate local day boundaries (start and end of today in user's timezone)
  // This ensures stats reset at midnight local time
  const localDayBoundaries = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return {
      localDayStart: startOfDay.getTime(),
      localDayEnd: endOfDay.getTime(),
    };
  }, []);

  // Real-time queries - automatically update when data changes
  const todayStats = useQuery(
    api.dashboard.getToday,
    currentUser ? { 
      userId: currentUser._id,
      ...localDayBoundaries 
    } : "skip"
  );
  const weeklyStats = useQuery(
    api.dashboard.getWeekly,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const streaks = useQuery(
    api.dashboard.getStreaks,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const goals = useQuery(
    api.dashboard.getGoals,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  const recommendations = useQuery(
    api.recommendations.getRecentRecommendations,
    currentUser ? { userId: currentUser._id, limit: 3 } : "skip"
  );

  // AI Goals generation
  const [isGeneratingGoals, setIsGeneratingGoals] = useState(false);
  const generateAIGoalsMutation = useMutation(api.goals.generateAIGoals);

  const handleGenerateAIGoals = async () => {
    if (!currentUser) return;

    setIsGeneratingGoals(true);
    try {
      const result = await generateAIGoalsMutation({ userId: currentUser._id });
      if (!result.success) throw new Error(result.message);
      Alert.alert(
        "AI Goals Generated",
        `Successfully generated personalized goals based on your activity data!`
      );
    } catch (error) {
      console.error("Error generating AI goals:", error);
      Alert.alert("Error", "Failed to generate AI goals. Please try again.");
    } finally {
      setIsGeneratingGoals(false);
    }
  };

  if (!currentUser || !todayStats || !weeklyStats) {
    return (
      <View className="flex-1 justify-center items-center bg-wise-background">
        <ActivityIndicator size="large" color={WiseColors.primary} />
        <Text className="mt-4 font-sans-medium text-base text-wise-text-secondary">
          Loading your dashboard...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-wise-background">
      <AIBackground className="flex-1">
        <Header />
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Featured Stat - Steps */}
          <View className="px-4 -mb-2">
            <StatCard
              label="Daily Steps"
              value={todayStats.steps}
              target={todayStats.stepGoal}
              unit="steps"
              color={WiseColors.primary}
            />
          </View>

          {/* Quick Stats Grid */}
          <View className="px-4 mb-2">
            <View className="flex-row gap-2">
              <StatCard
                label="Workouts"
                value={todayStats.workoutCount}
                unit="done"
                color={WiseColors.accent}
              />
              <StatCard
                label="Water"
                value={todayStats.water}
                target={2000}
                unit="ml"
                color="#3B82F6"
              />
            </View>
            <View className="flex-row gap-2 -mt-2">
              <StatCard
                label="Sleep"
                value={todayStats.sleep}
                target={8}
                unit="hrs"
                color="#8B5CF6"
              />
              <StatCard
                label="Calories"
                value={todayStats.caloriesConsumed || 0}
                target={2000}
                unit="kcal"
                color="#F59E0B"
              />
            </View>
          </View>

          {/* Streaks */}
          {streaks && streaks.length > 0 && (
            <View className="mb-8">
              <Text className="font-archivo-bold text-xl text-wise-text mb-4 px-4">
                Active Streaks
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
              >
                {streaks.map((streak) => (
                  <View key={streak._id} className="w-[280px]">
                    <StreakBadge
                      streakType={streak.streakType}
                      currentCount={streak.currentCount}
                      maxCount={streak.maxCount}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Goals Progress */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-4 px-4">
              <Text className="font-archivo-bold text-xl text-wise-text">
                Your Goals
              </Text>
              <Button
                title="Generate AI Goals"
                onPress={handleGenerateAIGoals}
                variant="outline"
                size="sm"
                loading={isGeneratingGoals}
                disabled={isGeneratingGoals}
                className="px-3 py-1"
                icon={<IconSymbol name="bolt" size={16} color={WiseColors.primary} />}
              />
            </View>
            {goals && goals.length > 0 ? (
              <Card padding="lg" className="mx-4">
                {goals.map((goal) => (
                  <GoalProgress
                    key={goal._id}
                    milestone={goal.milestone}
                    currentProgress={goal.currentProgress}
                    goalValue={goal.goalValue}
                    goalUnit={goal.goalUnit}
                    createdBy={goal.createdBy as "ai" | "user"}
                    sourceData={goal.sourceData}
                  />
                ))}
              </Card>
            ) : (
              <Card padding="lg" className="mx-4">
                <Text className="font-sans text-base text-wise-text-secondary text-center py-4">
                  No goals set yet. Generate personalized AI goals or create your own goals.
                </Text>
              </Card>
            )}
          </View>

          {/* AI Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <View className="mb-8">
              <Text className="font-archivo-bold text-xl text-wise-text mb-4 px-4">
                AI Insights
              </Text>
              {recommendations.map((rec) => (
                <View key={rec._id} className="px-4">
                  <RecommendationCard
                    recommendation={rec}
                    onMarkAsRead={(id) => {
                      // TODO: Implement mark as read functionality
                      console.log('Mark as read:', id);
                    }}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Pro Tip */}
          <Card variant="outlined" className="mx-4 mb-8 bg-wise-subtle" padding="md">
            <Text className="font-sans text-sm text-wise-primary-dark leading-5">
              <Text className="text-base">💬 </Text>
              <Text className="font-sans-bold">Pro Tip: </Text>
              Log your activities via messenger for real-time coaching!
            </Text>
          </Card>
          
          <View className="h-10" />
        </ScrollView>
      </AIBackground>
    </View>
  );
}
