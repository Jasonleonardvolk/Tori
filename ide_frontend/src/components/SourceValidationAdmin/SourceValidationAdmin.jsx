import React, { useState, useEffect } from 'react';
import './SourceValidationAdmin.css';

/**
 * SourceValidationAdmin component for reviewing rejected documents
 * 
 * This component displays rejected documents from the Source Validator,
 * allowing admins to review, override, or permanently reject documents.
 */
const SourceValidationAdmin = () => {
  const [rejectedDocs, setRejectedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    byReason: {},
    byScore: { low: 0, medium: 0, borderline: 0 }
  });
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  // Fetch rejected documents
  useEffect(() => {
    async function fetchRejectedDocs() {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        const response = await fetch('/api/rejected-documents');
        
        if (!response.ok) {
          throw new Error(`Error fetching rejected documents: ${response.status}`);
        }
        
        const data = await response.json();
        setRejectedDocs(data.documents);
        
        // Calculate stats
        const total = data.documents.length;
        const byReason = data.documents.reduce((acc, doc) => {
          const reason = doc.reason || 'Unknown';
          acc[reason] = (acc[reason] || 0) + 1;
          return acc;
        }, {});
        
        const byScore = data.documents.reduce((acc, doc) => {
          if (doc.quality_score < 0.4) acc.low++;
          else if (doc.quality_score < 0.55) acc.medium++;
          else acc.borderline++;
          return acc;
        }, { low: 0, medium: 0, borderline: 0 });
        
        setStats({ total, byReason, byScore });
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch rejected documents:", err);
        setError("Failed to load rejected documents. Please try again later.");
        setLoading(false);
        
        // For demo purposes, populate with sample data
        const sampleData = generateSampleData();
        setRejectedDocs(sampleData);
        
        // Calculate stats for sample data
        const total = sampleData.length;
        const byReason = sampleData.reduce((acc, doc) => {
          const reason = doc.reason || 'Unknown';
          acc[reason] = (acc[reason] || 0) + 1;
          return acc;
        }, {});
        
        const byScore = sampleData.reduce((acc, doc) => {
          if (doc.quality_score < 0.4) acc.low++;
          else if (doc.quality_score < 0.55) acc.medium++;
          else acc.borderline++;
          return acc;
        }, { low: 0, medium: 0, borderline: 0 });
        
        setStats({ total, byReason, byScore });
      }
    }
    
    fetchRejectedDocs();
  }, []);
  
  // Handle document selection
  const handleSelectDoc = (doc) => {
    setSelectedDoc(doc);
  };
  
  // Handle document approval
  const handleApproveDoc = async (docId) => {
    try {
      // In a real app, this would be an API call
      // await fetch(`/api/rejected-documents/${docId}/approve`, { method: 'POST' });
      
      // Update UI optimistically
      setRejectedDocs(docs => docs.filter(doc => doc.id !== docId));
      setSelectedDoc(null);
      
      // Update stats
      setStats(prevStats => ({
        ...prevStats,
        total: prevStats.total - 1
      }));
      
      alert(`Document ${docId} approved successfully`);
    } catch (err) {
      console.error("Failed to approve document:", err);
      alert("Failed to approve document. Please try again.");
    }
  };
  
  // Handle permanent rejection
  const handlePermanentReject = async (docId) => {
    try {
      // In a real app, this would be an API call
      // await fetch(`/api/rejected-documents/${docId}/permanently-reject`, { method: 'POST' });
      
      // Update UI optimistically
      setRejectedDocs(docs => docs.map(doc => 
        doc.id === docId ? { ...doc, status: 'permanently_rejected' } : doc
      ));
      
      if (selectedDoc && selectedDoc.id === docId) {
        setSelectedDoc({ ...selectedDoc, status: 'permanently_rejected' });
      }
      
      alert(`Document ${docId} permanently rejected`);
    } catch (err) {
      console.error("Failed to permanently reject document:", err);
      alert("Failed to permanently reject document. Please try again.");
    }
  };
  
  // Filter documents based on current filter
  const filteredDocs = rejectedDocs.filter(doc => {
    if (filter === 'all') return true;
    if (filter === 'low' && doc.quality_score < 0.4) return true;
    if (filter === 'medium' && doc.quality_score >= 0.4 && doc.quality_score < 0.55) return true;
    if (filter === 'borderline' && doc.quality_score >= 0.55) return true;
    if (filter === doc.reason) return true;
    return false;
  });
  
  // Sort documents based on current sort
  const sortedDocs = [...filteredDocs].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'date') {
      comparison = new Date(b.rejection_date) - new Date(a.rejection_date);
    } else if (sortBy === 'score') {
      comparison = b.quality_score - a.quality_score;
    } else if (sortBy === 'filename') {
      comparison = a.filename.localeCompare(b.filename);
    }
    
    return sortDir === 'asc' ? -comparison : comparison;
  });
  
  // Generate sample data for demo
  function generateSampleData() {
    const reasonOptions = [
      'Low source credibility', 
      'Insufficient academic structure', 
      'Irrelevant content', 
      'Contains undesirable content',
      'Missing references'
    ];
    
    return Array.from({ length: 25 }, (_, i) => ({
      id: `doc-${i + 1}`,
      filename: `rejected-document-${i + 1}.pdf`,
      rejection_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      quality_score: Math.random() * 0.6,
      reason: reasonOptions[Math.floor(Math.random() * reasonOptions.length)],
      domain_score: Math.random(),
      structure_score: Math.random(),
      content_score: Math.random(),
      status: Math.random() > 0.8 ? 'permanently_rejected' : 'rejected'
    }));
  }
  
  if (loading) {
    return (
      <div className="source-validation-admin source-validation-admin--loading">
        <div className="source-validation-admin__loading">
          Loading rejected documents...
        </div>
      </div>
    );
  }

  return (
    <div className="source-validation-admin">
      <header className="source-validation-admin__header">
        <h1>Source Validation Admin</h1>
        <div className="source-validation-admin__summary">
          <div className="source-validation-admin__stat">
            <span className="source-validation-admin__stat-label">Total Rejected:</span>
            <span className="source-validation-admin__stat-value">{stats.total}</span>
          </div>
          <div className="source-validation-admin__stat">
            <span className="source-validation-admin__stat-label">Low Quality:</span>
            <span className="source-validation-admin__stat-value">{stats.byScore.low}</span>
          </div>
          <div className="source-validation-admin__stat">
            <span className="source-validation-admin__stat-label">Medium Quality:</span>
            <span className="source-validation-admin__stat-value">{stats.byScore.medium}</span>
          </div>
          <div className="source-validation-admin__stat">
            <span className="source-validation-admin__stat-label">Borderline:</span>
            <span className="source-validation-admin__stat-value">{stats.byScore.borderline}</span>
          </div>
        </div>
      </header>

      <div className="source-validation-admin__controls">
        <div className="source-validation-admin__filters">
          <label htmlFor="filter">Filter By:</label>
          <select 
            id="filter" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Rejections</option>
            <option value="low">Low Quality (&lt;0.4)</option>
            <option value="medium">Medium Quality (0.4-0.55)</option>
            <option value="borderline">Borderline (&gt;0.55)</option>
            {Object.keys(stats.byReason).map(reason => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
        </div>

        <div className="source-validation-admin__sort">
          <label htmlFor="sortBy">Sort By:</label>
          <select 
            id="sortBy" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Rejection Date</option>
            <option value="score">Quality Score</option>
            <option value="filename">Filename</option>
          </select>
          
          <button 
            className="source-validation-admin__sort-dir" 
            onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
          >
            {sortDir === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {error && (
        <div className="source-validation-admin__error">
          {error}
        </div>
      )}

      <div className="source-validation-admin__content">
        <div className="source-validation-admin__document-list">
          {sortedDocs.length > 0 ? (
            <table className="source-validation-admin__table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Rejection Date</th>
                  <th>Quality Score</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedDocs.map(doc => (
                  <tr 
                    key={doc.id} 
                    className={`
                      source-validation-admin__row 
                      ${selectedDoc && selectedDoc.id === doc.id ? 'source-validation-admin__row--selected' : ''}
                      ${doc.status === 'permanently_rejected' ? 'source-validation-admin__row--permanent' : ''}
                    `}
                    onClick={() => handleSelectDoc(doc)}
                  >
                    <td className="source-validation-admin__filename">{doc.filename}</td>
                    <td>{new Date(doc.rejection_date).toLocaleDateString()}</td>
                    <td>
                      <div className="source-validation-admin__score">
                        <div className="source-validation-admin__score-bar">
                          <div 
                            className="source-validation-admin__score-fill"
                            style={{ width: `${doc.quality_score * 100}%` }}
                          ></div>
                        </div>
                        <span>{doc.quality_score.toFixed(2)}</span>
                      </div>
                    </td>
                    <td>{doc.reason}</td>
                    <td>
                      {doc.status === 'permanently_rejected' ? 'Permanent' : 'Pending Review'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="source-validation-admin__empty">
              No documents match the current filter criteria.
            </div>
          )}
        </div>

        <div className="source-validation-admin__document-detail">
          {selectedDoc ? (
            <div className="source-validation-admin__detail-content">
              <h2>{selectedDoc.filename}</h2>
              
              <div className="source-validation-admin__detail-meta">
                <div className="source-validation-admin__detail-row">
                  <span className="source-validation-admin__detail-label">Rejection Date:</span>
                  <span className="source-validation-admin__detail-value">
                    {new Date(selectedDoc.rejection_date).toLocaleString()}
                  </span>
                </div>
                <div className="source-validation-admin__detail-row">
                  <span className="source-validation-admin__detail-label">Primary Reason:</span>
                  <span className="source-validation-admin__detail-value">{selectedDoc.reason}</span>
                </div>
                <div className="source-validation-admin__detail-row">
                  <span className="source-validation-admin__detail-label">Status:</span>
                  <span className="source-validation-admin__detail-value">
                    {selectedDoc.status === 'permanently_rejected' ? 'Permanently Rejected' : 'Rejected (Pending Review)'}
                  </span>
                </div>
              </div>
              
              <div className="source-validation-admin__scores">
                <h3>Quality Scores</h3>
                
                <div className="source-validation-admin__detail-score">
                  <span className="source-validation-admin__detail-label">Overall Quality:</span>
                  <div className="source-validation-admin__detail-score-bar">
                    <div 
                      className="source-validation-admin__detail-score-fill"
                      style={{ width: `${selectedDoc.quality_score * 100}%` }}
                    ></div>
                    <span className="source-validation-admin__detail-score-value">
                      {selectedDoc.quality_score.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="source-validation-admin__detail-score">
                  <span className="source-validation-admin__detail-label">Domain Score:</span>
                  <div className="source-validation-admin__detail-score-bar">
                    <div 
                      className="source-validation-admin__detail-score-fill"
                      style={{ width: `${selectedDoc.domain_score * 100}%` }}
                    ></div>
                    <span className="source-validation-admin__detail-score-value">
                      {selectedDoc.domain_score.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="source-validation-admin__detail-score">
                  <span className="source-validation-admin__detail-label">Structure Score:</span>
                  <div className="source-validation-admin__detail-score-bar">
                    <div 
                      className="source-validation-admin__detail-score-fill"
                      style={{ width: `${selectedDoc.structure_score * 100}%` }}
                    ></div>
                    <span className="source-validation-admin__detail-score-value">
                      {selectedDoc.structure_score.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="source-validation-admin__detail-score">
                  <span className="source-validation-admin__detail-label">Content Score:</span>
                  <div className="source-validation-admin__detail-score-bar">
                    <div 
                      className="source-validation-admin__detail-score-fill"
                      style={{ width: `${selectedDoc.content_score * 100}%` }}
                    ></div>
                    <span className="source-validation-admin__detail-score-value">
                      {selectedDoc.content_score.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="source-validation-admin__threshold">
                <h3>Validation Thresholds</h3>
                <p>The platform is currently using the following thresholds:</p>
                <ul>
                  <li><strong>Minimum Quality Score:</strong> 0.6</li>
                  <li><strong>Domain Weight:</strong> 0.4</li>
                  <li><strong>Structure Weight:</strong> 0.3</li>
                  <li><strong>Content Weight:</strong> 0.3</li>
                </ul>
              </div>
              
              <div className="source-validation-admin__preview">
                <h3>Document Preview</h3>
                <div className="source-validation-admin__pdf-placeholder">
                  <p>PDF Preview would appear here in the production version.</p>
                </div>
              </div>
              
              <div className="source-validation-admin__actions">
                {selectedDoc.status !== 'permanently_rejected' ? (
                  <>
                    <button 
                      className="source-validation-admin__action-button source-validation-admin__action-button--approve"
                      onClick={() => handleApproveDoc(selectedDoc.id)}
                    >
                      Override & Approve
                    </button>
                    <button 
                      className="source-validation-admin__action-button source-validation-admin__action-button--reject"
                      onClick={() => handlePermanentReject(selectedDoc.id)}
                    >
                      Permanently Reject
                    </button>
                  </>
                ) : (
                  <div className="source-validation-admin__permanent-message">
                    This document has been permanently rejected and cannot be approved.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="source-validation-admin__detail-placeholder">
              <p>Select a document from the list to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SourceValidationAdmin;
