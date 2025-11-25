import React from 'react';
import { View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'elevated' | 'flat' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'elevated',
  padding = 'md',
}) => {
  const getPaddingClass = () => {
    switch (padding) {
    case 'none':
      return 'p-0';
    case 'sm':
      return 'p-2';
    case 'lg':
      return 'p-6';
    case 'xl':
      return 'p-8';
    default:
      return 'p-4';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
    case 'elevated':
      return 'bg-wise-surface-elevated shadow-sm';
    case 'flat':
      return 'bg-wise-subtle';
    case 'outlined':
      return 'bg-wise-surface border border-wise-border';
    default:
      return 'bg-wise-surface-elevated shadow-sm';
    }
  };

  return (
    <View
      className={`rounded-wise-lg ${getVariantClasses()} ${getPaddingClass()} ${className}`}
    >
      {children}
    </View>
  );
};
