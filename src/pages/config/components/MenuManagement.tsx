import { useState, useEffect, useCallback } from 'react';
import { Tree, Button, Form, Input, InputNumber, Select, Modal, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import { getMenuTree, createMenuItem, updateMenuItem, deleteMenuItem } from '@/services/config.service';
import type { MenuItem } from '@/services/config.service';

const TYPE_COLORS: Record<string, string> = { menu: 'blue', button: 'green', link: 'orange' };
const TYPE_LABELS: Record<string, string> = { menu: '菜单', button: '按钮', link: '链接' };

function toTreeData(nodes: MenuItem[]): any[] {
  return nodes.map((item) => ({
    key: item.id,
    title: (
      <span>
        {item.name} <Tag color={TYPE_COLORS[item.type] || 'default'}>{TYPE_LABELS[item.type] || item.type}</Tag>
        <Tag>{item.status === 1 ? '启用' : '禁用'}</Tag>
      </span>
    ),
    raw: item,
    children: item.children?.length ? toTreeData(item.children) : undefined,
  }));
}

function flattenMenu(nodes: MenuItem[]): MenuItem[] {
  const result: MenuItem[] = [];
  const walk = (items: MenuItem[]) => {
    for (const item of items) {
      result.push(item);
      if (item.children?.length) walk(item.children);
    }
  };
  walk(nodes);
  return result;
}

export default function MenuManagement() {
  const fetcher = useCallback(() => getMenuTree().then(r => r.data), []);
  const { data: tree, loading, refresh } = useAsyncData<MenuItem[]>(fetcher, '加载菜单树失败');
  const { execute: deleteItem } = useAsyncAction(
    async (id: string) => { await deleteMenuItem(id); },
    { successMessage: '删除成功', errorMessage: '删除失败' },
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [form] = Form.useForm();

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (tree?.length) {
      const collectKeys = (nodes: any[]): string[] =>
        nodes.flatMap((n: any) => [n.id, ...(n.children?.length ? collectKeys(n.children) : [])]);
      setExpandedKeys(collectKeys(tree));
    }
  }, [tree]);

  const handleAdd = (parentId?: string) => {
    form.resetFields();
    if (parentId) form.setFieldsValue({ parentId });
    setEditingId(null);
    setModalOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    form.setFieldsValue(item);
    setEditingId(item.id);
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
        await updateMenuItem(editingId, values);
        message.success('更新成功');
      } else {
        await createMenuItem(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      refresh();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('操作失败');
    }
  };

  const renderTreeTitle = (node: any) => {
    const item: MenuItem = node.raw;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{item.name}</span>
        <Tag color={TYPE_COLORS[item.type] || 'default'}>{TYPE_LABELS[item.type] || item.type}</Tag>
        <Tag>{item.status === 1 ? '启用' : '禁用'}</Tag>
        <Space size={4}>
          <Button type="link" size="small" icon={<PlusOutlined />} onClick={(e) => { e.stopPropagation(); handleAdd(item.id); }} />
          <Button type="link" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); handleEdit(item); }} />
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(item.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
          </Popconfirm>
        </Space>
      </div>
    );
  };

  const treeData = toTreeData(tree ?? []).map((node) => ({ ...node, title: renderTreeTitle(node) }));
  const allMenus = flattenMenu(tree ?? []);

  return (
    <div data-testid="menu-management">
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd()}>新增菜单</Button>
      </div>
      <Tree
        treeData={treeData}
        expandedKeys={expandedKeys}
        onExpand={(keys) => setExpandedKeys(keys as string[])}
        loading={loading}
        showLine
      />
      <Modal
        title={editingId ? '编辑菜单' : '新增菜单'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="菜单编码" rules={[{ required: true, message: '请输入菜单编码' }]}>
            <Input placeholder="例如: system:user" />
          </Form.Item>
          <Form.Item name="name" label="菜单名称" rules={[{ required: true, message: '请输入菜单名称' }]}>
            <Input placeholder="请输入菜单名称" />
          </Form.Item>
          <Form.Item name="parentId" label="上级菜单">
            <Select allowClear placeholder="无（顶级菜单）">
              {allMenus.map((m) => (
                <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select>
              <Select.Option value="menu">菜单</Select.Option>
              <Select.Option value="button">按钮</Select.Option>
              <Select.Option value="link">链接</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="图标名称" />
          </Form.Item>
          <Form.Item name="link" label="路由地址">
            <Input placeholder="/path" />
          </Form.Item>
          <Form.Item name="page" label="页面组件">
            <Input placeholder="ComponentName" />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select>
              <Select.Option value={1}>启用</Select.Option>
              <Select.Option value={0}>禁用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
