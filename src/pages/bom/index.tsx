import { useEffect, useState, useCallback } from 'react';
import { Button, Tabs, Modal, message, Dropdown, Drawer, Empty } from 'antd';
import { PlusOutlined, DownloadOutlined, HistoryOutlined, SwapOutlined, UnorderedListOutlined, SendOutlined, MoreOutlined, RollbackOutlined } from '@ant-design/icons';
import { getBomsByProject, getBomStructure, createBomItem, updateBomItem, deleteBomItem, submitForApproval, withdrawBomApproval } from '@/services/bom.service';
import type { BomVO, BomItemVO } from '@/services/bom.service';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSocket } from '@/hooks/useSocket';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import BomTree from './components/BomTree';
import BomTable from './components/BomTable';
import BomVersionPanel from './BomVersionPanel';
import ChangeRequestModal from './ChangeRequestModal';
import ChangeRequestList from './ChangeRequestList';
import UsageLookupView from './UsageLookupView';
import ProcessRouteView from './ProcessRouteView';
import styles from './BomPage.module.css';

export default function BomPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [currentBomId, setCurrentBomId] = useState<number | null>(null);
  const [versionPanelOpen, setVersionPanelOpen] = useState(false);
  const [changeRequestOpen, setChangeRequestOpen] = useState(false);
  const [changeRecordsOpen, setChangeRecordsOpen] = useState(false);
  const [activeView, setActiveView] = useState('bom');
  const projectId = useProjectStore((s) => s.selectedProject?.id);

  // Step 1: Fetch BOM list for the project, then load structure of the latest BOM
  const fetcher = useCallback(async () => {
    if (!projectId) return { bom: null as BomVO | null, tree: [] as BomItemVO[], flat: [] as BomItemVO[] };

    // Get BOMs for this project
    const bomListRes = await getBomsByProject(projectId);
    const bomList: BomVO[] = (bomListRes as { data?: BomVO[] }).data || [];
    const latestBom = bomList.find((b) => b.isLatest) || bomList[0];

    if (!latestBom) return { bom: null, tree: [], flat: [] };

    // Load BOM item tree using the BOM's own ID
    const treeRes = await getBomStructure(latestBom.id);
    const tree: BomItemVO[] = (treeRes as { data?: BomItemVO[] }).data || [];

    // Flatten tree for table display
    const flatten = (items: BomItemVO[]): BomItemVO[] =>
      items.flatMap((item) => [item, ...(item.children ? flatten(item.children) : [])]);

    return { bom: latestBom, tree, flat: flatten(tree) };
  }, [projectId]);

  const { data: bomData, loading, refresh } = useAsyncData(fetcher, '加载BOM数据失败');

  useEffect(() => {
    refresh();
  }, [refresh]);

  // WebSocket: refresh BOM data when approval status changes
  const { connected, subscribe } = useSocket();
  useEffect(() => {
    if (!connected) return;
    const unsub = subscribe('/topic/approvals', () => {
      refresh();
    });
    return unsub;
  }, [connected, subscribe, refresh]);

  useEffect(() => {
    setCurrentBomId(bomData?.bom?.id ?? null);
  }, [bomData?.bom?.id]);

  const treeData = bomData?.tree ?? [];
  const flatItems = bomData?.flat ?? [];
  const currentBom = bomData?.bom ?? null;

  const handleCreate = async (data: Partial<BomItemVO>) => {
    if (!currentBomId) {
      message.warning('请先创建BOM');
      return;
    }
    const res: any = await createBomItem(currentBomId, data);
    if (res?.code === 40106) {
      message.info(res.message || '变更已提交审批，审批通过后自动生效');
      return;
    }
    refresh();
  };

  const handleUpdate = async (id: number, data: Partial<BomItemVO>) => {
    const res: any = await updateBomItem(id, data);
    if (res?.code === 40106) {
      message.info(res.message || '变更已提交审批，审批通过后自动生效');
      return;
    }
    refresh();
  };

  const handleDelete = async (id: number) => {
    const res: any = await deleteBomItem(id);
    if (res?.code === 40106) {
      message.info(res.message || '变更已提交审批，审批通过后自动生效');
      return;
    }
    if (selectedId === id) setSelectedId(null);
    refresh();
  };

  const handleSubmitApproval = async () => {
    if (!currentBomId) return;
    await submitForApproval(currentBomId);
    message.success('BOM已提交审批');
    refresh();
  };

  const handleWithdraw = async () => {
    if (!currentBomId) return;
    await withdrawBomApproval(currentBomId);
    message.success('审批已撤回');
    refresh();
  };

  const handleExport = async () => {
    // Export the already-loaded flat item list directly — no separate API call needed
    const items = flatItems;
    if (items.length === 0) {
      return;
    }
    const headers = ['levelNo', 'materialCode', 'name', 'specification', 'material', 'sourceType', 'unit', 'quantity', 'weight', 'remark'];
    const headerLabels = ['层级编号', '物料编码', '物料名称', '规格型号', '材质', '来源类型', '单位', '用量', '重量', '备注'];
    const escapeCSV = (str: string) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const csvRows = [headerLabels.map(escapeCSV).join(',')];
    for (const item of items) {
      csvRows.push(headers.map((h) => {
        const val = (item as Record<string, unknown>)[h];
        return escapeCSV(val != null ? String(val) : '');
      }).join(','));
    }
    const csvContent = csvRows.join('\n');
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const bomName = currentBom?.name?.replace(/[/\\?%*:|"<>]/g, '-') || 'bom';
    link.download = `${bomName}-export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const { execute: execCreate } = useAsyncAction(handleCreate, { errorMessage: '创建BOM物料失败', successMessage: 'BOM物料创建成功' });
  const { execute: execUpdate } = useAsyncAction(handleUpdate, { errorMessage: '更新BOM物料失败', successMessage: 'BOM物料更新成功' });
  const { execute: execDelete } = useAsyncAction(handleDelete, { errorMessage: '删除BOM物料失败', successMessage: 'BOM物料删除成功' });
  const { execute: execExport } = useAsyncAction(handleExport, { errorMessage: '导出失败', successMessage: '导出成功' });
  const { execute: execSubmitApproval } = useAsyncAction(handleSubmitApproval, { errorMessage: '提交审批失败' });
  const { execute: execWithdraw } = useAsyncAction(handleWithdraw, { errorMessage: '撤回审批失败' });

  const selectedItem = flatItems.find((item) => item.id === selectedId) || null;

  if (!projectId) {
    return (
      <div className={styles.bomPage}>
        <div className={styles.header}>
          <h1 className={styles.title}>BOM管理</h1>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty description="请先在项目管理中选择一个项目" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bomPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>BOM管理{currentBom ? ` — ${currentBom.name}` : ''}</h1>
        <div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => execCreate({ name: '新物料', quantity: 1 })} style={{ marginRight: 8 }} disabled={!currentBom || currentBom.status >= 4}>
            新增物料
          </Button>
          {currentBom && currentBom.status === 1 && (
            <Button icon={<SendOutlined />} onClick={() => execSubmitApproval()} style={{ marginRight: 8 }}>
              提交审批
            </Button>
          )}
          {currentBom && currentBom.status === 2 && (
            <Button icon={<RollbackOutlined />} onClick={() => execWithdraw()} style={{ marginRight: 8 }}>
              撤回审批
            </Button>
          )}
          <Dropdown
            menu={{
              items: [
                { key: 'export', icon: <DownloadOutlined />, label: '导出CSV', onClick: () => execExport() },
                { key: 'version', icon: <HistoryOutlined />, label: '版本管理', onClick: () => setVersionPanelOpen(true) },
                { type: 'divider' },
                { key: 'change', icon: <SwapOutlined />, label: '变更申请', onClick: () => setChangeRequestOpen(true) },
                { key: 'records', icon: <UnorderedListOutlined />, label: '变更记录', onClick: () => setChangeRecordsOpen(true) },
              ],
            }}
          >
            <Button icon={<MoreOutlined />}>更多</Button>
          </Dropdown>
        </div>
      </div>

      {currentBom && currentBom.status === 2 && (
        <div style={{ padding: '8px 16px', background: '#FFF7E6', border: '1px solid #FFD591', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
          <SendOutlined style={{ color: '#FA8C16' }} />
          <span style={{ fontSize: 13, color: '#AD6800' }}>
            当前BOM正在审批中，物料编辑将自动转为变更申请
          </span>
        </div>
      )}

      {currentBom && currentBom.status === 3 && (
        <div style={{ padding: '8px 16px', background: '#F6FFED', border: '1px solid #B7EB8F', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#389E0D' }}>
            BOM已审批通过 (v{currentBom.version})，修改将触发变更审批流程
          </span>
        </div>
      )}

      {currentBom && currentBom.status === 4 && (
        <div style={{ padding: '8px 16px', background: '#F5F5F5', border: '1px solid #D9D9D9', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#595959' }}>
            BOM已锁定，不可编辑。如需修改请联系管理员解锁。
          </span>
        </div>
      )}

      {currentBom && currentBom.status === 5 && (
        <div style={{ padding: '8px 16px', background: '#FFF1F0', border: '1px solid #FFCCC7', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#CF1322' }}>
            BOM已作废，仅供查看历史记录。
          </span>
        </div>
      )}

      <div className={styles.mainContent}>
        <Tabs
          activeKey={activeView}
          onChange={setActiveView}
          items={[
            { key: 'bom', label: '多级BOM' },
            { key: 'usage', label: '用量反查' },
            { key: 'process', label: '工艺路线' },
          ]}
          style={{ marginBottom: 0 }}
        />

        <div className={styles.panelsRow}>
          {activeView === 'bom' && (
            <>
              <div className={styles.treePanel}>
                <h3 className={styles.panelTitle}>产品结构树</h3>
                <BomTree
                  data={treeData}
                  selectedId={selectedId ? String(selectedId) : null}
                  onSelect={(id) => setSelectedId(Number(id))}
                  loading={loading}
                />
              </div>

              <div className={styles.tablePanel}>
                <h3 className={styles.panelTitle}>物料详情</h3>
                <BomTable
                  items={flatItems}
                  selectedItem={selectedItem}
                  onUpdate={execUpdate}
                  onDelete={execDelete}
                />
              </div>
            </>
          )}

          {activeView === 'usage' && (
            <div style={{ width: '100%' }}>
              <UsageLookupView items={flatItems} />
            </div>
          )}

          {activeView === 'process' && (
            <div style={{ width: '100%' }}>
              <ProcessRouteView bomId={currentBomId} />
            </div>
          )}
        </div>
      </div>

      <BomVersionPanel
        bomId={currentBomId}
        bomStatus={currentBom?.status}
        open={versionPanelOpen}
        onClose={() => setVersionPanelOpen(false)}
      />

      <ChangeRequestModal
        bomId={currentBomId}
        items={flatItems}
        open={changeRequestOpen}
        onClose={() => setChangeRequestOpen(false)}
        onSuccess={() => setChangeRequestOpen(false)}
      />

      <Drawer
        title="变更记录"
        open={changeRecordsOpen}
        onClose={() => setChangeRecordsOpen(false)}
        styles={{ wrapper: { width: 680 } }}
      >
        <ChangeRequestList bomId={currentBomId} />
      </Drawer>
    </div>
  );
}
