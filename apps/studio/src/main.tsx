import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerAll } from '@xingjuan/question-types';
import { registerAllEditors } from '@xingjuan/question-types-editors';
import { initTheme } from '@xingjuan/ui';
import '@xingjuan/ui/tokens.css';
import '@xingjuan/ui/components.css';
import { App } from './App.js';

// 行为 + 作答组件;editors 仅 studio 追加,runtime 不引入(编辑器代码不进作答端产物)
registerAll();
registerAllEditors();
initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
