import { useMemo, useState } from 'react';
import { Select } from 'antd';
import { ShrinkOutlined, ArrowsAltOutlined, CloseOutlined } from '@ant-design/icons';
import type { Task } from '@/types';
import { TaskStatus } from '@/types';
import { TASK_STATUS_CONFIG } from '@/constants/enums';
import styles from './AiPanel.module.css';

interface AiPanelProps {
  tasks: Task[];
  isWide: boolean;
  onToggleWidth: () => void;
  onClose: () => void;
  onMetricClick: (status: TaskStatus) => void;
}

export default function AiPanel({ tasks, isWide, onToggleWidth, onClose, onMetricClick }: AiPanelProps) {
  const [selectedProject, setSelectedProject] = useState<string>('default');

  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const inProgress = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    const notStarted = tasks.filter(
      (t) => t.status === TaskStatus.NOT_STARTED || t.status === TaskStatus.PENDING_ASSIGN
    ).length;
    const overdue = tasks.filter((t) => t.status === TaskStatus.OVERDUE).length;
    const urgent = tasks.filter(
      (t) => t.status === TaskStatus.URGENT || t.priority === TaskStatus.URGENT
    ).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      overdue,
      urgent,
      completionRate,
    };
  }, [tasks]);

  const metricCards = [
    { label: '未开始', value: metrics.notStarted, color: '#8C8C8C', bgColor: '#F5F5F5', status: TaskStatus.NOT_STARTED },
    { label: '进行中', value: metrics.inProgress, color: '#FAAD14', bgColor: '#FFF7E6', status: TaskStatus.IN_PROGRESS },
    { label: '已完成', value: metrics.completed, color: '#52C41A', bgColor: '#F6FFED', status: TaskStatus.COMPLETED },
    { label: '已延期', value: metrics.overdue, color: '#A0522D', bgColor: '#FFF1F0', status: TaskStatus.OVERDUE },
    { label: '未完成', value: metrics.total - metrics.completed, color: '#3366FF', bgColor: '#EBF0FF', status: TaskStatus.IN_PROGRESS },
    { label: '紧急', value: metrics.urgent, color: '#FF4D4F', bgColor: '#FFF1F0', status: TaskStatus.URGENT },
  ];

  return (
    <div className={`${styles.aiPanel} ${isWide ? styles.aiPanelWide : ''}`}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <div className={styles.aiIcon}>AI</div>
          <h3>AI 助手</h3>
        </div>
        <div className={styles.panelHeaderActions}>
          <button
            className={styles.sizeToggle}
            onClick={onToggleWidth}
            title={isWide ? '收缩' : '展开'}
          >
            {isWide ? <ShrinkOutlined /> : <ArrowsAltOutlined />}
          </button>
          <button className={styles.closeButton} onClick={onClose} title="关闭">
            <CloseOutlined />
          </button>
        </div>
      </div>

      {/* Project Selector */}
      <div className={styles.projectSelector}>
        <div className={styles.projectSelectorLabel}>当前项目</div>
        <Select
          style={{ width: '100%' }}
          size="small"
          value={selectedProject}
          onChange={setSelectedProject}
          options={[
            { value: 'default', label: '默认项目' },
            { value: 'p1', label: '项目 A' },
            { value: 'p2', label: '项目 B' },
          ]}
        />
      </div>

      {/* Body */}
      <div className={styles.panelBody}>
        {/* AI Summary */}
        <div className={styles.summarySection}>
          <p className={styles.summaryText}>
            AI 分析了您在&quot;默认项目&quot;中的 {metrics.total} 个任务，当前完成率为 {metrics.completionRate}%。
          </p>
          <p className={styles.summarySubtext}>
            {metrics.total} Total Tasks &nbsp; {metrics.completionRate}% Completion Rate
          </p>
        </div>

        {/* 2x3 Metric Grid */}
        <div className={styles.metricGrid}>
          {metricCards.map((card) => (
            <div
              key={card.label}
              className={styles.metricCard}
              style={{ backgroundColor: card.bgColor }}
              onClick={() => onMetricClick(card.status)}
            >
              <div className={styles.metricLabel} style={{ color: card.color }}>
                {card.label}
              </div>
              <div className={styles.metricValue} style={{ color: card.color }}>
                {card.value}
                <span className={styles.metricCardSuffix}>个</span>
              </div>
            </div>
          ))}
        </div>

        {/* Suggestions */}
        <div className={styles.suggestionsSection}>
          <div className={styles.suggestionsTitle}>智能建议</div>
          <p className={styles.suggestionsText}>
            {metrics.overdue > 0
              ? `建议优先处理即将到期的紧急任务，并跟进已延期任务的进度。当前有 ${metrics.overdue} 个任务已延期。`
              : metrics.urgent > 0
              ? `当前有 ${metrics.urgent} 个紧急任务，建议尽快处理。整体进度良好，请继续保持。`
              : '当前任务进度良好，请继续保持。建议合理安排时间，确保按时完成各阶段目标。'}
          </p>
        </div>
      </div>
    </div>
  );
}
