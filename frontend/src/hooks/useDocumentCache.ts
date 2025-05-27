import { useState, useEffect, useCallback } from 'react';
import { Document } from '../types';
import { STORAGE_KEYS } from '../utils/constants';
import { useWebSocket } from './useWebSocket';

interface DocumentCache {
  documents: Document[];
  lastUpdated: number;
}

export const useDocumentCache = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const { on, off } = useWebSocket();

  // Load cache from localStorage
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.DOCUMENT_CACHE);
    if (cached) {
      try {
        const data: DocumentCache = JSON.parse(cached);
        setDocuments(data.documents);
      } catch (error) {
        console.error('Failed to parse document cache:', error);
      }
    }
    setCacheLoaded(true);
  }, []);

  const updateCache = useCallback((newDocuments: Document[]) => {
    const cache: DocumentCache = {
      documents: newDocuments,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.DOCUMENT_CACHE, JSON.stringify(cache));
  }, []);

  // Subscribe to WebSocket events
  useEffect(() => {
    // Handle document created
    const handleDocumentCreated = (payload: { document: Document }) => {
      setDocuments(prev => {
        const updated = [...prev, payload.document];
        updateCache(updated);
        return updated;
      });
    };

    // Handle document deleted
    const handleDocumentDeleted = (payload: { document_id: string }) => {
      setDocuments(prev => {
        const updated = prev.filter(doc => doc.id !== payload.document_id);
        updateCache(updated);
        return updated;
      });
    };

    // Handle documents updated (bulk update)
    const handleDocumentsUpdated = (payload: { documents: Document[] }) => {
      setDocuments(payload.documents);
      updateCache(payload.documents);
    };

    // Register event handlers
    on('document:created', handleDocumentCreated);
    on('document:deleted', handleDocumentDeleted);
    on('documents:updated', handleDocumentsUpdated);

    // Cleanup
    return () => {
      off('document:created');
      off('document:deleted');
      off('documents:updated');
    };
  }, [on, off, updateCache]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.DOCUMENT_CACHE);
    setDocuments([]);
  }, []);

  const needsRefresh = useCallback(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.DOCUMENT_CACHE);
    if (!cached) return true;
    
    try {
      const data: DocumentCache = JSON.parse(cached);
      // Consider cache stale after 1 hour
      return Date.now() - data.lastUpdated > 3600000;
    } catch {
      return true;
    }
  }, []);

  return {
    documents,
    cacheLoaded,
    updateCache,
    clearCache,
    needsRefresh,
  };
}; 