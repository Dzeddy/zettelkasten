import React from 'react';
import { ChevronRight, Zap, Archive, Sparkles } from 'lucide-react';
import { Theme } from '../types';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface LandingPageProps {
  theme: Theme;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  theme,
  isDarkMode,
  onThemeToggle,
  onGetStarted,
}) => {
  return (
    <div className="min-h-screen transition-colors duration-300">
      <Header
        theme={theme}
        isDarkMode={isDarkMode}
        onThemeToggle={onThemeToggle}
        onAuthClick={onGetStarted}
      />

      <main className="pt-20">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-7xl font-bold">
                <span className={theme.goldAccent}>Zettelkasten:</span> Your Second Brain
              </h1>
              <p className={`text-xl sm:text-2xl ${theme.textSecondary}`}>
                Transform scattered notes into connected knowledge
              </p>
            </div>
            
            <Card theme={theme} variant="bordered" className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold mb-4">What this project offers</h2>
              <div className="space-y-4 text-left">
                <p className={theme.textSecondary}>
                  Transform your scattered notes into a powerful knowledge graph. Upload from Notion, Obsidian, 
                  Roam, or Logseq and unlock semantic search across all your ideas.
                </p>
                <div className="grid sm:grid-cols-3 gap-4 mt-6">
                  <div className={`p-4 rounded-lg border ${theme.border} ${theme.hoverBg} transition-colors`}>
                    <Zap className={`w-8 h-8 ${theme.goldAccent} mb-2`} />
                    <h3 className="font-semibold mb-1">Smart Search</h3>
                    <p className={`text-sm ${theme.textSecondary}`}>AI-powered semantic search finds connections you missed</p>
                  </div>
                  <div className={`p-4 rounded-lg border ${theme.border} ${theme.hoverBg} transition-colors`}>
                    <Archive className={`w-8 h-8 ${theme.goldAccent} mb-2`} />
                    <h3 className="font-semibold mb-1">Universal Import</h3>
                    <p className={`text-sm ${theme.textSecondary}`}>Support for all major note-taking platforms</p>
                  </div>
                  <div className={`p-4 rounded-lg border ${theme.border} ${theme.hoverBg} transition-colors`}>
                    <Sparkles className={`w-8 h-8 ${theme.goldAccent} mb-2`} />
                    <h3 className="font-semibold mb-1">Knowledge Graph</h3>
                    <p className={`text-sm ${theme.textSecondary}`}>Visualize connections between your ideas</p>
                  </div>
                </div>
              </div>
            </Card>

            <Button
              onClick={onGetStarted}
              variant="primary"
              size="lg"
              theme={theme}
              className="shadow-lg hover:shadow-xl"
            >
              Try Now
              <ChevronRight className="inline-block ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}; 