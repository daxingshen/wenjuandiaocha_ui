import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerAll } from '@xingjuan/question-types';
import '@xingjuan/ui/tokens.css';
import { App } from './App.js';

registerAll();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
