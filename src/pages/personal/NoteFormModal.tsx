import { useEffect } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { createNote, updateNote } from '@/services/personal.service';

const { TextArea } = Input;

interface NoteFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  note?: { id: string; title: string; content: string; category?: string } | null;
  userId?: string;
}

const CATEGORIES = ['工作', '学习', '会议', '其他'];

export default function NoteFormModal({ open, onClose, onSuccess, note, userId }: NoteFormModalProps) {
  const [form] = Form.useForm();
  const isEdit = !!note;

  useEffect(() => {
    if (open) {
      if (note) {
        form.setFieldsValue({ title: note.title, content: note.content, category: note.category });
      } else {
        form.resetFields();
      }
    }
  }, [open, note, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit && note) {
        await updateNote(note.id, {
          title: values.title,
          content: values.content,
          category: values.category,
        });
        message.success('笔记更新成功');
      } else {
        await createNote({
          userId: userId || '',
          title: values.title,
          content: values.content,
          category: values.category,
        });
        message.success('笔记创建成功');
      }
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      if (error?.errorFields) return; // validation error, don't show message
      message.error('操作失败');
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑笔记' : '新建笔记'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEdit ? '保存' : '创建'}
      cancelText="取消"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="请输入笔记标题" />
        </Form.Item>
        <Form.Item label="分类" name="category">
          <Select
            placeholder="请选择分类"
            allowClear
            options={CATEGORIES.map((c) => ({ label: c, value: c }))}
          />
        </Form.Item>
        <Form.Item label="内容" name="content" rules={[{ required: true, message: '请输入内容' }]}>
          <TextArea rows={4} placeholder="请输入笔记内容" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
