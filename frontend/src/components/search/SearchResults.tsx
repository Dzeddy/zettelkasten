import React, { useState, useMemo } from 'react';
import { Download, Check, Square, FileText, Package } from 'lucide-react';
import { Theme, SearchResult } from '../../types';
import { Button } from '../ui/Button';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { ChunkModal } from './ChunkModal';

interface SearchResultsProps {
  theme: Theme;
  results: SearchResult[];
  onResultClick?: (result: SearchResult) => void;
  onExportClick?: (exportItems: ExportItem[]) => void;
}

export interface ExportItem {
  id: string;
  type: 'chunk' | 'document';
  title: string;
  content: string;
  documentId: string;
  chunkIndex?: number;
  selected: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  theme,
  results,
  onResultClick,
  onExportClick,
}) => {
  const [documentContents, setDocumentContents] = useState<Map<string, string>>(new Map());
  const [loadingDocuments, setLoadingDocuments] = useState<Set<string>>(new Set());
  const [selectedChunk, setSelectedChunk] = useState<SearchResult | null>(null);
  const [isChunkModalOpen, setIsChunkModalOpen] = useState(false);
  
  const { authState } = useAuth();
  const api = useApi(authState.token);

  // Group results by document and create export items
  const exportItems = useMemo(() => {
    const documentMap = new Map<string, SearchResult[]>();
    
    // Group chunks by document
    results.forEach(result => {
      const docId = result.source.document_id;
      if (!documentMap.has(docId)) {
        documentMap.set(docId, []);
      }
      documentMap.get(docId)!.push(result);
    });

    const items: ExportItem[] = [];
    
    // Create export items for each document group
    documentMap.forEach((chunks, docId) => {
      const firstChunk = chunks[0];
      
      // Add document-level item
      // Use cached full document content if available, otherwise use concatenated chunks
      const documentContent = documentContents.get(docId) || chunks
        .sort((a, b) => a.metadata.chunk_index - b.metadata.chunk_index)
        .map(chunk => chunk.content)
        .join('\n\n');
      
      items.push({
        id: `doc_${docId}`,
        type: 'document',
        title: firstChunk.source.title,
        content: documentContent,
        documentId: docId,
        selected: false,
      });

      // Add individual chunk items
      chunks.forEach(chunk => {
        items.push({
          id: `chunk_${chunk.id}`,
          type: 'chunk',
          title: `${chunk.source.title} - Chunk ${chunk.metadata.chunk_index + 1}`,
          content: chunk.content,
          documentId: docId,
          chunkIndex: chunk.metadata.chunk_index,
          selected: false,
        });
      });
    });

    return items.sort((a, b) => {
      // Sort by document title, then by type (documents first), then by chunk index
      if (a.documentId !== b.documentId) {
        return a.title.localeCompare(b.title);
      }
      if (a.type !== b.type) {
        return a.type === 'document' ? -1 : 1;
      }
      if (a.chunkIndex !== undefined && b.chunkIndex !== undefined) {
        return a.chunkIndex - b.chunkIndex;
      }
      return 0;
    });
  }, [results, documentContents]);

  const loadFullDocumentContent = async (documentId: string) => {
    if (documentContents.has(documentId) || loadingDocuments.has(documentId)) {
      return;
    }

    setLoadingDocuments(prev => new Set(prev).add(documentId));
    
    try {
      const response = await api.getDocumentChunks(documentId);
      if (response.success && response.data?.chunks) {
        const fullContent = response.data.chunks
          .sort((a, b) => a.chunk_index - b.chunk_index)
          .map(chunk => chunk.content)
          .join('\n\n');
        
        setDocumentContents(prev => new Map(prev).set(documentId, fullContent));
      }
    } catch (error) {
      console.error('Failed to load document content:', error);
    } finally {
      setLoadingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  // Load full content for all documents when export is clicked
  const handleExportClick = async () => {
    const documentIds = Array.from(new Set(results.map(r => r.source.document_id)));
    
    // Load full content for all documents
    await Promise.all(documentIds.map(docId => loadFullDocumentContent(docId)));
    
    // Create updated export items with full content
    const updatedExportItems = exportItems.map(item => ({
      ...item,
      content: item.type === 'document' && documentContents.has(item.documentId)
        ? documentContents.get(item.documentId)!
        : item.content
    }));
    
    onExportClick?.(updatedExportItems);
  };

  const handleChunkClick = (result: SearchResult) => {
    setSelectedChunk(result);
    setIsChunkModalOpen(true);
  };

  const handleCloseChunkModal = () => {
    setIsChunkModalOpen(false);
    setSelectedChunk(null);
  };

  if (results.length === 0) {
    return (
      <div className={`text-center py-8 ${theme.textSecondary}`}>
        No results found. Try adjusting your search query.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Results ({results.length})</h3>
        <Button
          onClick={handleExportClick}
          variant="secondary"
          theme={theme}
          className={`flex items-center gap-2`}
        >
          <Download className="w-4 h-4" />
          Export All
        </Button>
      </div>

      {results.map((result, idx) => (
        <div
          key={result.id || idx}
          onClick={() => handleChunkClick(result)}
          className={`
            p-4 rounded-lg border transition-all
            ${theme.border} ${theme.hoverBg}
            cursor-pointer hover:scale-[1.01]
          `}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold">{result.source.title || 'Untitled'}</h4>
            <span className={`text-sm ${theme.textSecondary}`}>
              {(result.similarity_score * 100).toFixed(1)}% match
            </span>
          </div>
          <p className={`${theme.textSecondary} line-clamp-3 mb-2`}>
            {result.content}
          </p>
          <div className={`text-xs ${theme.textSecondary}`}>
            Chunk {result.metadata.chunk_index + 1} • {result.source.type}
          </div>
        </div>
      ))}

      <ChunkModal
        theme={theme}
        chunk={selectedChunk}
        isOpen={isChunkModalOpen}
        onClose={handleCloseChunkModal}
      />
    </div>
  );
}; 