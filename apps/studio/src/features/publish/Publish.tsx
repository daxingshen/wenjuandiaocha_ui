/**
 * 发布回收页(Tab 3):对齐原型 prototype.html §发布回收(publish-grid 两栏)。
 *
 * 范围(gate① 定):仅「分享链接复制 / 二维码 / 状态+已回收量」真可用;
 * 其余渠道(微信/邀请/嵌入/样本)与回收控制开关按禁用占位呈现,不承诺后端(api-contract §7 延后)。
 *
 * 状态自管:挂载拉 getSurveyStats(id) 得 {status, publishedVersion, responseCount};
 * 按 status 分支(draft/live/closed/new)。发布页是**生命周期控制台**——发布/重新发布/结束/重新打开
 * 四个动作集中在此(reopen 不再在看板)。发布的是库里**已保存**的草稿快照:发布页只做发布行为,
 * 不修改问卷内容(不保存、不写草稿)。改内容一律在编辑页;重新发布前须先在编辑页保存。成功后重拉 stats。
 * id==='new'(内存草稿未落库)引导去编辑页保存,不在此保存。
 */
import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { publishSurvey, closeSurvey, reopenSurvey, getSurveyStats, type SurveyStats } from '../../api/surveys.js';
import { ConfirmDialog } from '../../components/ConfirmDialog.js';
import { answerLink, resolveRuntimeBase } from './publishLink.js';

const STATUS_LABEL: Record<string, { cls: string; label: string }> = {
  live: { cls: 'live', label: '进行中' },
  draft: { cls: 'draft', label: '待发布' },
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
  // 生命周期动作(首发/重发/结束/重开)统一走二次确认:点击先记下 kind,弹确认框,确认才执行。
  const [confirm, setConfirm] = useState<'publish' | 'close' | 'republish' | 'reopen' | null>(null);
  // 单按钮告知框(「已了解」):重发免发这类"无副作用、需用户知晓"的结果用它,不用一闪而过的小字。
  const [ackMsg, setAckMsg] = useState('');

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

  // 确认框「确认」回调:按 confirm 类型执行对应动作,成功后重拉 stats、关框。
  // 首发/重发均复用 publishSurvey(冻结库里已保存草稿为新版本、切换对外版本);
  // 重发若草稿与当前对外版本一致,后端免发(unchanged),此处据此改提示、不误报"已更新"。
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
        // publish(首发)/ republish(重发)
        const { version, unchanged } = await publishSurvey(id);
        if (unchanged) {
          // 内容未变、后端免发:弹需用户点头的提示框(「已了解」),不用一闪而过的小字。
          setAckMsg('当前内容与已发布版本一致,无需重新发布。如需更新对外内容,请先在编辑页修改并保存。');
        } else {
          setNotice(confirm === 'publish' ? '已发布' : `已更新至版本 ${version}`);
        }
      }
      await refresh();
      setConfirm(null);
    } catch {
      setNotice(
        confirm === 'close' ? '结束失败' : confirm === 'reopen' ? '重新打开失败' : confirm === 'publish' ? '发布失败' : '重新发布失败',
      );
    } finally {
      setBusy(false);
    }
  };

  // 确认框文案(按 kind)。有副作用动作各自讲清后果;重新发布强调"发布已保存内容"以防未保存编辑被漏发(gate① 约束:发布页不改草稿)。
  const CONFIRM_META: Record<'publish' | 'close' | 'republish' | 'reopen', { title: string; body: string; confirmLabel: string }> = {
    publish: {
      title: '发布问卷',
      body: '将发布编辑页里已保存的最新内容并正式对外接收作答;未保存的编辑不会包含(如刚在编辑器改动,请先返回编辑页保存)。确认发布?',
      confirmLabel: '发布问卷',
    },
    close: {
      title: '结束回收',
      body: '结束后问卷将停止接收新的作答,已回收数据保留。如需重新开放,可稍后重新打开。确认结束?',
      confirmLabel: '结束回收',
    },
    republish: {
      title: '重新发布',
      body: '将发布编辑页里已保存的最新内容为新版本并对外更新;未保存的编辑不会包含(如刚在编辑器改动,请先返回编辑页保存)。正在作答的用户刷新后会看到新版本。确认重新发布?',
      confirmLabel: '重新发布',
    },
    reopen: {
      title: '重新打开',
      body: '将恢复上次发布的版本重新对外接收作答。确认重新打开?',
      confirmLabel: '重新打开',
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
              <span className="badge draft">待发布</span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 13, color: 'var(--ink-2)' }}>
            <span>已回收</span>
            <b style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
              {stats ? stats.responseCount.toLocaleString() : '—'} 份
            </b>
          </div>

          {/* 状态相关主动作(生命周期控制台:发布 / 重新发布 + 结束 / 重新打开) */}
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {status === 'draft' && (
              <button className="btn primary" disabled={busy} onClick={() => setConfirm('publish')}>
                {busy ? '发布中…' : '🚀 发布问卷'}
              </button>
            )}
            {status === 'live' && (
              <>
                <button className="btn primary" disabled={busy} onClick={() => setConfirm('republish')}>
                  {busy ? '处理中…' : '🔄 重新发布(更新对外版本)'}
                </button>
                <button className="btn" disabled={busy} onClick={() => setConfirm('close')}>
                  {busy ? '处理中…' : '⏹ 结束回收'}
                </button>
              </>
            )}
            {status === 'closed' && (
              <>
                <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '0 0 4px' }}>问卷已结束回收,当前不接收新作答。</p>
                <button className="btn primary" disabled={busy} title="将恢复上次发布的版本供作答" onClick={() => setConfirm('reopen')}>
                  {busy ? '处理中…' : '↻ 重新打开'}
                </button>
              </>
            )}
          </div>

          {loadState === 'error' && <p style={{ fontSize: 12, color: 'var(--critical)', marginTop: 10 }}>加载状态失败</p>}
          {notice && <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 10 }}>{notice}</p>}
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

      {/* 单按钮告知框:重发免发用它,用户须点「已了解」关闭(复用 ConfirmDialog 的 modal 风格)。 */}
      {ackMsg && (
        <div className="modal-mask" onClick={() => setAckMsg('')}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="无需重新发布" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">无需重新发布</div>
            <div className="modal-body">{ackMsg}</div>
            <div className="modal-actions">
              <button className="btn primary sm" onClick={() => setAckMsg('')}>
                已了解
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
