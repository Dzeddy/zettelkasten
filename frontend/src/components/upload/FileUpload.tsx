import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Theme, SourceType } from '../../types';
import { FILE_UPLOAD } from '../../utils/constants';
import { Button } from '../ui/Button';

interface FileUploadProps {
  theme: Theme;
  onUpload: (files: File[], sourceType: SourceType) => Promise<string | null>;
  isLoading?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  theme,
  onUpload,
  isLoading = false,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [sourceType, setSourceType] = useState<SourceType>('standard');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    
    const validFiles = Array.from(newFiles).filter(file => {
      const isValidType = FILE_UPLOAD.ACCEPTED_TYPES.split(',').some(type => 
        file.name.toLowerCase().endsWith(type.replace('.', ''))
      );
      const isValidSize = file.size <= FILE_UPLOAD.MAX_SIZE;
      return isValidType && isValidSize;
    });
    
    setFiles(prev => [...prev, ...validFiles]);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length > 0) {
      try {
        await onUpload(files, sourceType);
        setFiles([]);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  };

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
          Files
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
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            accept={FILE_UPLOAD.ACCEPTED_TYPES}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Upload className={`w-12 h-12 ${theme.goldAccent} mx-auto mb-4`} />
            <p className="text-lg font-medium">Drop files here or click to browse</p>
            <p className={`text-sm ${theme.textSecondary} mt-2`}>
              Supports {FILE_UPLOAD.ACCEPTED_TYPES} files (max {FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB each)
            </p>
          </button>
        </div>
        
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, idx) => (
              <div key={idx} className={`p-3 rounded-lg ${theme.inputBg} flex justify-between items-center`}>
                <div>
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className={`text-xs ${theme.textSecondary} ml-2`}>
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={() => removeFile(idx)}
                  className={`p-1 rounded ${theme.hoverBg} text-red-500`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={handleUpload}
        disabled={files.length === 0 || isLoading}
        variant="primary"
        size="lg"
        theme={theme}
        isLoading={isLoading}
        className="w-full"
      >
        Upload Files
      </Button>
    </div>
  );
}; 