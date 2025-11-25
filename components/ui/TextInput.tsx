import React, { forwardRef } from 'react';
import { TextInput as RNTextInput, Text, View, KeyboardTypeOptions } from 'react-native';
import { WiseColors } from '@/constants/theme';

interface TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  numberOfLines?: number;
  className?: string;
  disabled?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  (
    {
      value,
      onChangeText,
      placeholder,
      label,
      error,
      keyboardType = 'default',
      multiline = false,
      numberOfLines = 1,
      className,
      disabled = false,
      autoCapitalize = 'sentences',
    },
    ref
  ) => {
    const inputClassName = `
      bg-wise-surface border rounded-wise-md px-4 py-3
      text-base text-wise-text font-sans
      ${error ? 'border-wise-error' : 'border-wise-border'}
      ${disabled ? 'opacity-50' : ''}
      ${multiline ? 'min-h-[80px]' : 'h-12'}
      ${className || ''}
    `.trim();

    const textInputProps = {
      ref,
      value,
      onChangeText,
      placeholder,
      placeholderTextColor: WiseColors.textSecondary,
      keyboardType,
      multiline,
      numberOfLines,
      editable: !disabled,
      autoCapitalize,
      className: inputClassName,
      style: {
        textAlignVertical: multiline ? 'top' : 'center',
      } as any,
    };

    return (
      <View className="w-full">
        {label && (
          <Text className="font-sans-medium text-base text-wise-text mb-2">
            {label}
          </Text>
        )}
        <RNTextInput {...textInputProps} />
        {error && (
          <Text className="font-sans text-sm text-wise-error mt-1">
            {error}
          </Text>
        )}
      </View>
    );
  }
);
