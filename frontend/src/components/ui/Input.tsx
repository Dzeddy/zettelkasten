import React from 'react';
import { Theme } from '../../types';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  theme: Theme;
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  theme,
  label,
  icon,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className={`block text-sm font-medium ${theme.textSecondary}`}>
          {icon && <span className="inline-block w-4 h-4 mr-1">{icon}</span>}
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 rounded-lg border-2 transition-all
          ${theme.border} ${theme.inputBg} ${theme.text}
          focus:ring-2 focus:ring-yellow-500 focus:border-transparent
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}; 