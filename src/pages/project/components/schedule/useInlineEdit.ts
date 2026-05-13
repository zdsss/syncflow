import { useState, useCallback } from 'react';
import type { Task } from '@/types';

export interface UseInlineEditReturn {
  editingId: number | null;
  editStart: string;
  editEnd: string;
  setEditStart: (v: string) => void;
  setEditEnd: (v: string) => void;
  startEdit: (task: Task, e?: React.MouseEvent) => void;
  cancelEdit: () => void;
  confirmEdit: () => void;
  handleEditKeyDown: (e: React.KeyboardEvent) => void;
}

export function useInlineEdit(
  onSave?: (taskId: number, data: Partial<Task>) => void,
): UseInlineEditReturn {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  const startEdit = useCallback((task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(task.id);
    setEditStart(task.plannedStart || '');
    setEditEnd(task.plannedEnd || '');
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const confirmEdit = useCallback(() => {
    if (editingId != null && onSave) {
      onSave(editingId, { plannedStart: editStart, plannedEnd: editEnd } as Partial<Task>);
    }
    setEditingId(null);
  }, [editingId, editStart, editEnd, onSave]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelEdit();
      } else if (e.key === 'Enter') {
        confirmEdit();
      }
    },
    [cancelEdit, confirmEdit],
  );

  return {
    editingId,
    editStart,
    editEnd,
    setEditStart,
    setEditEnd,
    startEdit,
    cancelEdit,
    confirmEdit,
    handleEditKeyDown,
  };
}
