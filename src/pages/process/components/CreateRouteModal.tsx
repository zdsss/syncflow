import { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { getBomsByProject } from '@/services/bom.service';
import { useProjectStore } from '@/stores/useProjectStore';

interface BomOption {
  id: number;
  name: string;
  productCode?: string;
  productName?: string;
}

interface CreateRouteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; bomId: number; projectId: number; productCode: string; productName: string }) => void;
}

export default function CreateRouteModal({ open, onClose, onSubmit }: CreateRouteModalProps) {
  const [form] = Form.useForm();
  const [boms, setBoms] = useState<BomOption[]>([]);
  const [loading, setLoading] = useState(false);
  const projectId = useProjectStore((s) => s.selectedProject?.id) || '';

  const fetchBoms = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await getBomsByProject(projectId);
      setBoms((res as any).data || []);
    } catch {
      // ignore
    }
  }, [projectId]);

  useEffect(() => {
    if (open) {
      fetchBoms();
      form.resetFields();
    }
  }, [open, fetchBoms, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const selectedBom = boms.find((b) => b.id === values.bomId);
      onSubmit({
        name: values.name,
        bomId: values.bomId || 0,
        projectId: Number(projectId) || 0,
        productCode: selectedBom?.productCode || '',
        productName: selectedBom?.productName || '',
      });
      onClose();
    } catch {
      // validation error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="新增工艺路线"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      okText="创建"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label="路线名称"
          rules={[{ required: true, message: '请输入路线名称' }]}
        >
          <Input placeholder="例如：主板SMT工艺路线" />
        </Form.Item>
        <Form.Item
          name="bomId"
          label="关联BOM"
        >
          <Select
            placeholder="选择关联的BOM（可选）"
            allowClear
            options={boms.map((b) => ({
              value: b.id,
              label: `${b.name}${b.productCode ? ` (${b.productCode})` : ''}`,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
