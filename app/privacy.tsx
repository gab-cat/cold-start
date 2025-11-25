import { IconSymbol } from '@/components/ui/icon-symbol'
import { WiseColors } from '@/constants/theme'
import { useRouter } from 'expo-router'
import React from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function PrivacyScreen() {
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-wise-background">
      <View className="flex-row items-center px-6 py-4 border-b border-wise-border">
        <Pressable onPress={() => router.back()} className="mr-4">
          <IconSymbol name="chevron.left" size={24} color={WiseColors.text} />
        </Pressable>
        <Text className="font-archivo-bold text-xl text-wise-text">Privacy Policy</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        <Text className="font-sans text-sm text-wise-text-secondary mb-2">
          Last updated: November 26, 2025
        </Text>

        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-6">
          Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          1. Information We Collect
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-2">
          We may collect information about you in various ways, including:
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4 ml-4">
          • Personal Data: Name, email address, and profile information provided through Google Sign-In{'\n'}
          • Health & Fitness Data: Activity logs, workout data, goals, and progress metrics you input{'\n'}
          • Device Data: Device type, operating system, and app usage statistics{'\n'}
          • Location Data: Only when you explicitly enable location-based features
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          2. How We Use Your Information
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4">
          We use the information we collect to:{'\n\n'}
          • Provide and maintain our service{'\n'}
          • Personalize your experience and deliver AI-powered insights{'\n'}
          • Analyze usage patterns to improve our application{'\n'}
          • Communicate with you about updates and features{'\n'}
          • Ensure the security of our service
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          3. Data Storage and Security
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4">
          We implement appropriate technical and organizational security measures to protect your personal information. Your data is stored securely using industry-standard encryption and access controls.
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          4. Third-Party Services
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4">
          Our application may use third-party services that have their own privacy policies:{'\n\n'}
          • Google (Authentication){'\n'}
          • Convex (Database and Backend){'\n'}
          • Expo (App Distribution){'\n\n'}
          We encourage you to review the privacy policies of these third-party services.
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          5. Data Sharing
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4">
          We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:{'\n\n'}
          • With your explicit consent{'\n'}
          • To comply with legal obligations{'\n'}
          • To protect our rights and safety{'\n'}
          • With service providers who assist in operating our application
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          6. Your Rights
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4">
          You have the right to:{'\n\n'}
          • Access the personal data we hold about you{'\n'}
          • Request correction of inaccurate data{'\n'}
          • Request deletion of your data{'\n'}
          • Withdraw consent at any time{'\n'}
          • Export your data in a portable format
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          7. Data Retention
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4">
          We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          8. Children&apos;s Privacy
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4">
          Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          9. Changes to This Policy
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4">
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          10. Contact Us
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-8">
          If you have questions or concerns about this Privacy Policy, please contact us at privacy@example.com.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}
