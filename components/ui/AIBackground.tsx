import { WiseColors } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Platform, View } from 'react-native';

interface AIBackgroundProps {
  imageUrl?: string;
  className?: string;
  children?: React.ReactNode;
  opacity?: number;
  blurIntensity?: number;
}

export const AIBackground: React.FC<AIBackgroundProps> = ({
  imageUrl,
  className,
  children,
  opacity = 0.1,
  blurIntensity = 70,
}) => {
  return (
    <View className={`overflow-hidden bg-wise-background flex-1 ${className}`}>
      <LinearGradient
        colors={[WiseColors.background, WiseColors.primaryLight, '#FFFFFF']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Decorative shapes - Blue/Orange accent circles */}
      <View className="absolute w-[400px] h-[400px] rounded-full bg-wise-primary-light opacity-90 -top-[100px] -right-[100px]" />
      <View className="absolute w-[300px] h-[300px] rounded-full bg-[#FED7AA] opacity-65 -bottom-[50px] -left-[100px]" />
      <View className="absolute w-[200px] h-[200px] rounded-full bg-[#BFDBFE] opacity-60 top-[30%] -right-[50px]" />

      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          className="absolute inset-0"
          style={{ opacity }}
          resizeMode="cover"
        />
      )}

      {/* Blur overlay - acts as backdrop blur, pointerEvents none to not intercept touches */}
      <BlurView
        intensity={blurIntensity}
        tint="light"
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
        }}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      />

      {/* Content layer - above blur */}
      <View className="flex-1" style={{ zIndex: 2 }}>
        {children}
      </View>
    </View>
  );
};
