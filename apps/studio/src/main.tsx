import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerAll } from '@xingjuan/question-types';
import { initTheme } from '@xingjuan/ui';
import '@xingjuan/ui/tokens.css';
import '@xingjuan/ui/components.css';
import { App } from './App.js';

registerAll();
initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
