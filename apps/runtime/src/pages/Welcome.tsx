/**
 * 作答端欢迎屏(作答路径第 0 站,③ UI§六②)。登录闸门(login_required)之后、Fill 之前。
 * 顶栏(.fill-top,与 Fill/Done 三页连续)+ 居中阅读列(无路径栏——此刻还没进度,是安静门槛):
 * eyebrow「欢迎」+ 标题 + 富内容只读渲染(WelcomeView,消毒)+ 元信息 + 「开始作答」。
 * 无欢迎内容:富内容段整段不渲染,其余上移(总显欢迎页)。点开始→dispatch start→进 Fill。
 */
import { evaluate, type SurveySchema } from '@xingjuan/engine';
import { WelcomeView } from '@xingjuan/ui/welcome';
import type { FillAuth } from './Fill.js';
import type { FillAction } from '../useFill.js';

export function Welcome({
  schema,
  dispatch,
  auth,
}: {
  schema: SurveySchema;
  dispatch: React.Dispatch<FillAction>;
  auth?: FillAuth;
}) {
  // 可见题数(元信息用):欢迎屏无答案,按空答案求隐藏,得初始可见集。
  const { hidden } = evaluate(schema.rules, {});
  const visibleCount = schema.questions.filter((q) => !hidden.has(q.id)).length;

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

      <div className="fill-wrap">
        <main className="wel-screen">
          <div className="wel-eyebrow">欢迎</div>
          <h1 className="wel-title">{schema.title}</h1>

          {/* 富内容只读渲染(消毒);无内容则不渲染(WelcomeView 返回 null)。 */}
          <WelcomeView welcome={schema.welcome} />

          <div className="wel-meta">
            <span>共 <b>{visibleCount}</b> 题</span>
            <span>约 {Math.max(1, Math.round(visibleCount / 4))} 分钟</span>
            <span>{auth ? '登录作答' : '匿名作答'}</span>
          </div>

          <div className="wel-actions">
            <button type="button" className="btn primary lg" onClick={() => dispatch({ type: 'start' })}>
              开始作答
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
