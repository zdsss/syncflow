import { Button, Popconfirm, Tag } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import EmptyState from '@/components/ui/EmptyState/EmptyState';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import styles from '../ProcessPage.module.css';

interface ProcessRoute {
  id: string;
  name: string;
  description?: string;
  status: string | number;
  steps: any[];
}

interface RouteListProps {
  routes: ProcessRoute[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate?: () => void;
  loading: boolean;
}

function statusTag(status: string | number) {
  const s = typeof status === 'number' ? status : 0;
  if (s === 5 || status === 'published') return <Tag color="success">已发布</Tag>;
  if (s === 2 || status === 'pending_approval') return <Tag color="warning">审批中</Tag>;
  if (s === 3 || status === 'approved') return <Tag color="blue">已通过</Tag>;
  return <Tag color="default">草稿</Tag>;
}

export default function RouteList({ routes, selectedId, onSelect, onDelete, onCreate, loading }: RouteListProps) {
  if (loading) return <LoadingSkeleton rows={4} />;

  if (!routes.length) {
    return (
      <EmptyState
        title="暂无工艺路线"
        description="创建工艺路线来管理生产工序"
        actionText={onCreate ? '新增工艺路线' : undefined}
        onAction={onCreate}
      />
    );
  }

  return (
    <div>
      {routes.map((route) => (
        <div
          key={route.id}
          className={`${styles.routeItem} ${selectedId === route.id ? styles.routeItemSelected : ''}`}
          onClick={() => onSelect(route.id)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className={styles.routeName}>{route.name}</p>
              <p className={styles.routeStatus}>
                {statusTag(route.status)} {route.steps.length} 个工序
              </p>
            </div>
            <Popconfirm title="确认删除?" onConfirm={(e) => { e?.stopPropagation(); onDelete(route.id); }}>
              <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={(e) => e.stopPropagation()} />
            </Popconfirm>
          </div>
        </div>
      ))}
    </div>
  );
}
