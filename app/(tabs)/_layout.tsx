import { BlurView } from 'expo-blur';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingScreen, SetupProfileScreen } from '@/components/ui/LoadingScreen';
import { WiseColors } from '@/constants/theme';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { state } = useAuthGuard();

  // Show loading screen while Clerk is loading
  if (state === 'loading') {
    return <LoadingScreen message="Loading..." />;
  }

  // Redirect to sign-in if not authenticated
  if (state === 'unauthenticated') {
    return <Redirect href="/sign-in" />;
  }

  // Show loading screen while Convex profile is being fetched
  if (state === 'profile-loading') {
    return <LoadingScreen message="Loading your profile..." />;
  }

  // Show setup screen if profile doesn't exist yet (webhook pending)
  if (state === 'profile-missing') {
    return <SetupProfileScreen />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: WiseColors.primary,
        tabBarInactiveTintColor: WiseColors.textSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : WiseColors.surface,
          borderTopWidth: 0,
          elevation: 0,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 85,
          paddingTop: 10,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.8)' }} />
          ) : undefined
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="safari.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
