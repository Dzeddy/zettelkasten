import React from 'react';
import { Brain, Sun, Moon, LogOut, Menu, X } from 'lucide-react';
import { Theme } from '../../types';
import { Button } from '../ui/Button';

interface HeaderProps {
  theme: Theme;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onMenuToggle?: () => void;
  showMobileMenu?: boolean;
  isAuthenticated?: boolean;
  onLogout?: () => void;
  onAuthClick?: () => void;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  isDarkMode,
  onThemeToggle,
  onMenuToggle,
  showMobileMenu = false,
  isAuthenticated = false,
  onLogout,
  onAuthClick,
  children,
}) => {
  return (
    <nav className={`border-b ${theme.border} backdrop-blur-sm fixed w-full top-0 z-50 ${theme.bg}/80`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Brain className={`w-8 h-8 ${theme.goldAccent}`} />
            <span className="text-xl font-bold hidden sm:inline">Zettelkasten</span>
            {children}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onThemeToggle}
              className={`p-2 rounded-lg ${theme.hoverBg} transition-colors`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {isAuthenticated ? (
              <button
                onClick={onLogout}
                className={`p-2 rounded-lg ${theme.hoverBg} transition-colors`}
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                theme={theme}
                onClick={onAuthClick}
              >
                Login
              </Button>
            )}
            
            {onMenuToggle && (
              <button
                onClick={onMenuToggle}
                className={`md:hidden p-2 rounded-lg ${theme.hoverBg}`}
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}; 