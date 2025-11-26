import { AIBackground } from '@/components/ui/AIBackground'
import { AnimatedIcon, AnimatedSection } from '@/components/ui/AnimatedSection'
import { Button } from '@/components/ui/Button'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { WiseColors } from '@/constants/theme'
import { useRouter } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function NotFoundScreen() {
  const router = useRouter()

  // Floating animation for the icon
  const translateY = useSharedValue(0)
  
  React.useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      true
    )
  }, [translateY])

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <AIBackground blurIntensity={60} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-center items-center px-8">
          {/* Floating 404 Icon */}
          <AnimatedSection index={0}>
            <AnimatedIcon delay={100}>
              <Animated.View 
                style={floatingStyle}
                className="w-32 h-32 bg-wise-accent/10 rounded-[40px] items-center justify-center mb-8 border-2 border-wise-accent/20"
              >
                <IconSymbol name="questionmark.circle" size={64} color={WiseColors.accent} />
              </Animated.View>
            </AnimatedIcon>
          </AnimatedSection>

          {/* 404 Text */}
          <AnimatedSection index={1}>
            <Text className="font-archivo-bold tracking-[-0.08em] text-8xl text-wise-text mb-2">
              4<Text className="text-wise-accent">0</Text>4
            </Text>
          </AnimatedSection>

          {/* Message */}
          <AnimatedSection index={2} className="items-center">
            <Text className="font-archivo-semibold text-2xl text-wise-text text-center mb-3">
              Oops! Page not found
            </Text>
            <Text className="font-sans text-base text-wise-text-secondary text-center leading-6 max-w-[280px]">
              Looks like this route took a wrong turn during the workout. Let&apos;s get you back on track!
            </Text>
          </AnimatedSection>

          {/* Decorative fitness icons */}
          <AnimatedSection index={3} className="flex-row justify-center items-center mt-10 mb-10">
            <AnimatedIcon delay={300}>
              <View className="items-center mx-4">
                <View className="w-12 h-12 bg-wise-primary-light rounded-full items-center justify-center">
                  <IconSymbol name="figure.run" size={22} color={WiseColors.primary} />
                </View>
              </View>
            </AnimatedIcon>
            <AnimatedIcon delay={400}>
              <View className="items-center mx-4">
                <View className="w-12 h-12 bg-[#FFF7ED] rounded-full items-center justify-center">
                  <IconSymbol name="heart.fill" size={22} color={WiseColors.accent} />
                </View>
              </View>
            </AnimatedIcon>
            <AnimatedIcon delay={500}>
              <View className="items-center mx-4">
                <View className="w-12 h-12 bg-wise-primary-light rounded-full items-center justify-center">
                  <IconSymbol name="flame.fill" size={22} color={WiseColors.primary} />
                </View>
              </View>
            </AnimatedIcon>
          </AnimatedSection>

          {/* Action Buttons */}
          <AnimatedSection index={4} className="w-full max-w-xs">
            <Button
              title="Go to Dashboard"
              onPress={() => router.replace('/')}
              icon={<IconSymbol name="house.fill" size={18} color="white" />}
              className="w-full mb-3"
              size="md"
            />
            <Button
              title="Go Back"
              onPress={() => router.back()}
              variant="outline"
              icon={<IconSymbol name="chevron.left" size={18} color={WiseColors.primary} />}
              className="w-full"
              size="md"
            />
          </AnimatedSection>
        </View>

        {/* Fun footer message */}
        <AnimatedSection index={5} animation="subtle" className="pb-8 px-8">
          <Text className="font-sans text-sm text-wise-text-secondary text-center">
            <Text className="text-base">💪 </Text>
            Every journey has a few detours. Keep moving forward!
          </Text>
        </AnimatedSection>
      </SafeAreaView>
    </AIBackground>
  )
}
