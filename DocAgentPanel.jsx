// ALAN IDE – DocAgentPanel (Story 3.3)
// Author: Cascade (2025-05-07)
// Features: live doc capsules, underdocumented region alerts, SelectionContext sync
// Updated: ScholarSphere integration, citation previews, knowledge base hooks

import React, { useState, useEffect } from 'react';
import { useSelection } from './SelectionContext';

// Example expected data structure for documentation
// const docData = { capsules: [{ id, summary, coverage }], alerts: ["Node X needs docs", ...] };

// ScholarSphere knowledge data structure
// const knowledgeData = { 
//   concepts: [{ id, title, source, relevance }],
//   citations: [{ id, text, source, page }]
// };

// Function to fetch knowledge from ScholarSphere via ingest-bus
async function fetchKnowledge(query, limit = 5) {
  try {
    const response = await fetch('http://localhost:8080/kb/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query, 
        limit, 
        min_relevance: 0.7,
        include_source: true 
      })
    });
    
    if (!response.ok) {
      throw new Error(`Knowledge search failed: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      concepts: data.results.map(r => ({
        id: r.chunk_id,
        title: r.text.substring(0, 60) + '...',
        source: r.source || 'Unknown source',
        relevance: r.relevance
      })),
      citations: data.results.map(r => ({
        id: r.chunk_id,
        text: r.text.substring(0, 120) + '...',
        source: r.source || 'Unknown source',
        concepts: r.concepts || []
      }))
    };
  } catch (error) {
    console.error('Error fetching knowledge:', error);
    return { concepts: [], citations: [] };
  }
}

export default function DocAgentPanel({ 
  docData = { capsules: [], alerts: [] },
  initialQuery = ''
}) {
  const { selected, setSelected } = useSelection();
  const [knowledgeData, setKnowledgeData] = useState({ concepts: [], citations: [] });
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activePreview, setActivePreview] = useState(null);
  
  // Fetch knowledge when search query changes
  useEffect(() => {
    if (searchQuery) {
      setIsLoadingKnowledge(true);
      fetchKnowledge(searchQuery)
        .then(data => {
          setKnowledgeData(data);
          setIsLoadingKnowledge(false);
        })
        .catch(() => {
          setIsLoadingKnowledge(false);
        });
    }
  }, [searchQuery]);
  // Handle clicking on a concept to view in Phase Field Lens
  const handleConceptClick = (conceptId) => {
    setSelected([conceptId]);
    // Close any active preview
    setActivePreview(null);
  };
  
  // Handle hovering on a citation to show preview
  const handleCitationHover = (citationId) => {
    setActivePreview(citationId);
  };
  
  return (
    <div style={{padding: 16}}>
      <h4 style={{color: '#00FFCC', marginBottom: 8}}>Live Doc Capsules</h4>
      {docData.capsules.length === 0 ? (
        <span style={{color: '#A9B1BD'}}>No documentation capsules found.</span>
      ) : docData.capsules.map((c, i) => (
        <div key={i} style={{marginBottom: 6}}>
          <b style={{color:'#FFD700'}}>Node {c.id}:</b>
          <span style={{marginLeft: 6, color: '#A9B1BD'}}>{c.summary}</span>
          <span style={{marginLeft: 10, color: c.coverage < 0.5 ? '#FF6B6B' : '#00FFCC'}}>
            ({(c.coverage*100).toFixed(0)}% doc)
          </span>
          <button
            style={{
              marginLeft: 10,
              background: selected.includes(c.id) ? '#00FFCC' : '#23272F',
              color: selected.includes(c.id) ? '#23272F' : '#A9B1BD',
              border: '1px solid #00FFCC',
              borderRadius: 4,
              padding: '2px 7px',
              cursor: 'pointer',
              fontWeight: 600
            }}
            onClick={() => setSelected([c.id])}
          >Focus</button>
        </div>
      ))}
      
      <h4 style={{color: '#FFD700', margin: '14px 0 8px'}}>Alerts</h4>
      <ul style={{color: '#A9B1BD', fontSize: 15}}>
        {docData.alerts.length === 0 ? (
          <li>No alerts.</li>
        ) : docData.alerts.map((a, i) => <li key={i}>{a}</li>)}
      </ul>
      
      {/* ScholarSphere Knowledge Integration */}
      <h4 style={{color: '#00FFCC', margin: '20px 0 10px'}}>Knowledge Base</h4>
      
      {/* Search input */}
      <div style={{marginBottom: 12, display: 'flex'}}>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search knowledge base..."
          style={{
            flex: 1,
            background: '#1E2127',
            border: '1px solid #444',
            color: '#FFF',
            padding: '6px 8px',
            borderRadius: 4
          }}
        />
        <button
          onClick={() => setSearchQuery(searchQuery)} // Refresh search
          disabled={isLoadingKnowledge || !searchQuery}
          style={{
            marginLeft: 8,
            background: !searchQuery ? '#333' : '#00FFCC',
            color: !searchQuery ? '#777' : '#1E2127',
            border: 'none',
            borderRadius: 4,
            padding: '0 10px',
            cursor: searchQuery ? 'pointer' : 'default',
            fontWeight: 600
          }}
        >
          {isLoadingKnowledge ? '...' : 'Search'}
        </button>
      </div>
      
      {/* Knowledge results */}
      {searchQuery && (
        <div style={{marginTop: 10}}>
          {isLoadingKnowledge ? (
            <div style={{color: '#A9B1BD', fontStyle: 'italic'}}>Searching ScholarSphere...</div>
          ) : knowledgeData.citations.length === 0 ? (
            <div style={{color: '#A9B1BD'}}>No knowledge found for "{searchQuery}"</div>
          ) : (
            <div>
              <div style={{marginBottom: 8, fontSize: 14, color: '#A9B1BD'}}>
                Found {knowledgeData.citations.length} citations
              </div>
              
              {/* Citation results with preview capability */}
              {knowledgeData.citations.map((citation, i) => (
                <div 
                  key={i} 
                  style={{
                    marginBottom: 12,
                    background: '#1E2127',
                    border: '1px solid #333',
                    borderRadius: 6,
                    padding: 10
                  }}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{color: '#FFD700', fontWeight: 600}}>
                      [§{citation.source}]
                    </div>
                    <div>
                      <button
                        style={{
                          marginLeft: 8,
                          background: 'transparent',
                          color: '#00FFCC',
                          border: '1px solid #00FFCC',
                          borderRadius: 4,
                          padding: '2px 7px',
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                        onClick={() => handleConceptClick(citation.id)}
                      >
                        View in Lens
                      </button>
                      <button
                        style={{
                          marginLeft: 8,
                          background: activePreview === citation.id ? '#00FFCC' : 'transparent',
                          color: activePreview === citation.id ? '#1E2127' : '#00FFCC',
                          border: '1px solid #00FFCC',
                          borderRadius: 4,
                          padding: '2px 7px',
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                        onMouseEnter={() => handleCitationHover(citation.id)}
                        onMouseLeave={() => setActivePreview(null)}
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                  
                  {/* Citation text */}
                  <div style={{
                    color: '#A9B1BD', 
                    marginTop: 6,
                    fontSize: 13,
                    overflow: 'hidden',
                    maxHeight: activePreview === citation.id ? '200px' : '40px',
                    transition: 'max-height 0.3s ease'
                  }}>
                    {citation.text}
                  </div>
                  
                  {/* Associated concepts */}
                  {activePreview === citation.id && citation.concepts && citation.concepts.length > 0 && (
                    <div style={{
                      marginTop: 8,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 4
                    }}>
                      {citation.concepts.map((concept, j) => (
                        <span
                          key={j}
                          style={{
                            background: '#2E3440',
                            color: '#7FDBFF',
                            padding: '2px 6px',
                            borderRadius: 12,
                            fontSize: 11
                          }}
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
