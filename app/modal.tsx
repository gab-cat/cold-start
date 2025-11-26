import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import React from 'react';

export default function ModalScreen() {
  return (
    <ThemedView className="flex-1 items-center justify-center p-5">
      <AnimatedSection index={0}>
        <ThemedText type="title">This is a modal</ThemedText>
      </AnimatedSection>
      <AnimatedSection index={1}>
        <Link href="/" dismissTo className="mt-4 py-4">
          <ThemedText type="link">Go to home screen</ThemedText>
        </Link>
      </AnimatedSection>
    </ThemedView>
  );
}
