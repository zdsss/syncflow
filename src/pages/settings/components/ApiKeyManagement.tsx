import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Checkbox, DatePicker, Tag, Popconfirm, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, CopyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getApiKeys, createApiKey, revokeApiKey, type ApiKey } from '@/services/auth.service';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';

const PERMISSION_OPTIONS = [
  { label: '任务读取', value: 'task:read' },
  { label: '任务写入', value: 'task:write' },
  { label: '项目读取', value: 'project:read' },
  { label: '项目写入', value: 'project:write' },
  { label: '仪表盘读取', value: 'dashboard:read' },
  { label: '文件读取', value: 'file:read' },
];

export default function ApiKeyManagement() {
  const [createOpen, setCreateOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchKeys = useCallback(async () => {
    const res = await getApiKeys();
    return (res as { data?: ApiKey[] }).data ?? [];
  }, []);

  const { data: keys, loading, refresh: fetchKeysRefresh, setData: setKeys } = useAsyncData<ApiKey[]>(fetchKeys, '加载API密钥失败');

  useEffect(() => {
    fetchKeysRefresh();
  }, [fetchKeysRefresh]);

  const { execute: executeCreate, loading: createLoading } = useAsyncAction(
    async (values: { name: string; permissions: string[]; expiresAt: dayjs.Dayjs }) => {
      const res = await createApiKey({
        name: values.name,
        permissions: values.permissions,
        expiresAt: values.expiresAt.toISOString(),
      });
      const data = (res as { data?: { fullKey?: string } }).data;
      setCreatedKey(data.fullKey);
      setCreateOpen(false);
      form.resetFields();
      fetchKeysRefresh();
      return data;
    },
    { successMessage: 'API Key 创建成功', errorMessage: 'API Key 创建失败' },
  );

  const { execute: executeRevoke } = useAsyncAction(
    async (id: string) => {
      await revokeApiKey(id);
      fetchKeysRefresh();
    },
    { successMessage: 'API Key 已吊销', errorMessage: '吊销失败' },
  );

  const handleCreate = (values: { name: string; permissions: string[]; expiresAt: dayjs.Dayjs }) => {
    executeCreate(values);
  };

  const handleRevoke = (id: string) => {
    executeRevoke(id);
  };

  const handleCopyKey = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      message.success('已复制到剪贴板');
    }
  };

  const columns: ColumnsType<ApiKey> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Key前缀',
      dataIndex: 'keyPrefix',
      key: 'keyPrefix',
      render: (val: string) => `${val}...`,
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (vals: string[]) => vals.map((v) => <Tag key={v}>{v}</Tag>),
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      render: (val?: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: number) => (
        <Tag color={val === 1 ? 'green' : 'default'} data-testid={`apikey-status-${val}`}>
          {val === 1 ? '有效' : '已吊销'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: ApiKey) =>
        record.status === 1 ? (
          <Popconfirm
            title="确定吊销此API Key？"
            onConfirm={() => handleRevoke(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger data-testid={`revoke-btn-${record.id}`}>
              吊销
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <div data-testid="api-key-management">
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
          data-testid="create-apikey-btn"
        >
          创建API Key
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={keys}
        loading={loading}
        data-testid="api-keys-table"
        pagination={false}
      />

      <Modal
        title="创建API Key"
        open={createOpen}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={createLoading}
        data-testid="create-apikey-modal"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="例如：CI/CD Pipeline" data-testid="apikey-name-input" />
          </Form.Item>
          <Form.Item label="权限" name="permissions" rules={[{ required: true, message: '请选择权限' }]}>
            <Checkbox.Group options={PERMISSION_OPTIONS} data-testid="apikey-permissions" />
          </Form.Item>
          <Form.Item label="过期时间" name="expiresAt" rules={[{ required: true, message: '请选择过期时间' }]}>
            <DatePicker style={{ width: '100%' }} data-testid="apikey-expiry" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="API Key 创建成功"
        open={!!createdKey}
        onCancel={() => setCreatedKey(null)}
        footer={[
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={handleCopyKey} data-testid="copy-key-btn">
            复制密钥
          </Button>,
          <Button key="close" onClick={() => setCreatedKey(null)}>
            关闭
          </Button>,
        ]}
        data-testid="key-display-modal"
      >
        <p style={{ color: '#ff4d4f', fontWeight: 600 }}>此密钥仅显示一次，请立即保存！</p>
        <Input.TextArea
          value={createdKey ?? ''}
          readOnly
          autoSize
          data-testid="created-key-value"
          style={{ fontFamily: 'monospace' }}
        />
      </Modal>
    </div>
  );
}
