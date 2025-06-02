const fs = require('fs');
const path = require('path');

// Read the file
const filePath = 'C:\\Users\\jason\\Desktop\\tori\\kha\\tori_ui_svelte\\src\\routes\\+page.svelte';
let content = fs.readFileSync(filePath, 'utf-8');

// Split into lines
let lines = content.split('\n');

// Find the line to replace (should be around line 370)
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('currentConcepts: [...new Set($conceptMesh.flatMap(d => d.concepts))],')) {
    console.log(`Found line to replace at line ${i + 1}`);
    
    // Replace with the enhanced version
    lines[i] = `        currentConcepts: (() => {
          const allConcepts = [];
          let pdfCount = 0;
          $conceptMesh.forEach(diff => {
            if (diff.concepts && Array.isArray(diff.concepts)) {
              if (diff.metadata?.source === 'scholarsphere_enhanced_server') {
                pdfCount += diff.concepts.length;
              }
              allConcepts.push(...diff.concepts);
            }
          });
          const uniqueConcepts = [...new Set(allConcepts)];
          console.log('📚 PDF CONCEPTS AVAILABLE:', pdfCount, 'of', uniqueConcepts.length, 'total');
          return uniqueConcepts;
        })(),`;
    
    break;
  }
}

// Join back and write
content = lines.join('\n');
fs.writeFileSync(filePath, content, 'utf-8');

console.log('✅ PDF concept extraction fix applied successfully!');
console.log('🔄 Please refresh your browser to see the changes.');
