import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { IconSymbol } from './icon-symbol';
import { WiseColors } from '@/constants/theme';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = 'Select options',
  label,
  error,
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOptions = options.filter(option => value.includes(option.value));
  const displayText = selectedOptions.length > 0
    ? selectedOptions.map(opt => opt.label).join(', ')
    : placeholder;

  const handleToggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onValueChange(newValue);
  };

  const containerClassName = `
    bg-wise-surface border rounded-wise-md px-4 py-3 min-h-[48px] justify-center
    ${error ? 'border-wise-error' : 'border-wise-border'}
    ${disabled ? 'opacity-50' : ''}
    ${className || ''}
  `.trim();

  return (
    <View className="w-full">
      {label && (
        <Text className="font-sans-medium text-base text-wise-text mb-2">
          {label}
        </Text>
      )}

      <TouchableOpacity
        className={containerClassName}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <View className="flex-row items-center justify-between">
          <Text
            className={`text-base font-sans flex-1 ${
              selectedOptions.length > 0 ? 'text-wise-text' : 'text-wise-text-secondary'
            }`}
            numberOfLines={2}
          >
            {displayText}
          </Text>
          <IconSymbol
            name="chevron.right"
            size={16}
            color={WiseColors.textSecondary}
            style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setIsOpen(false)}
        >
          <View className="bg-wise-surface rounded-t-wise-xl max-h-[60%]">
            <View className="p-4 border-b border-wise-border">
              <Text className="font-archivo-bold text-lg text-wise-text text-center">
                {label || 'Select Options'}
              </Text>
            </View>

            <ScrollView className="max-h-[400px]">
              {options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    className={`p-4 border-b border-wise-subtle flex-row items-center justify-between ${
                      isSelected ? 'bg-wise-primary-light' : ''
                    }`}
                    onPress={() => handleToggleOption(option.value)}
                  >
                    <Text
                      className={`text-base font-sans ${
                        isSelected
                          ? 'text-wise-primary-dark font-sans-bold'
                          : 'text-wise-text'
                      }`}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <View className="w-5 h-5 bg-wise-primary rounded-full items-center justify-center">
                        <IconSymbol
                          name="chevron.right"
                          size={12}
                          color="#FFFFFF"
                          style={{ transform: [{ rotate: '-90deg' }] }}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              className="p-4 bg-wise-subtle"
              onPress={() => setIsOpen(false)}
            >
              <Text className="font-sans-bold text-base text-wise-text text-center">
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {error && (
        <Text className="font-sans text-sm text-wise-error mt-1">
          {error}
        </Text>
      )}
    </View>
  );
};
