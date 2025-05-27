import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Theme } from '../../types';

interface SearchBarProps {
  theme: Theme;
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  theme,
  onSearch,
  isLoading = false,
  placeholder = "Search your knowledge base...",
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className={`
          w-full px-6 py-4 pr-12 rounded-xl border-2 transition-all text-lg
          ${theme.goldBorder} ${theme.inputBg} ${theme.text}
          focus:ring-2 focus:ring-yellow-500 focus:border-transparent
        `}
      />
      <button
        type="submit"
        disabled={isLoading || !query.trim()}
        className={`
          absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg
          ${theme.goldGradient} text-black disabled:opacity-50 transition-all
        `}
      >
        <Search className="w-6 h-6" />
      </button>
    </form>
  );
}; 