/**
 * 发布回收页(Tab 3):对齐原型 prototype.html §发布回收(publish-grid 两栏)。
 *
 * 范围(gate① 定):仅「分享链接复制 / 二维码 / 状态+已回收量」真可用;
 * 其余渠道(微信/邀请/嵌入/样本)与回收控制开关按禁用占位呈现,不承诺后端(api-contract §7 延后)。
 *
 * 状态自管:挂载拉 getSurveyStats(id) 得 {status, publishedVersion, responseCount};
 * 按 status 分支(draft/live/closed/new)。发布/结束只调对应 api,发布的是库里**已保存**的草稿——
 * 发布页只做发布行为,不修改问卷内容(不保存、不写草稿)。成功后重拉 stats。
 * 重新打开不在发布页(入口在看板 Dashboard);id==='new'(内存草稿未落库)引导去编辑页保存,不在此保存。
 */
import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { publishSurvey, closeSurvey, getSurveyStats, type SurveyStats } from '../../api/surveys.js';
import { answerLink, resolveRuntimeBase } from './publishLink.js';

const STATUS_LABEL: Record<string, { cls: string; label: string }> = {
  live: { cls: 'live', label: '进行中' },
  draft: { cls: 'draft', label: '草稿' },
  closed: { cls: 'closed', label: '已截止' },
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

  // 发布库里已保存的草稿快照 —— 不保存、不改草稿(发布页只做发布行为)。
  const doPublish = async () => {
    setBusy(true);
    setNotice('');
    try {
      await publishSurvey(id);
      await refresh();
      setNotice('已发布');
    } catch {
      setNotice('发布失败');
    } finally {
      setBusy(false);
    }
  };

  const doClose = async () => {
    setBusy(true);
    setNotice('');
    try {
      await closeSurvey(id);
      await refresh();
    } catch {
      setNotice('结束失败');
    } finally {
      setBusy(false);
    }
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
              <button className="btn sm" disabled={!published} onClick={onCopy}>
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
            <div className="cs">防刷与配额,保证样本质量(即将上线)</div>
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

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 13, color: 'var(--ink-2)' }}>
            <span>状态</span>
            {loadState === 'loading' ? (
              <span style={{ color: 'var(--ink-muted)' }}>加载中…</span>
            ) : badge ? (
              <span className={`badge ${badge.cls}`}>{badge.label}</span>
            ) : (
              <span className="badge draft">草稿</span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 13, color: 'var(--ink-2)' }}>
            <span>已回收</span>
            <b style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
              {stats ? stats.responseCount.toLocaleString() : '—'} 份
            </b>
          </div>

          {/* 状态相关主动作 */}
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {status === 'draft' && (
              <button className="btn primary" disabled={busy} onClick={doPublish}>
                {busy ? '发布中…' : '🚀 发布问卷'}
              </button>
            )}
            {status === 'live' && (
              <button className="btn" disabled={busy} onClick={doClose}>
                {busy ? '处理中…' : '⏹ 结束回收'}
              </button>
            )}
            {status === 'closed' && (
              <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0 }}>问卷已结束回收。如需重新开放,请在看板操作。</p>
            )}
            {status === 'live' && (
              <button className="btn primary" disabled={busy} title="将当前已保存的草稿冻结为新版本对外发布(如需改内容请先在编辑页保存)" onClick={doPublish}>
                {busy ? '发布中…' : '再次发布(更新对外版本)'}
              </button>
            )}
          </div>

          {loadState === 'error' && <p style={{ fontSize: 12, color: 'var(--critical)', marginTop: 10 }}>加载状态失败</p>}
          {notice && <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 10 }}>{notice}</p>}
        </div>
      </div>
    </div>
  );
}
