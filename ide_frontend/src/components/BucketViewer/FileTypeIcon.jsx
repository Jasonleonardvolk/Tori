import React from 'react';

/**
 * FileTypeIcon component that displays an appropriate icon based on file type
 */
const FileTypeIcon = ({ contentType }) => {
  const getIconForContentType = (contentType) => {
    if (!contentType) return '📄'; // Default document icon
    
    const type = contentType.toLowerCase();
    
    // Images
    if (type.startsWith('image/')) {
      return '🖼️';
    }
    
    // PDFs
    if (type === 'application/pdf') {
      return '📕';
    }
    
    // Text files
    if (type.startsWith('text/')) {
      return '📝';
    }
    
    // Audio files
    if (type.startsWith('audio/')) {
      return '🔊';
    }
    
    // Video files
    if (type.startsWith('video/')) {
      return '🎬';
    }
    
    // Archive files
    if (type.includes('zip') || type.includes('tar') || 
        type.includes('rar') || type.includes('gzip')) {
      return '🗄️';
    }
    
    // Code files
    if (type.includes('javascript') || type.includes('typescript') || 
        type.includes('python') || type.includes('java') || 
        type.includes('html') || type.includes('css')) {
      return '📋';
    }
    
    // JSON/XML data files
    if (type.includes('json') || type.includes('xml')) {
      return '📊';
    }
    
    // Fallback
    return '📄';
  };
  
  const icon = getIconForContentType(contentType);
  
  return (
    <div className="file-icon" title={contentType || 'Unknown type'}>
      {icon}
    </div>
  );
};

export default FileTypeIcon;
