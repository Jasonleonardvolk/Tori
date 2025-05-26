import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths for conversation storage
const PSIARC_DIR = path.join(__dirname, '..', '..', '..', 'psiarc_logs');
const CONVERSATIONS_DIR = path.join(__dirname, '..', '..', '..', 'conversations');
const CONCEPT_MESH_DIR = path.join(__dirname, '..', '..', '..', 'concept-mesh-data');

// Ensure directories exist
[PSIARC_DIR, CONVERSATIONS_DIR, CONCEPT_MESH_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * ConceptDiff Operations
 */
const ConceptDiffOp = {
  CREATE: '!Create',
  UPDATE: '!Update',
  LINK: '!Link',
  ANNOTATE: '!Annotate',
  PHASE_SHIFT: '!PhaseShift'
};

/**
 * Create a ψarc session for a conversation
 */
export function createPsiArcSession(userId, userName, persona) {
  const timestamp = new Date().toISOString();
  const sessionId = `ψ-${timestamp.replace(/[:.]/g, '-')}`;
  
  const session = {
    sessionId,
    userId,
    userName,
    persona,
    startTime: timestamp,
    frames: [],
    conceptsCreated: [],
    metadata: {
      type: 'chat_session',
      version: '1.0.0',
      corpus: 'TORI_CHAT'
    }
  };
  
  return session;
}

/**
 * Add a conversation frame to the ψarc session
 */
export function addConversationFrame(session, message, response, concepts = []) {
  const frameId = session.frames.length + 1;
  const timestamp = new Date().toISOString();
  
  const frame = {
    frame_id: frameId,
    timestamp,
    type: 'conversation',
    user_message: message,
    assistant_response: response,
    ops: [],
    metadata: {
      persona: session.persona,
      user_id: session.userId,
      concepts_referenced: concepts
    }
  };
  
  // Create ConceptDiff operations for any new concepts
  concepts.forEach(concept => {
    if (!session.conceptsCreated.includes(concept)) {
      frame.ops.push({
        op: ConceptDiffOp.CREATE,
        concept: {
          label: concept,
          created_by: session.userId,
          created_by_name: session.userName,
          session_id: session.sessionId,
          origin: 'chat',
          phase_seed: generatePhaseSeed()
        }
      });
      session.conceptsCreated.push(concept);
    } else {
      // Update existing concept with new reference
      frame.ops.push({
        op: ConceptDiffOp.UPDATE,
        concept: concept,
        update: {
          last_referenced: timestamp,
          reference_count: '+1'
        }
      });
    }
  });
  
  // Add phase alignment operation
  if (concepts.length > 1) {
    frame.ops.push({
      op: ConceptDiffOp.PHASE_SHIFT,
      concepts: concepts,
      alignment: calculatePhaseAlignment(concepts)
    });
  }
  
  session.frames.push(frame);
  return frame;
}

/**
 * Save ψarc session to disk
 */
export function savePsiArcSession(session) {
  const filename = `${session.sessionId}.psiarc`;
  const filepath = path.join(PSIARC_DIR, filename);
  
  // Create the .psiarc file (ConceptDiff stream)
  const psiarcContent = session.frames.map(frame => 
    JSON.stringify(frame)
  ).join('\n');
  
  fs.writeFileSync(filepath, psiarcContent);
  
  // Create the .meta.json file
  const metadata = {
    session_id: session.sessionId,
    user_id: session.userId,
    user_name: session.userName,
    persona: session.persona,
    start_time: session.startTime,
    end_time: new Date().toISOString(),
    frame_count: session.frames.length,
    concepts_created: session.conceptsCreated.length,
    concepts_list: session.conceptsCreated,
    total_messages: session.frames.length,
    corpus: 'TORI_CHAT',
    tags: ['chat', 'conversation', session.persona]
  };
  
  const metaFilepath = filepath.replace('.psiarc', '.meta.json');
  fs.writeFileSync(metaFilepath, JSON.stringify(metadata, null, 2));
  
  // Also save a human-readable conversation log
  saveConversationMarkdown(session);
  
  return { psiarcPath: filepath, metaPath: metaFilepath };
}

/**
 * Save conversation as markdown for easy reading
 */
function saveConversationMarkdown(session) {
  const filename = `${session.sessionId}.md`;
  const filepath = path.join(CONVERSATIONS_DIR, filename);
  
  let content = `# TORI Chat Conversation
**Session ID**: ${session.sessionId}
**User**: ${session.userName} (${session.userId})
**Persona**: ${session.persona}
**Time**: ${session.startTime}
**Concepts Created**: ${session.conceptsCreated.join(', ')}

---

`;
  
  session.frames.forEach((frame, index) => {
    content += `## Exchange ${index + 1}

**User**: ${frame.user_message}

**Assistant (${session.persona})**: ${frame.assistant_response}

**Concepts**: ${frame.metadata.concepts_referenced.join(', ') || 'None'}

---

`;
  });
  
  fs.writeFileSync(filepath, content);
  return filepath;
}

/**
 * Generate a phase seed for concept alignment
 */
function generatePhaseSeed() {
  // In production, this would use proper phase calculation
  return Math.random() * 2 * Math.PI;
}

/**
 * Calculate phase alignment between concepts
 */
function calculatePhaseAlignment(concepts) {
  // Simplified phase alignment calculation
  // In production, this would use Koopman eigenfunction analysis
  return {
    coherence: 0.85 + Math.random() * 0.15,
    coupling_strength: 0.7 + Math.random() * 0.3,
    resonance_frequency: 0.1 + Math.random() * 0.05
  };
}

/**
 * Replay a ψarc session
 */
export async function replayPsiArcSession(sessionId) {
  const filename = `${sessionId}.psiarc`;
  const filepath = path.join(PSIARC_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    throw new Error(`Session ${sessionId} not found`);
  }
  
  const content = fs.readFileSync(filepath, 'utf-8');
  const frames = content.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
  
  return frames;
}

/**
 * Search conversations by concept
 */
export function searchConversationsByConcept(concept) {
  const results = [];
  
  // Search through all .meta.json files
  const files = fs.readdirSync(PSIARC_DIR).filter(f => f.endsWith('.meta.json'));
  
  files.forEach(file => {
    const filepath = path.join(PSIARC_DIR, file);
    const metadata = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    
    if (metadata.concepts_list && metadata.concepts_list.includes(concept)) {
      results.push({
        session_id: metadata.session_id,
        user_name: metadata.user_name,
        timestamp: metadata.start_time,
        persona: metadata.persona,
        concept_index: metadata.concepts_list.indexOf(concept)
      });
    }
  });
  
  return results;
}

/**
 * Get user's conversation history
 */
export function getUserConversationHistory(userId) {
  const history = [];
  
  const files = fs.readdirSync(PSIARC_DIR).filter(f => f.endsWith('.meta.json'));
  
  files.forEach(file => {
    const filepath = path.join(PSIARC_DIR, file);
    const metadata = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    
    if (metadata.user_id === userId) {
      history.push({
        session_id: metadata.session_id,
        timestamp: metadata.start_time,
        persona: metadata.persona,
        message_count: metadata.total_messages,
        concepts: metadata.concepts_list
      });
    }
  });
  
  // Sort by timestamp, newest first
  history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return history;
}

/**
 * Export conversation as a .toripack
 */
export function exportConversationAsToripack(sessionId) {
  const session = replayPsiArcSession(sessionId);
  const metaPath = path.join(PSIARC_DIR, `${sessionId}.meta.json`);
  const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  
  const toripack = {
    version: '1.0.0',
    type: 'conversation',
    session_id: sessionId,
    metadata: metadata,
    frames: session,
    export_time: new Date().toISOString(),
    checksum: generateChecksum(session)
  };
  
  const filename = `${sessionId}.toripack`;
  const filepath = path.join(CONVERSATIONS_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(toripack, null, 2));
  
  return filepath;
}

/**
 * Generate checksum for data integrity
 */
function generateChecksum(data) {
  // Simple checksum for demo - in production use proper hashing
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export default {
  createPsiArcSession,
  addConversationFrame,
  savePsiArcSession,
  replayPsiArcSession,
  searchConversationsByConcept,
  getUserConversationHistory,
  exportConversationAsToripack
};
