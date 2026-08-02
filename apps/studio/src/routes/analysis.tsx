/** /analysis/:id —— 数据分析页,装 analysis feature。 */
import { RequireAuth } from '../features/auth/RequireAuth.js';
import { Analysis } from '../features/analysis/Analysis.js';

export function AnalysisRoute() {
  return (
    <RequireAuth>
      <Analysis />
    </RequireAuth>
  );
}
