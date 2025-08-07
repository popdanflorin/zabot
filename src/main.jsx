import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initI18n } from './i18n';

initI18n().then(() => {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('Root element not found');
  }

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
