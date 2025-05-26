# 🔥 Immediate Next Steps - Let's Go!

## 1. Start the OAuth Server (Do This Now!)

```bash
# Terminal 1: OAuth Server
cd C:\Users\jason\Desktop\tori\kha
node server\google-oauth-server.js
```

## 2. Update ChatWindow.jsx for Authentication

Add this to the top of ChatWindow.jsx:

```jsx
import { useAuth } from '../contexts/AuthContext';
import { conceptStorageAPI } from '../api/conceptStorage';

// Inside the component:
const { user, isAuthenticated, login } = useAuth();
```

Add login button in the header:

```jsx
{/* Header */}
<header className="glass rounded-t-xl2 px-6 py-3 flex items-center justify-between">
  <h1 className="text-lg font-semibold text-text-dark">TORI Chat</h1>
  {isAuthenticated ? (
    <div className="flex items-center gap-3">
      <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
      <span className="text-sm text-text-dark">{user.name}</span>
    </div>
  ) : (
    <button onClick={() => /* Google login */} className="text-sm text-primary hover:text-primary-dark">
      Sign in with Google
    </button>
  )}
</header>
```

## 3. Update the Upload Handler

Modify completeUpload function to store concepts with user:

```jsx
// After extracting concepts
if (isAuthenticated && concepts.length > 0) {
  try {
    await conceptStorageAPI.storeUserConcepts(
      user.email,
      files[0].name, // or generate a document ID
      concepts
    );
    console.log('✅ Concepts stored for user:', user.email);
  } catch (error) {
    console.error('Failed to store concepts:', error);
  }
}
```

## 4. Add App.jsx Provider Wrapper

```jsx
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Your existing app content */}
    </AuthProvider>
  );
}
```

## 5. Test the Flow

1. Login with Google
2. Upload a PDF
3. Check console for "Concepts stored for user"
4. Verify concepts appear in the side panel

## 6. Quick Database Setup (SQLite for now)

Create a simple SQLite database for rapid prototyping:

```javascript
// server/db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./tori.db');

db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    picture TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Concepts table
  db.run(`CREATE TABLE IF NOT EXISTS concepts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT,
    document_name TEXT,
    concept_text TEXT,
    phase_alignment REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users(email)
  )`);
});

module.exports = db;
```

## 7. Add Concept Storage Endpoints

In start-production.cjs, add:

```javascript
const db = require('./db');

// Store concepts
app.post('/api/concepts/store', async (req, res) => {
  const { userId, documentId, concepts } = req.body;
  
  try {
    for (const concept of concepts) {
      db.run(
        'INSERT INTO concepts (user_email, document_name, concept_text) VALUES (?, ?, ?)',
        [userId, documentId, concept]
      );
    }
    res.json({ success: true, stored: concepts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user concepts
app.get('/api/concepts/user/:userId', (req, res) => {
  db.all(
    'SELECT * FROM concepts WHERE user_email = ? ORDER BY created_at DESC',
    [req.params.userId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ concepts: rows });
      }
    }
  );
});
```

## 🏃‍♂️ Do These Steps NOW!

1. **Start OAuth server** (Terminal 1)
2. **Keep TORI frontend running** (Terminal 2)
3. **Copy the code snippets above** into the respective files
4. **Install SQLite**: `npm install sqlite3`
5. **Restart the production server**
6. **Test login and upload!**

This gets you a working prototype in the next 30 minutes! Then we can integrate the advanced Concept Mesh architecture.
