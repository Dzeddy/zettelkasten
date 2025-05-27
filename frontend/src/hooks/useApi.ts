import { useState } from 'react';
import { Document, SearchResult, SearchRequest, UploadRequest, ApiResponse, Chunk } from '../types';
import { API_URL, API_ENDPOINTS, SEARCH_CONFIG } from '../utils/constants';

export const useApi = (token: string | null) => {
  const [isLoading, setIsLoading] = useState(false);

  const makeRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data };
      } else {
        return { 
          success: false, 
          error: { message: data.error?.message || 'Request failed' }
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

  const search = async (request: SearchRequest): Promise<ApiResponse<{ results: SearchResult[] }>> => {
    const searchData = {
      query: request.query,
      limit: request.limit || SEARCH_CONFIG.DEFAULT_LIMIT,
      similarity_threshold: request.similarity_threshold || SEARCH_CONFIG.DEFAULT_SIMILARITY_THRESHOLD,
    };

    return makeRequest(API_ENDPOINTS.SEARCH, {
      method: 'POST',
      body: JSON.stringify(searchData),
    });
  };

  const getDocuments = async (): Promise<ApiResponse<{ documents: Document[] }>> => {
    return makeRequest(API_ENDPOINTS.DOCUMENTS.LIST);
  };

  const uploadDocuments = async (request: UploadRequest): Promise<ApiResponse<{ job_id: string }>> => {
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      request.files.forEach(file => {
        formData.append('files[]', file);
      });
      formData.append('source_type', request.source_type);
      
      const response = await fetch(`${API_URL}${API_ENDPOINTS.DOCUMENTS.UPLOAD}`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data };
      } else {
        return { 
          success: false, 
          error: { message: data.error?.message || 'Upload failed' }
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: { message: 'Upload failed. Please try again.' }
      };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDocument = async (documentId: string): Promise<ApiResponse> => {
    return makeRequest(`${API_ENDPOINTS.DOCUMENTS.DELETE}/${documentId}`, {
      method: 'DELETE',
    });
  };

  const getDocumentChunks = async (documentId: string): Promise<ApiResponse<{ chunks: Chunk[] }>> => {
    return makeRequest(`${API_ENDPOINTS.DOCUMENTS.CHUNKS}/${documentId}/chunks`);
  };

  return {
    isLoading,
    search,
    getDocuments,
    uploadDocuments,
    deleteDocument,
    getDocumentChunks,
  };
}; 