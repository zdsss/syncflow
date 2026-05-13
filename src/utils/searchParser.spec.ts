import { describe, it, expect } from 'vitest';
import { parseSearchQuery, filterTasksBySearch } from './searchParser';
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
    description: 'Some description',
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
    progress: 50,
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

// ---------------------------------------------------------------------------
// parseSearchQuery
// ---------------------------------------------------------------------------
describe('parseSearchQuery', () => {
  it('returns empty array for empty input', () => {
    expect(parseSearchQuery('')).toEqual([]);
    expect(parseSearchQuery('   ')).toEqual([]);
  });

  it('single keyword', () => {
    const groups = parseSearchQuery('bug');
    expect(groups).toEqual([
      { logic: 'AND', conditions: [{ type: 'keyword', value: 'bug' }] },
    ]);
  });

  it('AND conditions (space-separated)', () => {
    const groups = parseSearchQuery('bug fix urgent');
    expect(groups).toHaveLength(1);
    expect(groups[0].logic).toBe('AND');
    expect(groups[0].conditions).toEqual([
      { type: 'keyword', value: 'bug' },
      { type: 'keyword', value: 'fix' },
      { type: 'keyword', value: 'urgent' },
    ]);
  });

  it('OR conditions (comma-separated)', () => {
    const groups = parseSearchQuery('bug, feature');
    expect(groups).toHaveLength(2);
    expect(groups[0]).toEqual({ logic: 'AND', conditions: [{ type: 'keyword', value: 'bug' }] });
    expect(groups[1]).toEqual({ logic: 'AND', conditions: [{ type: 'keyword', value: 'feature' }] });
  });

  it('mixed AND/OR', () => {
    const groups = parseSearchQuery('bug fix, feature request');
    expect(groups).toHaveLength(2);
    expect(groups[0].conditions).toEqual([
      { type: 'keyword', value: 'bug' },
      { type: 'keyword', value: 'fix' },
    ]);
    expect(groups[1].conditions).toEqual([
      { type: 'keyword', value: 'feature' },
      { type: 'keyword', value: 'request' },
    ]);
  });

  it('prefix conditions (@ # %)', () => {
    const groups = parseSearchQuery('@alice #Alpha %TASK');
    expect(groups).toHaveLength(1);
    expect(groups[0].conditions).toEqual([
      { type: 'assignee', value: 'alice' },
      { type: 'project', value: 'Alpha' },
      { type: 'taskType', value: 'TASK' },
    ]);
  });
});

// ---------------------------------------------------------------------------
// filterTasksBySearch
// ---------------------------------------------------------------------------
describe('filterTasksBySearch', () => {
  const tasks: Task[] = [
    makeTask({ id: 1, title: 'Fix login bug', assigneeName: 'Alice', projectName: 'Alpha', type: 'TASK' }),
    makeTask({ id: 2, title: 'Add new feature', assigneeName: 'Bob', projectName: 'Beta', type: 'FEATURE' as any }),
    makeTask({ id: 3, title: 'Write documentation', assigneeName: 'Alice', projectName: 'Alpha', type: 'ACTIVITY' }),
    makeTask({ id: 4, title: 'Bug review meeting', assigneeName: 'Charlie', projectName: 'Gamma', type: 'TASK' }),
  ];

  it('returns all tasks for empty query', () => {
    expect(filterTasksBySearch(tasks, '')).toHaveLength(4);
  });

  it('filters by keyword', () => {
    const result = filterTasksBySearch(tasks, 'bug');
    expect(result.map((t) => t.id)).toEqual([1, 4]);
  });

  it('filters by assignee prefix', () => {
    const result = filterTasksBySearch(tasks, '@Alice');
    expect(result.map((t) => t.id)).toEqual([1, 3]);
  });

  it('filters by project prefix', () => {
    const result = filterTasksBySearch(tasks, '#Beta');
    expect(result.map((t) => t.id)).toEqual([2]);
  });

  it('filters by type prefix', () => {
    const result = filterTasksBySearch(tasks, '%TASK');
    expect(result.map((t) => t.id)).toEqual([1, 4]);
  });

  it('AND logic narrows results', () => {
    const result = filterTasksBySearch(tasks, '@Alice bug');
    expect(result.map((t) => t.id)).toEqual([1]);
  });

  it('OR logic broadens results', () => {
    const result = filterTasksBySearch(tasks, 'bug, feature');
    expect(result.map((t) => t.id)).toEqual([1, 2, 4]);
  });
});
