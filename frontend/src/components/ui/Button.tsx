import React from 'react';
import { Theme } from '../../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  theme: Theme;
  children: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  theme,
  children,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-all transform focus:outline-none focus:ring-2 focus:ring-yellow-500';
  
  const variantClasses = {
    primary: `${theme.goldGradient} text-black hover:scale-[1.02] shadow-lg hover:shadow-xl`,
    secondary: `border-2 ${theme.goldBorder} ${theme.goldAccent} hover:bg-yellow-500/10`,
    ghost: `${theme.hoverBg} ${theme.text}`,
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2',
    lg: 'px-8 py-4 text-lg',
  };
  
  const isDisabled = disabled || isLoading;
  
  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}; 