import React from 'react';
import { FileText, X, Calendar, Hash } from 'lucide-react';
import { Theme, Document } from '../../types';

interface DocumentListProps {
  theme: Theme;
  documents: Document[];
  onDelete?: (documentId: string) => void;
  onDocumentClick?: (document: Document) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  theme,
  documents,
  onDelete,
  onDocumentClick,
}) => {
  if (documents.length === 0) {
    return (
      <div className={`text-center py-12 ${theme.textSecondary}`}>
        <FileText className={`w-16 h-16 ${theme.goldAccent} mx-auto mb-4`} />
        <h3 className="text-xl font-semibold mb-2">No documents uploaded yet</h3>
        <p>Start by uploading your notes to build your knowledge base!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Your Documents ({documents.length})</h3>
      </div>
      
      <div className="grid gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            onClick={() => onDocumentClick?.(doc)}
            className={`
              p-4 rounded-lg border transition-all
              ${theme.border} ${theme.hoverBg}
              ${onDocumentClick ? 'cursor-pointer hover:scale-[1.01]' : ''}
            `}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <FileText className={`w-5 h-5 ${theme.goldAccent} mr-2`} />
                  <h4 className="font-semibold">{doc.title}</h4>
                </div>
                
                <div className={`text-sm ${theme.textSecondary} space-y-1`}>
                  <div className="flex items-center">
                    <span className="capitalize">{doc.source_type}</span>
                    <span className="mx-2">•</span>
                    <Hash className="w-3 h-3 mr-1" />
                    <span>{doc.chunk_count} chunks</span>
                    <span className="mx-2">•</span>
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {doc.tags.map((tag, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2 py-1 rounded-full ${theme.goldAccent} bg-yellow-500/10`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(doc.id);
                  }}
                  className={`p-2 rounded-lg ${theme.hoverBg} text-red-500 hover:bg-red-500/10 transition-colors`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 