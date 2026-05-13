import type { Task, TaskDependency } from '@/types';

export interface CPMData {
  es: number;
  ef: number;
  ls: number;
  lf: number;
  slack: number;
  isCritical: boolean;
}

function calcDays(start: string, end: string): number {
  return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
}

function getField(task: Task, newField: string, oldField: string): string | undefined {
  return (task as unknown as Record<string, string | undefined>)[newField]
    ?? (task as unknown as Record<string, string | undefined>)[oldField];
}

export function calculateCriticalPath(tasks: Task[]): Map<string, CPMData> {
  const result = new Map<string, CPMData>();

  if (tasks.length === 0) return result;

  // Normalize all IDs to strings for consistent Map lookups
  const sid = (id: number | string): string => String(id);

  // Build task map and find earliest project start
  const taskMap = new Map<string, Task>();
  let projectStart = Infinity;
  for (const t of tasks) {
    taskMap.set(sid(t.id), t);
    const start = getField(t, 'plannedStart', 'planStart');
    if (start) {
      const startMs = new Date(start).getTime();
      if (startMs < projectStart) projectStart = startMs;
    }
  }
  if (!isFinite(projectStart)) projectStart = Date.now();

  // Helper: get duration in days for a task
  const getDuration = (task: Task): number => {
    const start = getField(task, 'plannedStart', 'planStart');
    const end = getField(task, 'plannedEnd', 'planEnd');
    if (!start || !end) return 0;
    return Math.max(1, calcDays(start, end));
  };

  // Build dependency type map: taskId -> dependsOnId -> type
  const depTypeMap = new Map<string, Map<string, string>>();
  for (const t of tasks) {
    const details = (t as unknown as Record<string, TaskDependency[]>).dependencyDetails;
    if (details?.length) {
      const typeMap = new Map<string, string>();
      for (const d of details) {
        typeMap.set(sid(d.dependsOnId), d.type || 'FS');
      }
      depTypeMap.set(sid(t.id), typeMap);
    }
  }

  // Build adjacency lists
  const successors = new Map<string, string[]>();
  const predecessors = new Map<string, string[]>();
  for (const t of tasks) {
    successors.set(sid(t.id), []);
    predecessors.set(sid(t.id), []);
  }
  for (const t of tasks) {
    for (const depId of t.dependencies || []) {
      const nid = sid(depId);
      if (taskMap.has(nid)) {
        successors.get(nid)!.push(sid(t.id));
        predecessors.get(sid(t.id)!)!.push(nid);
      }
    }
  }

  // Topological sort (Kahn's algorithm) - handles cycles by skipping cycle nodes
  const inDegree = new Map<string, number>();
  for (const t of tasks) {
    inDegree.set(sid(t.id), (predecessors.get(sid(t.id)) || []).filter((p) => taskMap.has(p)).length);
  }
  const queue: string[] = [];
  for (const t of tasks) {
    if ((inDegree.get(sid(t.id)) || 0) === 0) queue.push(sid(t.id));
  }
  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    topoOrder.push(id);
    for (const succ of successors.get(id) || []) {
      const deg = (inDegree.get(succ) || 1) - 1;
      inDegree.set(succ, deg);
      if (deg === 0) queue.push(succ);
    }
  }

  // Forward pass: compute ES and EF (respecting dependency types)
  const es = new Map<string, number>();
  const ef = new Map<string, number>();
  for (const id of topoOrder) {
    const task = taskMap.get(id)!;
    const preds = predecessors.get(id) || [];
    const duration = getDuration(task);
    let earlyStart: number;
    let earlyFinish: number;

    if (preds.length === 0) {
      earlyStart = 0;
      earlyFinish = duration;
    } else {
      const typeMap = depTypeMap.get(id);
      // For each predecessor, compute constraint based on dependency type
      const constraints: { es: number; ef: number }[] = preds.map((p) => {
        const depType = typeMap?.get(p) || 'FS';
        const predES = es.get(p) ?? 0;
        const predEF = ef.get(p) ?? 0;
        switch (depType) {
          case 'SS': return { es: predES, ef: predES + duration };
          case 'FF': return { ef: predEF, es: predEF - duration };
          case 'SF': return { ef: predES, es: predES - duration };
          case 'FS':
          default:   return { es: predEF, ef: predEF + duration };
        }
      });
      earlyStart = Math.max(...constraints.map((c) => c.es));
      earlyFinish = earlyStart + duration;
    }
    es.set(id, earlyStart);
    ef.set(id, earlyFinish);
  }

  // Project end = max EF
  const projectEnd = Math.max(...Array.from(ef.values()), 0);

  // Backward pass: compute LF and LS (respecting dependency types)
  const lf = new Map<string, number>();
  const ls = new Map<string, number>();
  const reverseOrder = [...topoOrder].reverse();
  for (const id of reverseOrder) {
    const task = taskMap.get(id)!;
    const succs = successors.get(id) || [];
    const duration = getDuration(task);
    let lateFinish: number;
    let lateStart: number;

    if (succs.length === 0) {
      lateFinish = projectEnd;
      lateStart = projectEnd - duration;
    } else {
      // For each successor, compute constraint based on dependency type (reversed)
      const constraints: { lf: number; ls: number }[] = succs.map((s) => {
        const succTypeMap = depTypeMap.get(s);
        const depType = succTypeMap?.get(id) || 'FS';
        const succLS = ls.get(s) ?? projectEnd;
        const succLF = lf.get(s) ?? projectEnd;
        switch (depType) {
          case 'SS': return { ls: succLS, lf: succLS + duration };
          case 'FF': return { lf: succLF, ls: succLF - duration };
          case 'SF': return { lf: succLS, ls: succLS - duration };
          case 'FS':
          default:   return { lf: succLS, ls: succLS - duration };
        }
      });
      lateFinish = Math.min(...constraints.map((c) => c.lf));
      lateStart = lateFinish - duration;
    }
    lf.set(id, lateFinish);
    ls.set(id, lateStart);
  }

  // Calculate slack and build result
  for (const t of tasks) {
    const id = sid(t.id);
    if (!topoOrder.includes(id)) {
      // Cycle node
      const start = getField(t, 'plannedStart', 'planStart');
      const end = getField(t, 'plannedEnd', 'planEnd');
      const earlyStart = start ? Math.max(0, Math.round((new Date(start).getTime() - projectStart) / (1000 * 60 * 60 * 24))) : 0;
      const duration = getDuration(t);
      result.set(id, {
        es: earlyStart,
        ef: earlyStart + duration,
        ls: earlyStart,
        lf: earlyStart + duration,
        slack: 0,
        isCritical: true,
      });
      continue;
    }
    const earlyStart = es.get(id) ?? 0;
    const lateStart = ls.get(id) ?? 0;
    const slack = lateStart - earlyStart;
    result.set(id, {
      es: earlyStart,
      ef: ef.get(id) ?? 0,
      ls: lateStart,
      lf: lf.get(id) ?? 0,
      slack: Math.max(0, Math.round(slack)),
      isCritical: Math.abs(slack) < 0.01,
    });
  }

  return result;
}
