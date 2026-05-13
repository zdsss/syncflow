import { useState, useEffect, useMemo } from 'react';
import { Spin, Empty, Tag } from 'antd';
import { getTemplates } from '@/services/template.service';
import type { PickerProps } from './index';
import styles from '../QuickCreateBar.module.css';

interface TemplateItem {
  id: number | string;
  name: string;
  type?: string;
  description?: string;
  [key: string]: any;
}

const TYPE_LABEL: Record<string, string> = {
  task: '任务模板',
  project: '项目模板',
  workflow: '工作流',
};

const TYPE_COLOR: Record<string, string> = {
  task: 'blue',
  project: 'green',
  workflow: 'purple',
};

export default function TemplatePicker({ searchQuery, onSelect }: PickerProps) {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTemplates()
      .then((res) => {
        const data = res?.data;
        const list = Array.isArray(data) ? data : data?.records ?? [];
        // Filter to workflow templates only (type=workflow or name contains 工作流/流程)
        const workflowTemplates = list.filter((t: TemplateItem) =>
          t.type === 'workflow' ||
          t.name?.includes('工作流') ||
          t.name?.includes('流程')
        );
        // If no workflow-specific templates found, show all templates
        setTemplates(workflowTemplates.length > 0 ? workflowTemplates : list);
      })
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  const query = searchQuery.toLowerCase().trim();

  const filtered = useMemo(() => {
    if (!query) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
    );
  }, [templates, query]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 16 }} data-testid="template-picker">
        <Spin size="small" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div data-testid="template-picker">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无工作流模板" />
      </div>
    );
  }

  return (
    <div className={styles.pickerList} data-testid="template-picker">
      <div className={styles.pickerGroup}>工作流模板</div>
      {filtered.map((tpl) => (
        <div
          key={tpl.id}
          className={styles.pickerItem}
          onClick={() => onSelect(tpl.name)}
        >
          <span style={{ flex: 1 }}>{tpl.name}</span>
          {tpl.type && (
            <Tag color={TYPE_COLOR[tpl.type] ?? 'default'} style={{ marginRight: 0, fontSize: 11 }}>
              {TYPE_LABEL[tpl.type] ?? tpl.type}
            </Tag>
          )}
          {tpl.description && (
            <span style={{ color: '#999', fontSize: 11, marginLeft: 4 }}>{tpl.description}</span>
          )}
        </div>
      ))}
    </div>
  );
}
