import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Form, Input, Select, Switch, Modal, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import {
  getCodeEntries,
  createCodeEntry,
  updateCodeEntry,
  deleteCodeEntry,
} from '@/services/config.service';
import type { CodeEntry } from '@/services/config.service';

const TYPE_LABELS: Record<string, string> = { project: '项目', task: '任务', file: '文件' };
const TYPE_COLORS: Record<string, string> = { project: 'blue', task: 'green', file: 'orange' };

export default function CodeManagement() {
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const fetcher = useCallback(
    () => getCodeEntries(filterType ? { type: filterType } : undefined).then(r => r.data),
    [filterType],
  );
  const { data, loading, refresh } = useAsyncData<CodeEntry[]>(fetcher, '加载编码数据失败');
  const { execute: deleteItem } = useAsyncAction(
    async (id: string) => { await deleteCodeEntry(id); },
    { successMessage: '删除成功', errorMessage: '删除失败' },
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { refresh(); }, [filterType]);

  const handleAdd = () => {
    form.resetFields();
    setEditingId(null);
    setModalOpen(true);
  };

  const handleEdit = (record: CodeEntry) => {
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
        await updateCodeEntry(editingId, values);
        message.success('更新成功');
      } else {
        await createCodeEntry(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      refresh();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('操作失败');
    }
  };

  const handleFilterChange = (value: string) => {
    setFilterType(value === 'all' ? undefined : value);
  };

  const columns: ColumnsType<CodeEntry> = [
    { title: '编码', dataIndex: 'code', key: 'code', width: 200 },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '类型', dataIndex: 'type', key: 'type', width: 120,
      render: (val: string) => <Tag color={TYPE_COLORS[val]}>{TYPE_LABELS[val] || val}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (val: number) => <Tag color={val === 1 ? 'green' : 'red'}>{val === 1 ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} data-testid={`edit-${record.id}`} />
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)} data-testid={`delete-confirm-${record.id}`}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} data-testid={`delete-${record.id}`} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div data-testid="code-management-page">
      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} data-testid="add-code-btn">
          新增编码
        </Button>
        <Select
          placeholder="按类型筛选"
          allowClear
          style={{ width: 160 }}
          onChange={handleFilterChange}
          data-testid="type-filter"
        >
          <Select.Option value="all">全部类型</Select.Option>
          <Select.Option value="project">项目</Select.Option>
          <Select.Option value="task">任务</Select.Option>
          <Select.Option value="file">文件</Select.Option>
        </Select>
      </div>
      <Table
        dataSource={data ?? []}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        data-testid="code-table"
      />
      <Modal
        title={editingId ? '编辑编码' : '新增编码'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okText="确定"
        cancelText="取消"
        data-testid="code-modal"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="编码" rules={[{ required: true, message: '请输入编码' }]}>
            <Input placeholder="例如: PRJ-001" data-testid="input-code" />
          </Form.Item>
          <Form.Item name="description" label="描述" rules={[{ required: true, message: '请输入描述' }]}>
            <Input.TextArea rows={2} data-testid="input-description" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select data-testid="select-type">
              <Select.Option value="project">项目</Select.Option>
              <Select.Option value="task">任务</Select.Option>
              <Select.Option value="file">文件</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={1} valuePropName="checked">
            <Switch
              checkedChildren="启用"
              unCheckedChildren="禁用"
              data-testid="switch-status"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
