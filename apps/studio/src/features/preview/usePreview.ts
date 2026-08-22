/**
 * 预览作答态(useReducer)。与 runtime useFill 的关键差异:
 * 预览是发布前自检、即抛——**不落 localStorage、不调后端**。提交只跑 engine validate 给回执。
 *
 * reducer 抽成纯函数 `previewReducer` 便于单测(不依赖 React)。
 */
import { useReducer } from 'react';
import { validateSurvey } from '@xingjuan/engine';
import type { SurveySchema, Answers, ValidationError } from '@xingjuan/engine';

/** 提交回执:未提交 / 校验拦截 / 通过。 */
export type Submitted = 'none' | 'blocked' | 'ok';

export interface PreviewState {
  answers: Answers;
  errors: ValidationError[];
  submitted: Submitted;
  /** 逐题预览的当前题 id(displayMode='paged' 时用);null=回落首个可见题。单页预览不用。 */
  curId: string | null;
}

export type PreviewAction =
  | { type: 'setAnswer'; qid: string; value: unknown }
  | { type: 'setCurrent'; qid: string }
  | { type: 'showErrors'; errors: ValidationError[] }
  | { type: 'submitOk' }
  | { type: 'reset' };

export const initialPreviewState: PreviewState = { answers: {}, errors: [], submitted: 'none', curId: null };

/** 纯 reducer:改答案即清错误与回执(下次提交重算);提交结果由 submit 编排派发。 */
export function previewReducer(state: PreviewState, action: PreviewAction): PreviewState {
  switch (action.type) {
    case 'setAnswer':
      return { ...state, answers: { ...state.answers, [action.qid]: action.value }, errors: [], submitted: 'none' };
    case 'setCurrent':
      // 逐题预览翻页:只切当前题,不落盘(预览零持久化)、不动答案。
      return { ...state, curId: action.qid };
    case 'showErrors':
      return { ...state, errors: action.errors, submitted: 'blocked' };
    case 'submitOk':
      return { ...state, errors: [], submitted: 'ok' };
    case 'reset':
      return { answers: {}, errors: [], submitted: 'none', curId: null };
    default:
      return state;
  }
}

/**
 * 编排提交:跑 validate,有错则 showErrors(拦截)、无错则 submitOk。
 * 纯函数,返回首个错误 qid(供调用方滚动定位),不产生任何副作用/网络请求。
 */
export function runSubmit(
  schema: SurveySchema,
  answers: Answers,
  dispatch: (a: PreviewAction) => void,
): { ok: boolean; firstErrorQid?: string } {
  const errors = validateSurvey(schema, answers);
  if (errors.length > 0) {
    dispatch({ type: 'showErrors', errors });
    return { ok: false, firstErrorQid: errors[0]!.qid };
  }
  dispatch({ type: 'submitOk' });
  return { ok: true };
}

/** 预览作答态 hook。每次进入从空开始(不恢复,不留存)。 */
export function usePreview() {
  return useReducer(previewReducer, initialPreviewState);
}
