import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';
import ErrorBoundary from './components/ErrorBoundary';

// Ensure root element exists before rendering
const rootElement = document.getElementById('root');

if (!rootElement) {
  // Create a fallback error message if root element is missing
  document.body.innerHTML = `
    <div style="
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh; 
      font-family: sans-serif;
      text-align: center;
      padding: 20px;
    ">
      <div>
        <h1 style="color: #dc2626;">Application Error</h1>
        <p>Unable to find root element. Please check your index.html file.</p>
      </div>
    </div>
  `;
  throw new Error('Root element not found');
}

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Render the app
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);