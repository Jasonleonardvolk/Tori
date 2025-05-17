#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Searching for potential infinite loops in React components...\n');

// Common patterns that cause infinite loops
const problemPatterns = [
  {
    name: 'setState in useEffect without dependencies',
    pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*{[\s\S]*?setState[\s\S]*?}\s*\)/g,
    suggestion: 'Add dependency array to useEffect'
  },
  {
    name: 'useState setter in useEffect without deps',
    pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*{[\s\S]*?set[A-Z]\w+\s*\([\s\S]*?}\s*\)/g,
    suggestion: 'Add dependency array to useEffect'
  },
  {
    name: 'useEffect with empty dependency but changing state',
    pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*{[\s\S]*?set[A-Z]\w+[\s\S]*?}\s*,\s*\[\s*\]\s*\)/g,
    suggestion: 'Check if dependencies are missing'
  }
];

// Find all React component files
function findReactFiles(dir, files = []) {
  const entries = fs.readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !entry.includes('node_modules') && !entry.includes('.git')) {
      findReactFiles(fullPath, files);
    } else if (stat.isFile() && (entry.endsWith('.jsx') || entry.endsWith('.js'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Analyze file for potential infinite loops
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for React hooks import
  if (!content.includes('useEffect') && !content.includes('useState')) {
    return issues;
  }
  
  for (const pattern of problemPatterns) {
    const matches = content.matchAll(pattern.pattern);
    for (const match of matches) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      issues.push({
        file: filePath,
        line: lineNumber,
        pattern: pattern.name,
        suggestion: pattern.suggestion,
        snippet: match[0].substring(0, 100) + '...'
      });
    }
  }
  
  return issues;
}

// Run analysis
const startDir = path.join(__dirname, 'client', 'src');
const reactFiles = findReactFiles(startDir);
console.log(`Found ${reactFiles.length} React files to analyze...\n`);

let totalIssues = 0;
const fileIssues = {};

for (const file of reactFiles) {
  const issues = analyzeFile(file);
  if (issues.length > 0) {
    fileIssues[file] = issues;
    totalIssues += issues.length;
  }
}

// Report results
if (totalIssues === 0) {
  console.log('✅ No obvious infinite loop patterns found!');
} else {
  console.log(`⚠️  Found ${totalIssues} potential infinite loop issues:\n`);
  
  for (const [file, issues] of Object.entries(fileIssues)) {
    console.log(`📄 ${path.relative(__dirname, file)}`);
    for (const issue of issues) {
      console.log(`   Line ${issue.line}: ${issue.pattern}`);
      console.log(`   Suggestion: ${issue.suggestion}`);
      console.log(`   Code: ${issue.snippet}`);
      console.log();
    }
  }
}

// Create a report file
const reportPath = path.join(__dirname, 'infinite-loop-report.txt');
const report = `ALAN IDE Infinite Loop Analysis Report
Generated: ${new Date().toISOString()}

Files analyzed: ${reactFiles.length}
Issues found: ${totalIssues}

${Object.entries(fileIssues).map(([file, issues]) => 
  `\n${file}\n${'-'.repeat(file.length)}\n${issues.map(issue => 
    `Line ${issue.line}: ${issue.pattern}\nSuggestion: ${issue.suggestion}\nCode: ${issue.snippet}\n`
  ).join('\n')}`
).join('\n')}`;

fs.writeFileSync(reportPath, report);
console.log(`\nFull report saved to: ${reportPath}`);
console.log('\nNEXT STEPS:');
console.log('1. Review the files listed above');
console.log('2. Look for useEffect hooks without dependency arrays');
console.log('3. Ensure state updates in useEffect have proper dependencies');
console.log('4. Consider using useCallback or useMemo for functions in dependencies');
