import React from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StatCard } from "@/components/StatCard";
import { StreakBadge } from "@/components/StreakBadge";
import { GoalProgress } from "@/components/GoalProgress";

export default function DashboardScreen() {
  const { user } = useUser();

  // Get current user from Convex
  const currentUser = useQuery(api.users.getCurrentUser);

  // Real-time queries - automatically update when data changes
  const todayStats = useQuery(
    api.dashboard.getToday,
    currentUser ? { userId: currentUser._id } : "skip"
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

  if (!currentUser || !todayStats || !weeklyStats) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading your dashboard...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Today's Summary
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Welcome back, {currentUser.displayName || user?.firstName || "there"}!
        </ThemedText>
      </ThemedView>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Steps"
          value={todayStats.steps}
          target={todayStats.stepGoal}
          unit="steps"
        />
        <StatCard
          label="Workouts"
          value={todayStats.workoutCount}
          unit="completed"
        />
        <StatCard
          label="Water"
          value={todayStats.water}
          target={2000}
          unit="ml"
        />
        <StatCard
          label="Sleep"
          value={todayStats.sleep}
          target={8}
          unit="hours"
        />
      </View>

      {/* Streaks */}
      {streaks && streaks.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Active Streaks 🔥
          </ThemedText>
          {streaks.map((streak) => (
            <StreakBadge
              key={streak._id}
              streakType={streak.streakType}
              currentCount={streak.currentCount}
              maxCount={streak.maxCount}
            />
          ))}
        </ThemedView>
      )}

      {/* Goals Progress */}
      {goals && goals.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Goals 🎯
          </ThemedText>
          {goals.map((goal) => (
            <GoalProgress
              key={goal._id}
              milestone={goal.milestone}
              currentProgress={goal.currentProgress}
              goalValue={goal.goalValue}
              goalUnit={goal.goalUnit}
            />
          ))}
        </ThemedView>
      )}

      {/* Note: All writes go through Messenger */}
      <ThemedView style={styles.tipBox}>
        <ThemedText style={styles.tipText}>
          💬 <ThemedText style={styles.tipBold}>Pro Tip:</ThemedText> Log your
          activities via messenger for real-time coaching!
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },
  section: {
    padding: 16,
    marginTop: 8,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  tipBox: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
  },
  tipText: {
    fontSize: 14,
    color: "#1e40af",
  },
  tipBold: {
    fontWeight: "600",
  },
});
