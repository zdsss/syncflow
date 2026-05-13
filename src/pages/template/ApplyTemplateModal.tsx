import { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, DatePicker, Select, message } from 'antd';
import { applyTemplate } from '@/services/template.service';
import { getUsers } from '@/services/config.service';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

interface UserOption {
  id: number;
  name: string;
  username?: string;
}

interface ApplyTemplateModalProps {
  templateId: string | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ApplyTemplateModal({ templateId, open, onClose, onSuccess }: ApplyTemplateModalProps) {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getUsers({ pageSize: 100 });
      const data = (res as any)?.data?.records || (res as any)?.data || [];
      setUsers(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchUsers();
      form.resetFields();
    }
  }, [open, fetchUsers, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const submitData = {
        name: values.name,
        leaderId: String(values.leaderId),
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : undefined,
      };
      const res = await applyTemplate(templateId!, submitData);
      const projectId = (res as any)?.data?.projectId || (res as any)?.projectId;
      message.success('项目创建成功');
      form.resetFields();
      onClose();
      onSuccess?.();
      if (projectId) {
        navigate(`/project/${projectId}`);
      }
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('项目创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="应用模板创建项目"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="创建项目"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false} style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label="项目名称"
          rules={[{ required: true, message: '请输入项目名称' }]}
        >
          <Input placeholder="请输入项目名称" />
        </Form.Item>
        <Form.Item
          name="leaderId"
          label="项目负责人"
          rules={[{ required: true, message: '请选择负责人' }]}
        >
          <Select
            placeholder="选择项目负责人"
            showSearch
            optionFilterProp="label"
            options={users.map((u) => ({
              value: u.id,
              label: u.name || u.username || `用户${u.id}`,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="startDate"
          label="开始日期"
        >
          <DatePicker style={{ width: '100%' }} placeholder="请选择开始日期" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
