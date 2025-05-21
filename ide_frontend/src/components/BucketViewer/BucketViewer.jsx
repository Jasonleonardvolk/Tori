import React, { useState, useEffect } from 'react';
import PathNavigator from './PathNavigator';
import FileList from './FileList';
import FileDetails from './FileDetails';
import './BucketViewer.css';

/**
 * BucketViewer component for securely browsing and accessing files in the GCS bucket.
 * Provides file listing, navigation, search, and file previews.
 */
const BucketViewer = () => {
  // State
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [directories, setDirectories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [parentPath, setParentPath] = useState('');

  // Load files in the current path
  useEffect(() => {
    if (isSearching) return; // Don't fetch if we're in search mode
    
    fetchFiles(currentPath);
  }, [currentPath]);

  // Fetch files from the API
  const fetchFiles = async (path) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/bucket/list?prefix=${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setFiles(data.files);
      setDirectories(data.directories);
      setParentPath(data.parent_prefix);
      
    } catch (err) {
      console.error('Error fetching files:', err);
      setError(`Failed to load files: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle path navigation
  const navigateTo = (path) => {
    setSelectedFile(null); // Clear selected file when navigating
    setIsSearching(false); // Exit search mode
    setCurrentPath(path);
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setIsSearching(false);
      fetchFiles(currentPath);
      return;
    }
    
    setLoading(true);
    setError(null);
    setIsSearching(true);
    
    try {
      const response = await fetch(`/api/bucket/search?query=${encodeURIComponent(searchQuery)}&prefix=${encodeURIComponent(currentPath)}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSearchResults(data.results);
      
    } catch (err) {
      console.error('Search error:', err);
      setError(`Search failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    fetchFiles(currentPath);
  };

  // Go to parent directory
  const goToParent = () => {
    if (parentPath !== null && parentPath !== undefined) {
      navigateTo(parentPath);
    }
  };

  return (
    <div className="bucket-viewer">
      <div className="bucket-viewer-header">
        <h1>Bucket Explorer</h1>
        <div className="search-container">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">Search</button>
            {isSearching && (
              <button type="button" onClick={clearSearch} className="clear-button">
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      <PathNavigator 
        currentPath={currentPath} 
        navigateTo={navigateTo} 
        goToParent={goToParent}
        hasParent={!!parentPath}
      />

      <div className="bucket-viewer-content">
        <div className="file-list-container">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : isSearching ? (
            <>
              <h2>Search Results for "{searchQuery}"</h2>
              {searchResults.length === 0 ? (
                <p>No files found matching your search.</p>
              ) : (
                <FileList 
                  files={searchResults} 
                  directories={[]} 
                  onFileSelect={handleFileSelect} 
                  onDirectorySelect={navigateTo}
                  selectedFile={selectedFile}
                />
              )}
            </>
          ) : (
            <FileList 
              files={files} 
              directories={directories} 
              onFileSelect={handleFileSelect} 
              onDirectorySelect={navigateTo}
              selectedFile={selectedFile}
            />
          )}
        </div>

        {selectedFile && (
          <div className="file-details-container">
            <FileDetails file={selectedFile} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BucketViewer;
