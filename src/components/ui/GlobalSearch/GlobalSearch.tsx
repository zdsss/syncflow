import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Input, Tag, Empty, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { mockProjects } from '@/mocks/data/projects';
import { mockTasks } from '@/mocks/data/tasks';
import { mockFiles } from '@/mocks/data/files';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/constants/enums';
import styles from './GlobalSearch.module.css';

interface SearchResult {
  id: string;
  type: 'project' | 'task' | 'file';
  name: string;
  subtitle?: string;
  status?: string;
  path: string;
}

export default function GlobalSearch() {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [visible]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const items: SearchResult[] = [];

    mockProjects
      .filter((p) => p.name.toLowerCase().includes(q))
      .forEach((p) =>
        items.push({ id: p.id, type: 'project', name: p.name, status: p.status, path: '/project' })
      );

    mockTasks
      .filter((t) => t.name.toLowerCase().includes(q))
      .slice(0, 10)
      .forEach((t) =>
        items.push({ id: t.id, type: 'task', name: t.name, status: t.status, subtitle: `优先级: ${TASK_PRIORITY_CONFIG[t.priority]?.label}`, path: '/todo' })
      );

    mockFiles
      .filter((f) => f.name.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((f) =>
        items.push({ id: f.id, type: 'file', name: f.name, path: '/files' })
      );

    return items;
  }, [query]);

  const grouped = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((r) => {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    });
    return groups;
  }, [results]);

  const typeLabels: Record<string, string> = {
    project: '项目',
    task: '任务',
    file: '文件',
  };

  const handleSelect = useCallback(
    (item: SearchResult) => {
      setVisible(false);
      navigate(item.path);
    },
    [navigate]
  );

  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={() => setVisible(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.inputWrapper}>
          <SearchOutlined className={styles.searchIcon} />
          <input
            ref={inputRef as any}
            className={styles.input}
            placeholder="搜索项目、任务、文件..."
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
          {!loading &&
            Object.entries(grouped).map(([type, items]) => (
              <div key={type} className={styles.group}>
                <div className={styles.groupTitle}>
                  {typeLabels[type]} <span className={styles.groupCount}>({items.length})</span>
                </div>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={styles.resultItem}
                    onClick={() => handleSelect(item)}
                  >
                    <span className={styles.resultName}>{item.name}</span>
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
                      <span className={styles.resultSubtitle}>{item.subtitle}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          {!query && (
            <div className={styles.hint}>
              输入关键词搜索项目、任务、文件...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
