import { FILE_UPLOAD } from './constants';

export interface ExtractedFile {
  file: File;
  path: string;
  isSupported: boolean;
}

/**
 * Checks if a file type is supported based on the file extension
 */
export const isSupportedFileType = (fileName: string): boolean => {
  const supportedExtensions = FILE_UPLOAD.ACCEPTED_TYPES.split(',').map(ext => ext.trim());
  const fileExtension = '.' + fileName.split('.').pop()?.toLowerCase();
  return supportedExtensions.includes(fileExtension);
};

/**
 * Checks if a file size is within the allowed limit
 */
export const isValidFileSize = (fileSize: number): boolean => {
  return fileSize <= FILE_UPLOAD.MAX_SIZE;
};

/**
 * Extracts files from a FileList (from folder upload) and categorizes them
 */
export const extractFilesFromFolder = async (fileList: FileList): Promise<ExtractedFile[]> => {
  const extractedFiles: ExtractedFile[] = [];
  
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    
    // Get the relative path from the file's webkitRelativePath
    const relativePath = (file as any).webkitRelativePath || file.name;
    
    // Check if file is supported and valid
    const isSupported = isSupportedFileType(file.name) && isValidFileSize(file.size);
    
    extractedFiles.push({
      file,
      path: relativePath,
      isSupported
    });
  }
  
  return extractedFiles;
};

/**
 * Filters files to only include supported ones
 */
export const filterSupportedFiles = (extractedFiles: ExtractedFile[]): File[] => {
  return extractedFiles
    .filter(item => item.isSupported)
    .map(item => item.file);
};

/**
 * Gets file statistics from extracted files
 */
export const getFileStats = (extractedFiles: ExtractedFile[]) => {
  const supported = extractedFiles.filter(item => item.isSupported);
  const unsupported = extractedFiles.filter(item => !item.isSupported);
  
  return {
    total: extractedFiles.length,
    supported: supported.length,
    unsupported: unsupported.length,
    totalSize: supported.reduce((sum, item) => sum + item.file.size, 0)
  };
}; 