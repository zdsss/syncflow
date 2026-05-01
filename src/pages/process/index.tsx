import { useEffect, useState, useCallback } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getProcessRoutes, createProcessRoute, deleteProcessRoute, addProcessStep } from '@/services/process.service';
import RouteList from './components/RouteList';
import StepDetail from './components/StepDetail';
import styles from './ProcessPage.module.css';

interface ProcessStep {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  routeId: string;
  parameters?: any;
}

interface ProcessRoute {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  status: string;
  version: number;
  steps: ProcessStep[];
}

export default function ProcessPage() {
  const [routes, setRoutes] = useState<ProcessRoute[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const projectId = 'proj-1';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProcessRoutes(projectId);
      setRoutes((res as any).data || []);
    } catch {
      message.error('Failed to load process routes');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    try {
      await createProcessRoute({ name: '新工艺路线', projectId });
      message.success('Process route created');
      fetchData();
    } catch {
      message.error('Failed to create process route');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProcessRoute(id);
      message.success('Process route deleted');
      if (selectedId === id) setSelectedId(null);
      fetchData();
    } catch {
      message.error('Failed to delete process route');
    }
  };

  const handleAddStep = async (routeId: string) => {
    try {
      const route = routes.find((r) => r.id === routeId);
      const nextOrder = route ? route.steps.length + 1 : 1;
      await addProcessStep(routeId, { name: '新步骤', sortOrder: nextOrder });
      message.success('Step added');
      fetchData();
    } catch {
      message.error('Failed to add step');
    }
  };

  const selectedRoute = routes.find((r) => r.id === selectedId) || null;

  return (
    <div className={styles.processPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>工艺管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增工艺路线
        </Button>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.listPanel}>
          <h3 className={styles.panelTitle}>工艺路线列表</h3>
          <RouteList
            routes={routes}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={handleDelete}
            loading={loading}
          />
        </div>

        <div className={styles.detailPanel}>
          <h3 className={styles.panelTitle}>工序详情</h3>
          <StepDetail
            route={selectedRoute}
            onAddStep={handleAddStep}
          />
        </div>
      </div>
    </div>
  );
}
