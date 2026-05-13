import { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber } from 'antd';
import type { Task, TaskType } from '@/types';
import { TaskPriority, TaskStatus } from '@/types';
import { createTask, getTaskById, updateTask } from '@/services/task.service';
import { getProjects } from '@/services/project.service';
import { getUsers } from '@/services/config.service';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAsyncAction } from '@/hooks/useAsyncData';
import type { Project } from '@/types';
import dayjs from 'dayjs';

interface TaskFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskId?: number;
  projectId?: number;
}

const typeOptions: { value: TaskType; label: string }[] = [
  { value: 'TASK', label: '任务' },
  { value: 'MILESTONE', label: '里程碑' },
  { value: 'ISSUE', label: '问题' },
  { value: 'RISK', label: '风险' },
  { value: 'SUGGESTION', label: '建议' },
  { value: 'CHANGE', label: '变更' },
  { value: 'ACTIVITY', label: '活动' },
];

const priorityOptions = [
  { value: TaskPriority.URGENT, label: '紧急' },
  { value: TaskPriority.HIGH, label: '高' },
  { value: TaskPriority.MEDIUM, label: '中' },
  { value: TaskPriority.LOW, label: '低' },
];

const statusOptions = [
  { value: TaskStatus.PENDING, label: '未开始' },
  { value: TaskStatus.IN_PROGRESS, label: '进行中' },
  { value: TaskStatus.ON_HOLD, label: '暂停' },
];

export default function TaskForm({ visible, onClose, onSuccess, taskId, projectId }: TaskFormProps) {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<Array<{ id: number; realName: string }>>([]);
  const isEdit = !!taskId;

  const projectsFetcher = useCallback(async () => {
    const res = await getProjects();
    return (res?.data || []) as Project[];
  }, []);

  const { data: projectsData } = useAsyncData(projectsFetcher, '加载项目列表失败');
  const projects = projectsData || [];

  useEffect(() => {
    if (visible) {
      projectsFetcher();
      getUsers({ pageSize: 200 }).then((res: any) => {
        const list = Array.isArray(res?.data) ? res.data : res?.data?.records ?? [];
        setUsers(list);
      }).catch(() => {});
    }
  }, [visible, projectsFetcher]);

  const taskFetcher = useCallback(async () => {
    if (!taskId) return null;
    const res = await getTaskById(taskId);
    return res?.data || null;
  }, [taskId]);

  const { data: taskData, refresh: fetchTask } = useAsyncData(taskFetcher, '加载任务失败');

  useEffect(() => {
    if (visible && taskId) {
      fetchTask();
    }
  }, [visible, taskId, fetchTask]);

  useEffect(() => {
    if (taskData) {
      form.setFieldsValue({
        ...taskData,
        planStart: taskData.plannedStart ? dayjs(taskData.plannedStart) : undefined,
        planEnd: taskData.plannedEnd ? dayjs(taskData.plannedEnd) : undefined,
      });
    }
  }, [taskData, form]);

  useEffect(() => {
    if (visible && projectId && !taskId) {
      form.setFieldValue('projectId', projectId);
    }
  }, [visible, projectId, taskId, form]);

  const doSubmit = useCallback(async (values: any) => {
    const payload: Partial<Task> = {
      title: values.name || values.title,
      description: values.description,
      projectId: values.projectId,
      assigneeId: values.assigneeId,
      priority: values.priority,
      type: values.type || 'TASK',
      plannedStart: values.planStart ? values.planStart.format('YYYY-MM-DD') : (values.plannedStart || undefined),
      plannedEnd: values.planEnd ? values.planEnd.format('YYYY-MM-DD') : (values.plannedEnd || undefined),
      plannedHours: values.plannedHours,
    };
    if (isEdit) {
      await updateTask(taskId!, payload);
    } else {
      await createTask(payload);
    }
    onSuccess();
    onClose();
  }, [isEdit, taskId, onSuccess, onClose]);

  const { execute: handleSubmit, loading } = useAsyncAction<[any], void>(doSubmit, {
    errorMessage: isEdit ? '更新失败' : '创建失败',
    successMessage: isEdit ? '更新成功' : '创建成功',
  });

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      handleSubmit(values);
    } catch (err: any) {
      if (err?.errorFields) return;
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑任务' : '新建任务'}
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      destroyOnHidden
      width={640}
    >
      <Form form={form} layout="vertical" initialValues={{ priority: TaskPriority.MEDIUM, type: 'TASK', status: TaskStatus.PENDING }}>
        <Form.Item
          name="name"
          label="任务名称"
          rules={[{ required: true, message: '请输入任务名称' }]}
        >
          <Input placeholder="请输入任务名称" />
        </Form.Item>

        <Form.Item name="type" label="类型">
          <Select placeholder="请选择类型">
            {typeOptions.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="projectId" label="所属项目">
          <Select placeholder="请选择所属项目" allowClear showSearch optionFilterProp="children">
            {projects.map((p) => (
              <Select.Option key={p.id} value={p.id}>
                {p.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="assigneeId" label="负责人">
          <Select placeholder="请选择负责人" allowClear showSearch optionFilterProp="children">
            {users.map((u) => (
              <Select.Option key={u.id} value={u.id}>
                {u.realName}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="priority" label="优先级">
          <Select placeholder="请选择优先级">
            {priorityOptions.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="status" label="状态">
          <Select placeholder="请选择状态">
            {statusOptions.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="planStart" label="计划开始">
          <DatePicker style={{ width: '100%' }} placeholder="选择开始日期" />
        </Form.Item>

        <Form.Item name="planEnd" label="计划结束">
          <DatePicker style={{ width: '100%' }} placeholder="选择结束日期" />
        </Form.Item>

        <Form.Item name="plannedHours" label="计划工时">
          <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入计划工时" />
        </Form.Item>

        <Form.Item name="description" label="描述">
          <Input.TextArea rows={3} placeholder="请输入任务描述" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
