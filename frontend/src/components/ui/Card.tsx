import React from 'react';
import { Theme } from '../../types';

interface CardProps {
  theme: Theme;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
  theme,
  children,
  className = '',
  variant = 'default',
}) => {
  const variantClasses = {
    default: `${theme.cardBg} backdrop-blur-sm`,
    bordered: `border-2 ${theme.goldBorder} ${theme.cardBg} backdrop-blur-sm`,
    elevated: `${theme.cardBg} backdrop-blur-sm shadow-lg`,
  };

  return (
    <div
      className={`
        p-8 rounded-2xl transition-all
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}; 