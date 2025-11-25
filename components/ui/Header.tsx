import { useUser } from '@clerk/clerk-expo';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showAvatar?: boolean;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showAvatar = true,
  rightAction,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View 
      className="bg-wise-background px-6 pb-4"
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          {subtitle && (
            <Text className="font-sans-medium text-sm text-wise-text-secondary mb-1 uppercase tracking-wide">
              {subtitle}
            </Text>
          )}
          <Text className="font-archivo-bold text-3xl tracking-tighter text-wise-text">
            {title || `${greeting()}, ${user?.firstName || 'Friend'}!`}
          </Text>
        </View>
        
        <View className="flex-row items-center gap-2">
          {rightAction}
          {showAvatar && user?.imageUrl && (
            <Pressable className="shadow-md">
              <Image
                source={{ uri: user.imageUrl }}
                className="w-12 h-12 rounded-full border-2 border-wise-surface"
              />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};
