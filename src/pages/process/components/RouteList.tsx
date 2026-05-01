import { Spin, Button, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import styles from '../ProcessPage.module.css';

interface ProcessRoute {
  id: string;
  name: string;
  description?: string;
  status: string;
  steps: any[];
}

interface RouteListProps {
  routes: ProcessRoute[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

export default function RouteList({ routes, selectedId, onSelect, onDelete, loading }: RouteListProps) {
  if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;

  if (!routes.length) {
    return <div className={styles.emptyHint}>暂无工艺路线</div>;
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
                {route.status} | {route.steps.length} 个工序
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
