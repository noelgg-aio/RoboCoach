import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { API_KEY, GEMINI_API_KEY_MISSING_ERROR } from './constants';

// Check for API Key at the very start
if (!API_KEY) {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #0f172a; color: #e2e8f0; font-family: Inter, sans-serif; padding: 20px; text-align: center;">
        <h1 style="color: #f472b6; font-size: 1.5rem; margin-bottom: 1rem;">Configuration Error</h1>
        <p style="font-size: 1rem; margin-bottom: 0.5rem;">${GEMINI_API_KEY_MISSING_ERROR}</p>
        <p style="font-size: 0.9rem; color: #94a3b8;">Please ensure the API_KEY environment variable is correctly set and accessible by the application.</p>
         <p style="font-size: 0.8rem; color: #64748b; margin-top: 2rem;">Refer to the project documentation for setup instructions.</p>
      </div>
    `;
  }
  console.error(GEMINI_API_KEY_MISSING_ERROR);
} else {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}