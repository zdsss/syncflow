import type { Task } from '@/types';
import { TaskStatus, TaskPriority } from '@/types';

const statuses = [TaskStatus.NOT_STARTED, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.OVERDUE, TaskStatus.PENDING_ASSIGN, TaskStatus.URGENT, TaskStatus.ON_HOLD, TaskStatus.CANCELLED];
const priorities = [TaskPriority.URGENT, TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW];

function randomDate(start: string, end: string): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const d = new Date(s + Math.random() * (e - s));
  return d.toISOString().split('T')[0];
}

const taskNames = [
  '上海新能源电池pack外观设计', '确认新项目需求评审文档', '首页样式修改',
  '电池模组结构强度分析', 'BOM清单审核', '电池Pack热管理方案评审',
  '冷却液选型测试报告', '电池包外壳材料选型', '模组焊接工艺验证',
  'Pack装配工艺流程定义', '电池管理系统接口设计', 'BMS软件功能测试',
  '电池安全性测试方案', '热失控防护设计评审', '电气连接器选型',
  'Pack密封性测试', '模组绝缘电阻测试', '电池包跌落测试',
  '充电兼容性测试', '低温放电性能测试', '振动测试方案制定',
  'Pack气密性检测标准', '电池一致性分选方案', '模组组装SOP编写',
  'Pack终检流程定义', '供应商质量审核', '来料检验标准制定',
  '产线工装夹具设计', 'Pack标识标签设计', '产品使用说明书编写',
  '测试数据整理分析', '项目周报编写', '风险评估报告',
  '设计变更通知单', '工程变更申请', '客户反馈处理',
  '样品制作跟踪', '模具进度跟进', '采购订单跟踪',
  '质量异常处理', '生产排程协调', '交期评估',
  '成本核算分析', '技术方案对比', '专利申请文档',
];

function generateTasks(): Task[] {
  const tasks: Task[] = [];
  for (let i = 0; i < 100; i++) {
    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    const projectId = `p${(i % 10) + 1}`;
    const assigneeId = `u${(i % 15) + 1}`;
    const planStart = randomDate('2025-01-01', '2025-06-01');
    const planEnd = randomDate('2025-06-01', '2026-01-01');
    const progress = status === TaskStatus.COMPLETED ? 100 : status === TaskStatus.NOT_STARTED || status === TaskStatus.PENDING_ASSIGN ? 0 : Math.floor(Math.random() * 80) + 10;

    tasks.push({
      id: `t${i + 1}`,
      name: taskNames[i % taskNames.length] + (i >= taskNames.length ? ` (${Math.floor(i / taskNames.length) + 1})` : ''),
      description: `任务描述：${taskNames[i % taskNames.length]}`,
      projectId,
      priority,
      status,
      assigneeId,
      participantIds: [assigneeId, `u${((i + 3) % 15) + 1}`],
      planStart,
      planEnd,
      progress,
      milestone: i % 10 === 0,
      dependencies: i > 0 && i % 5 === 0 ? [`t${i}`] : [],
      tags: i % 3 === 0 ? ['设计'] : i % 3 === 1 ? ['测试'] : ['开发'],
      plannedHours: Math.floor(Math.random() * 40) + 8,
      loggedHours: status === TaskStatus.COMPLETED ? Math.floor(Math.random() * 40) + 8 : Math.floor(Math.random() * 20),
      createdAt: planStart + 'T08:00:00Z',
      updatedAt: randomDate('2025-03-01', '2025-05-01') + 'T08:00:00Z',
    });
  }
  return tasks;
}

export const mockTasks = generateTasks();
