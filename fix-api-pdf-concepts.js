const fs = require('fs');

// Read the file
const filePath = 'C:\\Users\\jason\\Desktop\\tori\\kha\\tori_ui_svelte\\src\\lib\\services\\enhancedApi.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Count how many times we need to replace
const searchPattern = 'const concepts = this.extractConceptsFromQuery(context.userQuery);';
const matches = (content.match(new RegExp(searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

console.log(`Found ${matches} instances to replace`);

// Replace ALL instances
content = content.replace(
  /const concepts = this\.extractConceptsFromQuery\(context\.userQuery\);/g,
  `// Extract concepts from query AND use PDF/document concepts
    const queryConcepts = this.extractConceptsFromQuery(context.userQuery);
    const documentConcepts = context.currentConcepts || [];
    
    // Find relevant document concepts
    const queryWords = context.userQuery.toLowerCase().split(/\\s+/);
    const relevantDocConcepts = documentConcepts.filter(concept => {
      const conceptLower = concept.toLowerCase();
      return queryWords.some(word => 
        word.length > 2 && (
          conceptLower.includes(word) || 
          word.includes(conceptLower)
        )
      );
    });
    
    // Use ALL concepts for processing
    const concepts = [...new Set([...queryConcepts, ...relevantDocConcepts])];
    
    console.log('📚 USING CONCEPTS:', {
      fromQuery: queryConcepts,
      fromPDFs: relevantDocConcepts.slice(0, 10),
      total: concepts.length
    });`
);

// Write back
fs.writeFileSync(filePath, content, 'utf-8');

console.log('✅ Fixed! Enhanced API now uses PDF concepts!');
console.log(`📝 Updated ${matches} processing methods`);
console.log('🔄 Dev server should auto-reload. Try asking about Darwin/Gödel!');
