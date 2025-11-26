import { GoalProgress } from "@/components/GoalProgress";
import { RecommendationCard } from "@/components/RecommendationCard";
import { StatCard } from "@/components/StatCard";
import { StreakBadge } from "@/components/StreakBadge";
import { AIBackground } from "@/components/ui/AIBackground";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { TextInput } from "@/components/ui/TextInput";
import { WiseColors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Keyboard, ScrollView, Text, TouchableWithoutFeedback, View } from "react-native";

// BMI calculation helper
const calculateBMI = (weightKg: number, heightCm: number): number => {
  if (weightKg <= 0 || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};

// BMI category helper
const getBMICategory = (bmi: number): { label: string; color: string } => {
  if (bmi < 18.5) return { label: "Underweight", color: "#3B82F6" };
  if (bmi < 25) return { label: "Normal", color: "#10B981" };
  if (bmi < 30) return { label: "Overweight", color: "#F59E0B" };
  return { label: "Obese", color: "#EF4444" };
};

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

  // Weight goal query
  const weightGoal = useQuery(
    api.goals.getWeightGoal,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  // AI Goals generation
  const [isGeneratingGoals, setIsGeneratingGoals] = useState(false);
  const generateAIGoalsMutation = useMutation(api.goals.generateAIGoals);

  // Body Goals edit state
  const [isEditingBodyGoals, setIsEditingBodyGoals] = useState(false);
  const [isSavingBodyGoals, setIsSavingBodyGoals] = useState(false);
  const [bodyGoalsForm, setBodyGoalsForm] = useState({
    height: "",
    weight: "",
    targetWeight: "",
  });

  // Mutations for body goals
  const updateProfileMutation = useMutation(api.users.updateCurrentUserProfile);
  const upsertWeightGoalMutation = useMutation(api.goals.upsertWeightGoal);

  // Initialize form when entering edit mode
  const handleEditBodyGoals = () => {
    setBodyGoalsForm({
      height: currentUser?.healthProfile?.height?.toString() || "",
      weight: currentUser?.healthProfile?.weight?.toString() || "",
      targetWeight: weightGoal?.goalValue?.toString() || "",
    });
    setIsEditingBodyGoals(true);
  };

  // Save body goals
  const handleSaveBodyGoals = async () => {
    if (!currentUser) return;

    const height = parseFloat(bodyGoalsForm.height);
    const weight = parseFloat(bodyGoalsForm.weight);
    const targetWeight = parseFloat(bodyGoalsForm.targetWeight);

    // Validation
    if (bodyGoalsForm.height && (isNaN(height) || height < 50 || height > 300)) {
      Alert.alert("Invalid Height", "Please enter a valid height between 50-300 cm");
      return;
    }
    if (bodyGoalsForm.weight && (isNaN(weight) || weight < 20 || weight > 500)) {
      Alert.alert("Invalid Weight", "Please enter a valid weight between 20-500 kg");
      return;
    }
    if (bodyGoalsForm.targetWeight && (isNaN(targetWeight) || targetWeight < 20 || targetWeight > 500)) {
      Alert.alert("Invalid Target Weight", "Please enter a valid target weight between 20-500 kg");
      return;
    }

    setIsSavingBodyGoals(true);
    try {
      // Update profile with height and weight
      await updateProfileMutation({
        healthProfile: {
          ...(bodyGoalsForm.height ? { height } : {}),
          ...(bodyGoalsForm.weight ? { weight } : {}),
        },
      });

      // Upsert weight goal if target weight is provided
      if (bodyGoalsForm.targetWeight && bodyGoalsForm.weight) {
        await upsertWeightGoalMutation({
          userId: currentUser._id,
          targetWeight,
          currentWeight: weight,
        });
      }

      setIsEditingBodyGoals(false);
      Alert.alert("Success", "Body goals updated successfully!");
    } catch (error) {
      console.error("Error saving body goals:", error);
      Alert.alert("Error", "Failed to save body goals. Please try again.");
    } finally {
      setIsSavingBodyGoals(false);
    }
  };

  const handleCancelBodyGoalsEdit = () => {
    setIsEditingBodyGoals(false);
    setBodyGoalsForm({ height: "", weight: "", targetWeight: "" });
  };

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
                target={todayStats.waterGoal || 2000}
                unit="ml"
                color="#3B82F6"
              />
            </View>
            <View className="flex-row gap-2 -mt-2">
              <StatCard
                label="Sleep"
                value={todayStats.sleep}
                target={todayStats.sleepGoal || 8}
                unit="hrs"
                color="#8B5CF6"
              />
              <StatCard
                label="Net Calories"
                value={todayStats.netCalories || 0}
                target={todayStats.calorieGoal || 2000}
                unit="kcal"
                color="#F59E0B"
                icon={
                  <View className="flex-row items-center ml-1">
                    <Text className="font-sans text-xs text-wise-text-secondary">
                      {todayStats.caloriesConsumed || 0} in / {todayStats.caloriesBurned || 0} out
                    </Text>
                  </View>
                }
              />
            </View>
          </View>

          {/* Body Goals Section */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-4 px-4">
              <Text className="font-archivo-bold text-xl text-wise-text">
                Body Goals
              </Text>
              {!isEditingBodyGoals && (
                <Button
                  title="Edit"
                  onPress={handleEditBodyGoals}
                  variant="outline"
                  size="sm"
                  className="px-3 py-1"
                  icon={<IconSymbol name="pencil" size={14} color={WiseColors.primary} />}
                />
              )}
            </View>
            
            <Card padding="lg" className="mx-4">
              {isEditingBodyGoals ? (
                // Edit Mode
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View>
                    <View className="flex-row gap-4 mb-4">
                      <View className="flex-1">
                        <TextInput
                          label="Height (cm)"
                          value={bodyGoalsForm.height}
                          onChangeText={(value) => setBodyGoalsForm(prev => ({ ...prev, height: value }))}
                          placeholder="170"
                          keyboardType="numeric"
                        />
                      </View>
                      <View className="flex-1">
                        <TextInput
                          label="Current Weight (kg)"
                          value={bodyGoalsForm.weight}
                          onChangeText={(value) => setBodyGoalsForm(prev => ({ ...prev, weight: value }))}
                          placeholder="70"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                    
                    <View className="mb-4">
                      <TextInput
                        label="Target Weight (kg)"
                        value={bodyGoalsForm.targetWeight}
                        onChangeText={(value) => setBodyGoalsForm(prev => ({ ...prev, targetWeight: value }))}
                        placeholder="65"
                        keyboardType="numeric"
                      />
                    </View>
                    
                    {/* BMI Preview */}
                    {bodyGoalsForm.height && bodyGoalsForm.weight && (
                      <View className="bg-wise-subtle rounded-wise-md p-3 mb-4">
                        <Text className="font-sans text-sm text-wise-text-secondary mb-1">
                          Preview BMI
                        </Text>
                        {(() => {
                          const previewBMI = calculateBMI(
                            parseFloat(bodyGoalsForm.weight) || 0,
                            parseFloat(bodyGoalsForm.height) || 0
                          );
                          const category = getBMICategory(previewBMI);
                          return (
                            <View className="flex-row items-center">
                              <Text className="font-archivo-bold text-xl text-wise-text">
                                {previewBMI.toFixed(1)}
                              </Text>
                              <View 
                                className="ml-2 px-2 py-1 rounded-full"
                                style={{ backgroundColor: `${category.color}20` }}
                              >
                                <Text 
                                  className="font-sans-medium text-xs"
                                  style={{ color: category.color }}
                                >
                                  {category.label}
                                </Text>
                              </View>
                            </View>
                          );
                        })()}
                      </View>
                    )}
                    
                    <View className="flex-row gap-3">
                      <Button
                        title="Cancel"
                        onPress={handleCancelBodyGoalsEdit}
                        variant="outline"
                        className="flex-1"
                        disabled={isSavingBodyGoals}
                      />
                      <Button
                        title="Save"
                        onPress={handleSaveBodyGoals}
                        variant="primary"
                        className="flex-1"
                        loading={isSavingBodyGoals}
                        disabled={isSavingBodyGoals}
                      />
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              ) : (
                // Display Mode
                <View>
                  {/* Current Stats Row */}
                  <View className="flex-row mb-4">
                    <View className="flex-1 items-center border-r border-wise-border">
                      <Text className="font-sans text-sm text-wise-text-secondary mb-1">Height</Text>
                      <Text className="font-archivo-bold text-2xl text-wise-text">
                        {currentUser?.healthProfile?.height || "—"}
                      </Text>
                      <Text className="font-sans text-xs text-wise-text-secondary">cm</Text>
                    </View>
                    <View className="flex-1 items-center border-r border-wise-border">
                      <Text className="font-sans text-sm text-wise-text-secondary mb-1">Weight</Text>
                      <Text className="font-archivo-bold text-2xl text-wise-text">
                        {currentUser?.healthProfile?.weight || "—"}
                      </Text>
                      <Text className="font-sans text-xs text-wise-text-secondary">kg</Text>
                    </View>
                    <View className="flex-1 items-center">
                      <Text className="font-sans text-sm text-wise-text-secondary mb-1">BMI</Text>
                      {currentUser?.healthProfile?.height && currentUser?.healthProfile?.weight ? (
                        (() => {
                          const bmi = calculateBMI(
                            currentUser.healthProfile.weight,
                            currentUser.healthProfile.height
                          );
                          const category = getBMICategory(bmi);
                          return (
                            <>
                              <Text className="font-archivo-bold text-2xl" style={{ color: category.color }}>
                                {bmi.toFixed(1)}
                              </Text>
                              <Text className="font-sans text-xs" style={{ color: category.color }}>
                                {category.label}
                              </Text>
                            </>
                          );
                        })()
                      ) : (
                        <>
                          <Text className="font-archivo-bold text-2xl text-wise-text">—</Text>
                          <Text className="font-sans text-xs text-wise-text-secondary">N/A</Text>
                        </>
                      )}
                    </View>
                  </View>
                  
                  {/* Weight Goal Progress */}
                  {weightGoal ? (
                    <View className="border-t border-wise-border pt-4">
                      <View className="flex-row items-center justify-between mb-3">
                        <Text className="font-sans-medium text-base text-wise-text">
                          Weight Goal
                        </Text>
                        <View className="flex-row items-center">
                          <Text className="font-archivo-bold text-lg text-wise-primary">
                            {weightGoal.currentProgress}
                          </Text>
                          <Text className="font-sans text-sm text-wise-text-secondary mx-1">→</Text>
                          <Text className="font-archivo-bold text-lg text-wise-text">
                            {weightGoal.goalValue}
                          </Text>
                          <Text className="font-sans text-xs text-wise-text-secondary ml-1">kg</Text>
                        </View>
                      </View>
                      
                      {/* Progress visualization */}
                      {(() => {
                        const current = weightGoal.currentProgress;
                        const target = weightGoal.goalValue;
                        const isLosing = current > target;
                        const diff = Math.abs(current - target);
                        const startWeight = isLosing ? current : target;
                        const progressPercent = isLosing
                          ? Math.min(100, ((startWeight - current) / (startWeight - target)) * 100)
                          : Math.min(100, ((current - startWeight) / (target - startWeight)) * 100);
                        
                        return (
                          <View className="flex-row items-center">
                            <View className="flex-1 mr-3">
                              <View className="h-2 bg-wise-border rounded-full overflow-hidden">
                                <View 
                                  className="h-full rounded-full"
                                  style={{ 
                                    width: `${Math.max(5, progressPercent)}%`,
                                    backgroundColor: WiseColors.primary 
                                  }}
                                />
                              </View>
                            </View>
                            <Text className="font-sans-medium text-sm text-wise-text-secondary">
                              {diff.toFixed(1)}kg {isLosing ? "to lose" : "to gain"}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                  ) : (
                    <View className="border-t border-wise-border pt-4">
                      <Text className="font-sans text-sm text-wise-text-secondary text-center">
                        Set a weight goal to track your progress
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </Card>
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
