import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Form, Input, InputNumber, Select, Modal, Space, Popconfirm, Switch, Checkbox, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import {
  getApprovalConfigs,
  createApprovalConfig,
  updateApprovalConfig,
  deleteApprovalConfig,
  toggleApprovalConfig,
} from '@/services/approval-config.service';
import type { ApprovalConfigVO, ApprovalConfigDTO } from '@/services/approval-config.service';

const OBJECT_TYPE_OPTIONS = [
  'BOM', 'STAGE_GATE', 'PROCESS_ROUTE', 'MODULE_SPEC', 'CHANGE', 'FILE', 'TASK', 'PROJECT',
];

const RULE_TYPE_OPTIONS = [
  { label: '项目角色', value: 'PROJECT_ROLE' },
  { label: '指定用户', value: 'USER' },
  { label: '部门', value: 'DEPARTMENT' },
  { label: '动态规则', value: 'DYNAMIC' },
];

export default function ApprovalChainConfig() {
  const [filterObjectType, setFilterObjectType] = useState<string | undefined>(undefined);
  const [filterProcessKey, setFilterProcessKey] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const ruleType = Form.useWatch('ruleType', form);

  const fetchConfigs = useCallback(
    () => getApprovalConfigs({
      objectType: filterObjectType,
      processKey: filterProcessKey || undefined,
    }).then(r => r.data),
    [filterObjectType, filterProcessKey],
  );

  const { data: configs, loading, refresh } = useAsyncData<ApprovalConfigVO[]>(fetchConfigs, '加载审批配置失败');

  const { execute: doDelete } = useAsyncAction(
    async (id: number) => { await deleteApprovalConfig(id); },
    { successMessage: '删除成功', errorMessage: '删除失败' },
  );

  const { execute: doToggle } = useAsyncAction(
    async (id: number) => { await toggleApprovalConfig(id); },
    { errorMessage: '切换状态失败' },
  );

  useEffect(() => { refresh(); }, [filterObjectType, filterProcessKey]);

  const handleAdd = () => {
    form.resetFields();
    form.setFieldsValue({ priority: 100, required: true, enabled: true });
    setEditingId(null);
    setModalOpen(true);
  };

  const handleEdit = (record: ApprovalConfigVO) => {
    form.setFieldsValue(record);
    setEditingId(record.id);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    await doDelete(id);
    refresh();
  };

  const handleToggle = async (id: number) => {
    await doToggle(id);
    refresh();
  };

  const handleOk = async () => {
    try {
      const values: ApprovalConfigDTO = await form.validateFields();
      if (editingId !== null) {
        await updateApprovalConfig(editingId, values);
        message.success('更新成功');
      } else {
        await createApprovalConfig(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      refresh();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('操作失败');
    }
  };

  const columns: ColumnsType<ApprovalConfigVO> = [
    { title: '审批类型', dataIndex: 'objectType', key: 'objectType', width: 130 },
    { title: '流程', dataIndex: 'processKey', key: 'processKey', width: 140 },
    { title: '节点', dataIndex: 'nodeName', key: 'nodeName', width: 120 },
    { title: '规则类型', dataIndex: 'ruleType', key: 'ruleType', width: 110 },
    { title: '规则值', dataIndex: 'ruleValue', key: 'ruleValue', ellipsis: true },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80 },
    {
      title: '启用', key: 'enabled', width: 80,
      render: (_, record) => (
        <Switch
          checked={record.enabled}
          size="small"
          onChange={() => handleToggle(record.id)}
        />
      ),
    },
    {
      title: '操作', key: 'action', width: 100,
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
    <div data-testid="approval-chain-config">
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Select
          placeholder="审批类型"
          allowClear
          style={{ width: 160 }}
          value={filterObjectType}
          onChange={setFilterObjectType}
          options={OBJECT_TYPE_OPTIONS.map(v => ({ label: v, value: v }))}
        />
        <Input
          placeholder="流程Key"
          allowClear
          style={{ width: 180 }}
          value={filterProcessKey}
          onChange={e => setFilterProcessKey(e.target.value || undefined)}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增</Button>
      </div>

      <Table
        dataSource={configs ?? []}
        columns={columns}
        rowKey="id"
        size="small"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title={editingId !== null ? '编辑审批配置' : '新增审批配置'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okText="确定"
        cancelText="取消"
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="objectType" label="审批类型" rules={[{ required: true, message: '请选择审批类型' }]}>
            <Select
              placeholder="请选择"
              options={OBJECT_TYPE_OPTIONS.map(v => ({ label: v, value: v }))}
            />
          </Form.Item>
          <Form.Item name="processKey" label="流程Key" rules={[{ required: true, message: '请输入流程Key' }]}>
            <Input placeholder="例如: bom_approval" />
          </Form.Item>
          <Form.Item name="nodeId" label="节点ID" rules={[{ required: true, message: '请输入节点ID' }]}>
            <Input placeholder="例如: node_review_1" />
          </Form.Item>
          <Form.Item name="nodeName" label="节点名称" rules={[{ required: true, message: '请输入节点名称' }]}>
            <Input placeholder="例如: 技术评审" />
          </Form.Item>
          <Form.Item name="ruleType" label="规则类型" rules={[{ required: true, message: '请选择规则类型' }]}>
            <Select placeholder="请选择" options={RULE_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="ruleValue" label="规则值">
            <Input placeholder="根据规则类型填写对应值" />
          </Form.Item>
          {ruleType === 'DYNAMIC' && (
            <Form.Item name="expression" label="动态表达式">
              <Input.TextArea rows={3} placeholder="SpEL / MVEL 表达式" />
            </Form.Item>
          )}
          <Form.Item name="priority" label="优先级" initialValue={100}>
            <InputNumber min={0} max={9999} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="skipExpression" label="跳过表达式">
            <Input.TextArea rows={2} placeholder="满足条件时跳过该节点（可选）" />
          </Form.Item>
          <Form.Item name="required" valuePropName="checked" initialValue={true}>
            <Checkbox>必填审批</Checkbox>
          </Form.Item>
          <Form.Item name="enabled" valuePropName="checked" initialValue={true}>
            <Checkbox>启用</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
