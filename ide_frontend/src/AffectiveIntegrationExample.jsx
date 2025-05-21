import React, { useState, useEffect } from 'react';
import { Controlled as CodeMirrorEditor } from 'react-codemirror2';
import AffectiveQuickActionsBar from './components/QuickActionsBar/AffectiveQuickActionsBar';
import QuickActionsPanel from './components/QuickActionsPanel/QuickActionsPanel';
import PersonaSelector from './components/PersonaSelector/PersonaSelector';
import { PersonaProvider } from './components/PersonaSelector/PersonaContext';
import RipplePreview from './components/RipplePreview/RipplePreview';
import affectiveAgentSuggestionsService from './services/affectiveAgentSuggestionsService';
import conceptGraphService from './services/conceptGraphService';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material-darker.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/jsx/jsx';
import './AffectiveIntegrationExample.css';

/**
 * AffectiveIntegrationExample Component
 * 
 * This component demonstrates the integration of affective computing
 * capabilities into the ALAN IDE, showing how the system can respond
 * to emotional context and provide persona-specific suggestions.
 */
function AffectiveIntegrationExample() {
  // State for agent suggestions and UI state
  const [agentSuggestions, setAgentSuggestions] = useState([]);
  const [activePersona, setActivePersona] = useState('default');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [code, setCode] = useState('// Your code here');
  const [conceptGraph, setConceptGraph] = useState({nodes: [], edges: []});
  
  // Fetch initial data
  useEffect(() => {
    // Fetch agent suggestions
    const fetchSuggestions = async () => {
      try {
        const suggestions = await affectiveAgentSuggestionsService.getSuggestions();
        setAgentSuggestions(suggestions);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      }
    };
    
    // Fetch concept graph
    const fetchConceptGraph = async () => {
      try {
        const graphData = await conceptGraphService.getConceptGraph();
        setConceptGraph(graphData);
      } catch (error) {
        console.error('Failed to fetch concept graph:', error);
      }
    };
    
    fetchSuggestions();
    fetchConceptGraph();
  }, []);
  
  // Handle code changes
  const handleEditorChange = (editor, data, value) => {
    setCode(value);
  };
  
  return (
    <PersonaProvider>
      <div className="affective-integration-example">
      <header className="example-header">
        <h1>ALAN IDE - Affective Computing Integration</h1>
      </header>
      
      <div className="example-content">
        <div className="editor-container">
          <CodeMirrorEditor
            value={code}
            options={{
              mode: 'jsx',
              theme: 'material-darker',
              lineNumbers: true
            }}
            onBeforeChange={handleEditorChange}
          />
          
          {showQuickActions && (
            <div className="quick-actions-overlay">
              <QuickActionsPanel
                suggestions={agentSuggestions.filter(s => s.persona === activePersona)}
                onClose={() => setShowQuickActions(false)}
                onApply={(suggestion) => console.log('Applied suggestion:', suggestion)}
              />
            </div>
          )}
        </div>
        
        <div className="sidebar">
          <PersonaSelector
            activePersona={activePersona}
            onSelectPersona={setActivePersona}
            personas={[
              { id: 'default', name: 'Default', icon: '👤' },
              { id: 'helper', name: 'Helper', icon: '🤝' },
              { id: 'critic', name: 'Critic', icon: '🧐' },
              { id: 'creative', name: 'Creative', icon: '🎨' }
            ]}
          />
          
          <AffectiveQuickActionsBar
            suggestions={agentSuggestions}
            activePersona={activePersona}
            onShowAll={() => setShowQuickActions(true)}
          />
          
          <RipplePreview
            conceptGraph={conceptGraph}
            newConcepts={['affect', 'emotion', 'sentiment']}
          />
        </div>
      </div>
      </div>
    </PersonaProvider>
  );
};

export default AffectiveIntegrationExample;
