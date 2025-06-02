const fs = require('fs');

// Read the file
const filePath = 'C:\\Users\\jason\\Desktop\\tori\\kha\\tori_ui_svelte\\src\\lib\\services\\enhancedApi.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// First, let's add a helper method to get all available concepts
const helperMethod = `
  /**
   * Get all available concepts including PDF/document concepts
   */
  private getAllAvailableConcepts(context: ConversationContext): { queryConcepts: string[], documentConcepts: string[], allConcepts: string[] } {
    const queryConcepts = this.extractConceptsFromQuery(context.userQuery);
    const documentConcepts = context.currentConcepts || [];
    
    // Find relevant document concepts based on query
    const queryWords = context.userQuery.toLowerCase().split(/\\s+/);
    const relevantDocConcepts = documentConcepts.filter(concept => {
      const conceptLower = concept.toLowerCase();
      return queryWords.some(word => 
        conceptLower.includes(word) || 
        word.includes(conceptLower) ||
        (word.length > 3 && conceptLower.includes(word.substring(0, 3)))
      );
    });
    
    // Combine all concepts
    const allConcepts = [...new Set([...queryConcepts, ...relevantDocConcepts])];
    
    console.log('📚 CONCEPT SOURCES:', {
      fromQuery: queryConcepts.length,
      fromDocuments: documentConcepts.length,
      relevantFromDocs: relevantDocConcepts.length,
      totalAvailable: allConcepts.length,
      sampleDocConcepts: relevantDocConcepts.slice(0, 5)
    });
    
    return { queryConcepts, documentConcepts, allConcepts };
  }
`;

// Insert the helper method before extractConceptsFromQuery
content = content.replace(
  'private extractConceptsFromQuery(query: string): string[] {',
  helperMethod + '\n\n  private extractConceptsFromQuery(query: string): string[] {'
);

// Now replace all instances of extractConceptsFromQuery with getAllAvailableConcepts
const replacements = [
  {
    old: 'const concepts = this.extractConceptsFromQuery(context.userQuery);',
    new: 'const { allConcepts: concepts, relevantDocConcepts } = this.getAllAvailableConcepts(context);'
  }
];

// Apply replacements
replacements.forEach(({ old, new: newText }) => {
  // Count replacements
  const count = (content.match(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  console.log(`Replacing ${count} instances of concept extraction`);
  
  content = content.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newText);
});

// Write back
fs.writeFileSync(filePath, content, 'utf-8');

console.log('✅ Enhanced API service now uses PDF concepts!');
console.log('🔄 The dev server should auto-reload. Check the console for "📚 CONCEPT SOURCES" when sending messages.');
