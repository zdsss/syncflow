import { Checkbox, Segmented, Tooltip, Button } from 'antd';
import type { Task } from '@/types';
import { TaskStatus } from '@/types';
import { TASK_STATUS_CONFIG } from '@/constants/enums';
import type { CPMData } from './criticalPath';
import type { ZoomLevel } from './useGanttColumns';
import type { DragState } from './useGanttDrag';
import styles from '../TaskGanttTab.module.css';

const STATUS_BAR_COLORS: Record<number, string> = {
  [TaskStatus.PENDING]: '#BFBFBF',
  [TaskStatus.IN_PROGRESS]: '#1890FF',
  [TaskStatus.PENDING_REVIEW]: '#FAAD14',
  [TaskStatus.COMPLETED]: '#FAAD14',
  [TaskStatus.CANCELLED]: '#D9D9D9',
};

const ZOOM_OPTIONS = [
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '季', value: 'quarter' },
];

const DEPARTMENTS = [
  { id: 'all', label: '全部' },
  { id: 'design', label: '设计部' },
  { id: 'product', label: '产品部' },
  { id: 'dev', label: '研发部' },
  { id: 'test', label: '测试部' },
  { id: 'production', label: '生产部' },
];

export interface GanttTimelineProps {
  visibleTasks: Task[];
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  selectedDepts: string[];
  deptTaskMap: Record<string, Task[]>;
  handleDeptToggle: (deptId: string) => void;
  showCriticalPath: boolean;
  setShowCriticalPath: (v: boolean) => void;
  showDependencies: boolean;
  setShowDependencies: (v: boolean) => void;
  zoomLevel: ZoomLevel;
  setZoomLevel: (v: ZoomLevel) => void;
  monthWeeks: { key: string; label: string; weeks: { key: string; label: string; days: number }[] }[];
  weekWidth: number;
  monthColumns: { key: string; label: string }[];
  monthCellWidth: number;
  quarterColumns: { key: string; label: string; monthCount: number }[];
  quarterCellWidth: number;
  totalTimelineWidth: number;
  totalDays: number;
  showTodayLine: boolean;
  todayLeft: number;
  startYear: number;
  cpmData: Map<string, CPMData>;
  getBarForTask: (task: Task) => { left: number; width: number } | null;
  getActualBarForTask?: (task: Task) => { left: number; width: number } | null;
  dragging: DragState | null;
  dragOffset: number;
  dragRef: React.RefObject<HTMLDivElement | null>;
  ganttBodyRef: React.RefObject<HTMLDivElement | null>;
  handleDragStart: (e: React.MouseEvent, task: Task) => void;
  handleResizeStart: (e: React.MouseEvent, task: Task, type: 'resize-left' | 'resize-right') => void;
}

export function GanttTimeline(props: GanttTimelineProps) {
  const {
    visibleTasks,
    tasks,
    onTaskClick,
    selectedDepts,
    deptTaskMap,
    handleDeptToggle,
    showCriticalPath,
    setShowCriticalPath,
    showDependencies,
    setShowDependencies,
    zoomLevel,
    setZoomLevel,
    monthWeeks,
    weekWidth,
    monthColumns,
    monthCellWidth,
    quarterColumns,
    quarterCellWidth,
    totalTimelineWidth,
    totalDays,
    showTodayLine,
    todayLeft,
    startYear,
    cpmData,
    getBarForTask,
    getActualBarForTask,
    dragging,
    dragOffset,
    dragRef,
    ganttBodyRef,
    handleDragStart,
    handleResizeStart,
  } = props;

  // Compute dependency arrow positions
  const taskIndexMap: Record<string, number> = {};
  visibleTasks.forEach((t, i) => { taskIndexMap[t.id] = i; });

  const dependencyArrows: { fromId: string; toId: string; fromX: number; fromY: number; toX: number; toY: number; depType: string }[] = [];
  for (const task of visibleTasks) {
    const depDetails = (task as unknown as Record<string, Array<{ dependsOnId: string; type: string }>>).dependencyDetails;
    const depIds = task.dependencies || [];
    if (!depIds.length) continue;
    for (const depId of depIds) {
      const depIdx = taskIndexMap[depId];
      const taskIdx = taskIndexMap[task.id];
      if (depIdx === undefined || taskIdx === undefined) continue;

      const depTask = visibleTasks[depIdx];
      const depBar = getBarForTask(depTask);
      const taskBar = getBarForTask(task);
      if (!depBar || !taskBar) continue;

      const depType = depDetails?.find((d) => d.dependsOnId === depId)?.type || 'FS';
      let fromX: number, toX: number;
      switch (depType) {
        case 'SS': fromX = depBar.left; toX = taskBar.left; break;
        case 'SF': fromX = depBar.left; toX = taskBar.left + taskBar.width; break;
        case 'FF': fromX = depBar.left + depBar.width; toX = taskBar.left + taskBar.width; break;
        case 'FS':
        default:   fromX = depBar.left + depBar.width; toX = taskBar.left; break;
      }
      const fromY = depIdx * 40 + 20;
      const toY = taskIdx * 40 + 20;
      dependencyArrows.push({ fromId: depId, toId: task.id, fromX, fromY, toX, toY, depType });
    }
  }

  return (
    <div className={styles.ganttArea}>
      {/* Filter bar at top */}
      <div className={styles.filterBar} data-testid="filter-bar">
        <span className={styles.filterTitle}>部门筛选</span>
        {DEPARTMENTS.map((dept) => (
          <label key={dept.id} className={styles.filterItem}>
            <Checkbox
              checked={selectedDepts.includes(dept.id)}
              onChange={() => handleDeptToggle(dept.id)}
            >
              {dept.label}
              {dept.id !== 'all' && (
                <span className={styles.filterCount}>
                  ({(deptTaskMap[dept.id] || []).length})
                </span>
              )}
            </Checkbox>
          </label>
        ))}
      </div>
      <div className={styles.zoomBar}>
        <Button
          size="small"
          type={showCriticalPath ? 'primary' : 'default'}
          onClick={() => setShowCriticalPath(!showCriticalPath)}
          data-testid="critical-path-toggle"
          style={{ marginRight: 12 }}
        >
          关键路径
        </Button>
        <Button
          size="small"
          type={showDependencies ? 'primary' : 'default'}
          onClick={() => setShowDependencies(!showDependencies)}
          data-testid="dependency-arrows-toggle"
          style={{ marginRight: 12 }}
        >
          依赖关系
        </Button>
        {showCriticalPath && (
          <span style={{ fontSize: 12, color: '#666', display: 'inline-flex', alignItems: 'center', gap: 12, marginRight: 12 }}>
            <span><span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#FF4D4F', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }} />红色=关键路径</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#3366FF', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }} />蓝色=普通任务</span>
          </span>
        )}
        <Segmented
          options={ZOOM_OPTIONS}
          value={zoomLevel}
          onChange={(val) => setZoomLevel(val as ZoomLevel)}
          size="small"
        />
      </div>
      <div className={styles.ganttScroll}>
        <div className={styles.ganttInner}>
          {/* Time axis header */}
          {zoomLevel === 'week' && (
            <>
              <div className={styles.ganttHeader}>
                {monthWeeks.map((m) => (
                  <div key={m.key} className={styles.monthCell} style={{ width: m.weeks.length * weekWidth }}>
                    {m.label}
                  </div>
                ))}
              </div>
              <div className={styles.ganttSubHeader}>
                {monthWeeks.flatMap((m) =>
                  m.weeks.map((w) => (
                    <div key={w.key} className={styles.weekCell} style={{ width: weekWidth }}>
                      {w.label}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
          {zoomLevel === 'month' && (
            <>
              <div className={styles.ganttHeader}>
                <div className={styles.monthCell} style={{ width: monthColumns.length * monthCellWidth }}>
                  {startYear}年
                </div>
              </div>
              <div className={styles.ganttSubHeader}>
                {monthColumns.map((col) => (
                  <div key={col.key} className={styles.weekCell} style={{ width: monthCellWidth }}>
                    {col.label}
                  </div>
                ))}
              </div>
            </>
          )}
          {zoomLevel === 'quarter' && (
            <>
              <div className={styles.ganttHeader}>
                <div className={styles.monthCell} style={{ width: quarterColumns.length * quarterCellWidth }}>
                  {startYear}年
                </div>
              </div>
              <div className={styles.ganttSubHeader}>
                {quarterColumns.map((col) => (
                  <div key={col.key} className={styles.weekCell} style={{ width: quarterCellWidth }}>
                    {col.label}
                  </div>
                ))}
              </div>
            </>
          )}
          {/* Task rows */}
          <div className={styles.ganttBody} ref={ganttBodyRef}>
            {/* Today red line */}
            {showTodayLine && (
              <div
                className={styles.todayLine}
                style={{ left: todayLeft }}
                data-testid="today-line"
              >
                <span className={styles.todayMarker}>今天</span>
              </div>
            )}
            {/* Dependency arrows SVG */}
            {showDependencies && dependencyArrows.length > 0 && (
              <svg
                className={styles.dependencySvg}
                width={totalTimelineWidth + 40}
                height={visibleTasks.length * 40}
                data-testid="dependency-arrows"
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="8"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#8C8C8C" />
                  </marker>
                </defs>
                {dependencyArrows.map((arrow) => {
                  const midX = (arrow.fromX + arrow.toX) / 2;
                  return (
                    <g key={`${arrow.fromId}-${arrow.toId}`}>
                      <path
                        d={`M ${arrow.fromX} ${arrow.fromY} C ${midX} ${arrow.fromY}, ${midX} ${arrow.toY}, ${arrow.toX} ${arrow.toY}`}
                        fill="none"
                        stroke="#8C8C8C"
                        strokeWidth={1.5}
                        markerEnd="url(#arrowhead)"
                      />
                    </g>
                  );
                })}
              </svg>
            )}
            {visibleTasks.map((task) => {
              const bar = getBarForTask(task);
              const actualBar = getActualBarForTask?.(task);
              const statusConfig = TASK_STATUS_CONFIG[task.status];
              const baseColor = STATUS_BAR_COLORS[task.status] || statusConfig?.color || '#BFBFBF';
              const cpm = cpmData.get(String(task.id));
              const isCritical = showCriticalPath && !!cpm?.isCritical;
              const isNonCritical = showCriticalPath && cpm && !cpm.isCritical;
              const barColor = isCritical ? '#FF4D4F' : baseColor;
              const tooltipContent = (
                <div data-testid={`gantt-tooltip-${task.id}`}>
                  <div><strong>{task.title}</strong></div>
                  <div>负责人: {task.assigneeName || task.assigneeId}</div>
                  {task.participants && task.participants.length > 0 && (
                    <div>参与人: {task.participants.join(', ')}</div>
                  )}
                  <div>日期: {task.plannedStart} ~ {task.plannedEnd}</div>
                  {task.plannedHours != null && (
                    <div>计划工时: {task.plannedHours}h</div>
                  )}
                  {task.actualHours != null && (
                    <div>完成工时: {task.actualHours}h</div>
                  )}
                  <div>进度: {task.progress}%</div>
                  <div>状态: {statusConfig?.label || task.status}</div>
                </div>
              );
              return (
                <div
                  key={task.id}
                  className={styles.ganttRow}
                  onClick={() => {
                    if (!dragging) onTaskClick?.(task);
                  }}
                >
                  <div className={styles.timelineRow}>
                    {zoomLevel === 'week' && monthWeeks.flatMap((m) =>
                      m.weeks.map((w) => (
                        <div key={w.key} className={styles.gridCell} style={{ width: weekWidth }} />
                      ))
                    )}
                    {zoomLevel === 'month' && monthColumns.map((col) => (
                      <div key={col.key} className={styles.gridCell} style={{ width: monthCellWidth }} />
                    ))}
                    {zoomLevel === 'quarter' && quarterColumns.map((col) => (
                      <div key={col.key} className={styles.gridCell} style={{ width: quarterCellWidth }} />
                    ))}
                    {/* Actual execution bar (on top of planned bar) */}
                    {actualBar && bar && (
                      <div
                        className={styles.actualBar}
                        style={{
                          left: actualBar.left,
                          width: actualBar.width,
                          backgroundColor: barColor,
                        }}
                        data-testid={`actual-bar-${task.id}`}
                      />
                    )}
                    {bar && (
                      <Tooltip title={tooltipContent} placement="top">
                        <div
                          ref={dragging?.taskId === task.id ? dragRef : undefined}
                          className={styles.ganttBar}
                          style={{
                            left: dragging?.taskId === task.id && dragging.type === 'move'
                              ? bar.left + dragOffset
                              : dragging?.taskId === task.id && dragging.type === 'resize-left'
                                ? bar.left + dragOffset
                                : bar.left,
                            width: dragging?.taskId === task.id && dragging.type === 'resize-right'
                              ? Math.max(totalTimelineWidth / totalDays, bar.width + dragOffset)
                              : dragging?.taskId === task.id && dragging.type === 'resize-left'
                                ? Math.max(totalTimelineWidth / totalDays, bar.width - dragOffset)
                                : bar.width,
                            backgroundColor: barColor,
                            opacity: actualBar ? 0.25 : (dragging?.taskId === task.id ? 0.7 : (isNonCritical ? 0.7 : 1)),
                            cursor: dragging?.taskId === task.id && dragging.type === 'move' ? 'grabbing' : 'grab',
                          }}
                          data-status={task.status}
                          data-testid={`gantt-bar-${task.id}`}
                          onMouseDown={(e) => handleDragStart(e, task)}
                        >
                          <div
                            className={`${styles.resizeHandle} ${styles.resizeHandleLeft}`}
                            data-testid={`resize-handle-left-${task.id}`}
                            style={{ position: 'absolute', width: 8, left: 0, top: 0, height: '100%', cursor: 'col-resize', zIndex: 2 }}
                            onMouseDown={(e) => handleResizeStart(e, task, 'resize-left')}
                          />
                          <span className={styles.barLabel}>{task.title}</span>
                          <div
                            className={`${styles.resizeHandle} ${styles.resizeHandleRight}`}
                            data-testid={`resize-handle-right-${task.id}`}
                            style={{ position: 'absolute', width: 8, right: 0, top: 0, height: '100%', cursor: 'col-resize', zIndex: 2 }}
                            onMouseDown={(e) => handleResizeStart(e, task, 'resize-right')}
                          />
                        </div>
                      </Tooltip>
                    )}
                  </div>
                </div>
              );
            })}
            {visibleTasks.length === 0 && (
              <div className={styles.emptyState}>暂无任务数据</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
