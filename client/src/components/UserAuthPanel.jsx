import React, { useEffect, useState } from 'react';
import { GoogleLogin, googleLogout } from '@react-oauth/google';

const UserAuthPanel = ({ onAuthChange }) => {
  const [user, setUser] = useState(null);
  const API_URL = 'http://localhost:3001';

  useEffect(() => {
    // Fetch session from backend on mount
    fetch(`${API_URL}/api/auth/user`, {
      credentials: 'include'
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.user) {
          setUser(data.user);
          if (onAuthChange) onAuthChange(data.user);
        }
      })
      .catch(err => console.error('Error checking auth status:', err));
  }, [onAuthChange]);

  const handleLogin = async (credential) => {
    const res = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      if (onAuthChange) onAuthChange(data.user);
    } else {
      alert('Login failed.');
    }
  };

  const handleLogout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
    if (onAuthChange) onAuthChange(null);
    googleLogout();
  };

  return (
    <div className="user-auth-panel">
      {!user ? (
        <GoogleLogin
          onSuccess={cred => handleLogin(cred.credential)}
          onError={() => alert('Login Failed')}
        />
      ) : (
        <div className="user-auth-info">
          <span>Welcome, {user.name || user.email}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default UserAuthPanel;
