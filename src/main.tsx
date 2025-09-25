// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  });
}

// Dev-only mock for /api/mint (so POST returns 204 when online)
if (import.meta.env.DEV) {
  const origFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.endsWith('/api/mint') && init?.method === 'POST') {
      await new Promise((r) => setTimeout(r, 300)); // simulate latency
      return new Response(null, { status: 204 });
    }
    return origFetch(input as any, init);
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
