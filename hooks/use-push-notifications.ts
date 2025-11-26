import Constants from "expo-constants";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

// Dynamically import native modules to handle Expo Go gracefully
let Device: typeof import("expo-device") | null = null;
let Notifications: typeof import("expo-notifications") | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Device = require("expo-device");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require("expo-notifications");
} catch {
  console.log("Native notification modules not available (running in Expo Go)");
}

// Type definitions for when modules aren't available
export type ExpoPushToken = { data: string; type: string };
export type Notification = {
  request: {
    content: {
      title: string | null;
      body: string | null;
      data: Record<string, unknown>;
    };
  };
  date: number;
};

export interface PushNotificationState {
  expoPushToken?: ExpoPushToken;
  notification?: Notification;
  error?: string;
}

// Configure notification handler for foreground notifications (only if available)
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldShowAlert: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<ExpoPushToken | undefined>();
  const [notification, setNotification] = useState<Notification | undefined>();
  const [error, setError] = useState<string | undefined>();

  const notificationListener = useRef<{ remove: () => void } | undefined>(undefined);
  const responseListener = useRef<{ remove: () => void } | undefined>(undefined);

  async function registerForPushNotificationsAsync(): Promise<ExpoPushToken | undefined> {
    // If notifications module isn't available, return early
    if (!Notifications) {
      setError("Push notifications require a development build");
      console.log("Push notifications not available in Expo Go");
      return undefined;
    }

    let token: ExpoPushToken | undefined;

    // Set up Android notification channel first (required for Android 13+)
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0EA5E9", // Sky-500 color to match app theme
      });

      // Additional channels for different notification types
      await Notifications.setNotificationChannelAsync("streaks", {
        name: "Streak Reminders",
        description: "Notifications about your activity streaks",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#F97316", // Orange for streaks
      });

      await Notifications.setNotificationChannelAsync("goals", {
        name: "Goal Progress",
        description: "Updates about your goal progress",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#22C55E", // Green for goals
      });

      await Notifications.setNotificationChannelAsync("insights", {
        name: "Daily Insights",
        description: "Your personalized daily health insights",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#8B5CF6", // Purple for insights
      });
    }

    if (Device?.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        setError("Permission not granted for push notifications");
        console.log("Failed to get push token: Permission not granted");
        return undefined;
      }

      try {
        // Get project ID from Expo config
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;

        if (!projectId) {
          setError("Project ID not found in Expo config");
          console.log("Failed to get push token: Project ID not found");
          return undefined;
        }

        token = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        console.log("Expo push token:", token.data);
      } catch (e) {
        setError(`Error getting push token: ${e}`);
        console.error("Error getting push token:", e);
      }
    } else if (!Device) {
      // expo-device not available (Expo Go)
      setError("Push notifications require a development build");
      console.log("Push notifications not available in Expo Go");
    } else {
      setError("Must use physical device for push notifications");
      console.log("Must use physical device for Push Notifications");
    }

    return token;
  }

  useEffect(() => {
    // Skip if notifications aren't available
    if (!Notifications) {
      setError("Push notifications require a development build");
      return;
    }

    // Register for push notifications
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
        setNotification(notification as unknown as Notification);
      });

    // Listen for user interactions with notifications
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    error,
  };
};
