// ==================== Application Entry Point ====================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize Neutralino (only available in desktop environment)
// @ts-expect-error - Neutralino is not available in browser environment
if (typeof window.Neutralino !== 'undefined') {
  // @ts-expect-error - Neutralino is not available in browser environment
  window.Neutralino.init();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
