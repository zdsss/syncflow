import { Card, Button } from 'antd';
import { FileTextOutlined, ExportOutlined } from '@ant-design/icons';
import styles from '../TemplatePage.module.css';

interface Template {
  id: string;
  name: string;
  type: string;
  description: string;
  usageCount: number;
  createdAt: string;
}

interface TemplateCardProps {
  template: Template;
  onClick: (id: string) => void;
  onExport?: (id: string) => void;
}

export default function TemplateCard({ template, onClick, onExport }: TemplateCardProps) {
  const handleExportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExport?.(template.id);
  };

  return (
    <Card
      className={styles.card}
      hoverable
      onClick={() => onClick(template.id)}
    >
      <div className={styles.cardTitle}>
        <FileTextOutlined style={{ marginRight: 8 }} />
        {template.name}
      </div>
      <div className={styles.cardDescription}>
        {template.description || '暂无描述'}
      </div>
      <div className={styles.cardMeta}>
        <span>类型: {template.type === 'project' ? '项目' : '任务'}</span>
        <span>使用 {template.usageCount} 次</span>
        {onExport && (
          <Button
            type="link"
            size="small"
            icon={<ExportOutlined />}
            onClick={handleExportClick}
            data-testid="export-btn"
          >
            导出
          </Button>
        )}
      </div>
    </Card>
  );
}
