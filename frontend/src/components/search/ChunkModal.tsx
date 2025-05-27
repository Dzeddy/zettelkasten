import React from 'react';
import { X } from 'lucide-react';
import { Theme, SearchResult } from '../../types';

interface ChunkModalProps {
  theme: Theme;
  chunk: SearchResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ChunkModal: React.FC<ChunkModalProps> = ({
  theme,
  chunk,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !chunk) return null;

  // Get the appropriate background color based on theme
  const getModalBackgroundStyle = () => {
    return {
      backdropFilter: 'blur(8px)',
    };
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Background overlay with enhanced blur and opacity */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal content with proper theme integration */}
      <div className="relative flex items-center justify-center min-h-screen p-4 pointer-events-none">
        <div 
          className={`
            ${theme.cardBg}
            rounded-lg 
            p-6 
            max-w-4xl 
            max-h-[80vh] 
            w-full 
            overflow-hidden 
            flex 
            flex-col 
            shadow-2xl 
            pointer-events-auto
            relative
            isolate
            border
            ${theme.border}
            backdrop-blur-sm
          `}
          style={getModalBackgroundStyle()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-semibold ${theme.text}`}>
              {chunk.source.title || 'Untitled'} - Chunk {chunk.metadata.chunk_index + 1}
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${theme.hoverBg} hover:bg-red-500/10 transition-colors`}
            >
              <X className={`w-5 h-5 ${theme.text}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div 
              className={`
                p-4 
                rounded-lg 
                border 
                ${theme.border} 
                ${theme.cardBg}
                whitespace-pre-wrap
                leading-relaxed
              `}
            >
              <p className={`${theme.text}`}>
                {chunk.content}
              </p>
            </div>
          </div>

          <div className={`flex justify-between items-center mt-4 pt-4 border-t ${theme.border}`}>
            <div className={`text-sm ${theme.textSecondary}`}>
              {(chunk.similarity_score * 100).toFixed(1)}% match • {chunk.source.type}
            </div>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${theme.hoverBg} ${theme.text} hover:scale-105 transition-all`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 