import React from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function ProfileScreen() {
  const { user } = useUser();

  // Get current user from Convex
  const currentUser = useQuery(api.users.getCurrentUser);

  if (!currentUser) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
      </ThemedView>
    );
  }

  const healthProfile = currentUser.healthProfile || {};
  const preferences = currentUser.preferences || {};

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Profile
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {currentUser.displayName || user?.firstName || "User"}
        </ThemedText>
        <ThemedText style={styles.email}>{currentUser.email}</ThemedText>
      </ThemedView>

      {/* Health Profile */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Health Profile
        </ThemedText>
        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Age:</ThemedText>
          <ThemedText style={styles.value}>
            {healthProfile.age || "Not set"}
          </ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Gender:</ThemedText>
          <ThemedText style={styles.value}>
            {healthProfile.gender || "Not set"}
          </ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Fitness Level:</ThemedText>
          <ThemedText style={styles.value}>
            {healthProfile.fitnessLevel || "Not set"}
          </ThemedText>
        </View>
        {healthProfile.goals && healthProfile.goals.length > 0 && (
          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Goals:</ThemedText>
            <ThemedText style={styles.value}>
              {healthProfile.goals.join(", ")}
            </ThemedText>
          </View>
        )}
        {healthProfile.injuries && (
          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Injuries:</ThemedText>
            <ThemedText style={styles.value}>
              {healthProfile.injuries}
            </ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Preferences */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Preferences
        </ThemedText>
        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Timezone:</ThemedText>
          <ThemedText style={styles.value}>
            {preferences.preferredTimezone || "Not set"}
          </ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Language:</ThemedText>
          <ThemedText style={styles.value}>
            {preferences.language || "Not set"}
          </ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Notifications:</ThemedText>
          <ThemedText style={styles.value}>
            {preferences.notificationFrequency || "Not set"}
          </ThemedText>
        </View>
        {preferences.preferredActivities &&
          preferences.preferredActivities.length > 0 && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Activities:</ThemedText>
              <ThemedText style={styles.value}>
                {preferences.preferredActivities.join(", ")}
              </ThemedText>
            </View>
          )}
      </ThemedView>

      {/* Messenger Connection */}
      {currentUser.messengerPsid && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Connected Services
          </ThemedText>
          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Facebook Messenger:</ThemedText>
            <ThemedText style={styles.connected}>✓ Connected</ThemedText>
          </View>
        </ThemedView>
      )}

      {/* Note */}
      <ThemedView style={styles.tipBox}>
        <ThemedText style={styles.tipText}>
          💡 <ThemedText style={styles.tipBold}>Note:</ThemedText> Profile
          updates are managed through your account settings.
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
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 8,
  },
  email: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  value: {
    fontSize: 16,
    color: "#6b7280",
  },
  connected: {
    fontSize: 16,
    color: "#10b981",
    fontWeight: "600",
  },
  tipBox: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#fef3c7",
  },
  tipText: {
    fontSize: 14,
    color: "#92400e",
  },
  tipBold: {
    fontWeight: "600",
  },
});

