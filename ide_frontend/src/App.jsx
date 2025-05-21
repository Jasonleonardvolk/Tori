import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ItoriIDELayout from './ItoriIDELayout';
import ErrorBoundary from './components/ErrorBoundary';
import UserAuthPanel from './components/UserAuthPanel';
import './App.css';

// Lazy loading secondary components
const NavigationDemoApp = lazy(() => import('./NavigationDemoApp'));
const AffectiveIntegrationExample = lazy(() => import('./AffectiveIntegrationExample'));
const BucketViewer = lazy(() => import('./components/BucketViewer/BucketViewer'));
const SourceValidationAdmin = lazy(() => import('./components/SourceValidationAdmin/SourceValidationAdmin'));

/**
 * Main Application Component
 * 
 * Acts as the entry point for the ITORI IDE, providing navigation
 * to different demonstration applications and features.
 */
const App = () => {
  return (
    <Router>
      <div className="app-container">
        <div className="auth-container">
          <UserAuthPanel onAuthChange={(user) => console.log('Auth changed:', user)} />
        </div>
        <Routes>
          <Route path="/chat" element={<ItoriIDELayout />} />
          <Route path="/navigation" element={
            <ErrorBoundary>
              <Suspense fallback={<div className="center">Loading…</div>}>
                <NavigationDemoApp />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="/affective" element={
            <ErrorBoundary>
              <Suspense fallback={<div className="center">Loading…</div>}>
                <AffectiveIntegrationExample />
              </Suspense>
            </ErrorBoundary>
          } />
          
          <Route path="/bucket" element={
            <ErrorBoundary>
              <Suspense fallback={<div className="center">Loading…</div>}>
                <BucketViewer />
              </Suspense>
            </ErrorBoundary>
          } />
          
          <Route path="/admin/validation" element={
            <ErrorBoundary>
              <Suspense fallback={<div className="center">Loading…</div>}>
                <SourceValidationAdmin />
              </Suspense>
            </ErrorBoundary>
          } />
          
          {/* Default route - redirect to the default app */}
          <Route path="/" element={<Navigate to={import.meta.env.VITE_DEFAULT_APP ?? "/chat"} replace />} />
          
          {/* 404 fallback - redirect to default app */}
          <Route path="*" element={<Navigate to={import.meta.env.VITE_DEFAULT_APP ?? "/chat"} replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
