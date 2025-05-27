# Folder Upload Functionality

This document describes the new folder upload functionality added to the Zettelkasten frontend application.

## Overview

The application now supports uploading entire folders and recursively extracting all supported file types from them. This is particularly useful for importing large collections of notes, documentation, or knowledge bases.

## Features

### 1. Enhanced Upload Interface
- **Tabbed Interface**: Switch between "Upload Files" and "Upload Folder" modes
- **Drag & Drop Support**: Drag folders directly onto the upload area
- **File Browser**: Click to browse and select folders using the native file picker

### 2. Recursive File Extraction
- **Deep Scanning**: Recursively scans all subdirectories within the uploaded folder
- **Smart Filtering**: Automatically identifies and extracts only supported file types
- **Path Preservation**: Maintains the original folder structure information for each file

### 3. Supported File Types
The following file types are automatically detected and extracted:
- **Text Files**: `.txt`, `.md`, `.org`, `.rst`, `.adoc`, `.asciidoc`
- **Documents**: `.pdf`, `.docx`, `.doc`, `.rtf`, `.html`, `.htm`
- **Data Files**: `.json`, `.csv`, `.xml`, `.yaml`, `.yml`
- **Archives**: `.zip`
- **Academic**: `.tex`

### 4. Visual Feedback
- **File Categorization**: Clearly separates supported and unsupported files
- **Progress Indication**: Shows processing status while scanning folders
- **File Details**: Displays file paths, sizes, and counts
- **Removal Options**: Individual file removal before upload

## How to Use

### Method 1: Drag & Drop
1. Navigate to the Upload tab in the dashboard
2. Select "Upload Folder" tab
3. Drag a folder from your file system onto the upload area
4. Wait for the recursive scan to complete
5. Review the extracted files
6. Choose your source type (Standard, Notion, Obsidian, etc.)
7. Click "Upload X Supported Files"

### Method 2: File Browser
1. Navigate to the Upload tab in the dashboard
2. Select "Upload Folder" tab
3. Click "Drop folder here or click to browse"
4. Select a folder in the file picker dialog
5. Wait for the recursive scan to complete
6. Review the extracted files
7. Choose your source type
8. Click "Upload X Supported Files"

## Technical Implementation

### Components
- **`EnhancedUpload`**: Main component with tabbed interface
- **`FolderUpload`**: Specialized component for folder uploads
- **`FileUpload`**: Original component for individual file uploads

### Utilities
- **`fileUtils.ts`**: Contains helper functions for:
  - File type validation
  - Recursive file extraction
  - File size checking
  - Statistics calculation

### Browser APIs Used
- **File System Access API**: For folder selection
- **DataTransfer API**: For drag & drop functionality
- **FileReader API**: For file processing

## Browser Compatibility

### Folder Upload Support
- **Chrome/Edge**: Full support (webkitdirectory attribute)
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile Browsers**: Limited support (fallback to file upload)

### Drag & Drop Support
- **Desktop Browsers**: Full support for folder drag & drop
- **Mobile Browsers**: File drag & drop only

## Performance Considerations

### File Limits
- **Maximum File Size**: 10MB per file
- **Recommended Folder Size**: Under 1000 files for optimal performance
- **Processing Time**: ~30 seconds per file for backend processing

### Memory Usage
- Files are processed in batches to prevent memory issues
- Large folders are scanned progressively
- Unsupported files are filtered out early to save memory

## Error Handling

### Common Issues
1. **Unsupported File Types**: Automatically filtered and displayed separately
2. **File Size Limits**: Files exceeding 10MB are marked as unsupported
3. **Permission Errors**: Handled gracefully with user feedback
4. **Network Timeouts**: Retry mechanisms for upload failures

### User Feedback
- Clear error messages for failed uploads
- Progress indicators during processing
- Success confirmations with job IDs
- File count summaries

## Future Enhancements

### Planned Features
- **Zip File Extraction**: Automatic extraction of zip files within folders
- **Batch Processing**: Improved handling of very large folder uploads
- **Preview Mode**: Preview file contents before upload
- **Custom Filters**: User-defined file type filters
- **Progress Tracking**: Real-time upload progress for individual files

### API Improvements
- **Streaming Uploads**: For better handling of large files
- **Parallel Processing**: Multiple file processing streams
- **Resume Capability**: Resume interrupted uploads
- **Metadata Extraction**: Automatic tag and metadata extraction

## Troubleshooting

### Common Problems

1. **Folder Not Uploading**
   - Ensure browser supports folder upload
   - Check if folder contains supported file types
   - Verify folder permissions

2. **Files Missing After Upload**
   - Check if files exceed size limits
   - Verify file types are supported
   - Review unsupported files list

3. **Slow Processing**
   - Large folders take time to scan
   - Network speed affects upload time
   - Consider uploading smaller batches

### Getting Help
- Check browser console for detailed error messages
- Review the supported file types list
- Contact support with specific error details 