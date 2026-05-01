import { useEffect, useState, useCallback } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { getResources, createResource, updateResource, deleteResource } from '@/services/resource.service';
import ResourceTabs from './components/ResourceTabs';
import ResourceList from './components/ResourceList';
import styles from './ResourcesPage.module.css';

interface Resource {
  id: string;
  name: string;
  type: string;
  description: string;
  tags: string[];
  status: string;
  createdAt: string;
}

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState('human');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [form] = Form.useForm();

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getResources({ type: activeTab });
      if (res?.data) {
        setResources(res.data);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleSearch = async (keyword: string) => {
    if (!keyword) {
      fetchResources();
      return;
    }
    const filtered = resources.filter(
      (r) =>
        r.name.includes(keyword) ||
        r.description?.includes(keyword) ||
        r.tags?.some((t) => t.includes(keyword))
    );
    setResources(filtered);
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
    try {
      await deleteResource(id);
      message.success('删除成功');
      fetchResources();
    } catch (err) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingResource) {
        await updateResource(editingResource.id, values);
        message.success('更新成功');
      } else {
        await createResource({ ...values, type: activeTab });
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchResources();
    } catch (err) {
      console.error('Form validation failed:', err);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>通用资源</h1>
      </div>

      <div className={styles.content}>
        <ResourceTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <ResourceList
          resources={resources}
          loading={loading}
          onSearch={handleSearch}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
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
    </div>
  );
}
