import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

interface GoalProgressProps {
  milestone: string;
  currentProgress: number;
  goalValue: number;
  goalUnit: string;
}

export function GoalProgress({
  milestone,
  currentProgress,
  goalValue,
  goalUnit,
}: GoalProgressProps) {
  const percentage = Math.min((currentProgress / goalValue) * 100, 100);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.milestone}>{milestone}</ThemedText>
        <ThemedText style={styles.progress}>
          {currentProgress}/{goalValue} {goalUnit}
        </ThemedText>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  milestone: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  progress: {
    fontSize: 14,
    color: "#6b7280",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 4,
  },
});

