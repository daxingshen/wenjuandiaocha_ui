/**
 * 问卷看板:应用外壳(顶栏 + 左侧导航 + 主视图),对齐原型。
 * 类型只是筛选维度,非独立系统(UI 文档 §3.2「一套引擎」)。后端未接:列表用示例数据。
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/TopBar.js';
import { ConfirmDialog } from '../../components/ConfirmDialog.js';
import { listSurveys, type SurveyListItem } from '../../api/surveys.js';
import { canEditSurvey } from './editGate.js';

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
  draft: { cls: 'draft', label: '待发布' },
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
  { key: 'live', label: '进行中' },
  { key: 'draft', label: '待发布' },
  { key: 'closed', label: '已结束' },
];

const PAGE_SIZES = [10, 20, 50];

/**
 * 页码窗口:总页数大时只显示首尾 + 当前页附近,其余用省略号('…')占位。
 * 例:page=6 total=20 → [1, '…', 5, 6, 7, '…', 20]。
 */
function pageWindow(page: number, totalPages: number): (number | '…')[] {
  const span = 1; // 当前页左右各显示 1 个
  const set = new Set<number>([1, totalPages]);
  for (let p = page - span; p <= page + span; p++) {
    if (p >= 1 && p <= totalPages) set.add(p);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

/** 右下角页码器:上一页 / 页码(带省略号)/ 下一页。 */
function Pager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  return (
    <nav className="pager" aria-label="分页">
      <button className="pg-btn" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="上一页">
        ‹
      </button>
      {pageWindow(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="pg-gap">
            …
          </span>
        ) : (
          <button
            key={p}
            className={`pg-btn${p === page ? ' on' : ''}`}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onPage(p)}
          >
            {p}
          </button>
        ),
      )}
      <button className="pg-btn" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="下一页">
        ›
      </button>
    </nav>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // 状态 chip:all|live|draft|closed → 后端 status 参数
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1); // 当前页码(1-based)
  const [total, setTotal] = useState(0); // 筛选后总行数(算总页数)
  const [query, setQuery] = useState(''); // 输入框实时值
  const [activeQuery, setActiveQuery] = useState(''); // 已提交(回车)生效的搜索词
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // 已发布问卷被拦下的编辑尝试:持有被拦问卷,非空即弹拦截窗。null = 无拦截。
  const [blocked, setBlocked] = useState<SurveyListItem | null>(null);

  // 搜索态:有生效搜索词时后端只返回前 10 条、不翻页,前端隐藏页码器。
  const searching = activeQuery !== '';

  // 统一拉列表。筛选/搜索/翻页都走后端;显式传参避免闭包读到旧 state。
  const fetchList = useCallback(
    async (opts: { q: string; status: string; size: number; page: number }) => {
      setLoading(true);
      try {
        const res = await listSurveys({
          q: opts.q || undefined,
          status: opts.status === 'all' ? undefined : opts.status,
          limit: opts.size,
          page: opts.page,
        });
        setSurveys(res.items);
        setTotal(res.total);
        setError('');
      } catch {
        setSurveys([]);
        setTotal(0);
        setError('加载问卷失败');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // 首屏:第一页全量。
  useEffect(() => {
    void fetchList({ q: '', status: 'all', size: 10, page: 1 });
  }, [fetchList]);

  // 换状态 chip:后端按 status 过滤,回到第一页。
  const onFilter = (key: string) => {
    setFilter(key);
    setPage(1);
    void fetchList({ q: activeQuery, status: key, size: pageSize, page: 1 });
  };

  // 换页大小:回到第一页重拉。
  const onPageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
    void fetchList({ q: activeQuery, status: filter, size, page: 1 });
  };

  // 回车触发接口搜索(输入过程中不请求)。搜索态后端只返回前 10 条、不翻页,回到第一页。
  const onSearch = () => {
    const kw = query.trim();
    setActiveQuery(kw);
    setPage(1);
    void fetchList({ q: kw, status: filter, size: pageSize, page: 1 });
  };

  // 清空搜索框。若当前有生效搜索词,退出搜索态并重拉全量(回第一页);仅清输入则不请求。
  const onClear = () => {
    setQuery('');
    if (activeQuery !== '') {
      setActiveQuery('');
      setPage(1);
      void fetchList({ q: '', status: filter, size: pageSize, page: 1 });
    }
  };

  // 跳到指定页码(页码器点击)。搜索态不翻页。
  const onPage = (p: number) => {
    if (p === page || p < 1) return;
    setPage(p);
    void fetchList({ q: activeQuery, status: filter, size: pageSize, page: p });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // 新建:不再先落库,进内存草稿态编辑器(/survey/new),用户点保存才首存落库(零写入直到保存)。
  const onCreate = () => navigate('/survey/new/edit');

  // 编辑入口守卫:仅草稿可进编辑器。已发布(进行中/已截止)问卷内容已冻结,弹窗拦下、不跳转。
  // 这只是体验层;真正防线在后端 Update 接口(非草稿返 40901)。
  const onEdit = (s: SurveyListItem) => {
    if (canEditSurvey(s.status)) navigate(`/survey/${s.id}/edit`);
    else setBlocked(s);
  };

  // 筛选/搜索/翻页全在后端做,前端直接渲染返回结果。
  const list = surveys;

  return (
    <div>
      <TopBar />

      <div className="app-body">
        {/* 左侧全局导航:只保留「问卷」单项(承担「看全部问卷」的定位)。 */}
        <aside className="app-side">
          <div className={`side-item${filter === 'all' ? ' on' : ''}`} onClick={() => onFilter('all')}>
            <span className="si">🗂</span>
            <span>问卷</span>
          </div>
        </aside>

        {/* 右侧主视图 */}
        <main className="app-main">
          {/* 筛选工具条 */}
          <div className="board-bar">
            {FILTERS.map((f) => (
              <button key={f.key} className={`fchip${filter === f.key ? ' on' : ''}`} onClick={() => onFilter(f.key)}>
                {f.label}
              </button>
            ))}
            <div className="grow" />
            <div className="search-wrap">
              <span className="search-ic" aria-hidden="true">🔍</span>
              <input
                className="search2"
                placeholder="搜索问卷标题,回车搜索…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSearch();
                  else if (e.key === 'Escape') onClear();
                }}
              />
              {query && (
                <button className="search-clear" onClick={onClear} title="清空" aria-label="清空搜索">
                  ✕
                </button>
              )}
            </div>
            <button className="btn primary" onClick={onCreate}>
              ＋ 新建问卷
            </button>
          </div>

          {/* 纵向列表 */}
          <div className="slist">
            {loading && <p style={{ color: 'var(--ink-muted)', padding: 16 }}>加载中…</p>}
            {error && !loading && <p style={{ color: 'var(--critical)', padding: 16 }}>{error}</p>}
            {!loading && !error && list.length === 0 && (
              <p style={{ color: 'var(--ink-muted)', padding: 16 }}>
                {activeQuery || filter !== 'all'
                  ? '没有匹配的问卷,试试换个搜索词或筛选条件。'
                  : '还没有问卷,点右上「新建问卷」开始。'}
              </p>
            )}
            {!loading && !error && list.map((s) => {
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
                      <button className="btn sm" onClick={() => onEdit(s)}>✏️ 编辑设计</button>
                      {/* 发布/暂停/继续等生命周期动作集中在发布页(发送分享),看板列表只做导航。 */}
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

          {/* 右下角页码器:非搜索态且总页数>1 时显示。点击页码跳页。 */}
          {/* 右下角分页区:每页条数选择器 + 页码器(均非搜索态显示;页码器仅在多于一页时出现)。 */}
          {!loading && !error && !searching && list.length > 0 && (
            <div className="pager-bar">
              <select
                className="page-size"
                value={pageSize}
                onChange={(e) => onPageSize(Number(e.target.value))}
                title="每页条数"
                aria-label="每页条数"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    每页 {n}
                  </option>
                ))}
              </select>
              {totalPages > 1 && <Pager page={page} totalPages={totalPages} onPage={onPage} />}
            </div>
          )}
        </main>
      </div>

      {/* 已发布问卷的编辑拦截:纯告知型(单按钮),点「知道了」关闭、留在看板。 */}
      <ConfirmDialog
        open={blocked !== null}
        hideCancel
        title="🔒 问卷已发布,内容已锁定"
        body={
          blocked
            ? `「${blocked.title}」${STATUS_META[blocked.status]?.label ?? ''},题目和结构已冻结,不能再改——这是为了让已回收和后续答卷的数据口径一致。如需一份可改的版本,请新建问卷。`
            : ''
        }
        confirmLabel="知道了"
        onConfirm={() => setBlocked(null)}
        onCancel={() => setBlocked(null)}
      />
    </div>
  );
}
