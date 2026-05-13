import { useEffect, useCallback } from 'react';
import { Drawer, Tag, Button, Space, Timeline, Popconfirm, Spin } from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  RocketOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { previewTemplate, duplicateTemplate, deleteTemplate } from '@/services/template.service';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';

interface Template {
  id: string;
  name: string;
  type: string;
  description: string;
  usageCount: number;
  createdAt: string;
}

interface PreviewTask {
  name: string;
  priority: string;
}

interface PreviewPhase {
  name: string;
  tasks: PreviewTask[];
}

interface TemplateDetailProps {
  template: Template | null;
  open: boolean;
  onClose: () => void;
  onApply: (id: string) => void;
}

export default function TemplateDetail({ template, open, onClose, onApply }: TemplateDetailProps) {
  const fetcher = useCallback(async () => {
    if (!template) return [];
    const res: any = await previewTemplate(template.id);
    if (res.code === 0 && res.data?.phases) {
      return res.data.phases as PreviewPhase[];
    }
    return [];
  }, [template]);

  const { data: phases, loading, refresh, setData: setPhases } = useAsyncData<PreviewPhase[]>(fetcher, '加载模板预览失败');

  useEffect(() => {
    if (open && template) {
      refresh();
    } else {
      setPhases([]);
    }
  }, [open, template, refresh, setPhases]);

  const handleDuplicate = async () => {
    if (!template) return;
    await duplicateTemplate(template.id);
  };

  const handleDelete = async () => {
    if (!template) return;
    await deleteTemplate(template.id);
    onClose();
  };

  const { execute: execDuplicate, loading: duplicating } = useAsyncAction(handleDuplicate, { errorMessage: '模板复制失败', successMessage: '模板复制成功' });
  const { execute: execDelete } = useAsyncAction(handleDelete, { errorMessage: '模板删除失败', successMessage: '模板删除成功' });

  if (!template) return null;

  const phaseList = phases ?? [];

  const typeLabel = template.type === 'project' ? '项目模板' : '任务模板';
  const typeColor = template.type === 'project' ? 'blue' : 'green';

  return (
    <Drawer
      title="模板详情"
      open={open}
      onClose={onClose}
      size={520}
      placement="right"
    >
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>
          {template.name}
        </h2>
        <Space size={12}>
          <Tag color={typeColor}>{typeLabel}</Tag>
          <span style={{ color: '#999', fontSize: 13 }}>使用 {template.usageCount} 次</span>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ color: '#666', fontSize: 14 }}>
          {template.description || '暂无描述'}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>模板内容预览</h3>
        {loading ? (
          <Spin />
        ) : phaseList.length > 0 ? (
          <Timeline
            items={phaseList.map((phase) => ({
              children: (
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>{phase.name}</div>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {(phase.tasks ?? []).map((task, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>
                        {task.name}
                        <Tag
                          color={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'orange' : 'default'}
                          style={{ marginLeft: 8 }}
                        >
                          {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                        </Tag>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            }))}
          />
        ) : (
          <div style={{ color: '#999' }}>暂无预览内容</div>
        )}
      </div>

      <Space style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Button type="primary" icon={<RocketOutlined />} onClick={() => onApply(template.id)}>
          应用模板
        </Button>
        <Button icon={<CopyOutlined />} loading={duplicating} onClick={() => execDuplicate()}>
          复制模板
        </Button>
        <Button icon={<EditOutlined />} disabled title="编辑功能开发中">
          编辑
        </Button>
        <Popconfirm
          title="确定删除该模板吗？"
          onConfirm={() => execDelete()}
          okText="确定"
          cancelText="取消"
        >
          <Button danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      </Space>
    </Drawer>
  );
}
