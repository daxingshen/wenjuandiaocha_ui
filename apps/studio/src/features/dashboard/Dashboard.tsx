/**
 * 问卷看板:应用外壳(顶栏 + 左侧导航 + 主视图),对齐原型。
 * 类型只是筛选维度,非独立系统(UI 文档 §3.2「一套引擎」)。后端未接:列表用示例数据。
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/useAuthStore.js';
import { TopBar } from '../../components/TopBar.js';
import { listSurveys, closeSurvey, reopenSurvey, type SurveyListItem } from '../../api/surveys.js';

/** 类型 → 色板槽位 + 图标(对照原型 typeMeta / 类型色映射 UI 文档 §2.1)。 */
const TYPE_META: Record<string, { color: string; ic: string; label: string }> = {
  survey: { color: 'var(--s1)', ic: '问', label: '问卷' },
  exam: { color: 'var(--s2)', ic: '考', label: '考试' },
  vote: { color: 'var(--s3)', ic: '投', label: '投票' },
  form: { color: 'var(--s4)', ic: '报', label: '报名' },
  assess: { color: 'var(--s7)', ic: '测', label: '测评' },
  review360: { color: 'var(--s5)', ic: '360', label: '360' },
};

const STATUS_META: Record<string, { cls: string; label: string }> = {
  live: { cls: 'live', label: '进行中' },
  draft: { cls: 'draft', label: '草稿' },
  closed: { cls: 'closed', label: '已截止' },
};

/** 相对时间显示(简版):把 ISO 时间转成「N 分钟/小时/天前」。 */
function relTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  return `${d} 天前`;
}

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'survey', label: '问卷' },
  { key: 'exam', label: '考试' },
  { key: 'vote', label: '投票' },
  { key: 'form', label: '报名' },
  { key: 'live', label: '进行中' },
  { key: 'draft', label: '草稿' },
  { key: 'closed', label: '已结束' },
];

export function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState('all');
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const refresh = () => {
    return listSurveys()
      .then((rows) => (setSurveys(rows), setError('')))
      .catch(() => setError('加载问卷失败'));
  };

  useEffect(() => {
    let alive = true;
    listSurveys()
      .then((rows) => alive && (setSurveys(rows), setError('')))
      .catch(() => alive && setError('加载问卷失败'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // 新建:不再先落库,进内存草稿态编辑器(/survey/new),用户点保存才首存落库(零写入直到保存)。
  const onCreate = () => navigate('/survey/new/edit');

  // 结束回收 / 重新打开:调后端状态机,成功后重拉列表刷新徽章。
  const onClose = async (id: string) => {
    setBusyId(id);
    try {
      await closeSurvey(id);
      await refresh();
    } catch {
      setError('结束失败');
    } finally {
      setBusyId('');
    }
  };
  const onReopen = async (id: string) => {
    setBusyId(id);
    try {
      await reopenSurvey(id);
      await refresh();
    } catch {
      setError('重新打开失败');
    } finally {
      setBusyId('');
    }
  };

  const list = surveys.filter((s) => {
    if (filter === 'all') return true;
    if (filter === 'live' || filter === 'draft' || filter === 'closed') return s.status === filter;
    return s.type === filter;
  });

  return (
    <div>
      <TopBar />

      <div className="app-body">
        {/* 左侧全局导航 */}
        <aside className="app-side">
          <div className="side-item on">
            <span className="si">🗂</span>
            <span>全部问卷</span>
          </div>
          <div className="side-item">
            <span className="si">🏠</span>
            <span>工作台</span>
          </div>
          <div className="side-cap">按类型</div>
          {Object.entries(TYPE_META).map(([key, m]) => (
            <div key={key} className="side-item" onClick={() => setFilter(key)}>
              <span className="si">{m.ic}</span>
              <span>{m.label}</span>
            </div>
          ))}
        </aside>

        {/* 右侧主视图 */}
        <main className="app-main">
          <div className="main-head">
            <div>
              <h1>所有问卷</h1>
              <p>管理你的问卷、考试、投票与测评 · {user?.name} · {user?.level}</p>
            </div>
          </div>

          {/* KPI 行 */}
          <div className="stat-row">
            <div className="card stat-tile">
              <div className="k">问卷总数</div>
              <div className="v">6</div>
              <div className="d up">▲ 本周 +2</div>
            </div>
            <div className="card stat-tile">
              <div className="k">累计回收</div>
              <div className="v">12,840 <small>份</small></div>
              <div className="d up">▲ 8.3%</div>
            </div>
            <div className="card stat-tile">
              <div className="k">今日新增</div>
              <div className="v">327 <small>份</small></div>
              <div className="d up">▲ 较昨日</div>
            </div>
            <div className="card stat-tile">
              <div className="k">平均完成率</div>
              <div className="v">86.4<small>%</small></div>
              <div className="d">持平</div>
            </div>
          </div>

          {/* 筛选工具条 */}
          <div className="board-bar">
            {FILTERS.map((f) => (
              <button key={f.key} className={`fchip${filter === f.key ? ' on' : ''}`} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
            <div className="grow" />
            <select defaultValue="updated">
              <option value="updated">按更新时间</option>
              <option value="recv">按回收量</option>
              <option value="created">按创建时间</option>
            </select>
            <input className="search2" placeholder="🔍 搜索问卷…" />
            <button className="btn primary" onClick={onCreate}>
              ＋ 新建问卷
            </button>
          </div>

          {/* 纵向列表 */}
          <div className="slist">
            {loading && <p style={{ color: 'var(--ink-muted)', padding: 16 }}>加载中…</p>}
            {error && !loading && <p style={{ color: 'var(--critical)', padding: 16 }}>{error}</p>}
            {!loading && !error && list.length === 0 && (
              <p style={{ color: 'var(--ink-muted)', padding: 16 }}>还没有问卷,点右上「新建问卷」开始。</p>
            )}
            {list.map((s) => {
              const m = TYPE_META[s.type] ?? { color: 'var(--s1)', ic: '问', label: s.type };
              const st = STATUS_META[s.status] ?? { cls: 'draft', label: s.status };
              return (
                <div key={s.id} className="srow">
                  <div className="stripe" style={{ background: m.color }} />
                  <div className="body">
                    <div className="top">
                      <div className="type-ic" style={{ background: m.color }}>{m.ic}</div>
                      <div className="info">
                        <div className="t">
                          <span className="txt">{s.title}</span>
                          <span className={`badge ${st.cls}`}>{st.label}</span>
                        </div>
                        <div className="m">
                          <span className="id">ID {s.id}</span>
                          <span>更新于 {relTime(s.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ops">
                      <button className="btn sm" onClick={() => navigate(`/survey/${s.id}/edit`)}>✏️ 编辑设计</button>
                      <button className="btn sm" onClick={() => navigate(`/survey/${s.id}/publish`)}>📤 发送分享</button>
                      <button className="btn sm" onClick={() => navigate(`/survey/${s.id}/analyze`)}>📊 分析下载</button>
                      {s.status === 'live' && (
                        <button className="btn sm" disabled={busyId === s.id} onClick={() => onClose(s.id)}>
                          {busyId === s.id ? '处理中…' : '⏹ 结束回收'}
                        </button>
                      )}
                      {s.status === 'closed' && (
                        <button
                          className="btn sm"
                          disabled={busyId === s.id}
                          title="将恢复上次发布的版本供作答"
                          onClick={() => onReopen(s.id)}
                        >
                          {busyId === s.id ? '处理中…' : '↻ 重新打开'}
                        </button>
                      )}
                      <div className="spring" />
                      <button className="btn sm ghost" title="更多">⋯</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
