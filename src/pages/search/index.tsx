import { useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spin, Empty, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { search } from '@/services/search.service';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/constants/enums';
import { useAsyncData } from '@/hooks/useAsyncData';
import type { TaskPriority } from '@/types';

interface SearchResult {
  id: string;
  type: 'project' | 'task' | 'file' | 'bomItem' | 'article' | 'user';
  name: string;
  subtitle?: string;
  status?: string;
  path: string;
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

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';

  const fetcher = useCallback(async (): Promise<SearchResult[]> => {
    if (!q.trim()) return [];
    const res = await search(q);
    const data = res.data?.data || res.data;
    return [
      ...(data.projects || []).map((p: any) => ({
        id: p.id, type: 'project' as const, name: p.name,
        status: p.status, path: '/project',
      })),
      ...(data.tasks || []).map((t: any) => ({
        id: t.id, type: 'task' as const, name: t.name,
        status: t.status,
        subtitle: `优先级: ${TASK_PRIORITY_CONFIG[t.priority as TaskPriority]?.label}`,
        path: '/todo',
      })),
      ...(data.files || []).map((f: any) => ({
        id: f.id, type: 'file' as const, name: f.name, path: '/files',
      })),
      ...(data.bomItems || []).map((b: any) => ({
        id: b.id, type: 'bomItem' as const, name: b.name,
        subtitle: b.partNumber, path: '/bom',
      })),
      ...(data.articles || []).map((a: any) => ({
        id: a.id, type: 'article' as const, name: a.title,
        status: a.status, path: '/knowledge',
      })),
      ...(data.users || []).map((u: any) => ({
        id: u.id, type: 'user' as const, name: u.name,
        subtitle: u.email, path: '/config',
      })),
    ];
  }, [q]);

  const { data: resultsData, loading, refresh: fetchResults, setData } = useAsyncData(fetcher, '搜索失败');
  const results = resultsData || [];

  useEffect(() => {
    if (q.trim()) {
      fetchResults();
    } else {
      setData([]);
    }
  }, [fetchResults, q]);

  const grouped: Record<string, SearchResult[]> = {};
  results.forEach((r) => {
    if (!grouped[r.type]) grouped[r.type] = [];
    grouped[r.type].push(r);
  });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <ArrowLeftOutlined
          style={{ fontSize: 18, cursor: 'pointer', color: '#666' }}
          onClick={() => navigate(-1)}
          data-testid="back-button"
        />
        <h2 style={{ margin: 0 }} data-testid="search-title">
          搜索结果: {q}
        </h2>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      )}

      {!loading && q && results.length === 0 && (
        <Empty description="未找到匹配的结果" />
      )}

      {!loading && !q && (
        <Empty description="请输入搜索关键词" />
      )}

      {!loading &&
        Object.entries(grouped).map(([type, items]) => (
          <div key={type} style={{ marginBottom: 24 }} data-testid={`group-${type}`}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#333',
                marginBottom: 8,
                paddingBottom: 8,
                borderBottom: '1px solid #F0F0F0',
              }}
            >
              {TYPE_LABELS[type]} ({items.length})
            </div>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'background 150ms',
                }}
                onClick={() => navigate(item.path)}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F7FA')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                data-testid={`result-${item.id}`}
              >
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: 11,
                    color: '#FFFFFF',
                    borderRadius: 4,
                    padding: '1px 6px',
                    lineHeight: '18px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    backgroundColor: TYPE_COLORS[type] || '#999',
                  }}
                >
                  {TYPE_LABELS[type]}
                </span>
                <span style={{ flex: 1, fontSize: 14, color: '#333' }}>
                  {highlightMatch(item.name, q)}
                </span>
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
                  <span style={{ fontSize: 12, color: '#999' }}>
                    {highlightMatch(item.subtitle, q)}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
