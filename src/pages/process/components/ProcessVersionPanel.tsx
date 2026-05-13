import { useState, useEffect, useCallback } from 'react';
import { Button, Table, Tag, Modal, Input, Popconfirm, Space } from 'antd';
import { PlusOutlined, CheckOutlined, SwapOutlined } from '@ant-design/icons';
import { getProcessVersions, createProcessVersion, publishProcessVersion } from '@/services/process.service';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import VersionCompareModal from './VersionCompareModal';

interface ProcessVersion {
  id: string;
  version: number;
  description?: string;
  status: string;
  routeId: string;
  createdAt: string;
}

interface ProcessVersionPanelProps {
  routeId: string;
  visible: boolean;
  onClose: () => void;
}

export default function ProcessVersionPanel({ routeId, visible, onClose }: ProcessVersionPanelProps) {
  const [descModalVisible, setDescModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [compareVisible, setCompareVisible] = useState(false);

  const fetcher = useCallback(
    () => getProcessVersions(routeId).then((res) => res.data || []),
    [routeId],
  );
  const { data: versions, loading, refresh } = useAsyncData<ProcessVersion[]>(fetcher, '加载版本列表失败');

  useEffect(() => {
    if (visible && routeId) refresh();
  }, [visible, routeId, refresh]);

  const { execute: createVersion } = useAsyncAction(
    async () => {
      await createProcessVersion(routeId, description || undefined);
    },
    { errorMessage: '版本创建失败', successMessage: '版本创建成功' },
  );

  const { execute: publishVersion } = useAsyncAction(
    async (versionId: string) => {
      await publishProcessVersion(routeId, versionId);
    },
    { errorMessage: '版本发布失败', successMessage: '版本发布成功' },
  );

  const handleCreate = async () => {
    await createVersion();
    setDescription('');
    setDescModalVisible(false);
    refresh();
  };

  const handlePublish = async (versionId: string) => {
    await publishVersion(versionId);
    refresh();
  };

  const columns = [
    { title: '版本号', dataIndex: 'version', key: 'version', render: (v: number) => `v${v}` },
    { title: '说明', dataIndex: 'description', key: 'description', render: (v: string) => v || '-' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: string) => (
        <Tag color={s === 'published' ? 'green' : 'default'}>
          {s === 'published' ? '已发布' : '草稿'}
        </Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => new Date(v).toLocaleDateString() },
    {
      title: '操作', key: 'action',
      render: (_: any, record: ProcessVersion) => (
        record.status !== 'published' ? (
          <Popconfirm title="确认发布此版本？" onConfirm={() => handlePublish(record.id)}>
            <Button type="link" size="small" icon={<CheckOutlined />}>发布</Button>
          </Popconfirm>
        ) : null
      ),
    },
  ];

  return (
    <>
      <Modal title="版本管理" open={visible} onCancel={onClose} footer={null} width={700}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDescModalVisible(true)}>
            创建新版本
          </Button>
          <Button icon={<SwapOutlined />} onClick={() => setCompareVisible(true)}>
            版本对比
          </Button>
        </div>
        <Table
          dataSource={versions || []}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={false}
        />
      </Modal>

      <Modal
        title="创建新版本"
        open={descModalVisible}
        onOk={handleCreate}
        onCancel={() => { setDescModalVisible(false); setDescription(''); }}
        okText="创建"
        cancelText="取消"
      >
        <Input.TextArea
          placeholder="版本说明（可选）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </Modal>

      <VersionCompareModal
        routeId={routeId}
        visible={compareVisible}
        onClose={() => setCompareVisible(false)}
      />
    </>
  );
}
