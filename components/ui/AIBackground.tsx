import { WiseColors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, View } from 'react-native';

interface AIBackgroundProps {
  imageUrl?: string;
  className?: string;
  children?: React.ReactNode;
  opacity?: number;
}

export const AIBackground: React.FC<AIBackgroundProps> = ({
  imageUrl,
  className,
  children,
  opacity = 0.1,
}) => {
  return (
    <View className={`overflow-hidden bg-wise-background flex-1 ${className}`}>
      <LinearGradient
        colors={[WiseColors.background, WiseColors.primaryLight, '#FFFFFF']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Decorative shapes */}
      <View className="absolute w-[400px] h-[400px] rounded-full bg-wise-primary-light opacity-50 -top-[100px] -right-[100px]" />
      <View className="absolute w-[300px] h-[300px] rounded-full bg-[#D1FAE5] opacity-40 -bottom-[50px] -left-[100px]" />
      <View className="absolute w-[200px] h-[200px] rounded-full bg-[#E0F2FE] opacity-30 top-[30%] -right-[50px]" />

      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          className="absolute inset-0"
          style={{ opacity }}
          resizeMode="cover"
        />
      )}
      <View className="flex-1">
        {children}
      </View>
    </View>
  );
};
