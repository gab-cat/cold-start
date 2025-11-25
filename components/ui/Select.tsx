import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { IconSymbol } from './icon-symbol';
import { WiseColors } from '@/constants/theme';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
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
            className={`text-base font-sans ${
              selectedOption ? 'text-wise-text' : 'text-wise-text-secondary'
            }`}
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
                {label || 'Select Option'}
              </Text>
            </View>

            <ScrollView className="max-h-[400px]">
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  className={`p-4 border-b border-wise-subtle ${
                    option.value === value ? 'bg-wise-primary-light' : ''
                  }`}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text
                    className={`text-base font-sans ${
                      option.value === value
                        ? 'text-wise-primary-dark font-sans-bold'
                        : 'text-wise-text'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              className="p-4 bg-wise-subtle"
              onPress={() => setIsOpen(false)}
            >
              <Text className="font-sans-bold text-base text-wise-text text-center">
                Cancel
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
