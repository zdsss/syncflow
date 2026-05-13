import { useEffect, useMemo, useCallback } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { getResources, createResource, updateResource, deleteResource } from '@/services/resource.service';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import ResourceTabs from './components/ResourceTabs';
import ResourceList from './components/ResourceList';
import styles from './ResourcesPage.module.css';
import { useState } from 'react';

interface Resource {
  id: string;
  name: string;
  type: string;
  description: string;
  tags: string[];
  status: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'available', label: '可用' },
  { value: 'busy', label: '忙碌' },
  { value: 'unavailable', label: '不可用' },
  { value: 'maintenance', label: '维护中' },
];

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState('human');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [borrowModalVisible, setBorrowModalVisible] = useState(false);
  const [borrowTarget, setBorrowTarget] = useState<Resource | null>(null);
  const [borrowForm] = Form.useForm();
  const [form] = Form.useForm();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [initialFetched, setInitialFetched] = useState(false);

  const resourcesFetcher = useCallback(async () => {
    const res = await getResources({ type: activeTab });
    return (res?.data || []) as Resource[];
  }, [activeTab]);

  const { data: allResources, loading, refresh: refreshResources } = useAsyncData<Resource[]>(
    resourcesFetcher,
    '加载资源失败',
  );

  useEffect(() => {
    refreshResources().finally(() => setInitialFetched(true));
  }, [refreshResources]);

  const resources = useMemo(() => {
    let filtered = allResources || [];
    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(kw) ||
          r.description?.toLowerCase().includes(kw) ||
          r.tags?.some((t) => t.toLowerCase().includes(kw)) ||
          r.status?.toLowerCase().includes(kw)
      );
    }
    return filtered;
  }, [allResources, statusFilter, searchKeyword]);

  const { execute: executeDelete } = useAsyncAction<[string], void>(
    async (id: string) => {
      await deleteResource(id);
    },
    { errorMessage: '删除失败', successMessage: '删除成功' },
  );

  const { execute: executeSubmit } = useAsyncAction(
    async () => {
      const values = await form.validateFields();
      if (editingResource) {
        await updateResource(editingResource.id, values);
        message.success('更新成功');
      } else {
        await createResource({ ...values, type: activeTab });
        message.success('创建成功');
      }
    },
    { errorMessage: '操作失败' },
  );

  const handleSearch = async (keyword: string) => {
    setSearchKeyword(keyword);
    if (!keyword) {
      refreshResources();
    }
  };

  const handleAdd = () => {
    setEditingResource(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Resource) => {
    setEditingResource(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    await executeDelete(id);
    refreshResources();
  };

  const handleSubmit = async () => {
    await executeSubmit();
    setModalVisible(false);
    refreshResources();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>通用资源</h1>
      </div>

      <div className={styles.content}>
        <ResourceTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#666', fontSize: 13 }}>状态筛选:</span>
          <Select
            data-testid="status-filter"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            style={{ width: 140 }}
            options={STATUS_OPTIONS}
          />
        </div>
        <ResourceList
          resources={resources}
          loading={loading || !initialFetched}
          onSearch={handleSearch}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBorrow={(record) => {
            setBorrowTarget(record);
            borrowForm.resetFields();
            setBorrowModalVisible(true);
          }}
        />
      </div>

      <Modal
        title={editingResource ? '编辑资源' : '添加资源'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="available">
            <Select>
              <Select.Option value="available">可用</Select.Option>
              <Select.Option value="busy">忙碌</Select.Option>
              <Select.Option value="unavailable">不可用</Select.Option>
              <Select.Option value="maintenance">维护中</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`借用申请 - ${borrowTarget?.name || ''}`}
        open={borrowModalVisible}
        onOk={() => {
          message.success('借用申请已提交');
          setBorrowModalVisible(false);
        }}
        onCancel={() => setBorrowModalVisible(false)}
        okText="提交申请"
        cancelText="取消"
      >
        <Form form={borrowForm} layout="vertical">
          <Form.Item name="reason" label="借用原因" rules={[{ required: true, message: '请输入借用原因' }]}>
            <Input.TextArea rows={3} placeholder="请说明借用原因" />
          </Form.Item>
          <Form.Item name="duration" label="借用时长">
            <Select placeholder="请选择借用时长">
              <Select.Option value="1d">1 天</Select.Option>
              <Select.Option value="3d">3 天</Select.Option>
              <Select.Option value="1w">1 周</Select.Option>
              <Select.Option value="1m">1 个月</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
