import type React from 'react';
import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { DatePicker, Progress } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { Task, TaskStatus } from '@/types';
import { TASK_PRIORITY_CONFIG } from '@/constants';
import { TASK_STATUS_CONFIG } from '@/constants';
import styles from './KanbanView.module.css';

const { RangePicker } = DatePicker;

const KANBAN_COLUMNS: { key: string; label: string; statuses: string[] }[] = [
  { key: 'todo', label: '待办 (To do)', statuses: ['not_started', 'pending_assign'] },
  { key: 'in_progress', label: '进行中 (In Progress)', statuses: ['in_progress'] },
  { key: 'done', label: '已完成 (Done)', statuses: ['completed'] },
  { key: 'pending', label: '待审核 (Pending)', statuses: ['on_hold'] },
  { key: 'approved', label: '已批准 (Approved)', statuses: [] },
  { key: 'rejected', label: '已拒绝 (Rejected)', statuses: ['cancelled'] },
];

function KanbanCard({ task, isDragOverlay }: { task: Task; isDragOverlay?: boolean }) {
  const priorityCfg = TASK_PRIORITY_CONFIG[task.priority];
  const assigneeInit = task.assigneeId ? task.assigneeId.charAt(0).toUpperCase() : '?';

  return (
    <div
      className={`${styles.card} ${isDragOverlay ? styles.cardOverlay : ''}`}
      style={{ borderLeftColor: priorityCfg?.color || '#8C8C8C' }}
    >
      {task.planStart && (
        <div className={styles.cardDate}>{dayjs(task.planStart).format('M/D')}</div>
      )}
      <div className={styles.cardTitle}>{task.name}</div>
      <div className={styles.cardBottom}>
        <span
          className={styles.priorityTag}
          style={{
            color: priorityCfg?.color || '#8C8C8C',
            backgroundColor: priorityCfg?.bgColor || '#F5F5F5',
          }}
        >
          {priorityCfg?.label || task.priority}
        </span>
        <div className={styles.assigneeAvatar}>
          {assigneeInit}
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({
  column,
  tasks: columnTasks,
}: {
  column: (typeof KANBAN_COLUMNS)[number];
  tasks: Task[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.columnOver : ''}`}
    >
      <div className={styles.columnHeader}>
        <span className={styles.columnTitle}>{column.label}</span>
        <span className={styles.columnCount}>{columnTasks.length} tasks</span>
      </div>
      <div className={styles.columnBody}>
        {columnTasks.map((task) => (
          <DraggableCard key={task.id} task={task} />
        ))}
        {columnTasks.length === 0 && (
          <div className={styles.emptyColumn}>暂无任务</div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style: React.CSSProperties = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? styles.dragging : ''}
    >
      <KanbanCard task={task} />
    </div>
  );
}

interface KanbanViewProps {
  tasks: Task[];
  dateRange: [string, string];
  onDateRangeChange: (range: [string, string]) => void;
  completionRate: number;
  onTaskStatusChange: (taskId: string, newStatus: string) => void;
}

export default function KanbanView({
  tasks,
  dateRange,
  onDateRangeChange,
  completionRate,
  onTaskStatusChange,
}: KanbanViewProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const getColumnTasks = useCallback(
    (column: (typeof KANBAN_COLUMNS)[number]): Task[] => {
      return tasks.filter((t) => column.statuses.includes(t.status));
    },
    [tasks]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id);
      if (task) setActiveTask(task);
    },
    [tasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);
      if (!over) return;

      const taskId = active.id as string;
      const targetColumnKey = over.id as string;
      const targetColumn = KANBAN_COLUMNS.find((c) => c.key === targetColumnKey);
      if (!targetColumn) return;

      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      if (!targetColumn.statuses.includes(task.status)) {
        const newStatus = targetColumn.statuses[0];
        if (newStatus) {
          onTaskStatusChange(taskId, newStatus);
        }
      }
    },
    [tasks, onTaskStatusChange]
  );

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <div className={styles.dateSelector}>
          <RangePicker
            size="small"
            value={dateRange[0] && dateRange[1] ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                onDateRangeChange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
              }
            }}
            placeholder={['开始日期', '结束日期']}
            style={{ width: 280 }}
          />
        </div>
        <div className={styles.completion}>
          <span className={styles.completionLabel}>已完成</span>
          <Progress
            percent={completionRate}
            size="small"
            strokeColor="#52C41A"
            railColor="#F0F0F0"
            style={{ width: 120, marginBottom: 0 }}
          />
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.board}>
          {KANBAN_COLUMNS.map((column) => (
            <DroppableColumn
              key={column.key}
              column={column}
              tasks={getColumnTasks(column)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <KanbanCard task={activeTask} isDragOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
