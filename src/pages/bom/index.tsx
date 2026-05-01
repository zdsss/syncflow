import { useEffect, useState, useCallback } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getBomTree, getBomItems, createBomItem, updateBomItem, deleteBomItem } from '@/services/bom.service';
import BomTree from './components/BomTree';
import BomTable from './components/BomTable';
import styles from './BomPage.module.css';

interface BomItem {
  id: string;
  name: string;
  partNumber?: string;
  specification?: string;
  supplier?: string;
  unit?: string;
  unitPrice?: number;
  quantity: number;
  parentId?: string;
  projectId: string;
  version: number;
  children?: BomItem[];
}

export default function BomPage() {
  const [treeData, setTreeData] = useState<BomItem[]>([]);
  const [flatItems, setFlatItems] = useState<BomItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const projectId = 'proj-1';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [treeRes, flatRes] = await Promise.all([
        getBomTree(projectId),
        getBomItems(projectId),
      ]);
      setTreeData((treeRes as any).data || []);
      setFlatItems((flatRes as any).data || []);
    } catch {
      message.error('Failed to load BOM data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (data: Partial<BomItem>) => {
    try {
      await createBomItem({ ...data, projectId });
      message.success('BOM item created');
      fetchData();
    } catch {
      message.error('Failed to create BOM item');
    }
  };

  const handleUpdate = async (id: string, data: Partial<BomItem>) => {
    try {
      await updateBomItem(id, data);
      message.success('BOM item updated');
      fetchData();
    } catch {
      message.error('Failed to update BOM item');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBomItem(id);
      message.success('BOM item deleted');
      if (selectedId === id) setSelectedId(null);
      fetchData();
    } catch {
      message.error('Failed to delete BOM item');
    }
  };

  const selectedItem = flatItems.find((item) => item.id === selectedId) || null;

  return (
    <div className={styles.bomPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>BOM管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleCreate({ name: '新物料', quantity: 1 })}>
          新增物料
        </Button>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.treePanel}>
          <h3 className={styles.panelTitle}>BOM结构树</h3>
          <BomTree
            data={treeData}
            selectedId={selectedId}
            onSelect={setSelectedId}
            loading={loading}
          />
        </div>

        <div className={styles.tablePanel}>
          <h3 className={styles.panelTitle}>物料详情</h3>
          <BomTable
            items={flatItems}
            selectedItem={selectedItem}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
