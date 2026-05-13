import type React from 'react';
import { useState, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import type { Task } from '@/types';

export interface DragState {
  taskId: string;
  startX: number;
  type: 'move' | 'resize-left' | 'resize-right';
}

export interface UseGanttDragOptions {
  onTaskUpdate?: (taskId: number, updates: { plannedStart?: string; plannedEnd?: string }) => void;
  totalTimelineWidth: number;
  totalDays: number;
  tasks: Task[];
}

export function useGanttDrag({ onTaskUpdate, totalTimelineWidth, totalDays, tasks }: UseGanttDragOptions) {
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    e.preventDefault();
    setDragging({ taskId: task.id, startX: e.clientX, type: 'move' });
    setDragOffset(0);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const offset = moveEvent.clientX - e.clientX;
      setDragOffset(offset);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const finalOffset = upEvent.clientX - e.clientX;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setDragging(null);
      setDragOffset(0);

      if (Math.abs(finalOffset) > 5 && onTaskUpdate) {
        const daysOffset = Math.round((finalOffset / totalTimelineWidth) * totalDays);
        const t = tasks.find((tk) => tk.id === task.id) || task;
        if (t.plannedStart && t.plannedEnd) {
          const newStart = dayjs(t.plannedStart).add(daysOffset, 'day').format('YYYY-MM-DD');
          const newEnd = dayjs(t.plannedEnd).add(daysOffset, 'day').format('YYYY-MM-DD');
          onTaskUpdate(t.id, { plannedStart: newStart, plannedEnd: newEnd });
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onTaskUpdate, totalTimelineWidth, totalDays, tasks]);

  const handleResizeStart = useCallback((e: React.MouseEvent, task: Task, resizeType: 'resize-left' | 'resize-right') => {
    e.stopPropagation();
    e.preventDefault();
    setDragging({ taskId: task.id, startX: e.clientX, type: resizeType });
    setDragOffset(0);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const offset = moveEvent.clientX - e.clientX;
      setDragOffset(offset);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const finalOffset = upEvent.clientX - e.clientX;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setDragging(null);
      setDragOffset(0);

      if (Math.abs(finalOffset) > 5 && onTaskUpdate) {
        const daysOffset = Math.round((finalOffset / totalTimelineWidth) * totalDays);
        const t = tasks.find((tk) => tk.id === task.id) || task;
        if (t.plannedStart && t.plannedEnd) {
          if (resizeType === 'resize-right') {
            const currentStart = dayjs(t.plannedStart);
            const proposedEnd = dayjs(t.plannedEnd).add(daysOffset, 'day');
            const finalEnd = proposedEnd.isAfter(currentStart.add(1, 'day')) ? proposedEnd : currentStart.add(1, 'day');
            onTaskUpdate(t.id, { plannedEnd: finalEnd.format('YYYY-MM-DD') });
          } else {
            const currentEnd = dayjs(t.plannedEnd);
            const proposedStart = dayjs(t.plannedStart).add(daysOffset, 'day');
            const finalStart = proposedStart.isBefore(currentEnd.subtract(1, 'day')) ? proposedStart : currentEnd.subtract(1, 'day');
            onTaskUpdate(t.id, { plannedStart: finalStart.format('YYYY-MM-DD') });
          }
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onTaskUpdate, totalTimelineWidth, totalDays, tasks]);

  return {
    dragging,
    dragOffset,
    dragRef,
    handleDragStart,
    handleResizeStart,
  };
}
