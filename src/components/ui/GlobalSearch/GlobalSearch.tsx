import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Input, Tag, Empty, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { search } from '@/services/search.service';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/constants/enums';
import type { TaskPriority } from '@/types';
import styles from './GlobalSearch.module.css';

interface SearchResult {
  id: string;
  type: 'project' | 'task' | 'file' | 'bomItem' | 'article' | 'user';
  name: string;
  subtitle?: string;
  status?: string;
  path: string;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  if (parts.length === 1) return text;
  const testRegex = new RegExp(`^${escaped}$`, 'i');
  return parts.map((part, i) =>
    testRegex.test(part) ? <mark key={i} style={{ background: '#FFF7E6', padding: 0, borderRadius: 2 }}>{part}</mark> : part,
  );
}

const TYPE_LABELS: Record<string, string> = {
  project: '项目',
  task: '任务',
  file: '文件',
  bomItem: '物料',
  article: '知识库',
  user: '用户',
};

const TYPE_COLORS: Record<string, string> = {
  project: '#1890ff',
  task: '#52c41a',
  file: '#faad14',
  bomItem: '#722ed1',
  article: '#13c2c2',
  user: '#eb2f96',
};

const POPULAR_SEARCHES = ['项目管理', '电池pack', '设计评审', 'BOM变更', '工艺路线'];

export default function GlobalSearch() {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const HISTORY_KEY = 'searchHistory';
  const MAX_HISTORY = 10;

  const loadHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setSearchHistory(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const saveToHistory = useCallback((term: string) => {
    if (!term.trim()) return;
    try {
      const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as string[];
      const filtered = stored.filter((s) => s !== term);
      const updated = [term, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      setSearchHistory(updated);
    } catch {
      // ignore
    }
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(HISTORY_KEY);
    setSearchHistory([]);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setVisible((v) => !v);
      }
      if (e.key === 'Escape') {
        setVisible(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (visible) {
      loadHistory();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [visible, loadHistory]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await search(query);
        const data = res.data?.data || res.data;
        const items: SearchResult[] = [
          ...(data.projects || []).map((p: any) => ({
            id: p.id,
            type: 'project' as const,
            name: p.name,
            status: p.status,
            path: '/project',
          })),
          ...(data.tasks || []).map((t: any) => ({
            id: t.id,
            type: 'task' as const,
            name: t.name,
            status: t.status,
            subtitle: `优先级: ${TASK_PRIORITY_CONFIG[t.priority as TaskPriority]?.label}`,
            path: '/todo',
          })),
          ...(data.files || []).map((f: any) => ({
            id: f.id,
            type: 'file' as const,
            name: f.name,
            path: '/files',
          })),
          ...(data.bomItems || []).map((b: any) => ({
            id: b.id,
            type: 'bomItem' as const,
            name: b.name,
            subtitle: b.partNumber,
            path: '/bom',
          })),
          ...(data.articles || []).map((a: any) => ({
            id: a.id,
            type: 'article' as const,
            name: a.title,
            status: a.status,
            path: '/knowledge',
          })),
          ...(data.users || []).map((u: any) => ({
            id: u.id,
            type: 'user' as const,
            name: u.name,
            subtitle: u.email,
            path: '/config',
          })),
        ];
        setResults(items);
        saveToHistory(query);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, saveToHistory]);

  const grouped = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return;
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    });
    return groups;
  }, [results, typeFilter]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: results.length };
    results.forEach((r) => { counts[r.type] = (counts[r.type] || 0) + 1; });
    return counts;
  }, [results]);

  const ALL_TYPES = ['all', 'project', 'task', 'file', 'bomItem', 'article', 'user'];

  const handleSelect = useCallback(
    (item: SearchResult) => {
      setVisible(false);
      navigate(item.path);
    },
    [navigate]
  );

  const handleRecentClick = useCallback((term: string) => {
    setQuery(term);
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={() => setVisible(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.inputWrapper}>
          <SearchOutlined className={styles.searchIcon} />
          <input
            ref={inputRef as React.Ref<HTMLInputElement>}
            className={styles.input}
            placeholder="搜索项目、任务、文件、物料、知识库..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className={styles.shortcut}>ESC</span>
        </div>

        <div className={styles.results}>
          {loading && <Spin className={styles.spin} />}
          {!loading && query && results.length === 0 && (
            <Empty description="未找到匹配的结果" className={styles.empty} />
          )}
          {!loading && query && results.length > 0 && (
            <div className={styles.typeFilter}>
              {ALL_TYPES.map((t) => (
                <button
                  key={t}
                  className={`${styles.typeFilterBtn} ${typeFilter === t ? styles.typeFilterActive : ''}`}
                  onClick={() => setTypeFilter(t)}
                >
                  {t === 'all' ? '全部' : TYPE_LABELS[t]}({typeCounts[t] || 0})
                </button>
              ))}
            </div>
          )}
          {!loading &&
            Object.entries(grouped).map(([type, items]) => (
              <div key={type} className={styles.group}>
                <div className={styles.groupTitle}>
                  {TYPE_LABELS[type]} <span className={styles.groupCount}>({items.length})</span>
                </div>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={styles.resultItem}
                    onClick={() => handleSelect(item)}
                  >
                    <span
                      className={styles.typeBadge}
                      style={{ backgroundColor: TYPE_COLORS[type] || '#999' }}
                    >
                      {TYPE_LABELS[type]}
                    </span>
                    <span className={styles.resultName}>{highlightMatch(item.name, query)}</span>
                    {item.status && (
                      <Tag
                        style={{
                          fontSize: 11,
                          borderRadius: 100,
                          ...(TASK_STATUS_CONFIG[item.status as keyof typeof TASK_STATUS_CONFIG]
                            ? {
                                color: TASK_STATUS_CONFIG[item.status as keyof typeof TASK_STATUS_CONFIG].color,
                                backgroundColor: TASK_STATUS_CONFIG[item.status as keyof typeof TASK_STATUS_CONFIG].bgColor,
                                border: 'none',
                              }
                            : {}),
                        }}
                      >
                        {TASK_STATUS_CONFIG[item.status as keyof typeof TASK_STATUS_CONFIG]?.label || item.status}
                      </Tag>
                    )}
                    {item.subtitle && (
                      <span className={styles.resultSubtitle}>{highlightMatch(item.subtitle, query)}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          {!loading && !query && searchHistory.length > 0 && (
            <div className={styles.group}>
              <div className={styles.groupTitle}>
                最近搜索
                <span
                  className={styles.clearHistory}
                  onClick={clearHistory}
                >
                  清除历史
                </span>
              </div>
              {searchHistory.map((term) => (
                <div
                  key={term}
                  className={styles.resultItem}
                  onClick={() => handleRecentClick(term)}
                >
                  <SearchOutlined style={{ color: '#BFBFBF', fontSize: 13 }} />
                  <span className={styles.resultName}>{term}</span>
                </div>
              ))}
            </div>
          )}
          {!loading && !query && (
            <div className={styles.group}>
              <div className={styles.groupTitle}>热门搜索</div>
              <div className={styles.popularRow}>
                {POPULAR_SEARCHES.map((term) => (
                  <span
                    key={term}
                    className={styles.popularTag}
                    onClick={() => handleRecentClick(term)}
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!loading && !query && searchHistory.length === 0 && (
            <div className={styles.hint}>
              输入关键词搜索项目、任务、文件、物料、知识库...
            </div>
          )}
          {!loading && query && results.length > 0 && (
            <div
              className={styles.viewAll}
              onClick={() => {
                setVisible(false);
                navigate(`/search?q=${encodeURIComponent(query)}`);
              }}
            >
              查看全部结果
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
