import React, { useState, useEffect } from 'react';

/**
 * FileDetails component to display metadata and preview for the selected file
 */
const FileDetails = ({ file }) => {
  const [fileDetails, setFileDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (file) {
      fetchFileDetails(file.path);
    }
  }, [file]);
  
  const fetchFileDetails = async (filePath) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/bucket/view?file_path=${encodeURIComponent(filePath)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file details: ${response.statusText}`);
      }
      
      const data = await response.json();
      setFileDetails(data);
      
    } catch (err) {
      console.error('Error fetching file details:', err);
      setError(`Failed to load file details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownload = async () => {
    if (!file) return;
    
    try {
      const response = await fetch(`/api/bucket/download?file_path=${encodeURIComponent(file.path)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to generate download URL: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Open the download URL in a new tab
      window.open(data.download_url, '_blank');
      
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(`Failed to download file: ${err.message}`);
    }
  };
  
  const renderFilePreview = () => {
    if (!fileDetails || !fileDetails.signed_url) return null;
    
    const { metadata, signed_url } = fileDetails;
    const type = metadata.content_type || '';
    
    // PDF preview
    if (type === 'application/pdf') {
      return (
        <div className="pdf-preview">
          <iframe 
            src={signed_url} 
            title={metadata.name}
            width="100%"
            height="500px"
            className="pdf-iframe"
          />
        </div>
      );
    }
    
    // Image preview
    if (type.startsWith('image/')) {
      return (
        <div className="image-preview">
          <img 
            src={signed_url}
            alt={metadata.name}
            className="preview-image"
          />
        </div>
      );
    }
    
    // Text preview (for smaller text files)
    if (type.startsWith('text/') && metadata.size < 100000) {
      return (
        <div className="text-preview">
          <iframe 
            src={signed_url}
            title={metadata.name}
            width="100%"
            height="400px"
            className="text-iframe"
          />
        </div>
      );
    }
    
    // For other file types, show a "no preview available" message
    return (
      <div className="no-preview">
        <p>No preview available for this file type.</p>
        <button onClick={handleDownload} className="download-button">
          Download File
        </button>
      </div>
    );
  };
  
  if (!file) {
    return <div className="file-details-empty">Select a file to view details</div>;
  }
  
  if (loading) {
    return <div className="file-details-loading">Loading file details...</div>;
  }
  
  if (error) {
    return <div className="file-details-error">{error}</div>;
  }
  
  return (
    <div className="file-details">
      <div className="file-details-header">
        <h2>{file.name}</h2>
        <button onClick={handleDownload} className="download-button">
          Download
        </button>
      </div>
      
      {fileDetails && (
        <>
          <div className="file-metadata">
            <div className="metadata-item">
              <span className="metadata-label">Type:</span>
              <span className="metadata-value">{fileDetails.metadata.content_type || 'Unknown'}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Size:</span>
              <span className="metadata-value">{fileDetails.metadata.size_formatted}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Last Modified:</span>
              <span className="metadata-value">
                {fileDetails.metadata.updated ? new Date(fileDetails.metadata.updated).toLocaleString() : 'Unknown'}
              </span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Path:</span>
              <span className="metadata-value">{fileDetails.metadata.path}</span>
            </div>
          </div>
          
          <div className="file-preview-container">
            {renderFilePreview()}
          </div>
        </>
      )}
    </div>
  );
};

export default FileDetails;
