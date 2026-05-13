import { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Select } from 'antd';
import type { FormInstance } from 'antd';
import { getUsers } from '@/services/config.service';

interface ProjectFormModalProps {
  mode: 'create' | 'edit';
  open: boolean;
  form: FormInstance;
  onOk: () => void;
  onCancel: () => void;
}

export default function ProjectFormModal({ mode, open, form, onOk, onCancel }: ProjectFormModalProps) {
  const isCreate = mode === 'create';
  const [users, setUsers] = useState<Array<{ id: number; realName: string }>>([]);

  useEffect(() => {
    if (open) {
      getUsers({ pageSize: 200 }).then((res: any) => {
        const list = Array.isArray(res?.data) ? res.data : res?.data?.records ?? [];
        setUsers(list);
      }).catch(() => {});
    }
  }, [open]);

  return (
    <Modal
      title={isCreate ? '新建项目' : '编辑项目'}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText={isCreate ? '创建' : '保存'}
      cancelText="取消"
      data-testid={isCreate ? 'create-project-modal' : 'edit-project-modal'}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="code" label="项目编号" rules={[{ required: true, message: '请输入项目编号' }]}>
          <Input placeholder="如 PRJ-2026-001" />
        </Form.Item>
        <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
          <Input placeholder="请输入项目名称" />
        </Form.Item>
        <Form.Item name="description" label="项目描述">
          <Input.TextArea rows={3} placeholder="请输入项目描述" />
        </Form.Item>
        <Form.Item name="ownerId" label="负责人">
          <Select placeholder="请选择负责人" allowClear showSearch optionFilterProp="children">
            {users.map((u) => (
              <Select.Option key={u.id} value={u.id}>
                {u.realName}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="dateRange" label="计划起止日期">
          <DatePicker.RangePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
