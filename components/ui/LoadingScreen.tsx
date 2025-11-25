import { WiseColors } from '@/constants/theme';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Text, View } from 'react-native';

interface LoadingScreenProps {
  message?: string;
  showSpinner?: boolean;
}

export function LoadingScreen({ 
  message = 'Loading...', 
  showSpinner = true 
}: LoadingScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Pulse animation for the message
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, pulseAnim]);

  return (
    <View className="flex-1 justify-center items-center bg-wise-background">
      <Animated.View className="items-center p-5" style={{ opacity: fadeAnim }}>
        {showSpinner && (
          <ActivityIndicator 
            size="large" 
            color={WiseColors.primary} 
            className="mb-5"
          />
        )}
        <Animated.View style={{ opacity: pulseAnim }}>
          <Text className="font-sans text-base text-wise-text-secondary text-center">
            {message}
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

export function SetupProfileScreen() {
  return (
    <LoadingScreen 
      message="Setting up your profile..." 
      showSpinner={true}
    />
  );
}
