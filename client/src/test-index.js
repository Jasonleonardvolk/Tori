import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import TestApp from './TestApp';

// Use the simplified TestApp instead of the main App
ReactDOM.render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>,
  document.getElementById('root')
);
