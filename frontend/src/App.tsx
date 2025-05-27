import React, { useState, useEffect } from 'react';
import { ViewType, AuthMode, Document, SearchResult, SourceType, AuthMessage } from './types';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useApi } from './hooks/useApi';
import { STORAGE_KEYS } from './utils/constants';
import { wsService } from './services/websocket';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [authMessage, setAuthMessage] = useState<AuthMessage | null>(null);
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { authState, isLoading: authLoading, authenticate, logout } = useAuth();
  const api = useApi(authState.token);

  // Update WebSocket token when auth state changes
  useEffect(() => {
    wsService.updateToken(authState.token);
  }, [authState.token]);

  // Apply theme background to body for infinite scroll background
  useEffect(() => {
    const bodyClass = isDarkMode ? 'bg-black' : 'bg-white';
    const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
    
    // Remove any existing background classes
    document.body.classList.remove('bg-black', 'bg-white', 'text-white', 'text-gray-900');
    
    // Add current theme classes
    document.body.classList.add(bodyClass, textClass);
    
    // Cleanup function to remove classes when component unmounts
    return () => {
      document.body.classList.remove('bg-black', 'bg-white', 'text-white', 'text-gray-900');
    };
  }, [isDarkMode]);

  useEffect(() => {
    if (authState.isAuthenticated) {
      setCurrentView('dashboard');
      // Clear any auth messages when successfully authenticated
      setAuthMessage(null);
    } else {
      setCurrentView('landing');
    }
  }, [authState.isAuthenticated]);

  const handleAuth = async (mode: AuthMode, credentials: { email: string; password: string; name?: string }) => {
    // Clear any existing messages
    setAuthMessage(null);
    
    const result = await authenticate(mode, credentials);
    
    if (result.success) {
      if (mode === 'login') {
        setCurrentView('dashboard');
      } else {
        setAuthMessage({
          type: 'success',
          message: 'Registration successful!'
        });
      }
    } else {
      setAuthMessage({
        type: 'error',
        message: result.error?.message || 'Authentication failed'
      });
    }
  };

  const handleClearAuthMessage = () => {
    setAuthMessage(null);
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem(STORAGE_KEYS.DOCUMENT_CACHE); // Clear document cache
    setCurrentView('landing');
    setAuthMessage(null);
  };

  const handleSearch = async (query: string): Promise<SearchResult[]> => {
    const result = await api.search({ query });
    if (result.success) {
      return result.data?.results || [];
    } else {
      throw new Error(result.error?.message || 'Search failed');
    }
  };

  const handleUpload = async (files: File[], sourceType: SourceType): Promise<string | null> => {
    const result = await api.uploadDocuments({ files, source_type: sourceType });
    if (result.success) {
      return result.data?.job_id || null;
    } else {
      throw new Error(result.error?.message || 'Upload failed');
    }
  };

  const handleLoadDocuments = async (): Promise<Document[]> => {
    const result = await api.getDocuments();
    if (result.success) {
      return result.data?.documents || [];
    } else {
      throw new Error(result.error?.message || 'Failed to load documents');
    }
  };

  const handleDeleteDocument = async (id: string): Promise<void> => {
    const result = await api.deleteDocument(id);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to delete document');
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return (
          <LandingPage
            theme={theme}
            isDarkMode={isDarkMode}
            onThemeToggle={toggleTheme}
            onGetStarted={() => {
              setCurrentView('auth');
              setAuthMessage(null);
            }}
          />
        );

      case 'auth':
        return (
          <AuthPage
            theme={theme}
            isDarkMode={isDarkMode}
            onThemeToggle={toggleTheme}
            onBack={() => {
              setCurrentView('landing');
              setAuthMessage(null);
            }}
            onAuth={handleAuth}
            isLoading={authLoading}
            message={authMessage}
            onClearMessage={handleClearAuthMessage}
          />
        );

      case 'dashboard':
        return authState.isAuthenticated ? (
          <DashboardPage
            theme={theme}
            isDarkMode={isDarkMode}
            onThemeToggle={toggleTheme}
            onLogout={handleLogout}
            onSearch={handleSearch}
            onUpload={handleUpload}
            onLoadDocuments={handleLoadDocuments}
            onDeleteDocument={handleDeleteDocument}
            isLoading={api.isLoading}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className={`App min-h-full ${theme.bg} ${theme.text} transition-colors duration-300`}>
      {renderCurrentView()}
    </div>
  );
};

export default App; 