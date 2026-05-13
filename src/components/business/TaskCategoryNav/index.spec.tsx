import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCategoryNav, { CATEGORIES } from './index';
import type { Task } from '@/types';
import { TaskStatus, TaskPriority } from '@/types';

// ---------------------------------------------------------------------------
// Helper – minimal Task stub
// ---------------------------------------------------------------------------
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    taskNo: 'T-001',
    title: 'Test task',
    description: '',
    type: 'TASK',
    projectId: 1,
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.IN_PROGRESS,
    assigneeId: 1,
    assigneeName: 'Alice',
    reporterName: 'Bob',
    projectName: 'Alpha',
    plannedStart: '2025-01-01',
    plannedEnd: '2025-01-10',
    progress: 0,
    tags: '',
    isWatching: false,
    isOverdue: false,
    isWarning: false,
    commentCount: 0,
    watcherCount: 0,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

const sampleTasks: Task[] = [
  makeTask({ id: 1, type: 'TASK', isOverdue: false, isWarning: true }),
  makeTask({ id: 2, type: 'ISSUE', isOverdue: true, isWarning: false }),
  makeTask({ id: 3, type: 'ACTIVITY', isWatching: true }),
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('TaskCategoryNav', () => {
  it('renders all category items', () => {
    render(
      <TaskCategoryNav
        tasks={sampleTasks}
        activeCategory="all"
        onCategoryChange={vi.fn()}
      />
    );

    for (const cat of CATEGORIES) {
      expect(screen.getByTestId(`category-${cat.key}`)).toBeTruthy();
      expect(screen.getByText(cat.label)).toBeTruthy();
    }
  });

  it('calls onCategoryChange when a category is clicked', () => {
    const handleChange = vi.fn();
    render(
      <TaskCategoryNav
        tasks={sampleTasks}
        activeCategory="all"
        onCategoryChange={handleChange}
      />
    );

    fireEvent.click(screen.getByTestId('category-today'));
    expect(handleChange).toHaveBeenCalledWith('today');

    fireEvent.click(screen.getByTestId('category-issue'));
    expect(handleChange).toHaveBeenCalledWith('issue');
  });

  it('highlights the active category', () => {
    render(
      <TaskCategoryNav
        tasks={sampleTasks}
        activeCategory="warning"
        onCategoryChange={vi.fn()}
      />
    );

    const warningItem = screen.getByTestId('category-warning');
    // The active class should be applied (CSS modules may hash it, so check the attribute presence)
    expect(warningItem.className).toContain('itemActive');
  });

  it('renders nav element with testid', () => {
    render(
      <TaskCategoryNav
        tasks={sampleTasks}
        activeCategory="all"
        onCategoryChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('task-category-nav')).toBeTruthy();
  });
});
