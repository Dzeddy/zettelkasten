export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/v1';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  THEME_MODE: 'themeMode',
  DOCUMENT_CACHE: 'documentCache',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
  },
  DOCUMENTS: {
    LIST: '/documents',
    UPLOAD: '/documents/upload',
    DELETE: '/documents',
    CHUNKS: '/documents', // Will be used as `/documents/{id}/chunks`
  },
  SEARCH: '/search',
} as const;

export const FILE_UPLOAD = {
  ACCEPTED_TYPES: '.txt,.md,.json,.zip,.pdf,.docx,.doc,.rtf,.html,.htm,.csv,.xml,.yaml,.yml,.org,.tex,.rst,.adoc,.asciidoc',
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

export const SEARCH_CONFIG = {
  DEFAULT_LIMIT: 100,
  DEFAULT_SIMILARITY_THRESHOLD: 0.3,
} as const; 