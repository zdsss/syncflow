import { TaskStatus, TaskPriority, ProjectPhase, ProjectStatus } from '@/types';

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  [TaskStatus.PENDING_ASSIGN]: { label: '待分配', color: '#8C8C8C', bgColor: '#F5F5F5' },
  [TaskStatus.NOT_STARTED]: { label: '未开始', color: '#8C8C8C', bgColor: '#F5F5F5' },
  [TaskStatus.IN_PROGRESS]: { label: '进行中', color: '#FAAD14', bgColor: '#FFF7E6' },
  [TaskStatus.ON_HOLD]: { label: '暂停', color: '#A0522D', bgColor: '#FFF1F0' },
  [TaskStatus.COMPLETED]: { label: '已完成', color: '#52C41A', bgColor: '#F6FFED' },
  [TaskStatus.OVERDUE]: { label: '已延期', color: '#A0522D', bgColor: '#FFF1F0' },
  [TaskStatus.CANCELLED]: { label: '已取消', color: '#BFBFBF', bgColor: '#F5F5F5' },
  [TaskStatus.URGENT]: { label: '紧急', color: '#FF4D4F', bgColor: '#FFF1F0' },
};

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  [TaskPriority.URGENT]: { label: '紧急', color: '#FF4D4F', bgColor: '#FFF1F0' },
  [TaskPriority.HIGH]: { label: '高', color: '#FF4D4F', bgColor: '#FFF1F0' },
  [TaskPriority.MEDIUM]: { label: '中', color: '#FAAD14', bgColor: '#FFF7E6' },
  [TaskPriority.LOW]: { label: '低', color: '#52C41A', bgColor: '#F6FFED' },
};

export const PROJECT_PHASE_CONFIG: Record<ProjectPhase, { label: string; color: string }> = {
  [ProjectPhase.SURVEY]: { label: '调查', color: '#8C8C8C' },
  [ProjectPhase.CONCEPT]: { label: '概念', color: '#3366FF' },
  [ProjectPhase.PLANNING]: { label: '计划', color: '#FAAD14' },
  [ProjectPhase.DEVELOPMENT]: { label: '开发', color: '#FF9C00' },
  [ProjectPhase.TESTING]: { label: '测试', color: '#3366FF' },
  [ProjectPhase.MASS_PRODUCTION]: { label: '量产', color: '#52C41A' },
};

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  [ProjectStatus.NOT_STARTED]: { label: '未开始', color: '#8C8C8C' },
  [ProjectStatus.IN_PROGRESS]: { label: '进行中', color: '#FAAD14' },
  [ProjectStatus.COMPLETED]: { label: '已完成', color: '#52C41A' },
  [ProjectStatus.DELAYED]: { label: '已延期', color: '#A0522D' },
};
