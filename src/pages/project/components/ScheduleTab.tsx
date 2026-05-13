import { useMemo, useState, useCallback } from 'react';
import { Checkbox, Button, Switch, Segmented, Select } from 'antd';
import dayjs from 'dayjs';
import type { Task } from '@/types';
import { TaskStatus } from '@/types';
import styles from './ScheduleTab.module.css';
import {
  generateWeeks,
  groupWeeksByMonth,
  getDepartment,
  getPhase,
  PHASE_OPTIONS,
} from './schedule/scheduleHelpers';
import { useInlineEdit } from './schedule/useInlineEdit';
import ScheduleLeftTable from './schedule/ScheduleLeftTable';
import ScheduleTimeAxis from './schedule/ScheduleTimeAxis';

interface ScheduleTabProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  onSave?: (taskId: number, data: Partial<Task>) => void;
  departmentFilter?: string;
  onDepartmentChange?: (val: string) => void;
}

const WEEK_COL_WIDTH = 60;
const PAGE_SIZE = 10;

const DEPARTMENT_OPTIONS = [
  { value: '', label: '全部门' },
  { value: '设计部', label: '设计部' },
  { value: '产品部', label: '产品部' },
  { value: '研发部', label: '研发部' },
  { value: '测试部', label: '测试部' },
];

function cascadeDependentTasks(
  taskId: number,
  deltaDays: number,
  allTasks: Task[],
  onSave?: (taskId: number, data: Partial<Task>) => void,
  visited = new Set<number>(),
) {
  if (visited.has(taskId)) return;
  visited.add(taskId);
  const dependents = allTasks.filter((t) =>
    t.dependencies?.includes(String(taskId)),
  );
  for (const dep of dependents) {
    const depId = dep.id;
    const oldStart = dep.plannedStart;
    const oldEnd = dep.plannedEnd;
    const newStart = oldStart ? dayjs(oldStart).add(deltaDays, 'day').format('YYYY-MM-DD') : undefined;
    const newEnd = oldEnd ? dayjs(oldEnd).add(deltaDays, 'day').format('YYYY-MM-DD') : undefined;
    onSave?.(depId, { plannedStart: newStart, plannedEnd: newEnd } as Partial<Task>);
    cascadeDependentTasks(depId, deltaDays, allTasks, onSave, visited);
  }
}

export default function ScheduleTab({ tasks, onTaskClick, onSave, departmentFilter, onDepartmentChange }: ScheduleTabProps) {
  const currentYear = new Date().getFullYear();
  const weeks = useMemo(() => generateWeeks(currentYear), [currentYear]);
  const monthGroups = useMemo(() => groupWeeksByMonth(weeks, currentYear), [weeks, currentYear]);

  const timelineStart = dayjs(`${currentYear}-01-01`);
  const timelineEnd = dayjs(`${currentYear}-12-31`);
  const totalDays = timelineEnd.diff(timelineStart, 'day');
  const totalWidth = weeks.length * WEEK_COL_WIDTH;

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [autoDefer, setAutoDefer] = useState(false);
  const [showOnlyStages, setShowOnlyStages] = useState(false);
  const [showOnlyMilestones, setShowOnlyMilestones] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'gantt'>('table');

  const handleSave = useCallback(
    (taskId: number, data: Partial<Task>) => {
      onSave?.(taskId, data);
      if (autoDefer && (data.plannedStart || data.plannedEnd)) {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;
        const oldStart = task.plannedStart;
        const oldEnd = task.plannedEnd;
        const deltaDays = data.plannedEnd && oldEnd
          ? dayjs(data.plannedEnd).diff(dayjs(oldEnd), 'day')
          : data.plannedStart && oldStart
            ? dayjs(data.plannedStart).diff(dayjs(oldStart), 'day')
            : 0;
        if (deltaDays !== 0) {
          cascadeDependentTasks(taskId, deltaDays, tasks, onSave);
        }
      }
    },
    [autoDefer, tasks, onSave],
  );

  const inlineEdit = useInlineEdit(handleSave);

  const toggleGroup = useCallback((group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }, []);

  const handlePhaseToggle = (phase: string) => {
    setSelectedPhases((prev) =>
      prev.includes(phase) ? prev.filter((p) => p !== phase) : [...prev, phase]
    );
    setCurrentPage(1);
  };

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    if (departmentFilter) {
      filtered = tasks.filter((t) => getDepartment(t) === departmentFilter);
    }
    if (selectedPhases.length > 0) {
      filtered = filtered.filter((t) => selectedPhases.includes(getPhase(t)));
    }
    if (showOnlyStages) {
      filtered = filtered.filter((t) => t.type === 'STAGE');
    }
    if (showOnlyMilestones) {
      filtered = filtered.filter((t) => t.type === 'MILESTONE');
    }
    return filtered;
  }, [tasks, departmentFilter, selectedPhases, showOnlyStages, showOnlyMilestones]);

  const groupedTasks = useMemo(() => {
    const groups = new Map<string, Task[]>();
    for (const task of filteredTasks) {
      const phase = getPhase(task);
      if (!groups.has(phase)) groups.set(phase, []);
      groups.get(phase)!.push(task);
    }
    return Array.from(groups.entries()).map(([phase, phaseTasks]) => ({
      phase,
      tasks: phaseTasks,
    }));
  }, [filteredTasks]);

  const totalItems = filteredTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const paginatedGroupedTasks = useMemo(() => {
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const endIdx = startIdx + PAGE_SIZE;
    let runningIdx = 0;
    const result: { phase: string; tasks: Task[] }[] = [];

    for (const group of groupedTasks) {
      const groupStart = runningIdx;
      const groupEnd = runningIdx + group.tasks.length;
      if (groupEnd <= startIdx || groupStart >= endIdx) {
        runningIdx = groupEnd;
        continue;
      }
      const sliceStart = Math.max(0, startIdx - groupStart);
      const sliceEnd = Math.min(group.tasks.length, endIdx - groupStart);
      result.push({ phase: group.phase, tasks: group.tasks.slice(sliceStart, sliceEnd) });
      runningIdx = groupEnd;
    }
    return result;
  }, [groupedTasks, currentPage]);

  const progressStats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const inProgress = filteredTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, percentage };
  }, [filteredTasks]);

  return (
    <div className={styles.container} data-testid="schedule-gantt">
      <div className={styles.topBar} data-testid="top-bar">
        <Segmented
          value={viewMode}
          onChange={(v) => setViewMode(v as 'table' | 'gantt')}
          options={[
            { label: '列表', value: 'table' },
            { label: '时间轴', value: 'gantt' },
          ]}
          size="small"
        />
        {onDepartmentChange && (
          <Select
            placeholder="全部门"
            allowClear
            value={departmentFilter || undefined}
            onChange={(v) => onDepartmentChange(v || '')}
            style={{ width: 100 }}
            size="small"
            options={DEPARTMENT_OPTIONS}
          />
        )}
        <div className={styles.filterSection}>
          <span className={styles.filterLabel}>阶段：</span>
          {PHASE_OPTIONS.map((phase) => (
            <label key={phase} className={styles.filterItem}>
              <Checkbox
                checked={selectedPhases.includes(phase)}
                onChange={() => handlePhaseToggle(phase)}
              >
                {phase}
              </Checkbox>
            </label>
          ))}
        </div>
        <div className={styles.autoDeferSection}>
          <Switch
            size="small"
            checked={autoDefer}
            onChange={setAutoDefer}
            data-testid="auto-defer-switch"
          />
          <span className={styles.autoDeferLabel}>自动顺延</span>
          <Switch size="small" checked={showOnlyStages} onChange={setShowOnlyStages} data-testid="show-stages-switch" />
          <span className={styles.autoDeferLabel}>仅阶段</span>
          <Switch size="small" checked={showOnlyMilestones} onChange={setShowOnlyMilestones} data-testid="show-milestones-switch" />
          <span className={styles.autoDeferLabel}>仅里程碑</span>
        </div>
        <div className={styles.progressSection}>
          <span className={styles.progressLabel}>
            {progressStats.completed}/{progressStats.total}
          </span>
          <span className={styles.topProgressBar}>
            <span
              className={styles.topProgressBarFill}
              style={{ width: `${progressStats.percentage}%` }}
              data-testid="overall-progress"
            />
          </span>
          <span className={styles.progressPercent}>{progressStats.percentage}%</span>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {viewMode === 'table' && (
          <ScheduleLeftTable
            paginatedGroupedTasks={paginatedGroupedTasks}
            collapsedGroups={collapsedGroups}
            onToggleGroup={toggleGroup}
            onTaskClick={onTaskClick}
            editingId={inlineEdit.editingId}
            editStart={inlineEdit.editStart}
            editEnd={inlineEdit.editEnd}
            setEditStart={inlineEdit.setEditStart}
            setEditEnd={inlineEdit.setEditEnd}
            onStartEdit={inlineEdit.startEdit}
            onCancelEdit={inlineEdit.cancelEdit}
            onConfirmEdit={inlineEdit.confirmEdit}
            onEditKeyDown={inlineEdit.handleEditKeyDown}
          />
        )}
        {viewMode === 'gantt' && (
          <ScheduleTimeAxis
            weeks={weeks}
            monthGroups={monthGroups}
            paginatedGroupedTasks={paginatedGroupedTasks}
            collapsedGroups={collapsedGroups}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
            totalDays={totalDays}
            totalWidth={totalWidth}
          />
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.paginationBar} data-testid="pagination">
          <span className={styles.paginationInfo}>
            共 {totalItems} 条记录，第 {currentPage}/{totalPages} 页
          </span>
          <div className={styles.paginationButtons}>
            <Button
              size="small"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              data-testid="prev-page"
            >
              上一页
            </Button>
            <Button
              size="small"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              data-testid="next-page"
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
