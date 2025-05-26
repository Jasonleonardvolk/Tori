import React, { useEffect, useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const CLIENT_ID = '320234779512-h75m28qbijfmc9dmjao7lks3m9hel769.apps.googleusercontent.com';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          credential: credentialResponse.credential
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        window.location.reload(); // Reload to update UI with user context
      } else {
        console.error('Authentication failed');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-dark">
        <div className="text-text-dark">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <GoogleOAuthProvider clientId={CLIENT_ID}>
        <div className="flex flex-col items-center justify-center h-screen bg-surface-dark">
          <div className="glass p-8 rounded-xl max-w-md w-full">
            <h1 className="text-2xl font-bold text-text-dark mb-2">Welcome to TORI Chat</h1>
            <p className="text-text-subtle mb-6">Sign in to access your personalized concept mesh</p>
            
            <div className="space-y-4">
              <p className="text-sm text-text-subtle">
                Your concepts will be associated with your account, creating a personalized cognitive map that grows with your explorations.
              </p>
              
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => console.error('Login Failed')}
                  useOneTap
                  theme="filled_black"
                />
              </div>
              
              <p className="text-xs text-text-subtle text-center mt-4">
                By signing in, you agree to TORI's concept mesh synchronization
              </p>
            </div>
          </div>
        </div>
      </GoogleOAuthProvider>
    );
  }

  // User is authenticated, render children with user context
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className="min-h-screen bg-surface-dark">
        <div className="flex justify-between items-center px-6 py-3 bg-surface border-b border-gray-800">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-text-subtle">Signed in as</span>
            <div className="flex items-center space-x-2">
              {user.picture && (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm font-medium text-text-dark">{user.name}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-text-subtle hover:text-text-dark transition-colors"
          >
            Sign out
          </button>
        </div>
        {React.cloneElement(children, { user })}
      </div>
    </GoogleOAuthProvider>
  );
}
