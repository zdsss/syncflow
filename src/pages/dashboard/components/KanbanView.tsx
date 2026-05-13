import type React from 'react';
import { useState, useCallback, useMemo } from 'react';
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
import { DatePicker, Select, Space } from 'antd';
import dayjs from 'dayjs';
import type { Task, TaskStatus } from '@/types';
import { TaskStatus as TaskStatusEnum, TaskPriority } from '@/types';
import { TASK_PRIORITY_CONFIG } from '@/constants/enums';
import styles from './KanbanView.module.css';

const { RangePicker } = DatePicker;

const KANBAN_COLUMNS: { key: string; label: string; statuses: TaskStatus[] }[] = [
  { key: 'todo', label: '待办', statuses: [TaskStatusEnum.PENDING] },
  { key: 'in_progress', label: '进行中', statuses: [TaskStatusEnum.IN_PROGRESS] },
  { key: 'done', label: '已完成', statuses: [TaskStatusEnum.COMPLETED] },
  { key: 'pending', label: '待审核', statuses: [TaskStatusEnum.PENDING_REVIEW] },
  { key: 'rejected', label: '已取消', statuses: [TaskStatusEnum.CANCELLED] },
];

function KanbanCard({ task, isDragOverlay }: { task: Task; isDragOverlay?: boolean }) {
  const priorityCfg = TASK_PRIORITY_CONFIG[task.priority];
  const assigneeInit = task.assigneeName ? task.assigneeName.charAt(0).toUpperCase() : '?';

  return (
    <div
      className={`${styles.card} ${isDragOverlay ? styles.cardOverlay : ''}`}
      style={{ borderLeftColor: priorityCfg?.color || '#8C8C8C' }}
      data-priority={task.priority}
    >
      {task.plannedStart && (
        <div className={styles.cardDate}>{dayjs(task.plannedStart).format('M/D')}</div>
      )}
      <div className={styles.cardTitle}>{task.title}</div>
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
      data-column-key={column.key}
      data-droppable="true"
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
      data-task-id={task.id}
      data-dragging={String(isDragging)}
    >
      <KanbanCard task={task} />
    </div>
  );
}

interface KanbanViewProps {
  tasks: Task[];
  dateRange: [string, string];
  onDateRangeChange: (range: [string, string]) => void;
  onTaskStatusChange: (taskId: number, newStatus: TaskStatus) => void;
}

export default function KanbanView({
  tasks,
  dateRange,
  onDateRangeChange,
  onTaskStatusChange,
}: KanbanViewProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [sortBy, setSortBy] = useState<string>('none');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const processedTasks = useMemo(() => {
    let result = [...tasks];
    if (filterPriority === 'high') {
      result = result.filter((t) => t.priority === TaskPriority.HIGH);
    } else if (filterPriority === 'urgent') {
      result = result.filter((t) => t.priority === TaskPriority.URGENT);
    }
    if (sortBy === 'priority') {
      result.sort((a, b) => a.priority - b.priority);
    } else if (sortBy === 'date') {
      result.sort((a, b) => (a.plannedEnd || '').localeCompare(b.plannedEnd || ''));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    return result;
  }, [tasks, sortBy, filterPriority]);

  const getColumnTasks = useCallback(
    (column: (typeof KANBAN_COLUMNS)[number]): Task[] => {
      return processedTasks.filter((t) => column.statuses.includes(t.status));
    },
    [processedTasks]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => String(t.id) === event.active.id);
      if (task) setActiveTask(task);
    },
    [tasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);
      if (!over) return;

      const taskId = Number(active.id);
      const targetColumnKey = over.id as string;
      const targetColumn = KANBAN_COLUMNS.find((c) => c.key === targetColumnKey);
      if (!targetColumn) return;

      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      if (!targetColumn.statuses.includes(task.status)) {
        const newStatus = targetColumn.statuses[0];
        if (newStatus != null) {
          onTaskStatusChange(taskId, newStatus);
        }
      }
    },
    [tasks, onTaskStatusChange]
  );

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <Space size="middle">
          <Select
            size="small"
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 130 }}
            options={[
              { value: 'none', label: '排序方式' },
              { value: 'priority', label: '按优先级' },
              { value: 'date', label: '按日期' },
              { value: 'name', label: '按名称' },
            ]}
            data-testid="kanban-sort-select"
          />
          <Select
            size="small"
            value={filterPriority}
            onChange={setFilterPriority}
            style={{ width: 120 }}
            options={[
              { value: 'all', label: '全部' },
              { value: 'high', label: '高优先级' },
              { value: 'urgent', label: '紧急' },
            ]}
            data-testid="kanban-filter-select"
          />
        </Space>
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
