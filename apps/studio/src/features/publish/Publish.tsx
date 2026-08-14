/**
 * 发布回收页(Tab 3):对齐原型 prototype.html §发布回收(publish-grid 两栏)。
 *
 * 范围(gate① 定):仅「分享链接复制 / 二维码 / 状态+已回收量」真可用;
 * 其余渠道(微信/邀请/嵌入/样本)与回收控制开关按禁用占位呈现,不承诺后端(api-contract §7 延后)。
 *
 * 状态自管:挂载拉 getSurveyStats(id) 得 {status, publishedVersion, responseCount};
 * 按 status 分支(draft/live/closed/new)。**发布/暂停开关**模型(极简两词汇,降低理解成本):
 *   draft → 「发布」(publish 冻结草稿为 v1) → live
 *   live  → 「暂停发布」(close) → closed
 *   closed→ 「继续发布」(reopen 原样恢复上次发布的旧快照) → live
 * 每态只一个主按钮 + 一句状态提示。发布的是库里**已保存**的草稿快照:发布页只做发布/暂停/继续,
 * 不修改问卷内容。改内容一律在编辑页。成功后重拉 stats。id==='new'(内存草稿未落库)引导去编辑页保存。
 * 注:live 态不再提供"更新对外内容"动作(上一轮的「重新发布」已按需求撤下,暂停/继续恢复同一版本)。
 */
import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { publishSurvey, closeSurvey, reopenSurvey, getSurveyStats, setAnswerAccess, type SurveyStats, type AnswerAccess } from '../../api/surveys.js';
import { ConfirmDialog } from '../../components/ConfirmDialog.js';
import { answerLink, resolveRuntimeBase } from './publishLink.js';
import { answerAccessControlMode } from './answerAccessControl.js';

// 发布页采用「暂停/继续」词汇,故 closed 标为「已暂停」(与本页 close 按钮「暂停发布」自洽);
// 看板列表沿用「已截止」不动(本轮不扩到看板),两处标签差异为已知非阻塞项。
const STATUS_LABEL: Record<string, { cls: string; label: string }> = {
  live: { cls: 'live', label: '进行中' },
  draft: { cls: 'draft', label: '待发布' },
  closed: { cls: 'closed', label: '已暂停' },
};

/** 占位渠道(gate① 延后项),仅展示不可用。 */
const SOON_CHANNELS = [
  { ic: '💬', color: 'var(--s3)', name: '微信 / 朋友圈', desc: '自定义分享卡片,微信内免登录作答', btn: '分享' },
  { ic: '✉', color: 'var(--s7)', name: '定向短信 / 邮件邀请', desc: '导入名单精准邀请,可追踪作答进度', btn: '设置' },
  { ic: '◧', color: 'var(--s2)', name: '网页嵌入', desc: 'iframe 嵌入到自有网站', btn: '获取代码' },
  { ic: '◎', color: 'var(--s5)', name: '样本服务', desc: '付费投放给平台精准样本(年龄/地域/职业)', btn: '购买样本' },
];

const SOON_CONTROLS = ['同一微信 / IP 限答 1 次', '密码访问', '答题时长下限(防秒答)', '配额控制(如男性满 500 份停止)', '定时开始 / 结束'];

interface PublishProps {
  id: string;
  /** 去编辑页(new 态无可发布内容时引导用户先保存)。 */
  onGoEdit: () => void;
}

export function Publish({ id, onGoEdit }: PublishProps) {
  const isNew = id === 'new';
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  // 生命周期动作(发布/暂停/继续)统一走二次确认:点击先记下 kind,弹确认框,确认才执行。
  const [confirm, setConfirm] = useState<'publish' | 'close' | 'reopen' | null>(null);

  const link = answerLink(id, resolveRuntimeBase());

  const refresh = useCallback(() => {
    if (isNew) return Promise.resolve();
    setLoadState('loading');
    return getSurveyStats(id)
      .then((s) => {
        setStats(s);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, [id, isNew]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const status = stats?.status ?? (isNew ? 'new' : 'draft');
  const badge = STATUS_LABEL[status];

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice('复制失败,请手动复制链接');
    }
  };

  // 切换作答访问模式(仅 draft 可改)。乐观更新 + 失败回滚;后端为唯一强制点。
  const [accessBusy, setAccessBusy] = useState(false);
  const onToggleAccess = async () => {
    if (accessBusy || !stats) return;
    const next: AnswerAccess = stats.answerAccess === 'login_required' ? 'anonymous' : 'login_required';
    setAccessBusy(true);
    setNotice('');
    try {
      await setAnswerAccess(id, next);
      setStats({ ...stats, answerAccess: next });
      setNotice(next === 'login_required' ? '已设为需登录作答' : '已设为匿名作答');
    } catch {
      setNotice('切换作答模式失败,请重试');
    } finally {
      setAccessBusy(false);
    }
  };

  // 确认框「确认」回调:按 confirm 类型执行对应动作,成功后重拉 stats、关框。
  // publish(首发:冻结草稿为 v1 并 live)/ close(暂停)/ reopen(继续:原样恢复上次发布的旧快照)。
  const runConfirmed = async () => {
    if (!confirm) return;
    setBusy(true);
    setNotice('');
    try {
      if (confirm === 'close') {
        await closeSurvey(id);
      } else if (confirm === 'reopen') {
        await reopenSurvey(id);
      } else {
        await publishSurvey(id);
        setNotice('已发布');
      }
      await refresh();
      setConfirm(null);
    } catch {
      setNotice(confirm === 'close' ? '暂停失败' : confirm === 'reopen' ? '继续发布失败' : '发布失败');
    } finally {
      setBusy(false);
    }
  };

  // 确认框文案(按 kind)。发布/暂停/继续三动作各讲清后果。
  const CONFIRM_META: Record<'publish' | 'close' | 'reopen', { title: string; body: string; confirmLabel: string }> = {
    publish: {
      title: '发布问卷',
      body: '将发布编辑页里已保存的最新内容并正式对外接收作答;未保存的编辑不会包含(如刚在编辑器改动,请先返回编辑页保存)。确认发布?',
      confirmLabel: '发布问卷',
    },
    close: {
      title: '暂停发布',
      body: '暂停后问卷将停止接收新的作答,已回收数据保留。可随时点「继续发布」恢复。确认暂停?',
      confirmLabel: '暂停发布',
    },
    reopen: {
      title: '继续发布',
      body: '将恢复上次发布的版本重新对外接收作答(内容与暂停前一致)。确认继续?',
      confirmLabel: '继续发布',
    },
  };

  // 内存草稿(未落库):无可发布内容。发布页不保存问卷,引导回编辑页保存后再来发布。
  if (isNew) {
    return (
      <div className="wpad" style={{ padding: 24 }}>
        <div className="card chart-card" style={{ maxWidth: 520 }}>
          <div className="ct">问卷尚未保存</div>
          <div className="cs">发布页只负责发布已保存的问卷。请先在编辑页保存,再回来发布。</div>
          <button className="btn primary" onClick={onGoEdit}>✎ 去编辑页保存</button>
        </div>
      </div>
    );
  }

  const published = status === 'live' || status === 'closed';

  return (
    <div className="wpad" style={{ padding: 24 }}>
      <div className="publish-grid">
        {/* 左:渠道 + 回收控制 */}
        <div>
          <div className="card chart-card" style={{ marginBottom: 16 }}>
            <div className="ct">回收渠道</div>
            <div className="cs">选择合适的渠道把问卷分发出去</div>
            {/* 分享链接:唯一真可用渠道 */}
            <div className="channel">
              <span className="ci" style={{ background: 'var(--s1)' }}>🔗</span>
              <div>
                <div className="cn">分享链接</div>
                <div className="cd">复制链接,发给任何人作答</div>
              </div>
              <button className={`btn sm${published ? ' primary' : ''}`} disabled={!published} onClick={onCopy}>
                {copied ? '已复制' : '复制'}
              </button>
            </div>
            <div className="channel">
              <span className="ci" style={{ background: 'var(--s4)' }}>▦</span>
              <div>
                <div className="cn">二维码</div>
                <div className="cd">扫码作答,或截图右侧二维码分发</div>
              </div>
              <button className="btn sm" disabled title="见右侧二维码,下载即将上线">
                下载
              </button>
            </div>
            {SOON_CHANNELS.map((ch) => (
              <div key={ch.name} className="channel disabled">
                <span className="ci" style={{ background: ch.color }}>{ch.ic}</span>
                <div>
                  <div className="cn">{ch.name}</div>
                  <div className="cd">{ch.desc}</div>
                </div>
                <button className="btn sm" disabled title="即将上线">{ch.btn}</button>
              </div>
            ))}
          </div>

          <div className="card chart-card">
            <div className="ct">回收控制</div>
            <div className="cs">防刷与配额,保证样本质量</div>

            {/* 作答访问模式。draft 可切;发布后(live/closed)锁定,纯文字回显;new 态无库行不显示。 */}
            {stats && (
              answerAccessControlMode(status) === 'editable' ? (
                <div className="toggle-row">
                  <div>
                    <span>需登录才能作答</span>
                    <div className="cd" style={{ marginTop: 2 }}>关闭后任何人凭链接可匿名作答</div>
                  </div>
                  <div
                    className={`sw${stats.answerAccess === 'login_required' ? ' on' : ''}`}
                    role="switch"
                    aria-checked={stats.answerAccess === 'login_required'}
                    aria-label="需登录才能作答"
                    title="仅未发布时可改"
                    onClick={() => { if (!accessBusy) void onToggleAccess(); }}
                  />
                </div>
              ) : (
                <div className="toggle-row" style={{ opacity: 0.7 }}>
                  <span>作答访问模式</span>
                  <span style={{ color: 'var(--ink-2)', fontSize: 13 }}>
                    {stats.answerAccess === 'login_required' ? '需登录作答(发布后锁定)' : '匿名作答(发布后锁定)'}
                  </span>
                </div>
              )
            )}

            {SOON_CONTROLS.map((label) => (
              <div key={label} className="toggle-row" style={{ opacity: 0.55 }}>
                <span>{label}</span>
                <div className="sw" title="即将上线" />
              </div>
            ))}
          </div>
        </div>

        {/* 右:二维码 + 链接 + 状态 + 回收量 */}
        <div className="card chart-card">
          <div className="ct">问卷二维码</div>
          <div className="cs">扫码即可作答</div>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 16px' }}>
            <div className="qr2">
              {published ? (
                <QRCodeSVG value={link} size={138} />
              ) : (
                <span style={{ fontSize: 12, color: 'var(--ink-muted)', padding: 12, textAlign: 'center' }}>发布后生成</span>
              )}
            </div>
          </div>
          <label style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 500 }}>作答链接</label>
          <div className="link-box">
            <input value={published ? link : '发布后生成作答链接'} readOnly />
            <button className="btn sm primary" disabled={!published} onClick={onCopy}>
              {copied ? '已复制' : '复制'}
            </button>
          </div>

          {/* 生命周期面板:状态色标 + 回收量在顶栏,说明文案 + 主动作落在有边界的 body。
              每态一个动作:draft 发布 / live 暂停发布 / closed 继续发布。 */}
          <div className={`lc-panel ${status === 'live' ? 'is-live' : status === 'closed' ? 'is-paused' : 'is-draft'}`}>
            <div className="lc-head">
              <span className="lc-chip">
                <span className="lc-dot" />
                {loadState === 'loading' ? '加载中…' : (badge?.label ?? '待发布')}
              </span>
              <span className="lc-recv">
                已回收 <b>{stats ? stats.responseCount.toLocaleString() : '—'}</b> 份
              </span>
            </div>
            <div className="lc-body">
              {status === 'draft' && (
                <>
                  <p className="lc-hint">问卷尚未发布,填写完成后即可对外接收作答。</p>
                  <button className="btn primary lc-act" disabled={busy} onClick={() => setConfirm('publish')}>
                    {busy ? '发布中…' : '🚀 发布'}
                  </button>
                </>
              )}
              {status === 'live' && (
                <>
                  <p className="lc-hint">问卷进行中,正在接收作答。暂停后可随时继续,已收数据保留。</p>
                  <button className="btn warn lc-act" disabled={busy} onClick={() => setConfirm('close')}>
                    {busy ? '处理中…' : '⏸ 暂停发布'}
                  </button>
                </>
              )}
              {status === 'closed' && (
                <>
                  <p className="lc-hint">问卷已暂停,当前不接收作答。继续发布将恢复暂停前的版本。</p>
                  <button className="btn primary lc-act" disabled={busy} title="将恢复上次发布的版本供作答" onClick={() => setConfirm('reopen')}>
                    {busy ? '处理中…' : '▶ 继续发布'}
                  </button>
                </>
              )}
              {loadState === 'error' && <p className="lc-note err">加载状态失败</p>}
              {notice && <p className="lc-note">{notice}</p>}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm ? CONFIRM_META[confirm].title : ''}
        body={confirm ? CONFIRM_META[confirm].body : ''}
        confirmLabel={confirm ? CONFIRM_META[confirm].confirmLabel : ''}
        busy={busy}
        onConfirm={runConfirmed}
        onCancel={() => !busy && setConfirm(null)}
      />
    </div>
  );
}
