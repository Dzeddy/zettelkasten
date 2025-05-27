import React, { useState } from 'react';
import { User, Lock, Mail } from 'lucide-react';
import { Theme, AuthMode } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface AuthFormProps {
  theme: Theme;
  mode: AuthMode;
  isLoading: boolean;
  onSubmit: (credentials: { email: string; password: string; name?: string }) => void;
  onModeToggle: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  theme,
  mode,
  isLoading,
  onSubmit,
  onModeToggle,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (mode === 'signup' && !name) newErrors.name = 'Name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({ email, password, name: mode === 'signup' ? name : undefined });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'signup' && (
        <Input
          theme={theme}
          label="Name"
          icon={<User className="w-4 h-4" />}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          error={errors.name}
        />
      )}
      
      <Input
        theme={theme}
        label="Email"
        icon={<Mail className="w-4 h-4" />}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        error={errors.email}
      />
      
      <Input
        theme={theme}
        label="Password"
        icon={<Lock className="w-4 h-4" />}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        error={errors.password}
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        theme={theme}
        isLoading={isLoading}
        className="w-full"
      >
        {mode === 'login' ? 'Login' : 'Sign Up'}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onModeToggle}
          className={`${theme.goldAccent} hover:underline`}
        >
          {mode === 'login' 
            ? "Don't have an account? Sign up" 
            : "Already have an account? Login"
          }
        </button>
      </div>
    </form>
  );
}; 