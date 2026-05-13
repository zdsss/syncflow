import { useMemo, useCallback } from 'react';
import { Avatar, Tooltip, Progress, Select, message, Modal } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PROJECT_STATUS_CONFIG } from '@/constants/enums';
import { updateProjectStatus } from '@/services/project.service';
import { startWorkflow } from '@/services/workflow.service';
import type { Project, Task } from '@/types';
import { ProjectStatus } from '@/types';
import styles from './BasicTab.module.css';

interface BasicTabProps {
  project: Project;
  tasks: Task[];
  onStatusChange?: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  completed: { bg: '#F6FFED', color: '#52C41A', border: '#B7EB8F' },
  in_progress: { bg: '#E6F7FF', color: '#1890FF', border: '#91D5FF' },
  pending: { bg: '#FFF7E6', color: '#FAAD14', border: '#FFD591' },
  rejected: { bg: '#FFF2F0', color: '#FF4D4F', border: '#FFCCC7' },
};

export default function BasicTab({ project, tasks: _tasks, onStatusChange }: BasicTabProps) {
  const handleStatusChange = useCallback(async (newStatus: number) => {
    if (newStatus === ProjectStatus.COMPLETED) {
      Modal.confirm({
        title: '项目完成确认',
        content: '项目标记为已完成需要审批确认，是否提交？',
        okText: '提交审批',
        cancelText: '取消',
        onOk: async () => {
          try {
            await startWorkflow({
              processKey: 'project_completion_approval',
              objectId: project.id,
              objectType: 'PROJECT',
              objectName: project.name,
              projectId: project.id,
            });
            message.success('已提交项目完成审批');
            onStatusChange?.();
          } catch {
            message.error('提交审批失败');
          }
        },
      });
      return;
    }
    try {
      await updateProjectStatus(project.id, newStatus);
      message.success('项目状态已更新');
      onStatusChange?.();
    } catch {
      message.error('状态更新失败');
    }
  }, [project.id, project.name, onStatusChange]);
  const timelineMonths = useMemo(() => {
    if (!project.plannedStart || !project.plannedEnd) return [];
    const start = dayjs(project.plannedStart).startOf('month');
    const end = dayjs(project.plannedEnd).endOf('month');
    const months: string[] = [];
    let current = start;
    while (current.isBefore(end) || current.isSame(end, 'month')) {
      months.push(current.format('YYYY.MM'));
      current = current.add(1, 'month');
    }
    return months;
  }, [project.plannedStart, project.plannedEnd]);

  const timelineBarStyle = useMemo(() => {
    if (!project.plannedStart || !project.plannedEnd || timelineMonths.length === 0) return undefined;
    const firstMonth = dayjs(timelineMonths[0] + '.01');
    const lastMonth = dayjs(timelineMonths[timelineMonths.length - 1] + '.01').endOf('month');
    const totalDays = lastMonth.diff(firstMonth, 'day');
    const startOffset = dayjs(project.plannedStart).diff(firstMonth, 'day');
    const duration = dayjs(project.plannedEnd).diff(dayjs(project.plannedStart), 'day');
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${Math.max((duration / totalDays) * 100, 2)}%`,
    };
  }, [project.plannedStart, project.plannedEnd, timelineMonths]);

  const statusConfig = PROJECT_STATUS_CONFIG[project.status];

  return (
    <div className={styles.container} data-testid="basic-tab">
      {/* Approval pending indicator */}
      {project.flowInstanceId && (
        <div style={{ padding: '8px 16px', marginBottom: 12, background: '#FFF7E6', border: '1px solid #FFD591', borderRadius: 6, fontSize: 13, color: '#AD6800' }} data-testid="approval-pending-banner">
          项目完成审批进行中，审批通过后状态将自动更新
        </div>
      )}

      {/* Project Header */}
      <div className={styles.projectHeader} data-testid="project-header">
        <h2 className={styles.projectHeaderName}>{project.name}</h2>
        <span
          className={styles.projectHeaderStatus}
          style={{
            background: statusConfig?.color === '#52C41A' ? '#F6FFED'
              : statusConfig?.color === '#FAAD14' ? '#FFF7E6'
              : statusConfig?.color === '#A0522D' ? '#FFF1F0'
              : '#F5F5F5',
            color: statusConfig?.color || '#8C8C8C',
            border: `1px solid ${statusConfig?.color || '#8C8C8C'}33`,
          }}
          data-testid="project-status-badge"
        >
          {statusConfig?.label || project.status}
        </span>
      </div>
      <div className={styles.metadataRow} data-testid="metadata-row">
        <div className={styles.metadataItem}>
          <span className={styles.metadataLabel}>项目类型:</span>
          <span className={styles.metadataValue}>{project.projectType || '未设置'}</span>
        </div>
        <div className={styles.metadataItem}>
          <span className={styles.metadataLabel}>项目描述:</span>
          <span className={styles.metadataValue}>
            {project.description
              ? project.description.length > 50
                ? project.description.slice(0, 50) + '...'
                : project.description
              : '未设置'}
          </span>
        </div>
        <div className={styles.metadataItem}>
          <span className={styles.metadataLabel}>负责人:</span>
          <span className={styles.metadataValue}>
            <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 4 }} />
            {project.ownerName || `ID: ${project.ownerId}`}
          </span>
        </div>
      </div>

      {/* Timeline */}
      {timelineMonths.length > 0 && (
        <div className={styles.timelineSection} data-testid="project-timeline">
          <div className={styles.timelineContainer}>
            <div className={styles.timelineMonths}>
              {timelineMonths.map((m, i) => (
                <span key={i} className={styles.timelineMonth}>{m}</span>
              ))}
            </div>
            <div className={styles.timelineTrack}>
              <div className={styles.timelineTrackLine} />
              {timelineBarStyle && <div className={styles.timelineBar} style={timelineBarStyle} />}
            </div>
          </div>
        </div>
      )}

      {/* Info Grid */}
      <table className={styles.infoTable} data-testid="info-grid">
        <tbody>
          <tr>
            <td className={styles.infoLabel}>项目编号</td>
            <td className={styles.infoValue} data-testid="project-number">{project.code || '未设置'}</td>
            <td className={styles.infoLabel}>状态</td>
            <td className={styles.infoValue} data-testid="status-indicator">
              <Select
                value={project.status}
                onChange={handleStatusChange}
                size="small"
                style={{ width: 120 }}
                data-testid="project-status-select"
                options={[
                  { value: ProjectStatus.NOT_STARTED, label: '未开始' },
                  { value: ProjectStatus.IN_PROGRESS, label: '进行中' },
                  { value: ProjectStatus.COMPLETED, label: '已完成' },
                  { value: ProjectStatus.CANCELLED, label: '已取消' },
                ]}
              />
            </td>
          </tr>
          <tr>
            <td className={styles.infoLabel}>项目名称</td>
            <td className={styles.infoValue} data-testid="project-name">{project.name}</td>
            <td className={styles.infoLabel}>项目描述</td>
            <td className={styles.infoValue} data-testid="project-description">{project.description || '未设置'}</td>
          </tr>
          <tr>
            <td className={styles.infoLabel}>项目类型</td>
            <td className={styles.infoValue} data-testid="project-type">{project.projectType || '未设置'}</td>
            <td className={styles.infoLabel}>计划周期</td>
            <td className={styles.infoValue} data-testid="planned-duration">
              {project.plannedStart && project.plannedEnd ? `${project.plannedStart} ~ ${project.plannedEnd}` : '未设置'}
            </td>
          </tr>
          <tr>
            <td className={styles.infoLabel}>负责人</td>
            <td className={styles.infoValue} data-testid="project-leader">
              <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
              {project.ownerName || `ID: ${project.ownerId}`}
            </td>
            <td className={styles.infoLabel}>起止时间</td>
            <td className={styles.infoValue} data-testid="planned-start-date">
              {project.plannedStart && project.plannedEnd ? `${project.plannedStart} - ${project.plannedEnd}` : '未设置'}
            </td>
          </tr>
          <tr>
            <td className={styles.infoLabel}>进度</td>
            <td className={styles.infoValue} data-testid="project-progress" colSpan={3}>
              <Progress percent={project.progress || 0} size="small" style={{ width: 200 }} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
