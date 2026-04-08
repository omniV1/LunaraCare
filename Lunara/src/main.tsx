/**
 * @module main
 * Application entry point. Mounts the root React component into the DOM
 * with StrictMode enabled for development diagnostics.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
