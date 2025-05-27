import { useState, useEffect } from 'react';
import { Theme } from '../types';
import { STORAGE_KEYS } from '../utils/constants';

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const theme: Theme = {
    bg: isDarkMode ? 'bg-black' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-gray-400' : 'text-gray-600',
    border: isDarkMode ? 'border-yellow-600/30' : 'border-yellow-600/50',
    cardBg: isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50',
    inputBg: isDarkMode ? 'bg-gray-900/70' : 'bg-gray-100',
    hoverBg: isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-200/50',
    goldAccent: 'text-yellow-500',
    goldBorder: 'border-yellow-500',
    goldGradient: 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600'
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return {
    isDarkMode,
    theme,
    toggleTheme
  };
}; 