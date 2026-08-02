/** /home —— 登录后首页,装 dashboard feature。 */
import { RequireAuth } from '../features/auth/RequireAuth.js';
import { Dashboard } from '../features/dashboard/Dashboard.js';

export function HomeRoute() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}
