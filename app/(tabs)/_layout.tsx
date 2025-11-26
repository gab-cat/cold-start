import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { FloatingChatButton } from '@/components/ui/FloatingChatButton';
import { FloatingTabBar } from '@/components/ui/FloatingTabBar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingScreen, SetupProfileScreen } from '@/components/ui/LoadingScreen';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export default function TabLayout() {
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
    <>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
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
      <FloatingChatButton />
    </>
  );
}
