import { AIBackground } from '@/components/ui/AIBackground'
import { AnimatedIcon, AnimatedSection } from '@/components/ui/AnimatedSection'
import { Button } from '@/components/ui/Button'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { WiseColors } from '@/constants/theme'
import { useWarmUpBrowser } from '@/hooks/useWarmUpBrowser'
import { useOAuth } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import { Link, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React from 'react'
import { Text, View } from 'react-native'

WebBrowser.maybeCompleteAuthSession()

export default function SignInScreen() {
  useWarmUpBrowser()
  const router = useRouter()
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })
  const [isLoading, setIsLoading] = React.useState(false)

  const onGoogleSignIn = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const { createdSessionId, setActive } = await startOAuthFlow()
      
      if (createdSessionId) {
        setActive!({ session: createdSessionId })
        router.replace('/')
      } else {
        // Use signIn or signUp for next steps such as MFA
      }
    } catch (err) {
      console.error('OAuth error', err)
    } finally {
      setIsLoading(false)
    }
  }, [startOAuthFlow, router])

  return (
    <AIBackground blurIntensity={80} className="flex-1">
      <View className="flex-1 justify-between p-8">
        <AnimatedSection index={0} className="mt-20">
          <AnimatedIcon delay={100}>
            <View className="w-16 h-16 bg-wise-accent/10 rounded-2xl items-center justify-center mb-6">
              <IconSymbol name="sparkles" size={32} color={WiseColors.accent} />
            </View>
          </AnimatedIcon>
          
          <Text className="font-archivo-bold tracking-[-0.07em] text-7xl text-wise-text mb-4 leading-tighter">
            Reach your <Text className="text-wise-accent">peak</Text> performance.
          </Text>
          <Text className="font-sans tracking-tighter text-lg text-wise-text-secondary leading-7">
            Your personal <Text className="text-wise-primary font-sans-medium">AI fitness companion</Text>. Track, analyze, and improve your health with intelligent insights.
          </Text>
        </AnimatedSection>

        <AnimatedSection index={1} className="mb-12">
          <View className="flex-row items-center justify-center mb-8 space-x-8">
            <AnimatedIcon delay={200}>
              <View className="items-center mr-2">
                <View className="w-12 h-12 bg-wise-primary-light rounded-full items-center justify-center mb-2">
                  <IconSymbol name="figure.run" size={20} color={WiseColors.primary} />
                </View>
                <Text className="font-sans-medium text-xs text-wise-text-secondary">Track</Text>
              </View>
            </AnimatedIcon>
            <AnimatedIcon delay={300}>
              <View className="items-center mr-2">
                <View className="w-12 h-12 bg-wise-primary-light rounded-full items-center justify-center mb-2">
                  <IconSymbol name="chart.bar.fill" size={20} color={WiseColors.primary} />
                </View>
                <Text className="font-sans-medium text-xs text-wise-text-secondary">Analyze</Text>
              </View>
            </AnimatedIcon>
            <AnimatedIcon delay={400}>
              <View className="items-center mr-2">
                <View className="w-12 h-12 bg-[#FFF7ED] rounded-full items-center justify-center mb-2">
                  <IconSymbol name="bolt.fill" size={20} color={WiseColors.accent} />
                </View>
                <Text className="font-sans-medium text-xs text-wise-text-secondary">Improve</Text>
              </View>
            </AnimatedIcon>
          </View>

          <Button 
            title={isLoading ? "Signing in..." : "Continue with Google"} 
            onPress={onGoogleSignIn} 
            icon={<Ionicons name="logo-google" size={20} color="white" style={{ marginRight: 8 }} />}
            className="w-full shadow-lg font-archivo-bold"
            size="md"
            disabled={isLoading}
          />
          
          <Text className="font-sans text-sm text-wise-text-tertiary text-center mt-6">
            By continuing, you agree to our{' '}
            <Link href="/terms" asChild>
              <Text className="font-sans-medium text-sm text-wise-primary">Terms of Service</Text>
            </Link>
            {' '}and{' '}
            <Link href="/privacy" asChild>
              <Text className="font-sans-medium text-sm text-wise-primary">Privacy Policy</Text>
            </Link>.
          </Text>

        </AnimatedSection>
      </View>
    </AIBackground>
  )
}