import { useState, useEffect, useMemo } from 'react';
import { Spin, Empty, Tag } from 'antd';
import { getTemplates } from '@/services/template.service';
import type { PickerProps } from './index';
import styles from '../QuickCreateBar.module.css';

interface TemplateItem {
  id: string | number;
  name: string;
  type?: string;
  description?: string;
  content?: any;
}

export default function TaskTemplatePicker({ searchQuery, onSelect, onClose }: PickerProps) {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTemplates({ type: 'task', pageSize: 100 })
      .then((res) => {
        const data = res?.data;
        const list = Array.isArray(data) ? data : data?.records ?? [];
        setTemplates(list.filter((t: TemplateItem) => t.type === 'task' || !t.type));
      })
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  const query = searchQuery.toLowerCase().trim();

  const filtered = useMemo(() => {
    if (!query) return templates;
    return templates.filter((t) => t.name.toLowerCase().includes(query));
  }, [templates, query]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 16 }} data-testid="task-template-picker">
        <Spin size="small" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div data-testid="task-template-picker">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="尚未设置我的任务模板" />
      </div>
    );
  }

  return (
    <div className={styles.pickerList} data-testid="task-template-picker">
      <div className={styles.pickerGroup}>我的任务模板</div>
      {filtered.map((tpl) => (
        <div
          key={tpl.id}
          className={styles.pickerItem}
          onClick={() => onSelect(tpl.name)}
        >
          <span>{tpl.name}</span>
          {tpl.description && (
            <span style={{ color: '#999', fontSize: 11, marginLeft: 8 }}>{tpl.description}</span>
          )}
        </div>
      ))}
    </div>
  );
}
