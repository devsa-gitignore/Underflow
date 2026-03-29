import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const LOCAL_BACKEND = 'http://localhost:5000';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || LOCAL_BACKEND).replace(/\/+$/, '');
const originalFetch = window.fetch.bind(window);

window.fetch = (input, init) => {
  if (typeof input === 'string' && input.startsWith(LOCAL_BACKEND)) {
    const rewrittenUrl = input.replace(LOCAL_BACKEND, API_BASE_URL);
    return originalFetch(rewrittenUrl, init);
  }

  if (input instanceof Request && input.url.startsWith(LOCAL_BACKEND)) {
    const rewrittenUrl = input.url.replace(LOCAL_BACKEND, API_BASE_URL);
    return originalFetch(new Request(rewrittenUrl, input), init);
  }

  return originalFetch(input, init);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
