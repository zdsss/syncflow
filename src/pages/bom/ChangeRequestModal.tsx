import { useState, useCallback, useEffect } from 'react';
import { Modal, Select, Input, InputNumber, Button, Space, Form, message } from 'antd';
import { useAsyncAction } from '@/hooks/useAsyncData';
import { createChangeRequest } from '@/services/bom.service';

const { TextArea } = Input;

const CHANGE_TYPES = [
  { value: 'ADD_ITEM', label: '新增物料' },
  { value: 'UPDATE_ITEM', label: '修改物料' },
  { value: 'DELETE_ITEM', label: '删除物料' },
];

const SOURCE_TYPES = [
  { value: 'MADE', label: '自制' },
  { value: 'PURCHASED', label: '外购' },
  { value: 'SUBCONTRACT', label: '外协' },
];

interface BomItem {
  id: number;
  name: string;
  materialCode?: string;
  specification?: string;
  sourceType?: string;
  quantity: number;
  unitOfMeasure?: string;
}

interface ChangeRequestModalProps {
  bomId: number | null;
  items?: BomItem[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangeRequestModal({ bomId, items = [], open, onClose, onSuccess }: ChangeRequestModalProps) {
  const [changeType, setChangeType] = useState<string | undefined>(undefined);
  const [selectedItemId, setSelectedItemId] = useState<number | undefined>(undefined);
  const [name, setName] = useState('');
  const [sourceType, setSourceType] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState<number>(1);
  const [specification, setSpecification] = useState('');
  const [materialCode, setMaterialCode] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('');
  const [description, setDescription] = useState('');

  // Pre-fill fields when selecting an item for UPDATE
  useEffect(() => {
    if (changeType === 'UPDATE_ITEM' && selectedItemId) {
      const item = items.find((i) => i.id === selectedItemId);
      if (item) {
        setName(item.name);
        setSourceType(item.sourceType);
        setQuantity(item.quantity);
        setSpecification(item.specification || '');
        setMaterialCode(item.materialCode || '');
        setUnitOfMeasure(item.unitOfMeasure || '');
      }
    }
  }, [changeType, selectedItemId, items]);

  const resetForm = () => {
    setChangeType(undefined);
    setSelectedItemId(undefined);
    setName('');
    setSourceType(undefined);
    setQuantity(1);
    setSpecification('');
    setMaterialCode('');
    setUnitOfMeasure('');
    setDescription('');
  };

  const { execute: submit, loading } = useAsyncAction(
    useCallback(async () => {
      if (!bomId) throw new Error('未选择BOM');
      if (!changeType) throw new Error('未知变更类型');
      if (changeType === 'DELETE_ITEM' && !selectedItemId) {
        throw new Error('请选择要操作的物料');
      }
      await createChangeRequest(bomId, {
        changeType,
        itemId: selectedItemId,
        name: name || undefined,
        sourceType: sourceType || undefined,
        quantity,
        specification: specification || undefined,
        materialCode: materialCode || undefined,
        unitOfMeasure: unitOfMeasure || undefined,
        description: description || undefined,
      });
    }, [bomId, changeType, selectedItemId, name, sourceType, quantity, specification, materialCode, unitOfMeasure, description]),
    { errorMessage: '提交失败', successMessage: '变更申请已提交，等待审批' },
  );

  const handleConfirm = async () => {
    if (!bomId) {
      message.warning('请先选择BOM');
      return;
    }
    if (!changeType) {
      message.warning('请选择变更类型');
      return;
    }
    if (!description.trim()) {
      message.warning('请输入变更说明');
      return;
    }
    if (changeType === 'ADD_ITEM' && !name.trim()) {
      message.warning('请输入物料名称');
      return;
    }
    if (changeType === 'DELETE_ITEM' && !selectedItemId) {
      message.warning('请选择要操作的物料');
      return;
    }
    await submit();
    resetForm();
    onSuccess();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      title="变更申请"
      open={open}
      onCancel={handleCancel}
      footer={
        <Space>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" loading={loading} onClick={handleConfirm} disabled={!bomId}>
            提交审批
          </Button>
        </Space>
      }
    >
      <Form layout="vertical">
        <Form.Item label="变更类型" required>
          <Select
            placeholder="请选择变更类型"
            value={changeType}
            onChange={(v) => { setChangeType(v); setSelectedItemId(undefined); }}
            options={CHANGE_TYPES}
          />
        </Form.Item>

        {(changeType === 'UPDATE_ITEM' || changeType === 'DELETE_ITEM') && (
          <Form.Item label="选择物料" required>
            <Select
              placeholder="请选择要操作的物料"
              value={selectedItemId}
              onChange={setSelectedItemId}
              showSearch
              optionFilterProp="label"
              options={items.map((item) => ({
                value: item.id,
                label: `${item.name}${item.materialCode ? ` (${item.materialCode})` : ''}`,
              }))}
            />
          </Form.Item>
        )}

        {changeType === 'DELETE_ITEM' && selectedItemId && (
          <div style={{ color: '#ff4d4f', marginBottom: 16 }}>
            确认删除物料「{items.find((i) => i.id === selectedItemId)?.name}」？
          </div>
        )}

        {(changeType === 'ADD_ITEM' || changeType === 'UPDATE_ITEM') && (
          <>
            <Form.Item label="物料名称" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入物料名称" />
            </Form.Item>
            <Space style={{ display: 'flex', marginBottom: 16 }} align="start">
              <Form.Item label="物料编码">
                <Input value={materialCode} onChange={(e) => setMaterialCode(e.target.value)} placeholder="可选" />
              </Form.Item>
              <Form.Item label="来源类型">
                <Select value={sourceType} onChange={setSourceType} options={SOURCE_TYPES} style={{ width: 120 }} allowClear placeholder="可选" />
              </Form.Item>
              <Form.Item label="用量">
                <InputNumber value={quantity} onChange={(v) => setQuantity(v ?? 1)} min={0} step={1} />
              </Form.Item>
            </Space>
            <Form.Item label="规格说明">
              <Input value={specification} onChange={(e) => setSpecification(e.target.value)} placeholder="可选" />
            </Form.Item>
            <Form.Item label="单位">
              <Input value={unitOfMeasure} onChange={(e) => setUnitOfMeasure(e.target.value)} placeholder="可选" />
            </Form.Item>
          </>
        )}

        <Form.Item label="变更说明">
          <TextArea
            rows={3}
            placeholder="请详细描述变更内容，例如：将M4螺丝改为M5"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
