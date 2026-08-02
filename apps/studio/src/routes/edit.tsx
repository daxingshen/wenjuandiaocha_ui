/** /edit/:id —— 编辑器页,装 editor feature(产品心脏)。 */
import { RequireAuth } from '../features/auth/RequireAuth.js';
import { Editor } from '../features/editor/Editor.js';

export function EditRoute() {
  return (
    <RequireAuth>
      <Editor />
    </RequireAuth>
  );
}
