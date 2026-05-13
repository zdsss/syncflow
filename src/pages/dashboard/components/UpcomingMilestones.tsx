import { Card, Tag, Skeleton, Empty } from 'antd';
import { FlagOutlined } from '@ant-design/icons';

export interface MilestoneItem {
  id: number;
  name: string;
  dueDate: string;
  status: string;
  projectName?: string;
}

interface UpcomingMilestonesProps {
  milestones: MilestoneItem[];
  loading?: boolean;
}

const MILESTONE_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: '待完成', color: 'default' },
  in_progress: { label: '进行中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  delayed: { label: '延期', color: 'error' },
};

export default function UpcomingMilestones({ milestones, loading }: UpcomingMilestonesProps) {
  if (loading) {
    return (
      <Card title="近期里程碑" data-testid="upcoming-milestones">
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  if (!milestones || milestones.length === 0) {
    return (
      <Card title="近期里程碑" data-testid="upcoming-milestones">
        <Empty description="暂无里程碑" />
      </Card>
    );
  }

  return (
    <Card title="近期里程碑" data-testid="upcoming-milestones">
      <div>
        {milestones.map((item) => {
          const cfg = MILESTONE_STATUS[item.status] || { label: item.status, color: 'default' };
          return (
            <div
              key={item.id}
              data-testid={`milestone-item-${item.id}`}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}
            >
              <FlagOutlined style={{ color: '#faad14', fontSize: 16, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span data-testid="milestone-name">{item.name}</span>
                  <Tag color={cfg.color}>{cfg.label}</Tag>
                </div>
                <div>
                  <span data-testid="milestone-date" style={{ marginRight: 12 }}>
                    截止: {item.dueDate}
                  </span>
                  {item.projectName && (
                    <span data-testid="milestone-project" style={{ color: '#999' }}>
                      {item.projectName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
