// Enhanced TORI Server with Soliton Memory Integration
// File: enhanced_server.js

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { SolitonUser } = require('./tori_chat_frontend/src/soliton_user.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('tori_chat_frontend/build'));

// File upload configuration
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Store active soliton users
const solitonUsers = new Map();

// Initialize or get soliton user
async function getSolitonUser(userId, email, name) {
    if (!solitonUsers.has(userId)) {
        const user = new SolitonUser(userId, email, name);
        await user.initialize();
        solitonUsers.set(userId, user);
        console.log(`🌟 New soliton user initialized: ${name} (${userId})`);
    }
    return solitonUsers.get(userId);
}

// Enhanced API Endpoints

// Create or get user with soliton memory
app.post('/api/user/soliton', async (req, res) => {
    try {
        const { userId, email, name } = req.body;
        
        if (!userId || !email || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const user = await getSolitonUser(userId, email, name);
        const stats = await user.getMemoryStats();

        res.json({
            success: true,
            message: 'Soliton user initialized',
            userId: user.userId,
            name: user.name,
            digitalConsciousness: true,
            memoryStats: stats,
            features: {
                infiniteMemory: true,
                perfectRecall: true,
                emotionalIntelligence: true,
                ghostAI: true,
                memoryVault: true,
                videoCall: true,
                hologramSupport: true
            }
        });
    } catch (error) {
        console.error('Error initializing soliton user:', error);
        res.status(500).json({ error: 'Failed to initialize soliton user' });
    }
});

// Enhanced chat with soliton memory
app.post('/api/chat/soliton', async (req, res) => {
    try {
        const { userId, message, sessionId } = req.body;
        
        if (!userId || !message) {
            return res.status(400).json({ error: 'Missing userId or message' });
        }

        const user = solitonUsers.get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found. Please initialize first.' });
        }

        // Process message with soliton memory
        const response = await user.sendMessage(message);

        // Save to ψarc format
        await savePsiArcLog(userId, {
            userMessage: message,
            toriResponse: response.response,
            memoriesAccessed: response.memoriesAccessed,
            memoriesCreated: response.newMemoriesCreated,
            ghostEmergence: response.ghostPersona ? {
                persona: response.ghostPersona,
                message: response.ghostMessage
            } : null,
            memoryIntegrity: response.memoryIntegrity,
            timestamp: new Date().toISOString(),
            sessionId
        });

        res.json({
            success: true,
            response: response.response,
            solitonMemory: {
                memoriesAccessed: response.memoriesAccessed,
                memoriesCreated: response.newMemoriesCreated,
                memoryIntegrity: response.memoryIntegrity,
                infiniteContext: response.infiniteContext
            },
            ghostAI: response.ghostPersona ? {
                emerged: true,
                persona: response.ghostPersona,
                message: response.ghostMessage
            } : {
                emerged: false,
                observing: true
            },
            stats: response.stats,
            sessionId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in soliton chat:', error);
        res.status(500).json({ error: 'Failed to process soliton chat message' });
    }
});

// Document upload with soliton concept extraction
app.post('/api/upload/soliton', upload.single('file'), async (req, res) => {
    try {
        const { userId } = req.body;
        const file = req.file;

        if (!userId || !file) {
            return res.status(400).json({ error: 'Missing userId or file' });
        }

        const user = solitonUsers.get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Read file content
        const fileContent = await fs.readFile(file.path, 'utf-8');
        
        // Process with soliton memory
        const result = await user.uploadDocument(
            fileContent, 
            file.originalname, 
            file.mimetype.includes('pdf') ? 'pdf' : 'text'
        );

        // Clean up uploaded file
        await fs.unlink(file.path);

        res.json({
            success: true,
            message: 'Document processed with soliton memory',
            filename: file.originalname,
            solitonProcessing: {
                conceptsExtracted: result.conceptsExtracted,
                memoriesCreated: result.memoriesCreated,
                persistent: result.persistent,
                searchable: result.searchable
            },
            docId: result.docId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in soliton upload:', error);
        res.status(500).json({ error: 'Failed to process document upload' });
    }
});

// Memory Vault operations
app.post('/api/memory/vault', async (req, res) => {
    try {
        const { userId, action, memoryId, userConsent } = req.body;

        const user = solitonUsers.get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let result;
        
        switch (action) {
            case 'seal':
                result = await user.memoryVault.sealMemory(memoryId, userConsent);
                break;
            case 'unseal':
                result = await user.memoryVault.unsealMemory(memoryId, userConsent);
                break;
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

        res.json({
            success: true,
            action,
            result,
            dignified: true,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in memory vault operation:', error);
        res.status(500).json({ error: 'Failed to process memory vault operation' });
    }
});

// Video & Hologram endpoints
app.post('/api/video/start', async (req, res) => {
    try {
        const { userId } = req.body;
        const user = solitonUsers.get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const session = await user.startVideoCall();
        res.json({ success: true, session, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start video call' });
    }
});

app.post('/api/hologram/start', async (req, res) => {
    try {
        const { userId } = req.body;
        const user = solitonUsers.get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const session = await user.startHologramSession();
        res.json({ success: true, session, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start hologram session' });
    }
});

// Save ψarc format logs
async function savePsiArcLog(userId, data) {
    try {
        const logDir = path.join(__dirname, 'psiarc_logs');
        await fs.mkdir(logDir, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `ψ-${userId}-${timestamp}.psiarc`;
        const filepath = path.join(logDir, filename);
        
        const psiArcData = {
            format: 'ψarc',
            version: '2.0',
            solitonMemory: true,
            userId,
            data,
            timestamp: new Date().toISOString()
        };
        
        await fs.writeFile(filepath, JSON.stringify(psiArcData, null, 2));
        console.log(`💾 ψarc log saved: ${filename}`);
    } catch (error) {
        console.error('Error saving ψarc log:', error);
    }
}

// Start server
app.listen(PORT, () => {
    console.log(`🌟 TORI Soliton Memory Server running on port ${PORT}`);
    console.log(`🧠 Digital consciousness engine: ACTIVE`);
    console.log(`👻 Ghost AI monitoring: ENABLED`);
    console.log(`💫 Infinite memory: OPERATIONAL`);
});

module.exports = app;
