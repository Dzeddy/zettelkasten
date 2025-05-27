import React, { useState, useRef } from 'react';
import { FolderOpen, X, FileText, AlertCircle } from 'lucide-react';
import { Theme, SourceType } from '../../types';
import { FILE_UPLOAD } from '../../utils/constants';
import { Button } from '../ui/Button';
import { extractFilesFromFolder, ExtractedFile } from '../../utils/fileUtils';

interface FolderUploadProps {
  theme: Theme;
  onUpload: (files: File[], sourceType: SourceType) => Promise<string | null>;
  isLoading?: boolean;
}

// Extend HTMLInputElement to include webkitdirectory
declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    webkitdirectory?: string;
  }
}

export const FolderUpload: React.FC<FolderUploadProps> = ({
  theme,
  onUpload,
  isLoading = false,
}) => {
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([]);
  const [sourceType, setSourceType] = useState<SourceType>('standard');
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = async (files: FileList | null) => {
    if (!files) return;
    
    setIsProcessing(true);
    try {
      const extracted = await extractFilesFromFolder(files);
      setExtractedFiles(extracted);
    } catch (error) {
      console.error('Error processing folder:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const items = Array.from(e.dataTransfer.items);
    const files: File[] = [];
    
    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          await processEntry(entry, files);
        }
      }
    }
    
    if (files.length > 0) {
      setIsProcessing(true);
      try {
        const fileList = new DataTransfer();
        files.forEach(file => fileList.items.add(file));
        const extracted = await extractFilesFromFolder(fileList.files);
        setExtractedFiles(extracted);
      } catch (error) {
        console.error('Error processing dropped folder:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const processEntry = async (entry: any, files: File[]): Promise<void> => {
    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file((file: File) => {
          files.push(file);
          resolve();
        });
      });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      return new Promise((resolve) => {
        reader.readEntries(async (entries: any[]) => {
          for (const childEntry of entries) {
            await processEntry(childEntry, files);
          }
          resolve();
        });
      });
    }
  };

  const removeFile = (index: number) => {
    setExtractedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const supportedFiles = extractedFiles
      .filter(item => item.isSupported)
      .map(item => item.file);
    
    if (supportedFiles.length > 0) {
      try {
        await onUpload(supportedFiles, sourceType);
        setExtractedFiles([]);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  };

  const supportedFiles = extractedFiles.filter(item => item.isSupported);
  const unsupportedFiles = extractedFiles.filter(item => !item.isSupported);

  return (
    <div className="space-y-6">
      <div>
        <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
          Source Type
        </label>
        <select
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as SourceType)}
          className={`w-full px-4 py-3 rounded-lg border ${theme.border} ${theme.inputBg} ${theme.text} focus:ring-2 focus:ring-yellow-500`}
        >
          <option value="standard">Standard (Text/Markdown)</option>
          <option value="notion">Notion</option>
          <option value="obsidian">Obsidian</option>
          <option value="roam">Roam Research</option>
          <option value="logseq">Logseq</option>
        </select>
      </div>

      <div>
        <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
          Folder Upload
        </label>
        <div
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-all
            ${dragActive ? `${theme.goldBorder} bg-yellow-500/5` : theme.goldBorder}
            ${theme.hoverBg}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory=""
            multiple
            onChange={(e) => handleFolderSelect(e.target.files)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="w-full"
            disabled={isProcessing}
          >
            <FolderOpen className={`w-12 h-12 ${theme.goldAccent} mx-auto mb-4`} />
            <p className="text-lg font-medium">
              {isProcessing ? 'Processing folder...' : 'Drop folder here or click to browse'}
            </p>
            <p className={`text-sm ${theme.textSecondary} mt-2`}>
              Recursively extracts all supported files: {FILE_UPLOAD.ACCEPTED_TYPES}
            </p>
            <p className={`text-xs ${theme.textSecondary} mt-1`}>
              Max {FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB per file
            </p>
          </button>
        </div>
        
        {extractedFiles.length > 0 && (
          <div className="mt-6 space-y-4">
            {supportedFiles.length > 0 && (
              <div>
                <h4 className={`text-sm font-medium mb-3 ${theme.text} flex items-center`}>
                  <FileText className="w-4 h-4 mr-2 text-green-500" />
                  Supported Files ({supportedFiles.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {supportedFiles.map((item, idx) => (
                    <div key={idx} className={`p-3 rounded-lg ${theme.inputBg} flex justify-between items-center`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.file.name}</div>
                        <div className={`text-xs ${theme.textSecondary} truncate`}>
                          {item.path} • {(item.file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(extractedFiles.findIndex(f => f === item))}
                        className={`p-1 rounded ${theme.hoverBg} text-red-500 ml-2 flex-shrink-0`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unsupportedFiles.length > 0 && (
              <div>
                <h4 className={`text-sm font-medium mb-3 ${theme.textSecondary} flex items-center`}>
                  <AlertCircle className="w-4 h-4 mr-2 text-yellow-500" />
                  Unsupported Files ({unsupportedFiles.length}) - Will be skipped
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {unsupportedFiles.slice(0, 10).map((item, idx) => (
                    <div key={idx} className={`p-2 rounded ${theme.inputBg} opacity-60`}>
                      <div className={`text-xs ${theme.textSecondary} truncate`}>
                        {item.path}
                      </div>
                    </div>
                  ))}
                  {unsupportedFiles.length > 10 && (
                    <div className={`text-xs ${theme.textSecondary} text-center py-2`}>
                      ... and {unsupportedFiles.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Button
        onClick={handleUpload}
        disabled={supportedFiles.length === 0 || isLoading}
        variant="primary"
        size="lg"
        theme={theme}
        isLoading={isLoading}
        className="w-full"
      >
        Upload {supportedFiles.length} Supported Files
      </Button>
    </div>
  );
}; 