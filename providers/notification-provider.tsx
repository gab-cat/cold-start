/* eslint-disable indent */
import { api } from "@/convex/_generated/api";
import {
    usePushNotifications,
    type Notification,
} from "@/hooks/use-push-notifications";
import {
    getRouteFromNotificationType,
    type NotificationType,
} from "@/lib/notifications";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

// Dynamically import expo-notifications
let Notifications: typeof import("expo-notifications") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require("expo-notifications");
} catch {
  console.log("expo-notifications not available (running in Expo Go)");
}

// Type for notification response
type NotificationResponse = {
  notification: {
    request: {
      content: {
        data: Record<string, unknown>;
      };
    };
  };
};

interface NotificationContextType {
  expoPushToken: string | null;
  isTokenRegistered: boolean;
  lastNotification: Notification | null;
  handleNotificationResponse: (response: NotificationResponse) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user, isSignedIn } = useUser();
  const [isTokenRegistered, setIsTokenRegistered] = useState(false);

  // Use the push notifications hook
  const { expoPushToken: hookToken, notification } = usePushNotifications();

  const responseListener = useRef<{ remove: () => void } | undefined>(
    undefined
  );

  // Convex mutation to register push token
  const recordPushToken = useMutation(
    api.pushNotifications.recordPushNotificationToken
  );
  const notificationStatus = useQuery(
    api.pushNotifications.getNotificationStatus
  );

  // Handle notification navigation based on type and data.url
  const handleNotificationResponse = useCallback(
    (response: NotificationResponse) => {
      const data = response.notification.request.content.data;
      console.log("Handling notification response with data:", data);

      if (!data || typeof data !== "object") {
        // Default navigation to stats
        router.push("/stats");
        return;
      }

      // Check for explicit URL in data
      if (data.url && typeof data.url === "string") {
        console.log("Navigating to URL from notification:", data.url);
        router.push(data.url as any);
        return;
      }

      // Fallback: navigate based on notification type
      const notificationType = data.type as NotificationType;
      if (notificationType) {
        const route = getRouteFromNotificationType(notificationType);
        console.log(
          `Navigating to ${route} based on notification type: ${notificationType}`
        );
        router.push(route as any);
        return;
      }

      // Ultimate fallback: go to stats
      router.push("/stats");
    },
    []
  );

  // Record push token to Convex when it changes
  useEffect(() => {
    async function recordToken() {
      if (!isSignedIn || !user || !hookToken) {
        console.log(
          `User not authenticated or no token, skipping token recording
          : isSignedIn=${isSignedIn}, user=${!!user}, hookToken=${!!hookToken}`
        );
        return;
      }

      // Add a small delay to ensure authentication is fully processed
      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        // Check if token is already registered
        if (notificationStatus?.hasToken) {
          console.log("Token already registered for user");
          setIsTokenRegistered(true);
          return;
        }

        // Record token with Convex
        const result = await recordPushToken({
          token: hookToken.data,
          tokenType: "expo",
        });

        if (result?.success) {
          setIsTokenRegistered(true);
          console.log("Push notification token registered successfully");
        } else {
          console.error("Failed to register push token:", result?.message);
          setIsTokenRegistered(false);
        }
      } catch (error) {
        console.error("Error recording push token:", error);
        setIsTokenRegistered(false);
      }
    }

    recordToken();
  }, [isSignedIn, user, hookToken, recordPushToken, notificationStatus]);

  // Set up notification response listener (for navigation when tapping notifications)
  useEffect(() => {
    // Skip if notifications aren't available
    if (!Notifications) {
      return;
    }

    // Check for initial notification response (app was opened via notification)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        console.log("App opened via notification:", response);
        handleNotificationResponse(response as unknown as NotificationResponse);
      }
    });

    // Listen for notification responses (when user taps notification)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response received:", response);
        handleNotificationResponse(response as unknown as NotificationResponse);
      });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [handleNotificationResponse]);

  const contextValue: NotificationContextType = {
    expoPushToken: hookToken?.data || null,
    isTokenRegistered,
    lastNotification: notification || null,
    handleNotificationResponse,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}
