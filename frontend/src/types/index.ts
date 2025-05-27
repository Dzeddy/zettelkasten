export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  source_type: string;
  chunk_count: number;
  uploaded_at: string;
  tags?: string[];
}

export interface Chunk {
  id: string;
  document_id: string;
  user_id: string;
  content: string;
  chunk_index: number;
  metadata: {
    [key: string]: any;
  };
  created_at: string;
}

export interface SearchResult {
  id: string;
  content: string;
  similarity_score: number;
  source: {
    document_id: string;
    title: string;
    type: string;
    original_path: string;
  };
  metadata: {
    chunk_index: number;
    content: string;
    created_at: number;
    document_id: string;
    source_type: string;
    user_id: string;
  };
}

export interface UploadFile extends File {
  id?: string;
}

export interface Theme {
  bg: string;
  text: string;
  textSecondary: string;
  border: string;
  cardBg: string;
  inputBg: string;
  hoverBg: string;
  goldAccent: string;
  goldBorder: string;
  goldGradient: string;
}

export type ViewType = 'landing' | 'auth' | 'dashboard';
export type AuthMode = 'login' | 'signup';
export type DashboardTab = 'search' | 'documents' | 'upload' | 'analytics';
export type SourceType = 'standard' | 'notion' | 'obsidian' | 'roam' | 'logseq';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface SearchRequest {
  query: string;
  limit?: number;
  similarity_threshold?: number;
}

export interface UploadRequest {
  files: File[];
  source_type: SourceType;
}

export interface AuthMessage {
  type: 'success' | 'error' | 'info';
  message: string;
} 