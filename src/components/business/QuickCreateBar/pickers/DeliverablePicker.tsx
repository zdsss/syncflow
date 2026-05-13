import { useState, useMemo } from 'react';
import { Tag } from 'antd';
import type { PickerProps } from './index';
import styles from '../QuickCreateBar.module.css';

const DELIVERABLE_TEMPLATES = [
  { id: 'dt1', name: '设计图纸', category: '设计', description: '产品设计CAD图纸' },
  { id: 'dt2', name: '测试报告', category: '测试', description: '测试结果报告模板' },
  { id: 'dt3', name: '需求文档', category: '产品', description: '产品需求规格说明' },
  { id: 'dt4', name: '评审记录', category: '管理', description: '技术评审会议记录' },
  { id: 'dt5', name: '验收报告', category: '质量', description: '项目验收报告模板' },
  { id: 'dt6', name: 'BOM清单', category: '制造', description: '物料清单模板' },
  { id: 'dt7', name: '工艺文件', category: '制造', description: '生产工艺流程文档' },
  { id: 'dt8', name: '变更申请', category: '管理', description: '工程变更申请单' },
];

const CATEGORY_COLORS: Record<string, string> = {
  '设计': 'blue', '测试': 'green', '产品': 'orange',
  '管理': 'purple', '质量': 'cyan', '制造': 'geekblue',
};

export default function DeliverablePicker({ searchQuery, onSelect, onClose }: PickerProps) {
  const query = searchQuery.toLowerCase().trim();

  const filtered = useMemo(() => {
    if (!query) return DELIVERABLE_TEMPLATES;
    return DELIVERABLE_TEMPLATES.filter(
      (t) => t.name.toLowerCase().includes(query) || t.category.toLowerCase().includes(query)
    );
  }, [query]);

  if (filtered.length === 0) {
    return (
      <div data-testid="deliverable-picker" style={{ padding: 16, textAlign: 'center', color: '#999' }}>
        暂无匹配的交付物模板
      </div>
    );
  }

  return (
    <div className={styles.pickerList} data-testid="deliverable-picker">
      <div className={styles.pickerGroup}>交付物模板</div>
      {filtered.map((tpl) => (
        <div
          key={tpl.id}
          className={styles.pickerItem}
          onClick={() => onSelect(tpl.name)}
        >
          <span>{tpl.name}</span>
          <Tag color={CATEGORY_COLORS[tpl.category] || 'default'} style={{ marginLeft: 'auto', fontSize: 11 }}>
            {tpl.category}
          </Tag>
        </div>
      ))}
    </div>
  );
}
