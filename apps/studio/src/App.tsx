/**
 * 工作台入口:路由表(决策 7,官网延后,登录并入 studio)。
 * /login 未登录入口 → /home 看板 → /survey/:id/:tab 专注工作区(四 tab)。
 * 受保护路由在各 route 内用 <RequireAuth> 包装(未登录跳 /login)。
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginRoute } from './routes/login.js';
import { HomeRoute } from './routes/home.js';
import { SurveyRoute } from './routes/survey.js';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/home" element={<HomeRoute />} />
        <Route path="/survey/:id/:tab" element={<SurveyRoute />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
