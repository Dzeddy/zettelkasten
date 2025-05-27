import React from 'react';
import { Theme } from '../../types';

interface AnalyticsData {
  searches: number;
  documents: number;
  chunks: number;
  apiCalls: number;
}

interface AnalyticsCardsProps {
  theme: Theme;
  data: AnalyticsData;
}

export const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({
  theme,
  data,
}) => {
  const stats = [
    { label: 'Searches', value: data.searches },
    { label: 'Documents', value: data.documents },
    { label: 'Chunks', value: data.chunks },
    { label: 'API Calls', value: data.apiCalls },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`p-6 rounded-lg border ${theme.border} text-center transition-all hover:scale-105`}
        >
          <p className={`text-3xl font-bold ${theme.goldAccent}`}>
            {stat.value.toLocaleString()}
          </p>
          <p className={`${theme.textSecondary} mt-1`}>{stat.label}</p>
        </div>
      ))}
    </div>
  );
}; 