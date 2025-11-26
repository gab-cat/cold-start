import { AIBackground } from '@/components/ui/AIBackground'
import { AnimatedIcon, AnimatedSection } from '@/components/ui/AnimatedSection'
import { Button } from '@/components/ui/Button'
import { useWarmUpBrowser } from '@/hooks/useWarmUpBrowser'
import { useOAuth } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React from 'react'
import { Text, View } from 'react-native'

WebBrowser.maybeCompleteAuthSession()

export default function SignUpScreen() {
  useWarmUpBrowser()
  const router = useRouter()
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })

  const onGoogleSignUp = React.useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow()
      
      if (createdSessionId) {
        setActive!({ session: createdSessionId })
        router.replace('/')
      } else {
        // Use signIn or signUp for next steps such as MFA
      }
    } catch (err) {
      console.error('OAuth error', err)
    }
  }, [startOAuthFlow, router])

  return (
    <AIBackground className="flex-1">
      <View className="flex-1 justify-center p-6">
        <AnimatedSection index={0} className="mb-8 items-center">
          <AnimatedIcon delay={100}>
            <View className="w-16 h-16 bg-wise-accent/15 rounded-2xl items-center justify-center mb-6">
              <Text className="text-4xl">🚀</Text>
            </View>
          </AnimatedIcon>
          <Text className="font-archivo-bold text-[32px] text-wise-text mb-1 text-center">
            Create Account
          </Text>
          <Text className="font-sans text-base text-wise-text-secondary text-center">
            Start your <Text className="text-wise-accent font-sans-medium">wellness journey</Text> today
          </Text>
        </AnimatedSection>

        <AnimatedSection index={1} className="w-full mt-8">
          <Button 
            title="Continue with Google" 
            onPress={onGoogleSignUp} 
            icon={<Ionicons name="logo-google" size={20} color="white" style={{ marginRight: 8 }} />}
            className="w-full"
          />
        </AnimatedSection>
      </View>
    </AIBackground>
  )
}