import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";

interface StatCardProps {
  label: string;
  value: number;
  target?: number;
  unit: string;
}

export function StatCard({ label, value, target, unit }: StatCardProps) {
  const percentage = target ? Math.min((value / target) * 100, 100) : 0;

  return (
    <ThemedView style={styles.card}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={styles.value}>
        {value}
        {target && (
          <ThemedText style={styles.target}>
            /{target} {unit}
          </ThemedText>
        )}
        {!target && <ThemedText style={styles.unit}> {unit}</ThemedText>}
      </ThemedText>
      {target && (
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${percentage}%` },
            ]}
          />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flex: 1,
    minWidth: "45%",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  target: {
    fontSize: 16,
    fontWeight: "normal",
    color: "#9ca3af",
  },
  unit: {
    fontSize: 16,
    fontWeight: "normal",
    color: "#9ca3af",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 4,
  },
});

