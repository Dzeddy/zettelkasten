import React, { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Upload, BarChart3 } from 'lucide-react';
import { Theme, DashboardTab, Document, SearchResult, SourceType } from '../types';
import { Header } from '../components/layout/Header';
import { TabNavigation } from '../components/dashboard/TabNavigation';
import { Card } from '../components/ui/Card';
import { SearchBar } from '../components/search/SearchBar';
import { SearchResults, ExportItem } from '../components/search/SearchResults';
import { ExportModal } from '../components/search/ExportModal';
import { DocumentList } from '../components/documents/DocumentList';
import { EnhancedUpload } from '../components/upload/EnhancedUpload';
import { UploadProgress } from '../components/upload/UploadProgress';
import { AnalyticsCards } from '../components/analytics/AnalyticsCards';
import { useDocumentCache } from '../hooks/useDocumentCache';

interface DashboardPageProps {
  theme: Theme;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onLogout: () => void;
  onSearch: (query: string) => Promise<SearchResult[]>;
  onUpload: (files: File[], sourceType: SourceType) => Promise<string | null>;
  onLoadDocuments: () => Promise<Document[]>;
  onDeleteDocument: (id: string) => Promise<void>;
  isLoading: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  theme,
  isDarkMode,
  onThemeToggle,
  onLogout,
  onSearch,
  onUpload,
  onLoadDocuments,
  onDeleteDocument,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('search');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeJobIds, setActiveJobIds] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportItems, setExportItems] = useState<ExportItem[]>([]);
  
  // Use the document cache hook
  const { 
    documents, 
    cacheLoaded, 
    updateCache, 
    needsRefresh 
  } = useDocumentCache();

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await onLoadDocuments();
      updateCache(docs); // Update the cache
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  }, [onLoadDocuments, updateCache]);

  // Load documents on mount or when cache needs refresh
  useEffect(() => {
    if (cacheLoaded && needsRefresh()) {
      loadDocuments();
    }
  }, [cacheLoaded, needsRefresh, loadDocuments]);

  // Also load when switching to documents tab if needed
  useEffect(() => {
    if (activeTab === 'documents' && documents.length === 0) {
      loadDocuments();
    }
  }, [activeTab, documents.length, loadDocuments]);

  const handleSearch = async (query: string) => {
    try {
      const results = await onSearch(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleUpload = async (files: File[], sourceType: SourceType): Promise<string | null> => {
    try {
      const jobId = await onUpload(files, sourceType);
      // Track the job ID if it was returned
      if (jobId) {
        setActiveJobIds(prev => [...prev, jobId]);
      }
      // Refresh documents if we're on the documents tab
      if (activeTab === 'documents') {
        loadDocuments();
      }
      return jobId;
    } catch (error) {
      console.error('Upload failed:', error);
      return null;
    }
  };

  const handleJobComplete = (jobId: string) => {
    // Remove completed job from active jobs
    setActiveJobIds(prev => prev.filter(id => id !== jobId));
    // Refresh documents when job completes
    loadDocuments();
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await onDeleteDocument(id);
      loadDocuments(); // Refresh the list
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleExport = (items: ExportItem[]) => {
    setExportItems(items);
    setShowExportModal(true);
  };

  const handleCloseExportModal = () => {
    setShowExportModal(false);
    setExportItems([]);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'search':
        return (
          <Card theme={theme} variant="bordered">
            <h2 className="text-3xl font-bold mb-6 flex items-center">
              <Search className={`w-8 h-8 ${theme.goldAccent} mr-3`} />
              Semantic Search
            </h2>
            
            <div className="space-y-6">
              <SearchBar
                theme={theme}
                onSearch={handleSearch}
                isLoading={isLoading}
              />
              
              {searchResults.length > 0 && (
                <SearchResults
                  theme={theme}
                  results={searchResults}
                  onExportClick={handleExport}
                />
              )}
            </div>
          </Card>
        );

      case 'documents':
        return (
          <Card theme={theme} variant="bordered">
            <h2 className="text-3xl font-bold mb-6 flex items-center">
              <FileText className={`w-8 h-8 ${theme.goldAccent} mr-3`} />
              Your Documents
            </h2>
            
            <DocumentList
              theme={theme}
              documents={documents}
              onDelete={handleDeleteDocument}
            />
          </Card>
        );

      case 'upload':
        return (
          <div className="space-y-6">
            <Card theme={theme} variant="bordered">
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <Upload className={`w-8 h-8 ${theme.goldAccent} mr-3`} />
                Upload Documents
              </h2>
              
              <EnhancedUpload
                theme={theme}
                onUpload={handleUpload}
                isLoading={isLoading}
              />
            </Card>
            
            {activeJobIds.length > 0 && (
              <Card theme={theme} variant="bordered">
                <UploadProgress
                  theme={theme}
                  jobIds={activeJobIds}
                  onJobComplete={handleJobComplete}
                />
              </Card>
            )}
          </div>
        );

      case 'analytics':
        return (
          <Card theme={theme} variant="bordered">
            <h2 className="text-3xl font-bold mb-6 flex items-center">
              <BarChart3 className={`w-8 h-8 ${theme.goldAccent} mr-3`} />
              Usage Analytics
            </h2>
            
            <AnalyticsCards
              theme={theme}
              data={{
                searches: 145,
                documents: documents.length,
                chunks: documents.reduce((sum, doc) => sum + doc.chunk_count, 0),
                apiCalls: 467,
              }}
            />
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300">
      <Header
        theme={theme}
        isDarkMode={isDarkMode}
        onThemeToggle={onThemeToggle}
        onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
        showMobileMenu={showMobileMenu}
        isAuthenticated={true}
        onLogout={onLogout}
      >
        <TabNavigation
          theme={theme}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showMobileMenu={showMobileMenu}
          onMobileMenuClose={() => setShowMobileMenu(false)}
        />
      </Header>

      <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="py-8">
          {renderTabContent()}
        </div>
      </main>

      {showExportModal && (
        <ExportModal
          theme={theme}
          exportItems={exportItems}
          isOpen={showExportModal}
          onClose={handleCloseExportModal}
        />
      )}
    </div>
  );
}; 