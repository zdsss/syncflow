import { useState, useEffect, useCallback } from 'react';
import { Button, Table, Input, InputNumber, Modal, Space, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { getStepParameters, updateStepParameters } from '@/services/process.service';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';

interface Parameter {
  name: string;
  targetValue: string;
  upperLimit: string;
  lowerLimit: string;
  unit: string;
  inspectionMethod: string;
}

interface ParameterEditorProps {
  routeId: string;
  stepId: string;
  stepName: string;
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ParameterEditor({ routeId, stepId, stepName, visible, onClose, onSaved }: ParameterEditorProps) {
  const [parameters, setParameters] = useState<Parameter[]>([]);

  const fetcher = useCallback(
    () => getStepParameters(routeId, stepId).then((res) => res.data || []),
    [routeId, stepId],
  );
  const { data, loading, refresh } = useAsyncData<Parameter[]>(fetcher, '加载参数失败');

  useEffect(() => {
    if (data) setParameters(data);
  }, [data]);

  useEffect(() => {
    if (visible && routeId && stepId) refresh();
  }, [visible, routeId, stepId, refresh]);

  const { execute: saveParameters, loading: saving } = useAsyncAction(
    async () => {
      await updateStepParameters(routeId, stepId, parameters);
    },
    { errorMessage: '参数保存失败', successMessage: '参数保存成功' },
  );

  const handleAdd = () => {
    setParameters([...parameters, { name: '', targetValue: '', upperLimit: '', lowerLimit: '', unit: '', inspectionMethod: '' }]);
  };

  const handleRemove = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof Parameter, value: string) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value };
    setParameters(updated);
  };

  const handleSave = async () => {
    await saveParameters();
    onSaved?.();
    onClose();
  };

  const columns = [
    {
      title: '参数名称', dataIndex: 'name', key: 'name',
      render: (_: any, __: any, index: number) => (
        <Input size="small" value={parameters[index]?.name} onChange={(e) => handleChange(index, 'name', e.target.value)} />
      ),
    },
    {
      title: '目标值', dataIndex: 'targetValue', key: 'targetValue',
      render: (_: any, __: any, index: number) => (
        <Input size="small" value={parameters[index]?.targetValue} onChange={(e) => handleChange(index, 'targetValue', e.target.value)} />
      ),
    },
    {
      title: '上限', dataIndex: 'upperLimit', key: 'upperLimit',
      render: (_: any, __: any, index: number) => (
        <Input size="small" value={parameters[index]?.upperLimit} onChange={(e) => handleChange(index, 'upperLimit', e.target.value)} />
      ),
    },
    {
      title: '下限', dataIndex: 'lowerLimit', key: 'lowerLimit',
      render: (_: any, __: any, index: number) => (
        <Input size="small" value={parameters[index]?.lowerLimit} onChange={(e) => handleChange(index, 'lowerLimit', e.target.value)} />
      ),
    },
    {
      title: '单位', dataIndex: 'unit', key: 'unit',
      render: (_: any, __: any, index: number) => (
        <Input size="small" value={parameters[index]?.unit} onChange={(e) => handleChange(index, 'unit', e.target.value)} style={{ width: 60 }} />
      ),
    },
    {
      title: '检测方式', dataIndex: 'inspectionMethod', key: 'inspectionMethod',
      render: (_: any, __: any, index: number) => (
        <Input size="small" value={parameters[index]?.inspectionMethod} onChange={(e) => handleChange(index, 'inspectionMethod', e.target.value)} />
      ),
    },
    {
      title: '', key: 'action', width: 40,
      render: (_: any, __: any, index: number) => (
        <Popconfirm title="确认删除？" onConfirm={() => handleRemove(index)}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      title={`工艺参数 - ${stepName}`}
      open={visible}
      onCancel={onClose}
      width="90vw"
      style={{ maxWidth: 900 }}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button icon={<PlusOutlined />} onClick={handleAdd}>添加参数</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>保存</Button>
        </Space>
      }
    >
      <Table
        dataSource={parameters}
        columns={columns}
        rowKey={(_, i) => String(i)}
        loading={loading}
        size="small"
        pagination={false}
        locale={{ emptyText: '暂无参数，点击"添加参数"开始' }}
      />
    </Modal>
  );
}
