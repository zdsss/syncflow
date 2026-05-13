import { Fragment } from 'react';
import { Button } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Task } from '@/types';
import { getDepartment, getPhase } from './scheduleHelpers';
import styles from '../ScheduleTab.module.css';

export interface ScheduleLeftTableProps {
  paginatedGroupedTasks: { phase: string; tasks: Task[] }[];
  collapsedGroups: Set<string>;
  onToggleGroup: (group: string) => void;
  onTaskClick?: (task: Task) => void;
  editingId: number | null;
  editStart: string;
  editEnd: string;
  setEditStart: (v: string) => void;
  setEditEnd: (v: string) => void;
  onStartEdit: (task: Task, e?: React.MouseEvent) => void;
  onCancelEdit: () => void;
  onConfirmEdit: () => void;
  onEditKeyDown: (e: React.KeyboardEvent) => void;
}

export default function ScheduleLeftTable({
  paginatedGroupedTasks,
  collapsedGroups,
  onToggleGroup,
  onTaskClick,
  editingId,
  editStart,
  editEnd,
  setEditStart,
  setEditEnd,
  onStartEdit,
  onCancelEdit,
  onConfirmEdit,
  onEditKeyDown,
}: ScheduleLeftTableProps) {
  return (
    <div className={styles.leftPanel} data-testid="left-panel">
      <table>
        <thead>
          <tr className={styles.headerRow}>
            <th style={{ width: 50 }}>阶段</th>
            <th style={{ width: 30 }}>序号</th>
            <th style={{ width: 60 }}>代号</th>
            <th style={{ width: 120 }}>名称</th>
            <th style={{ width: 55 }}>交付物</th>
            <th style={{ width: 60 }}>负责人</th>
            <th style={{ width: 60 }}>部门</th>
            <th style={{ width: 90 }}>计划工期</th>
            <th style={{ width: 70 }}>完成进度</th>
            <th style={{ width: 35 }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {paginatedGroupedTasks.map((group) => {
            const isCollapsed = collapsedGroups.has(group.phase);
            return (
              <Fragment key={group.phase}>
                <tr className={styles.groupRow}>
                  <td colSpan={10}>
                    <button
                      className={styles.groupToggle}
                      data-testid={`group-toggle-${group.phase}`}
                      onClick={() => onToggleGroup(group.phase)}
                    >
                      <span
                        className={`${styles.chevron} ${isCollapsed ? styles.chevronCollapsed : ''}`}
                      >
                        ▼
                      </span>
                      <span className={styles.groupNameCell}>{group.phase}</span>
                      <span style={{ fontWeight: 400, fontSize: 12, color: '#8C8C8C' }}>
                        ({group.tasks.length})
                      </span>
                    </button>
                  </td>
                </tr>
                {!isCollapsed &&
                  group.tasks.map((task, idx) => {
                    const dept = getDepartment(task);
                    const deliverableCount = task.dependencies?.length || 1;
                    const phase = getPhase(task);

                    return (
                      <tr
                        key={task.id}
                        className={`${styles.dataRow} ${editingId === task.id ? styles.editing : ''}`}
                        data-testid={`task-row-${task.id}`}
                        onClick={() => onTaskClick?.(task)}
                      >
                        <td style={{ width: 50 }} data-testid={`phase-${task.id}`}>
                          <span className={styles.phaseBadge}>{phase}</span>
                        </td>
                        <td style={{ width: 30 }} data-testid={`row-num-${task.id}`}>
                          {idx + 1}
                        </td>
                        <td style={{ width: 60 }} data-testid={`task-code-${task.id}`}>
                          {task.taskNo?.substring(0, 8) || ''}
                        </td>
                        <td style={{ width: 120, textAlign: 'left', paddingLeft: 6 }}>{task.title}</td>
                        <td style={{ width: 55 }} data-testid={`deliverable-${task.id}`}>
                          <span className={styles.deliverableBadge}>{deliverableCount}</span>
                        </td>
                        <td style={{ width: 60 }}>{task.assigneeName || task.assigneeId}</td>
                        <td style={{ width: 60 }}>{dept}</td>
                        <td
                          style={{ width: 80 }}
                          data-testid={`plan-duration-${task.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartEdit(task);
                          }}
                        >
                          {editingId === task.id ? (
                            <div className={styles.editCell}>
                              <input
                                type="date"
                                value={editStart}
                                onChange={(e) => setEditStart(e.target.value)}
                                onKeyDown={onEditKeyDown}
                                data-testid={`edit-start-${task.id}`}
                                className={styles.dateInput}
                              />
                              <input
                                type="date"
                                value={editEnd}
                                onChange={(e) => setEditEnd(e.target.value)}
                                onKeyDown={onEditKeyDown}
                                data-testid={`edit-end-${task.id}`}
                                className={styles.dateInput}
                              />
                              <button
                                className={styles.editConfirmBtn}
                                data-testid={`edit-confirm-${task.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onConfirmEdit();
                                }}
                              >
                                &#10003;
                              </button>
                              <button
                                className={styles.editCancelBtn}
                                data-testid={`edit-cancel-${task.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCancelEdit();
                                }}
                              >
                                &#10007;
                              </button>
                            </div>
                          ) : (
                            task.plannedStart && task.plannedEnd
                              ? `${dayjs(task.plannedStart).format('MM/DD')}-${dayjs(task.plannedEnd).format('MM/DD')}`
                              : '-'
                          )}
                        </td>
                        <td style={{ width: 70 }}>
                          <span className={styles.progressBar}>
                            <span
                              className={styles.progressBarFill}
                              data-testid={`progress-fill-${task.id}`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </span>
                          <span className={styles.progressText}>{task.progress}%</span>
                        </td>
                        <td style={{ width: 35 }}>
                          <Button
                            type="text"
                            size="small"
                            icon={<MoreOutlined />}
                            data-testid={`more-btn-${task.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
