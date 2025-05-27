import React, { useState } from 'react';
import { Upload, FolderOpen } from 'lucide-react';
import { Theme, SourceType } from '../../types';
import { FileUpload } from './FileUpload';
import { FolderUpload } from './FolderUpload';

interface EnhancedUploadProps {
  theme: Theme;
  onUpload: (files: File[], sourceType: SourceType) => Promise<string | null>;
  isLoading?: boolean;
}

type UploadMode = 'files' | 'folder';

export const EnhancedUpload: React.FC<EnhancedUploadProps> = ({
  theme,
  onUpload,
  isLoading = false,
}) => {
  const [uploadMode, setUploadMode] = useState<UploadMode>('files');

  return (
    <div className="space-y-6">
      {/* Upload Mode Tabs */}
      <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <button
          onClick={() => setUploadMode('files')}
          className={`
            flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all
            ${uploadMode === 'files'
              ? `${theme.goldAccent} bg-white dark:bg-gray-700 shadow-sm`
              : `${theme.textSecondary} hover:${theme.text}`
            }
          `}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Files
        </button>
        <button
          onClick={() => setUploadMode('folder')}
          className={`
            flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all
            ${uploadMode === 'folder'
              ? `${theme.goldAccent} bg-white dark:bg-gray-700 shadow-sm`
              : `${theme.textSecondary} hover:${theme.text}`
            }
          `}
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          Upload Folder
        </button>
      </div>

      {/* Upload Content */}
      <div className="min-h-[400px]">
        {uploadMode === 'files' ? (
          <FileUpload
            theme={theme}
            onUpload={onUpload}
            isLoading={isLoading}
          />
        ) : (
          <FolderUpload
            theme={theme}
            onUpload={onUpload}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Help Text */}
      <div className={`text-xs ${theme.textSecondary} space-y-2`}>
        <div className="flex items-start space-x-2">
          <span className="font-medium">Files:</span>
          <span>Upload individual files with drag & drop or file picker</span>
        </div>
        <div className="flex items-start space-x-2">
          <span className="font-medium">Folder:</span>
          <span>Upload entire folders and automatically extract all supported files recursively</span>
        </div>
      </div>
    </div>
  );
}; 