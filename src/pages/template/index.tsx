import { useState, useEffect } from 'react';
import { Input, Button, Select } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import TemplateGrid from './components/TemplateGrid';
import styles from './TemplatePage.module.css';

const { Option } = Select;

interface Template {
  id: string;
  name: string;
  type: string;
  description: string;
  usageCount: number;
  createdAt: string;
}

export default function TemplatePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, [typeFilter]);

  const fetchTemplates = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);

      const res = await fetch(`/api/templates?${params}`);
      const data = await res.json();
      if (data.code === 0) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleTemplateClick = (id: string) => {
    console.log('Template clicked:', id);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>模板定义</h1>
        <div className={styles.headerActions}>
          <Select
            placeholder="筛选类型"
            allowClear
            style={{ width: 120 }}
            onChange={(value) => setTypeFilter(value)}
          >
            <Option value="project">项目模板</Option>
            <Option value="task">任务模板</Option>
          </Select>
          <Input
            placeholder="搜索模板..."
            prefix={<SearchOutlined />}
            className={styles.searchInput}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />}>
            新建模板
          </Button>
        </div>
      </div>

      <TemplateGrid templates={templates} onClick={handleTemplateClick} />
    </div>
  );
}
