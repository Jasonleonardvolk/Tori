import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const clientId = '320234779512-h75m28qbijfmc9dmjao7lks3m9hel769.apps.googleusercontent.com';

// Get the container element
const container = document.getElementById('root');
// Create a root
const root = createRoot(container);
// Initial render: Render the app component to the root
root.render(
  <GoogleOAuthProvider clientId={clientId}>
    <App />
  </GoogleOAuthProvider>
);
