import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

interface StreakBadgeProps {
  streakType: string;
  currentCount: number;
  maxCount: number;
}

export function StreakBadge({
  streakType,
  currentCount,
  maxCount,
}: StreakBadgeProps) {
  const displayName =
    streakType.charAt(0).toUpperCase() + streakType.slice(1).replace("_", " ");

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.label}>{displayName}</ThemedText>
      <ThemedText style={styles.count}>
        🔥 {currentCount} days
      </ThemedText>
      <ThemedText style={styles.max}>
        Personal best: {maxCount}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  count: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f59e0b",
    marginBottom: 4,
  },
  max: {
    fontSize: 14,
    color: "#6b7280",
  },
});

