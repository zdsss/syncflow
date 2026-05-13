import { useState, useEffect, useCallback } from 'react';
import { Button, Table, Tag, message, Popconfirm, Alert, Space, Empty } from 'antd';
import { PlusOutlined, UploadOutlined, SendOutlined, UndoOutlined } from '@ant-design/icons';
import { getProcessRoutes, createProcessRoute, deleteProcessRoute, addProcessStep, reorderOperations, submitRouteForApproval, withdrawRouteApproval } from '@/services/process.service';
import { getFiles } from '@/services/file.service';
import { useProjectStore } from '@/stores/useProjectStore';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import { useSocket } from '@/hooks/useSocket';
import RouteList from './components/RouteList';
import StepDetail from './components/StepDetail';
import CreateRouteModal from './components/CreateRouteModal';
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
  status: string | number;
  version: number;
  steps: ProcessStep[];
}

interface ProcessFile {
  id: string | number;
  fileName: string;
  fileType: string;
  version?: string;
  uploadTime?: string;
  createdAt?: string;
}

const FILE_TYPE_COLORS: Record<string, string> = {
  SOP: 'blue',
  '工艺卡': 'green',
  '检验标准': 'orange',
  '控制计划': 'purple',
};

const FILE_COLUMNS = [
  { title: '文件名', dataIndex: 'fileName', key: 'fileName', ellipsis: true },
  {
    title: '类型',
    dataIndex: 'fileType',
    key: 'fileType',
    width: 120,
    render: (type: string) => <Tag color={FILE_TYPE_COLORS[type] || 'default'}>{type || '-'}</Tag>,
  },
  { title: '版本', dataIndex: 'version', key: 'version', width: 80, render: (v: string) => v || '-' },
  { title: '上传时间', dataIndex: 'uploadTime', key: 'uploadTime', width: 120, render: (_: any, r: ProcessFile) => r.uploadTime || r.createdAt?.slice(0, 10) || '-' },
];

function getStatusNum(status: string | number): number {
  if (typeof status === 'number') return status;
  const map: Record<string, number> = { draft: 1, pending_approval: 2, approved: 3, published: 5 };
  return map[status] || 1;
}

export default function ProcessPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const projectId = useProjectStore((s) => s.selectedProject?.id) || '';

  const fetcher = useCallback(
    async () => {
      if (!projectId) return [] as ProcessRoute[];
      const res = await getProcessRoutes({ projectId: projectId as any });
      return (res as { data?: ProcessRoute[] }).data || [];
    },
    [projectId],
  );
  const { data: routes, loading, refresh } = useAsyncData<ProcessRoute[]>(fetcher, '加载工艺路线失败');

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Fetch process files for the project
  const fileFetcher = useCallback(
    async () => {
      if (!projectId) return [] as ProcessFile[];
      const res = await getFiles({ projectId: Number(projectId) || undefined, bizType: 'PROCESS' });
      return ((res as any)?.data || []) as ProcessFile[];
    },
    [projectId],
  );
  const { data: processFiles, refresh: refreshFiles } = useAsyncData<ProcessFile[]>(fileFetcher, '加载工艺文件失败');

  useEffect(() => { refreshFiles(); }, [refreshFiles]);

  // WebSocket: refresh when approval status changes
  const { subscribe } = useSocket();
  useEffect(() => {
    const unsub = subscribe('/topic/approvals', () => {
      refresh();
    });
    return unsub;
  }, [subscribe, refresh]);

  const { execute: createRoute } = useAsyncAction(
    async (data: { name: string; bomId: number; projectId: number; productCode: string; productName: string }) => {
      await createProcessRoute(data);
    },
    { errorMessage: '创建工艺路线失败', successMessage: '工艺路线创建成功' },
  );

  const { execute: deleteRoute } = useAsyncAction(
    async (id: string) => {
      await deleteProcessRoute(id);
    },
    { errorMessage: '删除工艺路线失败', successMessage: '工艺路线已删除' },
  );

  const { execute: addStep } = useAsyncAction(
    async (routeId: string) => {
      const currentRoutes = routes || [];
      const route = currentRoutes.find((r) => r.id === routeId);
      const nextOrder = route ? route.steps.length + 1 : 1;
      await addProcessStep(routeId, { name: '新步骤', sortOrder: nextOrder });
    },
    { errorMessage: '添加步骤失败', successMessage: '步骤已添加' },
  );

  const { execute: submitApproval } = useAsyncAction(
    async (id: string) => {
      await submitRouteForApproval(id);
    },
    { errorMessage: '提交审批失败', successMessage: '已提交审批' },
  );

  const { execute: withdrawApproval } = useAsyncAction(
    async (id: string) => {
      await withdrawRouteApproval(id);
    },
    { errorMessage: '撤回失败', successMessage: '已撤回审批' },
  );

  const handleReorder = async (routeId: string, orderedIds: string[]) => {
    try {
      await reorderOperations(routeId, orderedIds);
    } catch {
      message.error('排序保存失败');
      refresh();
    }
  };

  const handleCreate = async (data: { name: string; bomId: number; projectId: number; productCode: string; productName: string }) => {
    await createRoute(data);
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteRoute(id);
    if (selectedId === id) setSelectedId(null);
    refresh();
  };

  const handleAddStep = async (routeId: string) => {
    await addStep(routeId);
    refresh();
  };

  const handleSubmitApproval = async () => {
    if (!selectedId) return;
    await submitApproval(selectedId);
    refresh();
  };

  const handleWithdrawApproval = async () => {
    if (!selectedId) return;
    await withdrawApproval(selectedId);
    refresh();
  };

  const currentRoutes = routes || [];
  const selectedRoute = currentRoutes.find((r) => r.id === selectedId) || null;
  const selectedStatus = selectedRoute ? getStatusNum(selectedRoute.status) : 0;

  const handleUpload = () => {
    message.info('功能开发中');
  };

  return (
    <div className={styles.processPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>工艺管理</h1>
        <Space>
          {selectedRoute && selectedStatus === 1 && (
            <Popconfirm
              title="确认提交审批？"
              description="提交后将进入审核流程，审批期间不可编辑。"
              onConfirm={handleSubmitApproval}
              okText="确认提交"
              cancelText="取消"
            >
              <Button icon={<SendOutlined />}>提交审批</Button>
            </Popconfirm>
          )}
          {selectedRoute && selectedStatus === 2 && (
            <Popconfirm
              title="确认撤回审批？"
              description="撤回后需重新提交。"
              onConfirm={handleWithdrawApproval}
              okText="确认撤回"
              cancelText="取消"
            >
              <Button icon={<UndoOutlined />}>撤回审批</Button>
            </Popconfirm>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            新增工艺路线
          </Button>
        </Space>
      </div>

      {selectedRoute && selectedStatus === 2 && (
        <Alert message="当前工艺路线正在审批中，暂不可编辑" type="warning" showIcon style={{ flexShrink: 0 }} />
      )}
      {selectedRoute && selectedStatus === 5 && (
        <Alert message="当前工艺路线已发布" type="success" showIcon style={{ flexShrink: 0 }} />
      )}

      <div className={styles.mainContent}>
        <div className={styles.listPanel}>
          <h3 className={styles.panelTitle}>工艺路线列表</h3>
          <RouteList
            routes={currentRoutes}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={handleDelete}
            onCreate={() => setCreateModalOpen(true)}
            loading={loading}
          />
        </div>

        <div className={styles.detailPanel}>
          <h3 className={styles.panelTitle}>工序详情</h3>
          <StepDetail
            route={selectedRoute}
            onAddStep={handleAddStep}
            onReorder={handleReorder}
          />
        </div>
      </div>

      <div className={styles.fileSection}>
        <div className={styles.fileSectionHeader}>
          <h3 className={styles.panelTitle}>工艺文件</h3>
          <Button icon={<UploadOutlined />} onClick={handleUpload}>
            上传文件
          </Button>
        </div>
        <Table
          dataSource={processFiles || []}
          columns={FILE_COLUMNS}
          rowKey="id"
          pagination={false}
          size="small"
          locale={{ emptyText: <Empty description="暂无工艺文件" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        />
      </div>

      <CreateRouteModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
