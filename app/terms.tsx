import { IconSymbol } from '@/components/ui/icon-symbol'
import { WiseColors } from '@/constants/theme'
import { useRouter } from 'expo-router'
import React from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function TermsScreen() {
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-wise-background">
      <View className="flex-row items-center px-6 py-4 border-b border-wise-border">
        <Pressable onPress={() => router.back()} className="mr-4">
          <IconSymbol name="chevron.left" size={24} color={WiseColors.text} />
        </Pressable>
        <Text className="font-archivo-bold text-xl text-wise-text">Terms of Service</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        <Text className="font-sans text-sm text-wise-text-secondary mb-2">
          Last updated: November 26, 2025
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-6 mb-3">
          1. Acceptance of Terms
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4">
          By accessing and using this application, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this service.
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          2. Description of Service
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4">
          Our application provides AI-powered fitness tracking and health insights. We offer tools to track your activities, analyze your progress, and provide personalized recommendations to help you achieve your health goals.
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          3. User Accounts
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4">
          You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          4. Health Disclaimer
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4">
          The information provided by this application is for general informational purposes only and is not intended as medical advice. Always consult with a qualified healthcare provider before starting any new fitness program or making changes to your health routine.
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          5. User Content
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4">
          You retain ownership of any content you submit to the application. By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, and display such content in connection with providing our services.
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          6. Prohibited Uses
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4">
          You agree not to use the service for any unlawful purpose or in any way that could damage, disable, or impair the service. You may not attempt to gain unauthorized access to any part of the service or its related systems.
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          7. Intellectual Property
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4">
          The service and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, and other intellectual property laws.
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          8. Termination
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4">
          We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason, including breach of these Terms.
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          9. Limitation of Liability
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4">
          In no event shall we be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the service.
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          10. Changes to Terms
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-4">
          We reserve the right to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page and updating the &ldquo;Last updated&rdquo; date.
        </Text>

        <Text className="font-archivo-semibold text-lg text-wise-text mt-4 mb-3">
          11. Contact Us
        </Text>
        <Text className="font-sans text-base text-wise-text-secondary leading-6 mb-8">
          If you have any questions about these Terms, please contact us at support@example.com.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}
