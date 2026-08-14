/**
 * 作答页(桌面双栏形态,对应 prototype.html §E / UI-原型设计文档 §4.5):
 * 左侧签名「作答路径栏」(.fill-rail:完成度大数字 + 进度条 + 时间线题目节点)+
 * 右侧 640px 阅读列(.fill-col:问卷头 + 舒展题块 + 提交条)。≤960px 折叠为单栏,
 * 顶部细进度(.fill-thin)接管。复用同一批 .a-* 作答组件与 engine 逻辑求值。
 *
 * engine 完整链路:渲染未隐藏题 → 实时 evaluate 隐藏 → 提交时 validate(逐题错误)→ normalize → 提交。
 * 前端 validate/normalize 仅为体验(即时反馈);后端提交时必须完整重跑,永不信任客户端(决策 6)。
 *
 * 冒险点(原型 §4.5):被逻辑隐藏的题不从路径里消失,而是连同「因 Qx 跳过」原因留在时间线里,
 * 消除「题目忽隐忽现」的迷失感。完成度只算可见题。
 */
import { useMemo, useState } from 'react';
import { evaluate, validateSurvey, type SurveySchema } from '@xingjuan/engine';
import { getAnswer } from '@xingjuan/question-types';
import { ApiError, type SubmitFn } from '../api/client.js';
import { buildPath, isAnswered } from '../fillPath.js';
import type { FillAction, FillState } from '../useFill.js';

/** 已登录作答者的头部信息(login_required 路径注入):显示账号 + 提供退出换账号。 */
export interface FillAuth {
  name: string;
  onLogout: () => void;
}

export function Fill({
  schema,
  state,
  dispatch,
  submit,
  auth,
}: {
  schema: SurveySchema;
  state: FillState;
  dispatch: React.Dispatch<FillAction>;
  /** 提交函数(方案A·D2):anonymous 注入匿名版,login_required 注入鉴权版。Fill 不感知登录。 */
  submit: SubmitFn;
  /** 已登录时的头部信息(仅 login_required 路径传入);anonymous 路径为 undefined。 */
  auth?: FillAuth;
}) {
  const { answers, errors, submitting, submitError, triedSubmit } = state;
  // 隐藏题是 answers 的纯派生;每次作答后重算(约束 3:逻辑求值器统一执行)
  const { hidden } = useMemo(() => evaluate(schema.rules, answers), [schema.rules, answers]);
  const errorOf = (qid: string) => errors.find((e) => e.qid === qid)?.message;
  // 已提交尝试(sticky,对应原型 fTried):必答红/路径栏 miss 在补填时持续、实时更新
  const tried = triedSubmit;

  // 进度:已答 / 可见题总数(隐藏题不计)
  const visible = schema.questions.filter((q) => !hidden.has(q.id));
  const answeredCount = visible.filter((q) => isAnswered(answers[q.id])).length;
  const skipCount = schema.questions.length - visible.length;
  const pct = visible.length === 0 ? 0 : Math.round((answeredCount / visible.length) * 100);

  // 路径栏时间线(纯派生,已抽到 fillPath.ts 便于单测):含隐藏题,skip 带源题序号。
  const nodes = useMemo(() => buildPath(schema, answers, hidden, tried), [schema, answers, hidden, tried]);

  // 窄屏(≤960px)作答路径抽屉开合。桌面双栏常驻侧栏,不用此态。
  const [railOpen, setRailOpen] = useState(false);

  const jump = (qid: string) => {
    document.getElementById(`q-${qid}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // 作答路径内容(进度 + 时间线节点)。桌面侧栏与窄屏抽屉共用,onJump 里桌面只跳、抽屉跳完顺手关。
  const railBody = (onJump: (qid: string) => void) => (
    <>
      <div className="eyebrow">你的作答路径</div>
      <div className="meter"><span className="big">{pct}</span><span className="u">%</span></div>
      <div className="msub">
        已答 {answeredCount} / {visible.length} 可见题
        {skipCount > 0 && ` · ${skipCount} 题按你的选择跳过`}
      </div>
      <div className="bar"><i style={{ width: `${pct}%` }} /></div>
      <ul className="fill-path">
        {nodes.map(({ qid, no, title, status, srcNo }) => {
          const short = title.length > 15 ? `${title.slice(0, 14)}…` : title;
          const why =
            status === 'skip' && srcNo
              ? `因 Q${srcNo} 的选择跳过`
              : status === 'miss'
                ? '必答 · 待完成'
                : '';
          return (
            <li key={qid}>
              <button
                type="button"
                className={status ? `fnode ${status}` : 'fnode'}
                onClick={() => status !== 'skip' && onJump(qid)}
                disabled={status === 'skip'}
              >
                <span className="dot" />
                <span className="qn">Q{no}</span>
                <span className="lbl">{short}</span>
                {why && <span className="why">{why}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );

  const onSubmit = async () => {
    if (submitting) return; // 防重复提交
    // 本地校验仅为即时反馈;后端会权威重跑(决策 6)
    const errs = validateSurvey(schema, answers);
    if (errs.length > 0) {
      dispatch({ type: 'showErrors', errors: errs });
      jump(errs[0]!.qid);
      return;
    }
    // 提交是权威落库的唯一凭据:必须等后端 200 才算成功,失败留在本页可重试(答案不清盘)
    dispatch({ type: 'submitStart' });
    try {
      const { rows } = await submit(schema.id, schema.version, answers);
      dispatch({ type: 'done', rows });
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError(0, '提交未成功,请稍后重试');
      // 后端权威校验(400)带逐题错误:映射回题目错误态,滚到首个
      if (err.validation && err.validation.length > 0) {
        dispatch({ type: 'showErrors', errors: err.validation });
        jump(err.validation[0]!.qid);
        return;
      }
      // 无作答权限(creator 提交 login_required 问卷,40301):给身份类文案,而非「网络失败」。
      if (err.forbidden) {
        dispatch({ type: 'submitFail', message: '你的账号不能作答这份问卷' });
        return;
      }
      // 会话失效(401):提示重新登录。
      if (err.unauthorized) {
        dispatch({ type: 'submitFail', message: '登录已过期,请刷新页面重新登录后再提交' });
        return;
      }
      dispatch({ type: 'submitFail', message: err.message });
    }
  };

  const missCount = tried ? visible.filter((q) => q.required && !isAnswered(answers[q.id])).length : 0;

  return (
    <>
      <header className="fill-top">
        <div className="logo"><span className="dot">星</span>星卷</div>
        <div className="sp" />
        {auth ? (
          <span className="who">
            <span className="name">{auth.name}</span>
            <button type="button" className="signout" onClick={auth.onLogout}>退出</button>
          </span>
        ) : (
          <span className="safe">🔒 匿名 · 断点续答已开</span>
        )}
      </header>
      <div className="fill-thin"><i style={{ width: `${pct}%` }} /></div>

      <div className="fill-wrap">
        {/* 签名:作答路径栏(桌面双栏左列)。窄屏改由抽屉呈现,内容同源 railBody。 */}
        <aside className="fill-rail" aria-label="作答路径">{railBody(jump)}</aside>

        {/* 作答列:复用 .a-* 作答组件 */}
        <main className="fill-col">
          <div className="fill-head">
            <h1 id="fill-title">{schema.title}</h1>
            <p className="desc">
              {auth
                ? '感谢参与这份调研。你的回答与账号关联,只用于产品改进。'
                : '感谢参与这份调研。全程匿名,你的回答只用于产品改进。'}
            </p>
            <div className="meta">
              <span>共 <b>{visible.length}</b> 题</span>
              <span>约 2 分钟</span>
              <span>{auth ? '登录作答' : '匿名作答'}</span>
            </div>
          </div>

          {/* 提交进行中锁住作答区:防止 onSubmit 已捕获 answers 快照后,用户再改动导致
              "改动进了 localStorage 但没进本次提交,成功后又被清盘"的静默丢失(⑥ 复核 defect 1)。 */}
          <div className="a-body" style={submitting ? { pointerEvents: 'none', opacity: 0.6 } : undefined} aria-busy={submitting}>
            {visible.map((q, i) => {
              const Answer = getAnswer(q.type);
              const err = errorOf(q.id);
              // 必答红 = 已尝试提交 && 必答 && 当前仍未答(live,与路径栏 miss 同源;
              // 编辑补填后即时消红,不依赖会被 setAnswer 清空的 errors 数组)。
              const invalid = (tried && q.required && !isAnswered(answers[q.id])) || !!err;
              return (
                <div key={q.id} id={`q-${q.id}`} className={`a-q${invalid ? ' invalid' : ''}`}>
                  <div className="qt">
                    {q.required && <span className="req">* </span>}
                    <span className="no">Q{i + 1}</span> {q.title}
                  </div>
                  {Answer ? (
                    <Answer question={q} value={answers[q.id]} onChange={(v) => { if (!submitting) dispatch({ type: 'setAnswer', qid: q.id, value: v }); }} />
                  ) : (
                    <p style={{ color: 'var(--critical)' }}>未知题型:{q.type}</p>
                  )}
                  {err && <p style={{ color: 'var(--critical)', fontSize: 12, marginTop: 8 }}>{err}</p>}
                </div>
              );
            })}
          </div>

          <div className="fill-foot">
            <div className="a-submit" style={{ flex: 'none' }}>
              <button type="button" className="btn primary" onClick={() => void onSubmit()} disabled={submitting}>
                {submitting ? '提交中…' : '提交问卷'}
              </button>
            </div>
            <span className="note" role={submitError || missCount > 0 ? 'alert' : undefined}>
              {submitError
                ? submitError
                : missCount > 0
                  ? `还有 ${missCount} 道必答题待完成`
                  : '提交后不可修改;答案已本地暂存,可随时回来续答。'}
            </span>
          </div>
        </main>
      </div>

      {/* 窄屏(≤960px)作答路径:浮动按钮唤起抽屉。桌面用 CSS 隐藏(见 components.css)。 */}
      <button
        type="button"
        className="fill-rail-fab"
        aria-label="查看作答路径"
        aria-expanded={railOpen}
        onClick={() => setRailOpen(true)}
      >
        <span className="fab-pct">{pct}%</span>
        <span className="fab-lbl">作答路径</span>
      </button>
      {railOpen && (
        <div className="fill-rail-drawer-mask" onClick={() => setRailOpen(false)}>
          <aside
            className="fill-rail-drawer"
            aria-label="作答路径"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="drawer-close" aria-label="关闭" onClick={() => setRailOpen(false)}>✕</button>
            {railBody((qid) => {
              // 抽屉里跳题后顺手关闭,让用户立刻看到目标题。
              jump(qid);
              setRailOpen(false);
            })}
          </aside>
        </div>
      )}
    </>
  );
}
