import React from 'react';
import { Search, FileText, Upload, BarChart3 } from 'lucide-react';
import { Theme, DashboardTab } from '../../types';

interface TabNavigationProps {
  theme: Theme;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  showMobileMenu: boolean;
  onMobileMenuClose: () => void;
}

const tabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
  { id: 'search', label: 'Search', icon: <Search className="w-4 h-4" /> },
  { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
  { id: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
];

export const TabNavigation: React.FC<TabNavigationProps> = ({
  theme,
  activeTab,
  onTabChange,
  showMobileMenu,
  onMobileMenuClose,
}) => {
  const handleTabClick = (tab: DashboardTab) => {
    onTabChange(tab);
    onMobileMenuClose();
  };

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex space-x-1 ml-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              px-4 py-2 rounded-lg capitalize transition-all flex items-center space-x-2
              ${activeTab === tab.id 
                ? `${theme.goldGradient} text-black` 
                : `${theme.hoverBg} ${theme.text}`
              }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className={`md:hidden border-t ${theme.border} ${theme.bg}`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  w-full px-4 py-2 rounded-lg text-left transition-all flex items-center space-x-2
                  ${activeTab === tab.id 
                    ? `${theme.goldGradient} text-black` 
                    : `${theme.hoverBg} ${theme.text}`
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}; 