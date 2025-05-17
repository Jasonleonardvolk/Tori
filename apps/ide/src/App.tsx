import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@itori/ui-kit';

import ItoriIDELayout from './ItoriIDELayout';
import './App.css';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<ItoriIDELayout />} />
          <Route path="*" element={<div>Page not found</div>} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
