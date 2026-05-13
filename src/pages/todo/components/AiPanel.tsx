import { useMemo, useState } from 'react';
import { Select } from 'antd';
import { ShrinkOutlined, ArrowsAltOutlined, CloseOutlined } from '@ant-design/icons';
import type { Task } from '@/types';
import { TaskStatus, TaskPriority } from '@/types';
import { TASK_STATUS_CONFIG } from '@/constants/enums';
import styles from './AiPanel.module.css';

interface AiPanelProps {
  tasks: Task[];
  isWide: boolean;
  onToggleWidth: () => void;
  onClose: () => void;
  onMetricClick: (status: TaskStatus) => void;
}

export interface Suggestion {
  type: 'warning' | 'info' | 'success';
  icon: string;
  text: string;
}

export function generateSuggestions(metrics: {
  overdue: number;
  urgent: number;
  inProgress: number;
  completed: number;
  total: number;
}): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (metrics.overdue > 0) {
    suggestions.push({
      type: 'warning',
      icon: '⚠️',
      text: `您有 ${metrics.overdue} 个任务已超期，建议优先处理`,
    });
  }

  if (metrics.urgent > 0) {
    suggestions.push({
      type: 'warning',
      icon: '🔴',
      text: `${metrics.urgent} 个紧急任务待处理，请立即关注`,
    });
  }

  if (metrics.inProgress > 3) {
    suggestions.push({
      type: 'info',
      icon: '💡',
      text: `当前有 ${metrics.inProgress} 个任务进行中，建议专注完成后再接新任务`,
    });
  }

  const completionRate =
    metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0;

  if (completionRate >= 80) {
    suggestions.push({
      type: 'success',
      icon: '✅',
      text: `完成率已达 ${completionRate}%，保持良好势头`,
    });
  } else if (completionRate < 30 && metrics.total > 0) {
    suggestions.push({
      type: 'warning',
      icon: '📊',
      text: `完成率仅 ${completionRate}%，建议加快推进`,
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      type: 'success',
      icon: '👍',
      text: '当前任务进展良好，继续保持',
    });
  }

  return suggestions;
}

const defaultProjectOptions = [
  { value: 'default', label: '默认项目' },
];

export default function AiPanel({ tasks = [], isWide, onToggleWidth, onClose, onMetricClick }: AiPanelProps) {
  const [selectedProject, setSelectedProject] = useState<string>('default');

  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const inProgress = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    const notStarted = tasks.filter(
      (t) => t.status === TaskStatus.PENDING || t.status === TaskStatus.ON_HOLD
    ).length;
    const overdue = tasks.filter((t) => t.status === TaskStatus.OVERDUE || t.isOverdue).length;
    const urgent = tasks.filter((t) => t.priority === TaskPriority.URGENT).length;

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
    { label: '未开始', value: metrics.notStarted, color: '#8C8C8C', bgColor: '#F5F5F5', status: TaskStatus.PENDING },
    { label: '进行中', value: metrics.inProgress, color: '#FAAD14', bgColor: '#FFF7E6', status: TaskStatus.IN_PROGRESS },
    { label: '已完成', value: metrics.completed, color: '#52C41A', bgColor: '#F6FFED', status: TaskStatus.COMPLETED },
    { label: '已延期', value: metrics.overdue, color: '#A0522D', bgColor: '#FFF1F0', status: TaskStatus.OVERDUE },
    { label: '未完成', value: metrics.total - metrics.completed, color: '#3366FF', bgColor: '#EBF0FF', status: TaskStatus.IN_PROGRESS },
    { label: '紧急', value: metrics.urgent, color: '#FF4D4F', bgColor: '#FFF1F0', status: TaskStatus.PENDING },
  ];

  const suggestions = generateSuggestions({
    overdue: metrics.overdue,
    urgent: metrics.urgent,
    inProgress: metrics.inProgress,
    completed: metrics.completed,
    total: metrics.total,
  });

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
          options={defaultProjectOptions}
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
          {suggestions.map((suggestion, index) => (
            <p key={index} className={styles.suggestionsText}>
              {suggestion.icon} {suggestion.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
