import React from 'react';

/**
 * Breadcrumb-style path navigator for the bucket browser
 */
const PathNavigator = ({ currentPath, navigateTo, goToParent, hasParent }) => {
  // Split the current path into segments
  const segments = currentPath ? currentPath.split('/').filter(Boolean) : [];
  
  // Generate breadcrumb segments
  const buildBreadcrumbs = () => {
    const breadcrumbs = [];
    let currentPathSoFar = '';
    
    // Root segment - always present
    breadcrumbs.push(
      <span 
        key="root" 
        className="path-segment clickable" 
        onClick={() => navigateTo('')}
      >
        Home
      </span>
    );
    
    // Add separator after root if there are segments
    if (segments.length > 0) {
      breadcrumbs.push(<span key="root-sep" className="path-separator">/</span>);
    }
    
    // Add each path segment
    segments.forEach((segment, index) => {
      currentPathSoFar += segment + '/';
      
      breadcrumbs.push(
        <span 
          key={`segment-${index}`}
          className="path-segment clickable"
          onClick={() => navigateTo(currentPathSoFar)}
        >
          {segment}
        </span>
      );
      
      // Add separator except after the last segment
      if (index < segments.length - 1) {
        breadcrumbs.push(<span key={`sep-${index}`} className="path-separator">/</span>);
      }
    });
    
    return breadcrumbs;
  };
  
  return (
    <div className="path-navigator">
      {hasParent && (
        <button 
          className="parent-button" 
          onClick={goToParent}
          title="Go to parent directory"
        >
          ← Up
        </button>
      )}
      
      <div className="breadcrumbs">
        {buildBreadcrumbs()}
      </div>
    </div>
  );
};

export default PathNavigator;
