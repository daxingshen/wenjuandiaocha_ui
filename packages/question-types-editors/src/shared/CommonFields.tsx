/**
 * 右栏「题型」tab 顶部的公共字段(§20 上移进 editors 包):题型只读锁 + 标题 + 提示 + 必答。
 * 操作 Question 顶层字段(title/hint/required),对所有题型统一存在——故共享一份,不下放给各题型复制。
 * 用原型 .field/.ro-field/.lock/.toggle-row/.sw 类(样式见 @xingjuan/ui components.css + editor.css)。
 */
import type { Question } from '@xingjuan/engine';
import '../editor.css';

export interface CommonFieldsProps {
  question: Question;
  onPatch: (patch: Partial<Question>) => void;
  /** 题型中文名(只读锁定行展示);宿主从 engine handler.label 取好传入。 */
  handlerLabel: string;
}

export function CommonFields({ question, onPatch, handlerLabel }: CommonFieldsProps) {
  return (
    <>
      <div className="field">
        <label>题型</label>
        <div className="ro-field">
          <span>{handlerLabel}</span>
          <span className="lock" title="题型创建后不可修改">🔒</span>
        </div>
      </div>

      <div className="field">
        <label>题目标题</label>
        <input type="text" value={question.title} onChange={(e) => onPatch({ title: e.target.value })} />
      </div>

      <div className="field">
        <label>填写提示</label>
        <input
          type="text"
          placeholder="显示在题干下方,作答者可见(选填)"
          value={question.hint ?? ''}
          onChange={(e) => onPatch({ hint: e.target.value })}
        />
      </div>

      <div className="toggle-row">
        <span>必答题</span>
        <div
          className={`sw${question.required ? ' on' : ''}`}
          onClick={() => onPatch({ required: !question.required })}
        />
      </div>
    </>
  );
}
