import React, { useState } from 'react';
import { Brain, ChevronRight } from 'lucide-react';
import { Theme, AuthMode, AuthMessage } from '../types';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { AuthForm } from '../components/auth/AuthForm';

interface AuthPageProps {
  theme: Theme;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onBack: () => void;
  onAuth: (mode: AuthMode, credentials: { email: string; password: string; name?: string }) => Promise<void>;
  isLoading: boolean;
  message?: AuthMessage | null;
  onClearMessage?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  theme,
  isDarkMode,
  onThemeToggle,
  onBack,
  onAuth,
  isLoading,
  message,
  onClearMessage,
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const handleAuth = async (credentials: { email: string; password: string; name?: string }) => {
    await onAuth(authMode, credentials);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <button
        onClick={onBack}
        className={`absolute top-4 left-4 p-2 rounded-lg ${theme.hoverBg}`}
      >
        <ChevronRight className="w-6 h-6 rotate-180" />
      </button>
      
      <button
        onClick={onThemeToggle}
        className={`absolute top-4 right-4 p-2 rounded-lg ${theme.hoverBg}`}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      <Card theme={theme} variant="bordered" className="w-full max-w-md">
        <div className="text-center mb-8">
          <Brain className={`w-16 h-16 ${theme.goldAccent} mx-auto mb-4`} />
          <h2 className="text-3xl font-bold">
            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className={`mt-2 ${theme.textSecondary}`}>
            {authMode === 'login' ? 'Login to access your brain' : 'Start building your second brain'}
          </p>
        </div>

        {message && (
          <Alert
            theme={theme}
            type={message.type}
            message={message.message}
            onClose={onClearMessage}
            className="mb-6"
          />
        )}

        <AuthForm
          theme={theme}
          mode={authMode}
          isLoading={isLoading}
          onSubmit={handleAuth}
          onModeToggle={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
        />
      </Card>
    </div>
  );
}; 