import { useState, useEffect, useRef, useCallback } from 'react';
import { Input, Button, Select } from 'antd';
import { SearchOutlined, PlusOutlined, ImportOutlined } from '@ant-design/icons';
import { getTemplates, exportTemplate, importTemplate } from '@/services/template.service';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import TemplateGrid from './components/TemplateGrid';
import TemplateDetail from './TemplateDetail';
import ApplyTemplateModal from './ApplyTemplateModal';
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
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [applyTemplateId, setApplyTemplateId] = useState<string | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetcher = useCallback(async () => {
    const params: Record<string, string> = {};
    if (typeFilter) params.type = typeFilter;
    const data: any = await getTemplates(params);
    if (data.code === 0) return data.data as Template[];
    return [];
  }, [typeFilter]);

  const { data: templates, refresh } = useAsyncData<Template[]>(fetcher, '加载模板失败');

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleTemplateClick = (id: string) => {
    setSelectedTemplateId(id);
    setDetailOpen(true);
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    setSelectedTemplateId(null);
    refresh();
  };

  const handleApply = (id: string) => {
    setApplyTemplateId(id);
    setApplyModalOpen(true);
  };

  const handleApplySuccess = () => {
    setApplyModalOpen(false);
    setApplyTemplateId(null);
    setDetailOpen(false);
    setSelectedTemplateId(null);
    refresh();
  };

  const handleExport = async (id: string) => {
    const data: any = await exportTemplate(id);
    if (data.code === 0) {
      const json = JSON.stringify(data.data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result: any = await importTemplate(data);
      if (result.code === 0) {
        refresh();
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const { execute: execExport } = useAsyncAction(handleExport, { errorMessage: '模板导出失败', successMessage: '模板导出成功' });
  const { execute: execImport } = useAsyncAction(handleImport, { errorMessage: '模板导入失败，请检查文件格式' });

  const templateList = templates ?? [];
  const selectedTemplate = templateList.find((t) => t.id === selectedTemplateId) ?? null;

  const filteredTemplates = keyword.trim()
    ? templateList.filter((t) =>
        t.name.toLowerCase().includes(keyword.toLowerCase()) ||
        t.description?.toLowerCase().includes(keyword.toLowerCase())
      )
    : templateList;

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
          <Button icon={<ImportOutlined />} onClick={() => fileInputRef.current?.click()}>
            导入
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={execImport}
            data-testid="import-file-input"
          />
        </div>
      </div>

      <TemplateGrid templates={filteredTemplates} onClick={handleTemplateClick} onExport={execExport} />

      <TemplateDetail
        template={selectedTemplate}
        open={detailOpen}
        onClose={handleDetailClose}
        onApply={handleApply}
      />

      <ApplyTemplateModal
        templateId={applyTemplateId}
        open={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        onSuccess={handleApplySuccess}
      />
    </div>
  );
}
