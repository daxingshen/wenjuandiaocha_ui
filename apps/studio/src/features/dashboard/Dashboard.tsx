/**
 * 问卷看板:应用外壳(顶栏 + 左侧导航 + 主视图),对齐原型。
 * 类型只是筛选维度,非独立系统(UI 文档 §3.2「一套引擎」)。后端未接:列表用示例数据。
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/useAuthStore.js';
import { TopBar } from '../../components/TopBar.js';

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

/** 示例问卷(对照原型 surveys)。后端 listSurveys 接通后替换。 */
const DEMO_LIST = [
  { id: 'a3f9', title: '2026 年产品满意度调研问卷', type: 'survey', status: 'live', n: 1284, done: '86%', updated: '2 小时前' },
  { id: '7k2m', title: '新员工入职 Java 基础在线考试', type: 'exam', status: 'live', n: 342, done: '100%', updated: '昨天' },
  { id: 'p8w1', title: '年度最佳团队评选投票', type: 'vote', status: 'live', n: 5621, done: '—', updated: '3 天前' },
  { id: 'r2c5', title: '技术沙龙线下活动报名表', type: 'form', status: 'closed', n: 198, done: '—', updated: '上周' },
  { id: 'z0x3', title: 'Q3 管理者 360 度反馈评估', type: 'review360', status: 'draft', n: 0, done: '—', updated: '刚刚' },
];

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'survey', label: '问卷' },
  { key: 'exam', label: '考试' },
  { key: 'vote', label: '投票' },
  { key: 'form', label: '报名' },
  { key: 'live', label: '进行中' },
  { key: 'draft', label: '草稿' },
];

export function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState('all');

  const list = DEMO_LIST.filter((s) => {
    if (filter === 'all') return true;
    if (filter === 'live' || filter === 'draft') return s.status === filter;
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
            <button className="btn primary" onClick={() => navigate('/survey/new/edit')}>＋ 新建问卷</button>
          </div>

          {/* 纵向列表 */}
          <div className="slist">
            {list.map((s) => {
              const m = TYPE_META[s.type]!;
              const st = STATUS_META[s.status]!;
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
                          <span>更新于 {s.updated}</span>
                        </div>
                      </div>
                      <div className="stats">
                        <div className="stat">
                          <div className="num">{s.n.toLocaleString()}</div>
                          <div className="lab">作答数</div>
                        </div>
                        <div className="stat">
                          <div className="num">{s.done}</div>
                          <div className="lab">完成率</div>
                        </div>
                      </div>
                    </div>
                    <div className="ops">
                      <button className="btn sm" onClick={() => navigate(`/survey/${s.id}/edit`)}>✏️ 编辑设计</button>
                      <button className="btn sm" onClick={() => navigate(`/survey/${s.id}/publish`)}>📤 发送分享</button>
                      <button className="btn sm" onClick={() => navigate(`/survey/${s.id}/analyze`)}>📊 分析下载</button>
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
