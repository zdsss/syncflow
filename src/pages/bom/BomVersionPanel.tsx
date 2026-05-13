import { useState, useEffect, useCallback } from 'react';
import { Drawer, Table, Button, Input, Popconfirm, Tag, Space, message } from 'antd';
import { PlusOutlined, SwapOutlined, RollbackOutlined } from '@ant-design/icons';
import { getBomVersions, saveBomVersion, rollbackBomVersion } from '@/services/bom.service';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import BomCompareModal from './BomCompareModal';

interface BomVersion {
  id: number;
  bomId: number;
  version: string;
  changeSummary?: string;
  createdBy?: string;
  createdAt?: string;
}

interface BomVersionPanelProps {
  bomId: number | null;
  bomStatus?: number;
  open: boolean;
  onClose: () => void;
}

export default function BomVersionPanel({ bomId, bomStatus, open, onClose }: BomVersionPanelProps) {
  const [changeSummary, setChangeSummary] = useState('');
  const [compareOpen, setCompareOpen] = useState(false);

  const fetcher = useCallback(
    () => bomId ? getBomVersions(bomId).then((res) => (res as any).data || []) : Promise.resolve([]),
    [bomId],
  );
  const { data: versions, loading, refresh } = useAsyncData<BomVersion[]>(fetcher, '获取版本列表失败');

  useEffect(() => {
    if (open && bomId) refresh();
  }, [open, bomId, refresh]);

  const { execute: handleCreate, loading: creating } = useAsyncAction(
    async () => {
      if (!bomId) return;
      await saveBomVersion(bomId, changeSummary || undefined);
    },
    { errorMessage: '创建版本失败', successMessage: '版本创建成功' },
  );

  const onCreate = async () => {
    if (!bomId) return;
    await handleCreate();
    setChangeSummary('');
    refresh();
  };

  const handleRollback = useCallback(async (targetVersion: string) => {
    if (!bomId) return;
    try {
      await rollbackBomVersion(bomId, targetVersion);
      message.success(`已回滚至版本 v${targetVersion}`);
      refresh();
    } catch {
      message.error('版本回滚失败');
    }
  }, [bomId, refresh]);

  const columns = [
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (v: string) => `v${v}`,
    },
    {
      title: '变更说明',
      dataIndex: 'changeSummary',
      key: 'changeSummary',
      render: (v: string) => v || '-',
    },
    {
      title: '创建者',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (v: string) => v || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (date ? new Date(date).toLocaleDateString('zh-CN') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: BomVersion) => (
        <Popconfirm
          title={`确认回滚至版本 v${record.version}？当前物料清单将被替换。`}
          onConfirm={() => handleRollback(record.version)}
          okText="确认"
          cancelText="取消"
        >
          <Button size="small" icon={<RollbackOutlined />} danger>
            回滚
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Drawer
      title="版本管理"
      open={open}
      onClose={onClose}
      size="large"
    >
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="变更说明（可选）"
          value={changeSummary}
          onChange={(e) => setChangeSummary(e.target.value)}
          style={{ width: 240 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate} loading={creating} disabled={!bomId || bomStatus === 2}>
          创建新版本
        </Button>
        <Button icon={<SwapOutlined />} onClick={() => setCompareOpen(true)} disabled={!bomId || !versions || versions.length < 2}>
          版本对比
        </Button>
      </Space>

      <Table
        dataSource={versions || []}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
      />

      {versions && versions.length >= 2 && (
        <BomCompareModal
          bomId={bomId}
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          v1={versions[versions.length - 2].version}
          v2={versions[versions.length - 1].version}
        />
      )}
    </Drawer>
  );
}
