import type { Task } from '@/types';

export interface SearchCondition {
  type: 'keyword' | 'assignee' | 'project' | 'taskType';
  value: string;
}

export interface SearchGroup {
  logic: 'AND' | 'OR';
  conditions: SearchCondition[];
}

/**
 * Parse a single token into a SearchCondition.
 * Recognised prefixes: @ = assignee, # = project, % = type
 */
function parseToken(token: string): SearchCondition {
  if (token.startsWith('@')) {
    return { type: 'assignee', value: token.slice(1).trim() };
  }
  if (token.startsWith('#')) {
    return { type: 'project', value: token.slice(1).trim() };
  }
  if (token.startsWith('%')) {
    return { type: 'taskType', value: token.slice(1).trim() };
  }
  return { type: 'keyword', value: token.trim() };
}

/**
 * Parse a search query into groups of conditions.
 *
 * - Comma (`,`) separates **OR** groups.
 * - Space within a group separates **AND** conditions.
 * - Prefixes: `@` assignee, `#` project, `%` type.
 *
 * Examples:
 *   "bug fix"         => AND(keyword:"bug", keyword:"fix")
 *   "bug, feature"    => OR(AND(keyword:"bug"), AND(keyword:"feature"))
 *   "@alice fix"      => AND(assignee:"alice", keyword:"fix")
 */
export function parseSearchQuery(input: string): SearchGroup[] {
  if (!input || !input.trim()) return [];

  const orParts = input.split(',').map((s) => s.trim()).filter(Boolean);

  return orParts.map((orPart) => {
    const tokens = orPart.split(/\s+/).filter(Boolean);
    return {
      logic: 'AND' as const,
      conditions: tokens.map(parseToken),
    };
  });
}

/**
 * Evaluate a single task against one SearchCondition.
 */
function matchesCondition(task: Task, condition: SearchCondition): boolean {
  const q = condition.value.toLowerCase();
  const t = task as Record<string, unknown>;

  switch (condition.type) {
    case 'assignee': {
      const name = (t.assigneeName ?? t.assignee ?? '') as string;
      return name.toLowerCase().includes(q);
    }
    case 'project': {
      const name = (t.projectName ?? t.project ?? '') as string;
      return name.toLowerCase().includes(q);
    }
    case 'taskType': {
      const type = (t.type ?? '') as string;
      return type.toLowerCase() === q;
    }
    case 'keyword':
    default: {
      const haystack = [
        (t.title ?? t.name ?? '') as string,
        (t.description ?? '') as string,
        (t.taskNo ?? t.code ?? '') as string,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    }
  }
}

/**
 * Filter tasks according to a search query string.
 *
 * Groups are OR-ed; conditions inside each group are AND-ed.
 */
export function filterTasksBySearch(tasks: Task[], query: string): Task[] {
  const groups = parseSearchQuery(query);
  if (groups.length === 0) return tasks;

  return tasks.filter((task) =>
    groups.some((group) =>
      group.conditions.every((cond) => matchesCondition(task, cond))
    )
  );
}
