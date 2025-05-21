// rippleAnalysisService.js
// Service for analyzing and providing ripple effect data for code changes

/**
 * This service provides analysis of how code changes would affect other parts of the codebase.
 * In a real implementation, this would analyze the concept graph and determine dependencies.
 * For this demo, we're generating mock data based on suggestion properties.
 */
const SOCIAL_PENALTY = -0.25;
const SOCIAL_BONUS   =  0.15;

class RippleAnalysisService {
  /**
   * Get affected files for a given suggestion
   * @param {Object} suggestion - The suggestion object
   * @returns {Array} - Array of affected nodes/files
   */
  getAffectedNodes(suggestion) {
    // In a real implementation, this would analyze the concept graph
    // and determine actual dependencies based on code analysis
    
    // For now, we'll generate mock data based on the suggestion type
    if (!suggestion) return [];
    
    const mockData = {
      // For refactoring suggestions
      'Refactorer': [
        {
          fileName: 'useEffects.js',
          filePath: 'src/hooks/useEffects.js',
          icon: '🪝', // hook
          type: 'hook',
          changeType: 'minor',
          changeDescription: 'Pattern used in this hook needs to be updated'
        },
        {
          fileName: 'Button.jsx',
          filePath: 'src/components/Button.jsx',
          icon: '🧩', // component
          type: 'component',
          changeType: 'minor',
          changeDescription: 'Uses the pattern being refactored'
        },
        {
          fileName: 'Dropdown.jsx',
          filePath: 'src/components/Dropdown.jsx',
          icon: '🧩', // component
          type: 'component',
          changeType: 'moderate',
          changeDescription: 'Multiple uses of the pattern being refactored'
        }
      ],
      
      // For security suggestions
      'Security': [
        {
          fileName: 'apiClient.js',
          filePath: 'src/services/apiClient.js',
          icon: '🔌', // service
          type: 'service',
          changeType: 'major',
          changeDescription: 'Security vulnerability needs to be addressed in all API calls'
        },
        {
          fileName: 'authUtils.js',
          filePath: 'src/utils/authUtils.js',
          icon: '🔐', // auth
          type: 'utility',
          changeType: 'major',
          changeDescription: 'Authentication logic affected by security update'
        }
      ],
      
      // For documentation/scholar suggestions
      'Scholar': [
        {
          fileName: 'types.ts',
          filePath: 'src/types/types.ts',
          icon: '📝', // types
          type: 'typedefs',
          changeType: 'minor',
          changeDescription: 'Documentation structure should be consistent with new pattern'
        },
        {
          fileName: 'README.md',
          filePath: 'README.md',
          icon: '📖', // docs
          type: 'documentation',
          changeType: 'minor',
          changeDescription: 'API documentation will need updating'
        }
      ],
      
      // For performance suggestions
      'Performance': [
        {
          fileName: 'DataGrid.jsx',
          filePath: 'src/components/DataGrid.jsx',
          icon: '🧩', // component
          type: 'component',
          changeType: 'moderate',
          changeDescription: 'Uses similar rendering pattern that could benefit from the same optimization'
        },
        {
          fileName: 'utils.js',
          filePath: 'src/utils/utils.js',
          icon: '🔧', // utility
          type: 'utility',
          changeType: 'minor',
          changeDescription: 'Utility functions called by the optimized code'
        },
        {
          fileName: 'store.js',
          filePath: 'src/store/store.js',
          icon: '🏪', // store
          type: 'store',
          changeType: 'minor',
          changeDescription: 'State management affected by performance changes'
        }
      ],
      
      // Default for unknown types
      'default': [
        {
          fileName: 'index.js',
          filePath: 'src/index.js',
          icon: '📄', // file
          type: 'entry',
          changeType: 'minor',
          changeDescription: 'May be affected by the proposed changes'
        }
      ]
    };
    
    // Return affected nodes based on suggestion persona, or a default set
    return mockData[suggestion.persona] || mockData.default;
  }
  
  /**
   * Get code preview for a specific file affected by a suggestion
   * @param {Object} suggestion - The suggestion object
   * @param {Object} node - The affected node/file
   * @returns {String} - Code preview with highlighting
   */
  getCodePreview(suggestion, node) {
    // In a real implementation, this would get the actual code
    // from the file and highlight the affected portions
    
    // For now, we'll return mock code based on the node type
    const mockCode = {
      'component': `import React from 'react';

// This component would be affected
function ${node.fileName.replace('.jsx', '')}({ items }) {
  // This pattern would change
  ${suggestion.diff?.old || '// Some code that would be affected'}
  
  return (
    <div className="component">
      {/* Rendering logic */}
    </div>
  );
}`,
      'hook': `import { useState, useEffect } from 'react';

// This hook would be affected
function ${node.fileName.replace('.js', '')}(params) {
  // Logic that would be updated
  ${suggestion.diff?.old || '// Hook implementation that needs updating'}
  
  return {
    // Return values
  };
}`,
      'service': `// This service contains security issues
export default class ApiService {
  // Method with vulnerability
  async fetchData() {
    ${suggestion.diff?.old || '// Code with security vulnerability'}
  }
}`,
      'utility': `// Utility functions
export function helperFunction(input) {
  // This would be affected
  ${suggestion.diff?.old || '// Code that would change'}
  
  return result;
}`,
      'documentation': `# API Documentation
  
## Usage
\`\`\`javascript
${suggestion.diff?.old || '// Example that needs updating'}
\`\`\``,
      'default': `// Code in ${node.fileName}
// This would be affected by the suggestion
${suggestion.diff?.old || '// Some code that would change'}`
    };
    
    return mockCode[node.type] || mockCode.default;
  }
  
  /**
   * Get full impact analysis for a suggestion
   * @param {Object} suggestion - The suggestion object 
   * @returns {Object} - Full impact analysis
   */
  estimateRipple(suggestion) {
    // Base estimate implementation
    const baseEstimate = (suggestion) => {
      // Calculate base complexity from suggestion properties
      const complexity = suggestion.complexity || 0.5;
      const scope = suggestion.scope || 'component';
      
      // Base score adjusted by scope
      let score = complexity;
      if (scope === 'global') score *= 1.5;
      if (scope === 'system') score *= 2.0;
      
      return score;
    };
    
    let score = baseEstimate(suggestion);

    /* NEW: adjust by socialImpact */
    if (suggestion.socialImpact === 'pro')     score += SOCIAL_BONUS;
    else if (suggestion.socialImpact === 'anti') score += SOCIAL_PENALTY;

    return score;
  }

  getFullImpactAnalysis(suggestion) {
    const affectedNodes = this.getAffectedNodes(suggestion);
    
    // Get code previews for each node
    const nodesWithCode = affectedNodes.map(node => ({
      ...node,
      code: this.getCodePreview(suggestion, node)
    }));
    
    return {
      suggestion,
      affectedNodes: nodesWithCode,
      impact: {
        filesAffected: affectedNodes.length,
        criticalChanges: affectedNodes.filter(n => n.changeType === 'major').length,
        moderateChanges: affectedNodes.filter(n => n.changeType === 'moderate').length,
        minorChanges: affectedNodes.filter(n => n.changeType === 'minor').length,
        estimatedEffort: affectedNodes.length * (suggestion.persona === 'Security' ? 2 : 1) // Security changes need more testing
      }
    };
  }
}

// Create and export singleton instance
const rippleAnalysisService = new RippleAnalysisService();
export const estimateRipple = rippleAnalysisService.estimateRipple.bind(rippleAnalysisService);
export default rippleAnalysisService;
