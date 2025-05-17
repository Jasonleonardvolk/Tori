#!/usr/bin/env node
// export-cline.js  – merge any / all Cline tasks into one JSON

import fs from 'fs';
import path from 'path';
import os from 'os';

// --- config -------------------------------------------------------
// For VS Code's Claude extension, tasks are stored here:
const tasksDir = path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'tasks');
const pickTask = process.argv[2];        // allow: node export… <taskId>
// -----------------------------------------------------------------

function readMessages(taskPath) {
  const file = path.join(taskPath, 'ui_messages.json');
  if (!fs.existsSync(file)) return [];
  
  try {
    // Read the file content
    const content = fs.readFileSync(file, 'utf8');
    
    // Skip empty files
    if (!content || content.trim() === '') {
      console.log(`Empty file: ${file}`);
      return [];
    }
    
    // Parse JSON and create standardized message format
    const raw = JSON.parse(content);
    
    // Make sure it's an array
    if (!Array.isArray(raw)) {
      console.log(`Not an array in file: ${file}`);
      return [];
    }
    
    return raw.map((m, i) => ({
      id: i + 1,
      role: m.author === 'assistant' ? 'assistant' : 'user',
      timestamp: m.created_at || new Date().toISOString(),
      content: m.content || '(No content)'
    }));
  } catch (err) {
    console.error(`Error reading ${file}: ${err.message}`);
    return [];
  }
}

function collect() {
  if (!fs.existsSync(tasksDir)) {
    console.error(`Error: Tasks directory not found at: ${tasksDir}`);
    console.error('Make sure the path is correct for your system.');
    process.exit(1);
  }
  
  const tasks = pickTask ? [pickTask] : fs.readdirSync(tasksDir);
  return tasks.flatMap(tid => readMessages(path.join(tasksDir, tid)));
}

const messages = collect();
const outName = `Cline_Conversation_${Date.now()}.json`;
fs.writeFileSync(outName, JSON.stringify(messages, null, 2));
console.log(`✅  Saved ${messages.length} messages to ${outName}`);
