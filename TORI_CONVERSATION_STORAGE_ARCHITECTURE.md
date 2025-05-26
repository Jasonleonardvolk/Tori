# TORI Chat Conversation Storage Architecture

## 📚 How Conversations Are Stored

TORI doesn't just log chat messages - it transforms conversations into **living memory** through the Concept Mesh architecture.

## 🗂️ Storage Locations

```
C:\Users\jason\Desktop\tori\kha\
├── psiarc_logs/              # ψarc conversation logs
│   ├── ψ-2025-05-23T10-15-30.psiarc    # ConceptDiff stream
│   └── ψ-2025-05-23T10-15-30.meta.json # Session metadata
├── conversations/            # Human-readable formats
│   ├── ψ-2025-05-23T10-15-30.md        # Markdown transcript
│   └── ψ-2025-05-23T10-15-30.toripack  # Exportable package
└── concept-mesh-data/        # Concept graph storage
    └── user_concepts.json    # User-concept associations
```

## 🔄 Conversation Processing Pipeline

### 1. **Real-time Capture**
Every chat message is immediately captured as a **frame** in the active ψarc session:

```javascript
{
  "frame_id": 1,
  "timestamp": "2025-05-23T10:15:30Z",
  "type": "conversation",
  "user_message": "What is spectral decomposition?",
  "assistant_response": "Spectral decomposition is...",
  "ops": [
    {
      "op": "!Create",
      "concept": {
        "label": "Spectral Decomposition",
        "created_by": "google_12345",
        "created_by_name": "John",
        "session_id": "ψ-2025-05-23T10-15-30",
        "origin": "chat",
        "phase_seed": 3.14159
      }
    }
  ],
  "metadata": {
    "persona": "sch",
    "user_id": "google_12345",
    "concepts_referenced": ["Spectral Decomposition"]
  }
}
```

### 2. **ConceptDiff Operations**
Each conversation frame can generate multiple ConceptDiff operations:

- **!Create** - New concept introduced
- **!Update** - Existing concept referenced/modified
- **!Link** - Concepts connected
- **!PhaseShift** - Phase alignment between concepts
- **!Annotate** - Metadata added to concepts

### 3. **Storage Formats**

#### `.psiarc` File (ConceptDiff Stream)
```
{"frame_id":1,"timestamp":"2025-05-23T10:15:30Z","type":"conversation"...}
{"frame_id":2,"timestamp":"2025-05-23T10:16:45Z","type":"conversation"...}
{"frame_id":3,"timestamp":"2025-05-23T10:18:12Z","type":"conversation"...}
```

#### `.meta.json` File (Session Metadata)
```json
{
  "session_id": "ψ-2025-05-23T10-15-30",
  "user_id": "google_12345",
  "user_name": "John",
  "persona": "sch",
  "start_time": "2025-05-23T10:15:30Z",
  "end_time": "2025-05-23T10:45:22Z",
  "frame_count": 15,
  "concepts_created": 8,
  "concepts_list": [
    "Spectral Decomposition",
    "Koopman Operator",
    "Eigenfunction Analysis"
  ],
  "total_messages": 15,
  "corpus": "TORI_CHAT",
  "tags": ["chat", "conversation", "sch"]
}
```

#### `.md` File (Human-Readable)
```markdown
# TORI Chat Conversation
**Session ID**: ψ-2025-05-23T10-15-30
**User**: John (google_12345)
**Persona**: sch
**Time**: 2025-05-23T10:15:30Z
**Concepts Created**: Spectral Decomposition, Koopman Operator

---

## Exchange 1

**User**: What is spectral decomposition?

**Assistant (sch)**: Spectral decomposition is...

**Concepts**: Spectral Decomposition

---
```

## 🔍 How Conversations Are Referenced

### By Session ID
```
ψ-2025-05-23T10-15-30
```
Unique identifier for each conversation session.

### By User ID
```
google_12345 → All conversations by this user
```

### By Concept
```
"Spectral Decomposition" → All conversations mentioning this concept
```

### By Persona
```
persona: "sch" → All scholarly conversations
```

## 🎯 API Endpoints for Conversation Management

| Endpoint | Purpose |
|----------|---------|
| `POST /api/chat` | Send message, creates conversation frames |
| `POST /api/chat/save-session` | Save current session to ψarc |
| `GET /api/chat/history` | Get user's conversation history |
| `GET /api/chat/replay/:sessionId` | Replay a conversation |
| `GET /api/chat/search?concept=X` | Search by concept |
| `GET /api/chat/export/:sessionId` | Export as .toripack |

## 🧠 Key Features

### 1. **Conversation as Memory**
- Not just a log - each utterance becomes part of the cognitive map
- Concepts are extracted and linked in real-time
- Phase alignment tracks conceptual coherence

### 2. **Replayable History**
```javascript
// Replay any conversation
const frames = await replayPsiArcSession('ψ-2025-05-23T10-15-30');
```

### 3. **Concept Search**
```javascript
// Find all conversations about "Koopman Operator"
const results = searchConversationsByConcept('Koopman Operator');
```

### 4. **User Attribution**
Every concept is tagged with:
- User ID
- User name
- Source session
- Timestamp
- Persona context

### 5. **Export as Toripack**
Conversations can be exported as `.toripack` files for:
- Sharing knowledge
- Backup
- Import into other systems
- Academic research

## 📊 Example User Journey

1. **John logs in** → Session starts
2. **John asks about spectral decomposition** → Frame 1 created
3. **Concept "Spectral Decomposition" created** → ConceptDiff logged
4. **John uploads PDF** → Concepts extracted and linked
5. **Conversation continues** → More frames, more concepts
6. **Session ends** → Saved as .psiarc + .meta.json + .md

## 🔮 Advanced Features

### Phase Coupling Analysis
```javascript
{
  "op": "!PhaseShift",
  "concepts": ["Spectral Decomposition", "Koopman Operator"],
  "alignment": {
    "coherence": 0.92,
    "coupling_strength": 0.85,
    "resonance_frequency": 0.12
  }
}
```

### Concept Evolution Tracking
- See how understanding of concepts changes over time
- Track which concepts frequently appear together
- Identify learning patterns

### Cross-Session Memory
- Concepts persist across sessions
- Build cumulative knowledge graph
- Personalized responses based on history

## 🛠️ Implementation Details

### Server-Side Storage
```javascript
// Create session
const session = createPsiArcSession(userId, userName, persona);

// Add conversation frame
addConversationFrame(session, message, response, concepts);

// Save session
savePsiArcSession(session);
```

### Client-Side Access
```javascript
// View history
const history = await fetch('/api/chat/history');

// Replay session
const frames = await fetch(`/api/chat/replay/${sessionId}`);

// Search by concept
const results = await fetch(`/api/chat/search?concept=${concept}`);
```

## 🚀 Production Considerations

1. **Storage**: Currently file-based, migrate to database for scale
2. **Indexing**: Add search indexing for faster concept queries
3. **Compression**: Compress older .psiarc files
4. **Privacy**: Encrypt user conversations
5. **Backup**: Regular backups of psiarc_logs directory

## 📝 Summary

TORI's conversation storage goes beyond traditional chat logs:

- **Conversations become memory** through ConceptDiff operations
- **Every utterance is replayable** and searchable
- **Concepts are extracted and linked** automatically
- **User journeys are tracked** through their cognitive map
- **Knowledge accumulates** across sessions

The system literally watches **conversations become cognition**, transforming ephemeral chat into a permanent, searchable, and evolving knowledge graph unique to each user.
