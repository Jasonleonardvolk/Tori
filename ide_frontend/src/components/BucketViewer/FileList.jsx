import React from 'react';
import FileTypeIcon from './FileTypeIcon';

/**
 * FileList component to display files and directories in the current path
 */
const FileList = ({ files, directories, onFileSelect, onDirectorySelect, selectedFile }) => {
  // Helper to get class name for file item
  const getFileClassName = (file) => {
    let className = 'file-item';
    
    if (selectedFile && selectedFile.path === file.path) {
      className += ' selected';
    }
    
    return className;
  };
  
  return (
    <div className="file-list">
      {directories.length === 0 && files.length === 0 ? (
        <div className="empty-state">
          <p>No files found in this location.</p>
        </div>
      ) : (
        <>
          {/* Directory listing */}
          {directories.length > 0 && (
            <div className="directory-list">
              <h3 className="list-section-title">Directories</h3>
              <ul>
                {directories.map((dir, index) => (
                  <li 
                    key={`dir-${index}`}
                    className="directory-item"
                    onClick={() => onDirectorySelect(dir.path)}
                  >
                    <div className="folder-icon">📁</div>
                    <div className="item-name">{dir.name}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* File listing */}
          {files.length > 0 && (
            <div className="files-list">
              <h3 className="list-section-title">Files</h3>
              <ul>
                {files.map((file, index) => (
                  <li 
                    key={`file-${index}`}
                    className={getFileClassName(file)}
                    onClick={() => onFileSelect(file)}
                  >
                    <FileTypeIcon contentType={file.content_type} />
                    <div className="item-name">{file.name}</div>
                    <div className="item-size">{file.size_formatted || formatFileSize(file.size)}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Helper to format file size if not already formatted
const formatFileSize = (size) => {
  if (typeof size !== 'number') return 'Unknown';
  
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  } else if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
};

export default FileList;
