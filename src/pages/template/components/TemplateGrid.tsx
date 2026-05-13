import { Empty } from 'antd';
import TemplateCard from './TemplateCard';
import styles from '../TemplatePage.module.css';

interface Template {
  id: string;
  name: string;
  type: string;
  description: string;
  usageCount: number;
  createdAt: string;
}

interface TemplateGridProps {
  templates: Template[];
  onClick: (id: string) => void;
  onExport?: (id: string) => void;
}

export default function TemplateGrid({ templates, onClick, onExport }: TemplateGridProps) {
  if (templates.length === 0) {
    return <Empty description="暂无模板" />;
  }

  return (
    <div className={styles.grid}>
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} onClick={onClick} onExport={onExport} />
      ))}
    </div>
  );
}
