import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import type { Task } from '@/types';
import {
  calculateCriticalPath,
  useGanttColumns,
  useGanttDrag,
  GanttLeftTable,
  GanttTimeline,
} from './gantt';
import styles from './TaskGanttTab.module.css';

export { calculateCriticalPath } from './gantt';
export type { CPMData } from './gantt';

interface TaskGanttTabProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskUpdate?: (taskId: string, updates: { planStart?: string; planEnd?: string }) => void;
}

export default function TaskGanttTab({ tasks, onTaskClick, onTaskUpdate }: TaskGanttTabProps) {
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['all']);
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [showDependencies, setShowDependencies] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<'week' | 'month' | 'quarter'>('week');
  const ganttBodyRef = { current: null as HTMLDivElement | null };

  const currentYear = new Date().getFullYear();
  const startYear = currentYear;
  const monthCount = (currentYear + 2 - startYear) * 12 - new Date().getMonth();

  const {
    monthWeeks,
    weekWidth,
    timelineStart,
    totalDays,
    monthColumns,
    monthCellWidth,
    quarterColumns,
    quarterCellWidth,
    todayOffset,
  } = useGanttColumns(startYear, monthCount);

  const totalWeeks = monthWeeks.reduce((s, m) => s + m.weeks.length, 0);

  const totalTimelineWidth =
    zoomLevel === 'week'
      ? totalWeeks * weekWidth
      : zoomLevel === 'month'
        ? monthColumns.length * monthCellWidth
        : quarterColumns.length * quarterCellWidth;

  const { dragging, dragOffset, dragRef, handleDragStart, handleResizeStart } = useGanttDrag({
    onTaskUpdate,
    totalTimelineWidth,
    totalDays,
    tasks,
  });

  const deptTaskMap = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      const dept = task.tags?.split(',')[0]?.trim() || 'other';
      if (!map[dept]) map[dept] = [];
      map[dept].push(task);
    }
    return map;
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    if (selectedDepts.includes('all')) return tasks;
    return tasks.filter((t) => {
      const dept = t.tags?.split(',')[0]?.trim() || 'other';
      return selectedDepts.includes(dept);
    });
  }, [tasks, selectedDepts]);

  const cpmData = useMemo(() => calculateCriticalPath(tasks), [tasks]);

  const getBarForTask = (task: Task) => {
    if (!task.plannedStart || !task.plannedEnd) return null;
    const s = dayjs(task.plannedStart);
    const e = dayjs(task.plannedEnd);
    if (e.isBefore(timelineStart) || s.isAfter(dayjs(timelineStart).add(monthCount, 'month'))) return null;
    const startOffset = Math.max(0, s.diff(timelineStart, 'day'));
    const endOffset = Math.min(totalDays, e.diff(timelineStart, 'day'));
    return {
      left: (startOffset / totalDays) * totalTimelineWidth,
      width: Math.max(20, ((endOffset - startOffset) / totalDays) * totalTimelineWidth),
    };
  };

  const getActualBarForTask = (task: Task) => {
    if (!task.actualStart) return null;
    const s = dayjs(task.actualStart);
    const e = task.actualEnd ? dayjs(task.actualEnd) : dayjs();
    if (e.isBefore(timelineStart) || s.isAfter(dayjs(timelineStart).add(monthCount, 'month'))) return null;
    const startOffset = Math.max(0, s.diff(timelineStart, 'day'));
    const endOffset = Math.min(totalDays, e.diff(timelineStart, 'day'));
    if (endOffset <= startOffset) return null;
    return {
      left: (startOffset / totalDays) * totalTimelineWidth,
      width: Math.max(4, ((endOffset - startOffset) / totalDays) * totalTimelineWidth),
    };
  };

  const handleDeptToggle = (deptId: string) => {
    if (deptId === 'all') {
      setSelectedDepts(['all']);
    } else {
      const newDepts = selectedDepts.includes(deptId)
        ? selectedDepts.filter((d) => d !== deptId)
        : [...selectedDepts.filter((d) => d !== 'all'), deptId];
      setSelectedDepts(newDepts.length === 0 ? ['all'] : newDepts);
    }
  };

  const todayLeft = (todayOffset / totalDays) * totalTimelineWidth;
  const showTodayLine = todayOffset >= 0 && todayOffset <= totalDays;

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        <GanttLeftTable visibleTasks={visibleTasks} onTaskClick={onTaskClick} />
        <GanttTimeline
          visibleTasks={visibleTasks}
          tasks={tasks}
          onTaskClick={onTaskClick}
          selectedDepts={selectedDepts}
          deptTaskMap={deptTaskMap}
          handleDeptToggle={handleDeptToggle}
          showCriticalPath={showCriticalPath}
          setShowCriticalPath={setShowCriticalPath}
          showDependencies={showDependencies}
          setShowDependencies={setShowDependencies}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          monthWeeks={monthWeeks}
          weekWidth={weekWidth}
          monthColumns={monthColumns}
          monthCellWidth={monthCellWidth}
          quarterColumns={quarterColumns}
          quarterCellWidth={quarterCellWidth}
          totalTimelineWidth={totalTimelineWidth}
          totalDays={totalDays}
          showTodayLine={showTodayLine}
          todayLeft={todayLeft}
          startYear={startYear}
          cpmData={cpmData}
          getBarForTask={getBarForTask}
          getActualBarForTask={getActualBarForTask}
          dragging={dragging}
          dragOffset={dragOffset}
          dragRef={dragRef}
          ganttBodyRef={ganttBodyRef}
          handleDragStart={handleDragStart}
          handleResizeStart={handleResizeStart}
        />
      </div>
    </div>
  );
}
