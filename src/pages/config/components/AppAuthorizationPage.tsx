import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Form, Input, Select, Modal, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import {
  getAppAuthorizations,
  createAppAuthorization,
  updateAppAuthorization,
  deleteAppAuthorization,
} from '@/services/config.service';
import type { AppAuthorization } from '@/services/config.service';

const TYPE_LABELS: Record<string, string> = { api: 'API', function: '功能', data: '数据' };
const TYPE_COLORS: Record<string, string> = { api: 'blue', function: 'green', data: 'orange' };

export default function AppAuthorizationPage() {
  const fetcher = useCallback(() => getAppAuthorizations().then(r => r.data), []);
  const { data, loading, refresh } = useAsyncData<AppAuthorization[]>(fetcher, '加载应用授权失败');
  const { execute: deleteItem } = useAsyncAction(
    async (id: string) => { await deleteAppAuthorization(id); },
    { successMessage: '删除成功', errorMessage: '删除失败' },
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { refresh(); }, []);

  const handleAdd = () => {
    form.resetFields();
    setEditingId(null);
    setModalOpen(true);
  };

  const handleEdit = (record: AppAuthorization) => {
    form.setFieldsValue(record);
    setEditingId(record.id);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteItem(id);
    refresh();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await updateAppAuthorization(editingId, values);
        message.success('更新成功');
      } else {
        await createAppAuthorization(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      refresh();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('操作失败');
    }
  };

  const columns: ColumnsType<AppAuthorization> = [
    { title: '键名', dataIndex: 'keyName', key: 'keyName', width: 200 },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '类型', dataIndex: 'type', key: 'type', width: 100,
      render: (val: string) => <Tag color={TYPE_COLORS[val]}>{TYPE_LABELS[val] || val}</Tag>,
    },
    { title: '作用域', dataIndex: 'scope', key: 'scope', width: 120 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (val: number) => <Tag color={val === 1 ? 'green' : 'red'}>{val === 1 ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div data-testid="app-authorization-page">
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增应用授权</Button>
      </div>
      <Table
        dataSource={data ?? []}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
      />
      <Modal
        title={editingId ? '编辑应用授权' : '新增应用授权'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="keyName" label="键名" rules={[{ required: true, message: '请输入键名' }]}>
            <Input placeholder="例如: api:task:read" />
          </Form.Item>
          <Form.Item name="description" label="描述" rules={[{ required: true, message: '请输入描述' }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select>
              <Select.Option value="api">API</Select.Option>
              <Select.Option value="function">功能</Select.Option>
              <Select.Option value="data">数据</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="scope" label="作用域">
            <Input placeholder="作用域" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select>
              <Select.Option value={1}>启用</Select.Option>
              <Select.Option value={0}>禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
