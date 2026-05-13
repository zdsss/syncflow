export const TASK_STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '待处理', color: '#8C8C8C' },
  2: { label: '进行中', color: '#FAAD14' },
  3: { label: '待审核', color: '#A0522D' },
  4: { label: '已完成', color: '#52C41A' },
  5: { label: '已取消', color: '#BFBFBF' },
  6: { label: '暂停', color: '#FF9C00' },
  7: { label: '逾期', color: '#FF4D4F' },
};

export const TASK_PRIORITY_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '紧急', color: '#FF4D4F' },
  2: { label: '高', color: '#FF9C00' },
  3: { label: '中', color: '#FAAD14' },
  4: { label: '低', color: '#52C41A' },
};

export const PROJECT_STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '已取消', color: '#BFBFBF' },
  1: { label: '未开始', color: '#8C8C8C' },
  2: { label: '进行中', color: '#FAAD14' },
  3: { label: '已完成', color: '#52C41A' },
  4: { label: '已延期', color: '#FF4D4F' },
};

/** Helper: get label for a project status integer */
export function getProjectStatusLabel(status: number): string {
  return PROJECT_STATUS_MAP[status]?.label ?? '未知';
}

/** Helper: get color for a project status integer */
export function getProjectStatusColor(status: number): string {
  return PROJECT_STATUS_MAP[status]?.color ?? '#8C8C8C';
}

/** Helper: get label for a task status integer */
export function getTaskStatusLabel(status: number): string {
  return TASK_STATUS_MAP[status]?.label ?? '未知';
}

/** Helper: get color for a task status integer */
export function getTaskStatusColor(status: number): string {
  return TASK_STATUS_MAP[status]?.color ?? '#8C8C8C';
}
