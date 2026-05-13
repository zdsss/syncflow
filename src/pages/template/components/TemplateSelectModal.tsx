import { useState, useMemo } from 'react';
import { Modal, Button, Empty } from 'antd';
import { FileTextOutlined, FolderOutlined, RightOutlined } from '@ant-design/icons';
import styles from './TemplateSelectModal.module.css';

interface Template {
  id: string;
  name: string;
  type: string;
  description: string;
  usageCount: number;
  createdAt: string;
  tasks?: { id: string; name: string; children?: { id: string; name: string }[] }[];
}

interface TemplateSelectModalProps {
  templates: Template[];
  open: boolean;
  onClose: () => void;
  onApply: (templateId: string) => void;
}

export default function TemplateSelectModal({ templates, open, onClose, onApply }: TemplateSelectModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedId) || null,
    [templates, selectedId]
  );

  const handleApply = () => {
    if (selectedId) {
      onApply(selectedId);
    }
  };

  return (
    <Modal
      title="选择模板"
      open={open}
      onCancel={onClose}
      width={800}
      footer={
        <div className={styles.footer}>
          <span className={styles.footerHint}>
            {selectedTemplate ? `已选择: ${selectedTemplate.name}` : '请选择一个模板'}
          </span>
          <Button type="primary" disabled={!selectedId} onClick={handleApply}>
            应用模板
          </Button>
        </div>
      }
      className={styles.modal}
      data-testid="template-select-modal"
    >
      <div className={styles.splitLayout}>
        {/* Left: Template card grid */}
        <div className={styles.leftPanel}>
          <div className={styles.grid}>
            {templates.map((template) => (
              <div
                key={template.id}
                className={`${styles.card} ${selectedId === template.id ? styles.cardSelected : ''}`}
                onClick={() => setSelectedId(template.id)}
                data-testid={`template-card-${template.id}`}
              >
                <div className={styles.cardIcon}>
                  <FileTextOutlined />
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.cardName}>{template.name}</div>
                  <div className={styles.cardDesc}>
                    {template.description || '暂无描述'}
                  </div>
                  <div className={styles.cardMeta}>
                    <span>{template.type === 'project' ? '项目' : '任务'}</span>
                    <span>使用 {template.usageCount} 次</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {templates.length === 0 && <Empty description="暂无模板" style={{ padding: 40 }} />}
        </div>

        {/* Right: Hierarchical tree preview */}
        <div className={styles.rightPanel}>
          <div className={styles.previewTitle}>
            <FolderOutlined style={{ marginRight: 6 }} />
            模板结构预览
          </div>
          <div className={styles.treeContainer}>
            {selectedTemplate ? (
              <div className={styles.tree}>
                <div className={styles.treeRoot}>
                  <FolderOutlined className={styles.treeIcon} />
                  <span>{selectedTemplate.name}</span>
                </div>
                {selectedTemplate.tasks && selectedTemplate.tasks.length > 0 ? (
                  selectedTemplate.tasks.map((task) => (
                    <div key={task.id}>
                      <div className={styles.treeItem}>
                        <RightOutlined className={styles.treeArrow} />
                        <span className={styles.treeNode}>{task.name}</span>
                      </div>
                      {task.children && task.children.map((child) => (
                        <div key={child.id} className={styles.treeChild}>
                          <span className={styles.treeNode}>{child.name}</span>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className={styles.treeEmpty}>无子任务</div>
                )}
              </div>
            ) : (
              <div className={styles.treePlaceholder}>
                选择左侧模板查看结构预览
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
