import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerAll } from '@xingjuan/question-types';
import '@xingjuan/ui/tokens.css';
import { App } from './App.js';

// 启动时注册全部题型一次(约束 2:加题型只改 question-types,此处不动)
registerAll();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
