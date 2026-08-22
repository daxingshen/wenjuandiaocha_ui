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
import { useEffect, useMemo, useState } from 'react';
import { evaluate, validateSurvey, type SurveySchema } from '@xingjuan/engine';
import { getAnswer } from '@xingjuan/question-types';
import { ApiError, type DisplayMode, type SubmitFn } from '../api/client.js';
import { buildPath, isAnswered } from '../fillPath.js';
import { initialCursorId, pickCurrent } from '../pickCurrent.js';
import type { FillAction, FillState } from '../useFill.js';

/** 已登录作答者的头部信息(login_required 路径注入):显示账号 + 提供退出换账号。 */
export interface FillAuth {
  name: string;
  onLogout: () => void;
}

export function Fill({
  schema,
  displayMode,
  state,
  dispatch,
  submit,
  auth,
}: {
  schema: SurveySchema;
  /** 作答呈现形态:'paged' 逐题一页(每屏一题 + 上/下一题),'single'(默认)全部一页。 */
  displayMode: DisplayMode;
  state: FillState;
  dispatch: React.Dispatch<FillAction>;
  /** 提交函数(方案A·D2):anonymous 注入匿名版,login_required 注入鉴权版。Fill 不感知登录。 */
  submit: SubmitFn;
  /** 已登录时的头部信息(仅 login_required 路径传入);anonymous 路径为 undefined。 */
  auth?: FillAuth;
}) {
  const { answers, curId, errors, submitting, submitError, triedSubmit } = state;
  const paged = displayMode === 'paged';
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

  // 逐题模式:当前题**只由持久化指针 curId 决定**,不随作答重算——否则勾选当前题即被判"已答"、
  // 当前题就滑到下一题(真机缺陷)。curId 指向的题若被逻辑隐藏,pickCurrent 借原题序就近回退。
  // curId 为 null(初次进入/旧数据无指针)时先渲染"首个未答题"占位,同时由下方 useEffect 一次性
  // 把指针锚定到 state;锚定后前进只发生在点「下一题/上一题/跳题」。单页模式下 cur 恒 null。
  const orderIds = useMemo(() => schema.questions.map((q) => q.id), [schema]);
  const cur = paged ? pickCurrent(visible, curId ?? initialCursorId(visible, answers), orderIds) : null;
  const curIdx = cur ? visible.findIndex((q) => q.id === cur.id) : -1;
  const isFirstVisible = curIdx <= 0;
  const isLastVisible = curIdx === visible.length - 1;

  // 进入逐题模式且无持久指针时,把当前题一次性锚定到 state(首个未答→首个可见)。
  // 锚定后 curId 不再为 null,cur 纯由 curId 驱动,勾选当前题不再触发跳题。
  // 依赖 cur?.id:仅在"该渲染哪题"已定且 state 尚未落指针时落一次,不会来回抖动。
  useEffect(() => {
    if (paged && curId == null && cur) dispatch({ type: 'setCurrent', qid: cur.id });
  }, [paged, curId, cur, dispatch]);

  // 窄屏(≤960px)作答路径抽屉开合。桌面双栏常驻侧栏,不用此态。
  const [railOpen, setRailOpen] = useState(false);
  // 提交失败弹窗:非校验类失败(无权限/会话失效/网络/服务端)用弹窗明确告知,而非仅底部小字。
  // 校验类失败仍走逐题红 + 滚动,不弹窗(那是"补填"而非"出错")。
  const [failModal, setFailModal] = useState<{ title: string; body: string } | null>(null);
  // 提交二次确认:本地校验通过后先弹确认框(告知"提交后不可修改"),确认才真正提交。
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // 单页模式:滚到目标题。逐题模式:目标题不在当前屏,改为切换当前题(setCurrent),再由渲染切页。
  const jump = (qid: string) => {
    if (paged) {
      if (!hidden.has(qid)) dispatch({ type: 'setCurrent', qid });
      return;
    }
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

  // 点提交:本地校验(仅即时反馈,后端会权威重跑,决策 6)。通过则弹二次确认,不直接提交。
  const onSubmit = () => {
    if (submitting) return; // 防重复提交
    const errs = validateSurvey(schema, answers);
    if (errs.length > 0) {
      dispatch({ type: 'showErrors', errors: errs });
      jump(errs[0]!.qid);
      return;
    }
    setConfirmSubmit(true);
  };

  // 二次确认后真正提交(权威落库的唯一凭据:必须等后端 200 才算成功,失败留在本页可重试,答案不清盘)。
  const doSubmit = async () => {
    setConfirmSubmit(false);
    if (submitting) return;
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
        const msg = '你的账号不能作答这份问卷。请用作答账号登录后再试。';
        dispatch({ type: 'submitFail', message: msg });
        setFailModal({ title: '无法提交', body: msg });
        return;
      }
      // 会话失效(401):提示重新登录。
      if (err.unauthorized) {
        const msg = '登录已过期,请刷新页面重新登录后再提交。';
        dispatch({ type: 'submitFail', message: msg });
        setFailModal({ title: '登录已过期', body: msg });
        return;
      }
      // 其它(网络/429/5xx):留在本页可重试,弹窗告知具体原因。
      dispatch({ type: 'submitFail', message: err.message });
      setFailModal({ title: '提交未成功', body: `${err.message}。你的答案已本地暂存,可稍后重试。` });
    }
  };

  // 逐题「下一题」:先校验当前题(复用 validateSurvey,过滤到当前 qid),不通过则亮该题红、不前进;
  // 通过则切到下一可见题。最后一题的「下一题」由按钮换成「提交问卷」走 onSubmit,不进此函数。
  const goNext = () => {
    if (submitting || !cur) return;
    const errs = validateSurvey(schema, answers).filter((e) => e.qid === cur.id);
    if (errs.length > 0) {
      dispatch({ type: 'showErrors', errors: errs });
      return;
    }
    const next = visible[curIdx + 1];
    if (next) dispatch({ type: 'setCurrent', qid: next.id });
  };

  // 逐题「上一题」:回到上一可见题,已填值保留(不校验、不清答案)。首题时按钮隐藏,不会走到这。
  const goPrev = () => {
    if (submitting) return;
    const prev = visible[curIdx - 1];
    if (prev) dispatch({ type: 'setCurrent', qid: prev.id });
  };

  const missCount = tried ? visible.filter((q) => q.required && !isAnswered(answers[q.id])).length : 0;

  // 单题块渲染(单页/逐题共用):i 为可见序号,用于 Q{i+1} 编号(沿用原单页口径,行为不变)。
  const renderQuestion = (q: (typeof visible)[number], i: number) => {
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
        {q.hint && <div className="q-hint">{q.hint}</div>}
        {Answer ? (
          <Answer question={q} value={answers[q.id]} onChange={(v) => { if (!submitting) dispatch({ type: 'setAnswer', qid: q.id, value: v }); }} />
        ) : (
          <p style={{ color: 'var(--critical)' }}>未知题型:{q.type}</p>
        )}
        {err && <p style={{ color: 'var(--critical)', fontSize: 12, marginTop: 8 }}>{err}</p>}
      </div>
    );
  };

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
            {/* 单页(single,默认):渲染全部可见题;逐题(paged):只渲染当前题 cur。
                两条路径共用同一题块渲染(renderQuestion),保证单页行为零变化。 */}
            {paged
              ? cur && renderQuestion(cur, curIdx)
              : visible.map((q, i) => renderQuestion(q, i))}
          </div>

          {paged ? (
            // 逐题页脚:翻页器(上一题[首题隐藏] / 下一题[末题禁用不消失,保持翻页器稳定])一行,
            // 末题再单起一行给与列等宽的「提交问卷」——提交是独立动作,不并进翻页器。
            <div className="fill-foot fill-foot-paged">
              <div className="fill-pager">
                {!isFirstVisible && (
                  <button type="button" className="btn" onClick={goPrev} disabled={submitting}>← 上一题</button>
                )}
                <div className="sp" style={{ flex: 1 }} />
                <button type="button" className="btn primary" onClick={goNext} disabled={submitting || isLastVisible}>下一题 →</button>
              </div>
              {isLastVisible && (
                <div className="a-submit">
                  <button type="button" className="btn primary" onClick={() => void onSubmit()} disabled={submitting}>
                    {submitting ? '提交中…' : '提交问卷'}
                  </button>
                </div>
              )}
              {(submitError || missCount > 0) && (
                <span className="note" role="alert">
                  {submitError ? submitError : `还有 ${missCount} 道必答题待完成`}
                </span>
              )}
            </div>
          ) : (
            <div className="fill-foot">
              <div className="a-submit" style={{ flex: 'none' }}>
                <button type="button" className="btn primary" onClick={() => void onSubmit()} disabled={submitting}>
                  {submitting ? '提交中…' : '提交问卷'}
                </button>
              </div>
              {/* 静态"提交后不可修改"提示已移入提交二次确认弹窗;此处只在有校验/提交错误时显示红字反馈。 */}
              {(submitError || missCount > 0) && (
                <span className="note" role="alert">
                  {submitError ? submitError : `还有 ${missCount} 道必答题待完成`}
                </span>
              )}
            </div>
          )}
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

      {/* 提交二次确认弹窗:本地校验已过,确认后才真正提交。告知"提交后不可修改"。 */}
      {confirmSubmit && (
        <div className="modal-mask" role="dialog" aria-modal="true" aria-label="确认提交" onClick={() => setConfirmSubmit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">确认提交?</div>
            <div className="modal-body">提交后不可修改。你的答案已本地暂存,可随时回来续答。</div>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setConfirmSubmit(false)}>再检查一下</button>
              <button type="button" className="btn primary" onClick={() => void doSubmit()}>确认提交</button>
            </div>
          </div>
        </div>
      )}

      {/* 提交失败弹窗(非校验类):明确告知原因 + 单「知道了」关闭。校验类走逐题红,不弹窗。 */}
      {failModal && (
        <div className="modal-mask" role="dialog" aria-modal="true" aria-label={failModal.title} onClick={() => setFailModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{failModal.title}</div>
            <div className="modal-body">{failModal.body}</div>
            <div className="modal-actions">
              <button type="button" className="btn primary" onClick={() => setFailModal(null)}>知道了</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
