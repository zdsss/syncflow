import { Card, Progress, Tag, Skeleton, Empty } from 'antd';

export interface ProjectProgressItem {
  id: number;
  name: string;
  progress: number;
  status: string;
  dueDate?: string;
}

interface ProjectProgressListProps {
  projects: ProjectProgressItem[];
  loading?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  in_progress: { label: '进行中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  delayed: { label: '延期', color: 'error' },
  not_started: { label: '未开始', color: 'default' },
};

export default function ProjectProgressList({ projects, loading }: ProjectProgressListProps) {
  if (loading) {
    return (
      <Card title="项目进度" data-testid="project-progress-list">
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  const sortedProjects = [...(projects || [])].sort((a, b) => b.progress - a.progress);

  if (sortedProjects.length === 0) {
    return (
      <Card title="项目进度" data-testid="project-progress-list">
        <Empty description="暂无项目数据" />
      </Card>
    );
  }

  return (
    <Card title="项目进度" data-testid="project-progress-list">
      <div>
        {sortedProjects.map((item) => {
          const cfg = STATUS_CONFIG[item.status] || { label: item.status, color: 'default' };
          return (
            <div
              key={item.id}
              data-testid={`project-progress-item-${item.id}`}
              style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span data-testid="project-name">{item.name}</span>
                <Tag color={cfg.color}>{cfg.label}</Tag>
              </div>
              <Progress
                percent={item.progress}
                size="small"
                status={item.status === 'completed' ? 'success' : item.status === 'delayed' ? 'exception' : 'active'}
                data-testid="project-progress-bar"
              />
              {item.dueDate && (
                <span style={{ fontSize: 12, color: '#999' }} data-testid="project-due-date">
                  截止: {item.dueDate}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
