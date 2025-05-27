import { useState, useEffect } from 'react';
import { AuthState, AuthMode, ApiResponse } from '../types';
import { API_URL, API_ENDPOINTS, STORAGE_KEYS } from '../utils/constants';

interface AuthCredentials {
  email: string;
  password: string;
  name?: string;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        token,
      }));
    }
  }, []);

  const login = async (credentials: AuthCredentials): Promise<ApiResponse> => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const token = data.access_token;
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        setAuthState({
          isAuthenticated: true,
          user: data.user,
          token,
        });
        return { success: true, data };
      } else {
        return { 
          success: false, 
          error: { message: data.error?.message || 'Login failed' }
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: { message: 'Network error. Please try again.' }
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (credentials: AuthCredentials): Promise<ApiResponse> => {
    if (!credentials.name) {
      return { 
        success: false, 
        error: { message: 'Name is required for signup' }
      };
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}${API_ENDPOINTS.AUTH.SIGNUP}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          name: credentials.name,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data };
      } else {
        return { 
          success: false, 
          error: { message: data.error?.message || 'Signup failed' }
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: { message: 'Network error. Please try again.' }
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  };

  const authenticate = async (
    mode: AuthMode, 
    credentials: AuthCredentials
  ): Promise<ApiResponse> => {
    if (!credentials.email || !credentials.password || 
        (mode === 'signup' && !credentials.name)) {
      return { 
        success: false, 
        error: { message: 'Please fill in all required fields' }
      };
    }

    return mode === 'login' ? login(credentials) : signup(credentials);
  };

  return {
    authState,
    isLoading,
    authenticate,
    logout,
  };
}; 