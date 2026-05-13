import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Form, Input, InputNumber, Select, Modal, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import {
  getDictionaries,
  createDictionary,
  updateDictionary,
  deleteDictionary,
  getDictionaryValues,
  createDictionaryValue,
  updateDictionaryValue,
  deleteDictionaryValue,
} from '@/services/config.service';
import type { Dictionary, DictionaryValue } from '@/services/config.service';

export default function DictionaryManagement() {
  const [selectedDict, setSelectedDict] = useState<Dictionary | null>(null);
  const [dictModalOpen, setDictModalOpen] = useState(false);
  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [editingDictId, setEditingDictId] = useState<string | null>(null);
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [dictForm] = Form.useForm();
  const [valueForm] = Form.useForm();

  const fetchDicts = useCallback(() => getDictionaries().then(r => r.data), []);
  const { data: dicts, loading, refresh: refreshDicts, setData: setDicts } = useAsyncData<Dictionary[]>(fetchDicts, '加载字典列表失败');

  const fetchValues = useCallback(
    () => selectedDict ? getDictionaryValues(selectedDict.id).then(r => r.data) : Promise.resolve([]),
    [selectedDict],
  );
  const { data: values, refresh: refreshValues, setData: setValues } = useAsyncData<DictionaryValue[]>(fetchValues, '加载字典值失败');

  const { execute: deleteDict } = useAsyncAction(
    async (id: string) => { await deleteDictionary(id); },
    { successMessage: '删除成功', errorMessage: '删除失败' },
  );
  const { execute: deleteVal } = useAsyncAction(
    async (dictId: string, valueId: string) => { await deleteDictionaryValue(dictId, valueId); },
    { successMessage: '删除成功', errorMessage: '删除失败' },
  );

  useEffect(() => { refreshDicts(); }, []);

  useEffect(() => {
    if (dicts?.length && !selectedDict) {
      setSelectedDict(dicts[0]);
    }
  }, [dicts]);

  useEffect(() => { if (selectedDict) refreshValues(); }, [selectedDict]);

  const handleAddDict = () => {
    dictForm.resetFields();
    setEditingDictId(null);
    setDictModalOpen(true);
  };

  const handleEditDict = (dict: Dictionary) => {
    dictForm.setFieldsValue(dict);
    setEditingDictId(dict.id);
    setDictModalOpen(true);
  };

  const handleDeleteDict = async (id: string) => {
    await deleteDict(id);
    if (selectedDict?.id === id) setSelectedDict(null);
    refreshDicts();
  };

  const handleDictOk = async () => {
    try {
      const vals = await dictForm.validateFields();
      if (editingDictId) {
        await updateDictionary(editingDictId, vals);
        message.success('更新成功');
      } else {
        await createDictionary(vals);
        message.success('创建成功');
      }
      setDictModalOpen(false);
      refreshDicts();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('操作失败');
    }
  };

  const handleAddValue = () => {
    valueForm.resetFields();
    setEditingValueId(null);
    setValueModalOpen(true);
  };

  const handleEditValue = (val: DictionaryValue) => {
    valueForm.setFieldsValue(val);
    setEditingValueId(val.id);
    setValueModalOpen(true);
  };

  const handleDeleteValue = async (valueId: string) => {
    if (!selectedDict) return;
    await deleteVal(selectedDict.id, valueId);
    refreshValues();
  };

  const handleValueOk = async () => {
    if (!selectedDict) return;
    try {
      const vals = await valueForm.validateFields();
      if (editingValueId) {
        await updateDictionaryValue(selectedDict.id, editingValueId, vals);
        message.success('更新成功');
      } else {
        await createDictionaryValue(selectedDict.id, vals);
        message.success('创建成功');
      }
      setValueModalOpen(false);
      refreshValues();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('操作失败');
    }
  };

  const dictColumns: ColumnsType<Dictionary> = [
    { title: '编码', dataIndex: 'code', key: 'code' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '操作', key: 'action', width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditDict(record)} />
          <Popconfirm title="确认删除?" onConfirm={() => handleDeleteDict(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const valueColumns: ColumnsType<DictionaryValue> = [
    { title: '编码', dataIndex: 'code', key: 'code' },
    { title: '值', dataIndex: 'value', key: 'value' },
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 80 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (val: number) => val === 1 ? '启用' : '禁用',
    },
    {
      title: '操作', key: 'action', width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditValue(record)} />
          <Popconfirm title="确认删除?" onConfirm={() => handleDeleteValue(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div data-testid="dictionary-management" style={{ display: 'flex', gap: 16, minHeight: 500 }}>
      <div style={{ width: '40%', borderRight: '1px solid #e8e8e8', paddingRight: 16 }}>
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>字典列表</h3>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddDict}>新增</Button>
        </div>
        <Table
          dataSource={dicts ?? []}
          columns={dictColumns}
          rowKey="id"
          size="small"
          pagination={false}
          loading={loading}
          onRow={(record) => ({
            onClick: () => setSelectedDict(record),
            style: { cursor: 'pointer', background: selectedDict?.id === record.id ? '#e6f7ff' : undefined },
          })}
        />
      </div>
      <div style={{ width: '60%', paddingLeft: 16 }}>
        {selectedDict ? (
          <>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{selectedDict.name} - 字典值</h3>
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddValue}>新增字典值</Button>
            </div>
            <Table
              dataSource={values ?? []}
              columns={valueColumns}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>请先选择一个字典</div>
        )}
      </div>

      <Modal
        title={editingDictId ? '编辑字典' : '新增字典'}
        open={dictModalOpen}
        onOk={handleDictOk}
        onCancel={() => setDictModalOpen(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={dictForm} layout="vertical">
          <Form.Item name="code" label="编码" rules={[{ required: true, message: '请输入编码' }]}>
            <Input placeholder="例如: task_priority" />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入字典名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select>
              <Select.Option value={1}>启用</Select.Option>
              <Select.Option value={0}>禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingValueId ? '编辑字典值' : '新增字典值'}
        open={valueModalOpen}
        onOk={handleValueOk}
        onCancel={() => setValueModalOpen(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={valueForm} layout="vertical">
          <Form.Item name="code" label="编码" rules={[{ required: true, message: '请输入编码' }]}>
            <Input placeholder="编码" />
          </Form.Item>
          <Form.Item name="value" label="值" rules={[{ required: true, message: '请输入值' }]}>
            <Input placeholder="值" />
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
        </Form>
      </Modal>
    </div>
  );
}
