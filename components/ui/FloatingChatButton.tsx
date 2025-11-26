/* eslint-disable indent */
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Shadows, WiseColors } from '@/constants/theme';
import { api } from '@/convex/_generated/api';
import { useAction, useQuery } from 'convex/react';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 160,
  mass: 0.9,
};

const TAB_BAR_HEIGHT = 70;
const TAB_BAR_MARGIN = 16;
const FAB_SIZE = 56;
const FAB_OFFSET = 20;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export function FloatingChatButton() {
  const insets = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animations
  const fabScale = useSharedValue(1);
  const modalProgress = useSharedValue(0);

  // Convex
  const user = useQuery(api.users.getCurrentUser);
  const processMessage = useAction(api.actions.inAppChat.processInAppMessage);

  // Modal animation
  useEffect(() => {
    modalProgress.value = withSpring(isModalVisible ? 1 : 0, SPRING_CONFIG);
  }, [isModalVisible, modalProgress]);

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsModalVisible(true);
  };

  const handleClose = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Keyboard.dismiss();
    setIsModalVisible(false);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !user || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const result = await processMessage({
        userId: user._id,
        userMessage: userMessage.text,
        timestamp: Date.now(),
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: result.response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Scroll to bottom again
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, something went wrong. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePressIn = () => {
    fabScale.value = withSpring(0.88, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    fabScale.value = withSpring(1, SPRING_CONFIG);
  };

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const modalBackdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(modalProgress.value, [0, 1], [0, 1]),
  }));

  const modalContentStyle = useAnimatedStyle(() => ({
    opacity: modalProgress.value,
    transform: [
      {
        translateY: interpolate(
          modalProgress.value,
          [0, 1],
          [100, 0],
          Extrapolation.CLAMP
        ),
      },
      {
        scale: interpolate(
          modalProgress.value,
          [0, 1],
          [0.9, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const fabPosition = {
    bottom: Math.max(insets.bottom, 12) + TAB_BAR_HEIGHT + FAB_OFFSET,
    right: TAB_BAR_MARGIN,
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.fab, fabPosition, fabAnimatedStyle]}
      >
        <View style={styles.fabInner}>
          <IconSymbol name="bubble.left.and.bubble.right.fill" size={24} color="#FFFFFF" />
        </View>
      </AnimatedPressable>

      {/* Chat Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          {/* Backdrop */}
          <Animated.View style={[styles.backdrop, modalBackdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          </Animated.View>

          {/* Content */}
          <Animated.View
            style={[
              styles.chatContainer,
              { paddingBottom: Math.max(insets.bottom, 16) },
              modalContentStyle,
            ]}
          >
            {/* Header */}
            <View style={styles.chatHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.aiAvatarContainer}>
                  <View style={styles.aiAvatar}>
                    <IconSymbol name="sparkles" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.onlineIndicator} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>WellBuddy</Text>
                  <Text style={styles.headerSubtitle}>Your wellness coach</Text>
                </View>
              </View>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <IconSymbol name="xmark" size={18} color={WiseColors.textSecondary} />
              </Pressable>
            </View>

            {/* Decorative divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerDot} />
              <View style={styles.dividerLine} />
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <IconSymbol name="hand.wave.fill" size={32} color={WiseColors.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>Hey there!</Text>
                  <Text style={styles.emptyText}>
                    I&apos;m here to help you track meals, workouts, and stay on top of your wellness
                    goals. What would you like to do?
                  </Text>
                  <View style={styles.suggestionsContainer}>
                    {['Log a meal', 'Track a workout', "How's my progress?"].map(
                      (suggestion, index) => (
                        <Pressable
                          key={index}
                          style={styles.suggestionChip}
                          onPress={() => {
                            setInputText(suggestion);
                            if (Platform.OS === 'ios') {
                              Haptics.selectionAsync();
                            }
                          }}
                        >
                          <Text style={styles.suggestionText}>{suggestion}</Text>
                        </Pressable>
                      )
                    )}
                  </View>
                </View>
              ) : (
                messages.map((message, index) => (
                  <MessageBubble key={message.id} message={message} index={index} />
                ))
              )}

              {/* Loading indicator */}
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingBubble}>
                    <View style={styles.typingDots}>
                      <TypingDot delay={0} />
                      <TypingDot delay={150} />
                      <TypingDot delay={300} />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Tell me what you ate, did, or want to know..."
                  placeholderTextColor={WiseColors.textSecondary}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                  blurOnSubmit={false}
                />
                <Pressable
                  onPress={handleSend}
                  disabled={!inputText.trim() || isLoading}
                  style={[
                    styles.sendButton,
                    (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <IconSymbol name="arrow.up" size={18} color="#FFFFFF" />
                  )}
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

interface MessageBubbleProps {
  message: Message;
  index: number;
}

function MessageBubble({ message, index }: MessageBubbleProps) {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(index * 50, withSpring(0, SPRING_CONFIG));
    opacity.value = withDelay(index * 50, withTiming(1, { duration: 300 }));
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.messageBubbleContainer,
        message.isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        animatedStyle,
      ]}
    >
      {!message.isUser && (
        <View style={styles.messageAvatar}>
          <IconSymbol name="sparkles" size={12} color={WiseColors.primary} />
        </View>
      )}
      <View
        style={[styles.messageBubble, message.isUser ? styles.userBubble : styles.aiBubble]}
      >
        <Text
          style={[
            styles.messageText,
            message.isUser ? styles.userMessageText : styles.aiMessageText,
          ]}
        >
          {message.text}
        </Text>
      </View>
    </Animated.View>
  );
}

function TypingDot({ delay }: { delay: number }) {
  const scale = useSharedValue(0.6);

  useEffect(() => {
    const animate = () => {
      scale.value = withDelay(
        delay,
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.6, { duration: 300 }),
          withDelay(300, withTiming(0.6, { duration: 0 }))
        )
      );
    };
    animate();
    const interval = setInterval(animate, 900);
    return () => clearInterval(interval);
  }, [delay, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0.6, 1], [0.4, 1]),
  }));

  return <Animated.View style={[styles.typingDot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    ...Shadows.lg,
    shadowColor: WiseColors.primary,
    shadowOpacity: 0.35,
    zIndex: 9999,
    elevation: 10,
  },
  fabInner: {
    width: '100%',
    height: '100%',
    borderRadius: FAB_SIZE / 2,
    backgroundColor: WiseColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  chatContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: WiseColors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
    minHeight: 400,
    ...Shadows.lg,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiAvatarContainer: {
    position: 'relative',
  },
  aiAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: WiseColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: WiseColors.success,
    borderWidth: 2,
    borderColor: WiseColors.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
    color: WiseColors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: WiseColors.textSecondary,
    marginTop: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: WiseColors.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: WiseColors.border,
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: WiseColors.primary,
    marginHorizontal: 12,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: WiseColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
    color: WiseColors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: WiseColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: WiseColors.subtle,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: WiseColors.border,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: WiseColors.text,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: WiseColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: SCREEN_WIDTH * 0.7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    backgroundColor: WiseColors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: WiseColors.subtle,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    lineHeight: 21,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: WiseColors.text,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  loadingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: WiseColors.subtle,
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: 4,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: WiseColors.textSecondary,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: WiseColors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: WiseColors.subtle,
    borderRadius: BorderRadius.lg,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: WiseColors.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: WiseColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: WiseColors.border,
  },
});
