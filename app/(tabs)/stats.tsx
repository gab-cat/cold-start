import React from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StatCard } from "@/components/StatCard";

export default function StatsScreen() {
  const { user } = useUser();

  // Get current user from Convex
  const currentUser = useQuery(api.users.getCurrentUser);

  // Get weekly stats
  const weeklyStats = useQuery(
    api.dashboard.getWeekly,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  if (!currentUser || !weeklyStats) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading stats...</ThemedText>
      </ThemedView>
    );
  }

  // Calculate weekly totals
  const weeklyTotals = weeklyStats.reduce(
    (acc, day) => ({
      workouts: acc.workouts + day.workouts,
      steps: acc.steps + day.steps,
      water: acc.water + day.water,
      sleep: acc.sleep + day.sleep,
    }),
    { workouts: 0, steps: 0, water: 0, sleep: 0 }
  );

  const avgSleep = weeklyStats.length > 0 ? weeklyTotals.sleep / weeklyStats.length : 0;

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Weekly Stats
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          7-day overview
        </ThemedText>
      </ThemedView>

      {/* Weekly Totals */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Total Steps"
          value={weeklyTotals.steps}
          unit="steps"
        />
        <StatCard
          label="Workouts"
          value={weeklyTotals.workouts}
          unit="completed"
        />
        <StatCard
          label="Water"
          value={weeklyTotals.water}
          unit="ml"
        />
        <StatCard
          label="Avg Sleep"
          value={Math.round(avgSleep * 10) / 10}
          unit="hours"
        />
      </View>

      {/* Daily Breakdown */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Daily Breakdown
        </ThemedText>
        {weeklyStats.map((day, index) => (
          <ThemedView key={index} style={styles.dayRow}>
            <ThemedText style={styles.dayLabel}>
              {new Date(day.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </ThemedText>
            <View style={styles.dayStats}>
              <ThemedText style={styles.dayStat}>
                {day.steps} steps
              </ThemedText>
              <ThemedText style={styles.dayStat}>
                {day.workouts} workouts
              </ThemedText>
              <ThemedText style={styles.dayStat}>
                {day.water}ml water
              </ThemedText>
            </View>
          </ThemedView>
        ))}
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
  dayRow: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  dayStats: {
    flexDirection: "row",
    gap: 16,
  },
  dayStat: {
    fontSize: 14,
    color: "#6b7280",
  },
});

