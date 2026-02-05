// ==================== Application Entry Point ====================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize Neutralino (only available in desktop environment)
// @ts-ignore
if (typeof window.Neutralino !== 'undefined') {
  // @ts-ignore
  window.Neutralino.init();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
