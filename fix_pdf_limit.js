// Quick fix script to update the PDF extraction limit
const fs = require('fs');
const path = require('path');

const serverPath = 'C:\\Users\\jason\\Desktop\\tori\\kha\\tori_ui_svelte\\src\\routes\\upload\\+server.ts';

console.log('🔧 FIXING PDF TEXT LIMIT BUG...');

try {
    let content = fs.readFileSync(serverPath, 'utf8');
    
    // Find the problematic line
    const buggyLine = 'extractedText.substring(0, 2000)';
    const fixedLine = 'extractedText'; // Remove the substring limit
    
    if (content.includes(buggyLine)) {
        content = content.replace(buggyLine, fixedLine);
        fs.writeFileSync(serverPath, content);
        console.log('✅ FIXED: Removed 2000 character limit from PDF extraction');
        console.log('🔄 Please restart TORI to apply the fix');
    } else {
        console.log('❓ Could not find the problematic line - may already be fixed');
    }
    
} catch (error) {
    console.error('❌ Error fixing file:', error.message);
}
