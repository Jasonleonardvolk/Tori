// google-oauth-server.js
const express = require('express');
const session = require('express-session');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');

const app = express();
const CLIENT_ID = '320234779512-h75m28qbijfmc9dmjao7lks3m9hel769.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(session({
  secret: 'your-session-secret',
  resave: false,
  saveUninitialized: true,
}));

const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, 'http://localhost:3000');

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: credential,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    req.session.user = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    };
    res.json({ user: req.session.user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

app.get('/api/auth/user', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

app.listen(3001, () => {
  console.log('Backend listening on port 3001');
});
