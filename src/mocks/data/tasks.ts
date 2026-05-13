import type { Task, TaskDependency } from '@/types';
import { TaskStatus, TaskPriority } from '@/types';

/**
 * 按业务逻辑构造的测试数据：电池Pack项目
 *
 * 项目结构：
 *   电池Pack项目 (projectId=4)
 *   ├── 概念设计阶段 (STAGE)
 *   │   ├── 需求分析 (已完成)
 *   │   ├── 概念方案设计 (已完成)
 *   │   └── 概念评审 (MILESTONE, 已完成)
 *   ├── 详细设计阶段 (STAGE)
 *   │   ├── 结构设计 (进行中)
 *   │   ├── 热管理设计 (进行中)
 *   │   ├── BMS接口设计 (待审核)
 *   │   ├── BOM清单编制 (未开始)
 *   │   └── 设计评审 (MILESTONE, 未开始)
 *   ├── 样件制作阶段 (STAGE)
 *   │   ├── 模具开发 (未开始)
 *   │   ├── 样件组装 (未开始)
 *   │   └── 样件确认 (MILESTONE, 未开始)
 *   ├── 验证测试阶段 (STAGE)
 *   │   ├── 安全性测试 (未开始)
 *   │   ├── 环境测试 (未开始)
 *   │   ├── 充放电测试 (未开始)
 *   │   └── 测试报告 (未开始)
 *   ├── 问题跟踪 (ISSUE)
 *   ├── 风险项 (RISK)
 *   ├── 改进建议 (SUGGESTION)
 *   └── 变更申请 (CHANGE)
 *
 * 充电桩项目 (projectId=9)
 *   ├── 需求评审 (逾期)
 *   ├── 方案设计 (进行中)
 *   └── 软件开发 (进行中)
 *
 * 依赖关系：
 *   结构设计 --FS--> 模具开发
 *   热管理设计 --FS--> 样件组装
 *   模具开发 --FS--> 样件组装
 *   概念评审 --FS--> 结构设计 (阶段间)
 *   样件确认 --FS--> 安全性测试
 */

// ── 用户映射（id → name + department）─────────────────────────
const userMap: Record<number, { name: string; dept: string }> = {
  1:  { name: '邓智豪', dept: '设计部' },
  2:  { name: '王美玲', dept: '设计部' },
  3:  { name: '陈思远', dept: '设计部' },
  4:  { name: '李小龙', dept: '设计部' },
  5:  { name: '赵雨薇', dept: '设计部' },
  6:  { name: '张伟',   dept: '公司管理层' },
  7:  { name: '李娜',   dept: '公司管理层' },
  8:  { name: '王晓明', dept: '产品部' },
  9:  { name: '赵静怡', dept: '产品部' },
  10: { name: '刘伟',   dept: '研发部' },
  11: { name: '陈晨',   dept: '研发部' },
  12: { name: '周鑫',   dept: '研发部' },
  13: { name: '孙小雨', dept: '测试部' },
  14: { name: '吴文杰', dept: '测试部' },
  15: { name: '刘婷婷', dept: '产品部' },
};

function u(id: number) {
  return { assigneeId: id, assigneeName: userMap[id].name, deptName: userMap[id].dept };
}

function today(): string { return new Date().toISOString().split('T')[0]; }
function daysAgo(n: number): string { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; }
function daysFromNow(n: number): string { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; }

// ── 电池Pack项目 阶段ID ──────────────────────────────────────
const PHASE_CONCEPT = 100;
const PHASE_DETAIL  = 101;
const PHASE_PROTO   = 102;
const PHASE_TEST    = 103;

// ── 依赖关系 ─────────────────────────────────────────────────
const dep = (taskId: number, dependsOnId: number, type: TaskDependency['type'] = 'FS'): TaskDependency => ({
  taskId: String(taskId), dependsOnId: String(dependsOnId), type,
});

// 所有依赖关系集中定义
const allDependencies: TaskDependency[] = [
  dep(2, 1),       // 概念方案 --FS--> 需求分析
  dep(3, 2, 'FF'), // 概念评审 --FF--> 概念方案
  dep(4, 3),       // 结构设计 --FS--> 概念评审
  dep(5, 3),       // 热管理设计 --FS--> 概念评审
  dep(6, 3),       // BMS接口设计 --FS--> 概念评审
  dep(7, 4),       // BOM清单 --FS--> 结构设计
  dep(7, 5),       // BOM清单 --FS--> 热管理设计
  dep(9, 4),       // 模具开发 --FS--> 结构设计
  dep(10, 5),      // 样件组装 --FS--> 热管理设计
  dep(10, 9),      // 样件组装 --FS--> 模具开发
  dep(12, 10, 'SS'),// 安全性测试 --SS--> 样件组装（同步开始）
  dep(13, 10),     // 环境测试 --FS--> 样件组装
  dep(14, 12),     // 充放电测试 --FS--> 安全性测试
];

function depsFor(taskId: number): TaskDependency[] {
  return allDependencies.filter(d => d.taskId === String(taskId));
}
function depIdsFor(taskId: number): string[] {
  return allDependencies.filter(d => d.taskId === String(taskId)).map(d => d.dependsOnId);
}

// ── 主任务列表 ───────────────────────────────────────────────
export const mockTasks: Task[] = [
  // ═══════════════════════════════════════════════════════════
  // 电池Pack项目 (projectId=4) - 概念设计阶段
  // ═══════════════════════════════════════════════════════════
  {
    id: 1, taskNo: 'BP-001', title: '电池Pack需求分析', description: '收集整车需求、法规要求、性能指标，输出需求规格书',
    type: 'TASK', projectId: 4, parentId: PHASE_CONCEPT, phaseId: PHASE_CONCEPT,
    priority: TaskPriority.HIGH, status: TaskStatus.COMPLETED,
    ...u(8), reporterName: '张伟', projectName: '电池Pack',
    plannedStart: '2025-03-01', plannedEnd: '2025-03-31',
    actualStart: '2025-03-01', actualEnd: '2025-03-28',
    progress: 100, tags: '产品,需求',
    plannedHours: 80, actualHours: 72,
    isWatching: true, isOverdue: false, isWarning: false,
    commentCount: 5, watcherCount: 3,
    participants: ['赵静怡', '刘婷婷'],
    createdAt: '2025-03-01T08:00:00Z', updatedAt: '2025-03-28T17:00:00Z',
  },
  {
    id: 2, taskNo: 'BP-002', title: 'Pack概念方案设计', description: '根据需求规格书进行电池Pack概念方案设计，包括电芯选型、模组配置、结构布局',
    type: 'TASK', projectId: 4, parentId: PHASE_CONCEPT, phaseId: PHASE_CONCEPT,
    priority: TaskPriority.HIGH, status: TaskStatus.COMPLETED,
    ...u(1), reporterName: '张伟', projectName: '电池Pack',
    plannedStart: '2025-03-15', plannedEnd: '2025-04-15',
    actualStart: '2025-03-15', actualEnd: '2025-04-12',
    progress: 100, tags: '设计,概念',
    plannedHours: 120, actualHours: 108,
    dependencies: ['1'], dependencyDetails: depsFor(2),
    isWatching: true, isOverdue: false, isWarning: false,
    commentCount: 8, watcherCount: 5,
    participants: ['王美玲', '陈思远'],
    createdAt: '2025-03-15T08:00:00Z', updatedAt: '2025-04-12T17:00:00Z',
  },
  {
    id: 3, taskNo: 'BP-003', title: '概念设计评审', description: '组织跨部门评审，确认概念方案可行性',
    type: 'MILESTONE', projectId: 4, parentId: PHASE_CONCEPT, phaseId: PHASE_CONCEPT,
    milestoneId: 1,
    priority: TaskPriority.HIGH, status: TaskStatus.COMPLETED,
    ...u(6), reporterName: '李娜', projectName: '电池Pack',
    plannedStart: '2025-04-15', plannedEnd: '2025-04-15',
    actualStart: '2025-04-15', actualEnd: '2025-04-15',
    progress: 100, tags: '里程碑,评审',
    plannedHours: 8, actualHours: 6,
    dependencies: ['2'], dependencyDetails: depsFor(3),
    isWatching: true, isOverdue: false, isWarning: false,
    commentCount: 3, watcherCount: 8,
    createdAt: '2025-04-15T09:00:00Z', updatedAt: '2025-04-15T17:00:00Z',
  },

  // ═══════════════════════════════════════════════════════════
  // 电池Pack项目 - 详细设计阶段
  // ═══════════════════════════════════════════════════════════
  {
    id: 4, taskNo: 'BP-004', title: 'Pack结构设计', description: '电池包外壳、支架、连接件3D建模及2D工程图输出',
    type: 'TASK', projectId: 4, parentId: PHASE_DETAIL, phaseId: PHASE_DETAIL,
    priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS,
    ...u(1), reporterName: '张伟', projectName: '电池Pack',
    plannedStart: '2025-04-20', plannedEnd: daysFromNow(15),
    actualStart: '2025-04-20',
    progress: 65, tags: '设计,结构',
    plannedHours: 160, actualHours: 104,
    dependencies: ['3'], dependencyDetails: depsFor(4),
    isWatching: true, isOverdue: false, isWarning: false,
    commentCount: 12, watcherCount: 4,
    participants: ['陈思远', '李小龙'],
    createdAt: '2025-04-20T08:00:00Z', updatedAt: today() + 'T10:00:00Z',
  },
  {
    id: 5, taskNo: 'BP-005', title: '热管理方案设计', description: '液冷板设计、冷却液流道布局、散热仿真分析',
    type: 'TASK', projectId: 4, parentId: PHASE_DETAIL, phaseId: PHASE_DETAIL,
    priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS,
    ...u(2), reporterName: '张伟', projectName: '电池Pack',
    plannedStart: '2025-04-20', plannedEnd: daysFromNow(20),
    actualStart: '2025-04-22',
    progress: 45, tags: '设计,热管理',
    plannedHours: 140, actualHours: 63,
    dependencies: ['3'], dependencyDetails: depsFor(5),
    isWatching: true, isOverdue: false, isWarning: false,
    commentCount: 6, watcherCount: 3,
    participants: ['赵雨薇'],
    createdAt: '2025-04-20T08:00:00Z', updatedAt: today() + 'T09:00:00Z',
  },
  {
    id: 6, taskNo: 'BP-006', title: 'BMS接口设计', description: '电池管理系统通信接口定义、CAN协议设计、传感器接口规划',
    type: 'TASK', projectId: 4, parentId: PHASE_DETAIL, phaseId: PHASE_DETAIL,
    priority: TaskPriority.MEDIUM, status: TaskStatus.PENDING_REVIEW,
    ...u(10), reporterName: '张伟', projectName: '电池Pack',
    plannedStart: '2025-05-01', plannedEnd: daysFromNow(5),
    actualStart: '2025-05-01',
    progress: 90, tags: '研发,BMS',
    plannedHours: 100, actualHours: 88,
    dependencies: ['3'], dependencyDetails: depsFor(6),
    isWatching: false, isOverdue: false, isWarning: false,
    commentCount: 4, watcherCount: 2,
    participants: ['陈晨'],
    createdAt: '2025-05-01T08:00:00Z', updatedAt: today() + 'T14:00:00Z',
  },
  {
    id: 7, taskNo: 'BP-007', title: 'BOM清单编制', description: '编制电池Pack完整物料清单，包括电芯、结构件、线束、连接器等',
    type: 'TASK', projectId: 4, parentId: PHASE_DETAIL, phaseId: PHASE_DETAIL,
    priority: TaskPriority.MEDIUM, status: TaskStatus.PENDING,
    ...u(8), reporterName: '张伟', projectName: '电池Pack',
    plannedStart: daysFromNow(5), plannedEnd: daysFromNow(35),
    progress: 0, tags: '产品,BOM',
    plannedHours: 60, actualHours: 0,
    dependencies: ['4', '5'], dependencyDetails: depsFor(7),
    isWatching: false, isOverdue: false, isWarning: false,
    commentCount: 0, watcherCount: 1,
    createdAt: '2025-05-01T08:00:00Z', updatedAt: '2025-05-01T08:00:00Z',
  },
  {
    id: 8, taskNo: 'BP-008', title: '设计评审', description: '详细设计阶段评审，确认设计输出满足需求规格',
    type: 'MILESTONE', projectId: 4, parentId: PHASE_DETAIL, phaseId: PHASE_DETAIL,
    milestoneId: 2,
    priority: TaskPriority.HIGH, status: TaskStatus.PENDING,
    ...u(6), reporterName: '李娜', projectName: '电池Pack',
    plannedStart: daysFromNow(40), plannedEnd: daysFromNow(40),
    progress: 0, tags: '里程碑,评审',
    plannedHours: 8, actualHours: 0,
    isWatching: true, isOverdue: false, isWarning: false,
    commentCount: 0, watcherCount: 6,
    createdAt: '2025-05-01T08:00:00Z', updatedAt: '2025-05-01T08:00:00Z',
  },

  // ═══════════════════════════════════════════════════════════
  // 电池Pack项目 - 样件制作阶段
  // ═══════════════════════════════════════════════════════════
  {
    id: 9, taskNo: 'BP-009', title: '模具开发', description: '电池包外壳注塑模具开发、冲压模具制作',
    type: 'TASK', projectId: 4, parentId: PHASE_PROTO, phaseId: PHASE_PROTO,
    priority: TaskPriority.HIGH, status: TaskStatus.PENDING,
    ...u(3), reporterName: '张伟', projectName: '电池Pack',
    plannedStart: daysFromNow(20), plannedEnd: daysFromNow(80),
    progress: 0, tags: '设计,模具',
    plannedHours: 200, actualHours: 0,
    dependencies: ['4'], dependencyDetails: depsFor(9),
    isWatching: false, isOverdue: false, isWarning: false,
    commentCount: 0, watcherCount: 2,
    createdAt: '2025-05-01T08:00:00Z', updatedAt: '2025-05-01T08:00:00Z',
  },
  {
    id: 10, taskNo: 'BP-010', title: '样件组装', description: '按照设计图纸进行电池Pack样件组装，记录组装过程问题',
    type: 'TASK', projectId: 4, parentId: PHASE_PROTO, phaseId: PHASE_PROTO,
    priority: TaskPriority.HIGH, status: TaskStatus.PENDING,
    ...u(4), reporterName: '张伟', projectName: '电池Pack',
    plannedStart: daysFromNow(80), plannedEnd: daysFromNow(110),
    progress: 0, tags: '研发,组装',
    plannedHours: 120, actualHours: 0,
    dependencies: ['5', '9'], dependencyDetails: depsFor(10),
    isWatching: false, isOverdue: false, isWarning: false,
    commentCount: 0, watcherCount: 2,
    createdAt: '2025-05-01T08:00:00Z', updatedAt: '2025-05-01T08:00:00Z',
  },
  {
    id: 11, taskNo: 'BP-011', title: '样件确认', description: '样件尺寸检测、功能验证、客户确认',
    type: 'MILESTONE', projectId: 4, parentId: PHASE_PROTO, phaseId: PHASE_PROTO,
    milestoneId: 3,
    priority: TaskPriority.HIGH, status: TaskStatus.PENDING,
    ...u(6), reporterName: '李娜', projectName: '电池Pack',
    plannedStart: daysFromNow(115), plannedEnd: daysFromNow(115),
    progress: 0, tags: '里程碑,确认',
    plannedHours: 8, actualHours: 0,
    isWatching: true, isOverdue: false, isWarning: false,
    commentCount: 0, watcherCount: 6,
    createdAt: '2025-05-01T08:00:00Z', updatedAt: '2025-05-01T08:00:00Z',
  },

  // ═══════════════════════════════════════════════════════════
  // 电池Pack项目 - 验证测试阶段
  // ═══════════════════════════════════════════════════════════
  {
    id: 12, taskNo: 'BP-012', title: '安全性测试', description: '过充过放、短路、热失控、挤压、跌落等安全测试',
    type: 'TASK', projectId: 4, parentId: PHASE_TEST, phaseId: PHASE_TEST,
    priority: TaskPriority.URGENT, status: TaskStatus.PENDING,
    ...u(13), reporterName: '张伟', projectName: '电池Pack',
    plannedStart: daysFromNow(110), plannedEnd: daysFromNow(150),
    progress: 0, tags: '测试,安全',
    plannedHours: 180, actualHours: 0,
    dependencies: ['10'], dependencyDetails: depsFor(12),
    isWatching: false, isOverdue: false, isWarning: false,
    commentCount: 0, watcherCount: 3,
    participants: ['吴文杰'],
    createdAt: '2025-05-01T08:00:00Z', updatedAt: '2025-05-01T08:00:00Z',
  },
  {
    id: 13, taskNo: 'BP-013', title: '环境适应性测试', description: '高低温循环、湿热老化、盐雾、振动测试',
    type: 'TASK', projectId: 4, parentId: PHASE_TEST, phaseId: PHASE_TEST,
    priority: TaskPriority.HIGH, status: TaskStatus.PENDING,
    ...u(14), reporterName: '张伟', projectName: '电池Pack',
    plannedStart: daysFromNow(110), plannedEnd: daysFromNow(160),
    progress: 0, tags: '测试,环境',
    plannedHours: 160, actualHours: 0,
    dependencies: ['10'], dependencyDetails: depsFor(13),
    isWatching: false, isOverdue: false, isWarning: false,
    commentCount: 0, watcherCount: 2,
    createdAt: '2025-05-01T08:00:00Z', updatedAt: '2025-05-01T08:00:00Z',
  },
  {
    id: 14, taskNo: 'BP-014', title: '充放电性能测试', description: '常温/高低温充放电、循环寿命、功率特性测试',
    type: 'TASK', projectId: 4, parentId: PHASE_TEST, phaseId: PHASE_TEST,
    priority: TaskPriority.HIGH, status: TaskStatus.PENDING,
    ...u(13), reporterName: '张伟', projectName: '电池Pack',
    plannedStart: daysFromNow(150), plannedEnd: daysFromNow(180),
    progress: 0, tags: '测试,性能',
    plannedHours: 140, actualHours: 0,
    dependencies: ['12'], dependencyDetails: depsFor(14),
    isWatching: false, isOverdue: false, isWarning: false,
    commentCount: 0, watcherCount: 2,
    createdAt: '2025-05-01T08:00:00Z', updatedAt: '2025-05-01T08:00:00Z',
  },
  {
    id: 15, taskNo: 'BP-015', title: '测试报告编写', description: '汇总全部测试数据，编写验证测试报告',
    type: 'TASK', projectId: 4, parentId: PHASE_TEST, phaseId: PHASE_TEST,
    priority: TaskPriority.MEDIUM, status: TaskStatus.PENDING,
    ...u(13), reporterName: '张伟', projectName: '电池Pack',
    plannedStart: daysFromNow(180), plannedEnd: daysFromNow(200),
    progress: 0, tags: '测试,报告',
    plannedHours: 40, actualHours: 0,
    isWatching: false, isOverdue: false, isWarning: false,
    commentCount: 0, watcherCount: 1,
    createdAt: '2025-05-01T08:00:00Z', updatedAt: '2025-05-01T08:00:00Z',
  },

  // ═══════════════════════════════════════════════════════════
  // 电池Pack项目 - 问题/风险/建议/变更
  // ═══════════════════════════════════════════════════════════
  {
    id: 16, taskNo: 'BP-I01', title: '电芯供应商交期延迟', description: '某供应商电芯交期延迟2周，影响样件制作进度',
    type: 'ISSUE', projectId: 4, phaseId: PHASE_PROTO,
    priority: TaskPriority.URGENT, status: TaskStatus.IN_PROGRESS,
    ...u(8), reporterName: '王晓明', projectName: '电池Pack',
    plannedStart: daysAgo(3), plannedEnd: daysFromNow(4),
    actualStart: daysAgo(3),
    progress: 30, tags: '采购,交期',
    plannedHours: 16, actualHours: 8,
    isWatching: true, isOverdue: false, isWarning: true,
    commentCount: 7, watcherCount: 5,
    createdAt: daysAgo(3) + 'T10:00:00Z', updatedAt: today() + 'T09:00:00Z',
  },
  {
    id: 17, taskNo: 'BP-R01', title: '热管理散热效率风险', description: '液冷方案在极端高温工况下散热效率可能不足',
    type: 'RISK', projectId: 4, phaseId: PHASE_DETAIL,
    priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS,
    ...u(2), reporterName: '王美玲', projectName: '电池Pack',
    plannedStart: daysAgo(10), plannedEnd: daysFromNow(20),
    actualStart: daysAgo(10),
    progress: 40, tags: '设计,风险',
    plannedHours: 24, actualHours: 10,
    isWatching: true, isOverdue: false, isWarning: true,
    commentCount: 4, watcherCount: 3,
    createdAt: daysAgo(10) + 'T08:00:00Z', updatedAt: daysAgo(1) + 'T14:00:00Z',
  },
  {
    id: 18, taskNo: 'BP-S01', title: '建议采用CTP方案降低成本', description: 'Cell to Pack方案可减少结构件数量，预计降低成本15%',
    type: 'SUGGESTION', projectId: 4, phaseId: PHASE_DETAIL,
    priority: TaskPriority.MEDIUM, status: TaskStatus.PENDING,
    ...u(9), reporterName: '赵静怡', projectName: '电池Pack',
    plannedStart: daysAgo(5), plannedEnd: daysFromNow(25),
    progress: 0, tags: '建议,成本',
    plannedHours: 8, actualHours: 0,
    isWatching: false, isOverdue: false, isWarning: false,
    commentCount: 3, watcherCount: 2,
    createdAt: daysAgo(5) + 'T11:00:00Z', updatedAt: daysAgo(5) + 'T11:00:00Z',
  },
  {
    id: 19, taskNo: 'BP-C01', title: '电芯型号变更申请', description: '因供应商产能问题，申请将A型号电芯替换为B型号',
    type: 'CHANGE', projectId: 4, phaseId: PHASE_DETAIL,
    priority: TaskPriority.HIGH, status: TaskStatus.PENDING_REVIEW,
    ...u(8), reporterName: '王晓明', projectName: '电池Pack',
    plannedStart: daysAgo(2), plannedEnd: daysFromNow(5),
    actualStart: daysAgo(2),
    progress: 50, tags: '变更,电芯',
    plannedHours: 16, actualHours: 8,
    isWatching: true, isOverdue: false, isWarning: false,
    commentCount: 6, watcherCount: 4,
    participants: ['邓智豪', '王美玲'],
    createdAt: daysAgo(2) + 'T09:00:00Z', updatedAt: today() + 'T08:00:00Z',
  },

  // ═══════════════════════════════════════════════════════════
  // 充电桩项目 (projectId=9) - 逾期项目
  // ═══════════════════════════════════════════════════════════
  {
    id: 20, taskNo: 'EV-001', title: '充电桩需求评审', description: '充电桩控制系统需求文档评审',
    type: 'TASK', projectId: 9,
    priority: TaskPriority.URGENT, status: TaskStatus.PENDING_REVIEW,
    ...u(11), reporterName: '测试用户', projectName: '充电桩控制系统',
    plannedStart: daysAgo(30), plannedEnd: daysAgo(15),
    actualStart: daysAgo(30),
    progress: 85, tags: '研发,需求',
    plannedHours: 40, actualHours: 36,
    isWatching: true, isOverdue: true, isWarning: true,
    commentCount: 3, watcherCount: 2,
    createdAt: daysAgo(30) + 'T08:00:00Z', updatedAt: daysAgo(5) + 'T17:00:00Z',
  },
  {
    id: 21, taskNo: 'EV-002', title: '充电桩方案设计', description: '控制板硬件方案、通信协议方案设计',
    type: 'TASK', projectId: 9,
    priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS,
    ...u(11), reporterName: '测试用户', projectName: '充电桩控制系统',
    plannedStart: daysAgo(15), plannedEnd: daysFromNow(15),
    actualStart: daysAgo(15),
    progress: 40, tags: '研发,设计',
    plannedHours: 80, actualHours: 32,
    isWatching: false, isOverdue: false, isWarning: false,
    commentCount: 2, watcherCount: 2,
    createdAt: daysAgo(15) + 'T08:00:00Z', updatedAt: today() + 'T10:00:00Z',
  },
  {
    id: 22, taskNo: 'EV-003', title: '充电桩软件开发', description: '充电桩控制软件开发，包括计费模块、通信模块、安全模块',
    type: 'TASK', projectId: 9,
    priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS,
    ...u(12), reporterName: '测试用户', projectName: '充电桩控制系统',
    plannedStart: daysAgo(10), plannedEnd: daysFromNow(30),
    actualStart: daysAgo(10),
    progress: 25, tags: '研发,软件',
    plannedHours: 200, actualHours: 50,
    isWatching: false, isOverdue: false, isWarning: false,
    commentCount: 1, watcherCount: 3,
    participants: ['陈晨'],
    createdAt: daysAgo(10) + 'T08:00:00Z', updatedAt: today() + 'T14:00:00Z',
  },

  // ═══════════════════════════════════════════════════════════
  // 车载信息娱乐系统 (projectId=10)
  // ═══════════════════════════════════════════════════════════
  {
    id: 23, taskNo: 'IVI-001', title: 'IVI系统架构设计', description: '车载信息娱乐系统整体架构设计，包括硬件平台选型、软件分层',
    type: 'TASK', projectId: 10,
    priority: TaskPriority.HIGH, status: TaskStatus.COMPLETED,
    ...u(10), reporterName: '李明', projectName: '车载信息娱乐系统',
    plannedStart: '2025-02-15', plannedEnd: '2025-04-30',
    actualStart: '2025-02-15', actualEnd: '2025-04-28',
    progress: 100, tags: '研发,架构',
    plannedHours: 120, actualHours: 110,
    isWatching: false, isOverdue: false, isWarning: false,
    commentCount: 6, watcherCount: 4,
    createdAt: '2025-02-15T08:00:00Z', updatedAt: '2025-04-28T17:00:00Z',
  },
  {
    id: 24, taskNo: 'IVI-002', title: 'IVI UI/UX设计', description: '中控屏幕界面设计、交互流程设计、视觉规范制定',
    type: 'TASK', projectId: 10,
    priority: TaskPriority.MEDIUM, status: TaskStatus.COMPLETED,
    ...u(5), reporterName: '李明', projectName: '车载信息娱乐系统',
    plannedStart: '2025-03-01', plannedEnd: '2025-05-15',
    actualStart: '2025-03-01', actualEnd: '2025-05-10',
    progress: 100, tags: '设计,UI',
    plannedHours: 80, actualHours: 75,
    isWatching: false, isOverdue: false, isWarning: false,
    commentCount: 4, watcherCount: 3,
    createdAt: '2025-03-01T08:00:00Z', updatedAt: '2025-05-10T17:00:00Z',
  },
  {
    id: 25, taskNo: 'IVI-003', title: 'IVI导航模块开发', description: '高精度地图集成、路径规划、实时路况接入',
    type: 'TASK', projectId: 10,
    priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS,
    ...u(11), reporterName: '李明', projectName: '车载信息娱乐系统',
    plannedStart: '2025-05-01', plannedEnd: daysFromNow(25),
    actualStart: '2025-05-01',
    progress: 55, tags: '研发,导航',
    plannedHours: 160, actualHours: 88,
    isWatching: true, isOverdue: false, isWarning: false,
    commentCount: 8, watcherCount: 4,
    participants: ['周鑫'],
    createdAt: '2025-05-01T08:00:00Z', updatedAt: today() + 'T11:00:00Z',
  },

  // ═══════════════════════════════════════════════════════════
  // 今日/本周/本月到期任务（补充时间分布）
  // ═══════════════════════════════════════════════════════════
  {
    id: 26, taskNo: 'ADM-001', title: '项目周报编写', description: '编写本周项目进度周报',
    type: 'ACTIVITY', projectId: 4,
    priority: TaskPriority.LOW, status: TaskStatus.IN_PROGRESS,
    ...u(7), reporterName: '李娜', projectName: '电池Pack',
    plannedStart: today(), plannedEnd: today(),
    actualStart: today(),
    progress: 50, tags: '管理,周报',
    plannedHours: 4, actualHours: 2,
    isWatching: false, isOverdue: false, isWarning: false,
    commentCount: 0, watcherCount: 0,
    createdAt: today() + 'T08:00:00Z', updatedAt: today() + 'T10:00:00Z',
  },
  {
    id: 27, taskNo: 'ADM-002', title: '供应商质量审核', description: '对电芯供应商进行季度质量审核',
    type: 'ACTIVITY', projectId: 4,
    priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS,
    ...u(15), reporterName: '张伟', projectName: '电池Pack',
    plannedStart: today(), plannedEnd: daysFromNow(3),
    actualStart: today(),
    progress: 20, tags: '质量,审核',
    plannedHours: 24, actualHours: 5,
    isWatching: true, isOverdue: false, isWarning: false,
    commentCount: 1, watcherCount: 2,
    createdAt: today() + 'T08:00:00Z', updatedAt: today() + 'T15:00:00Z',
  },
  {
    id: 28, taskNo: 'ADM-003', title: '来料检验标准更新', description: '根据新电芯规格更新来料检验标准文件',
    type: 'TASK', projectId: 4,
    priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS,
    ...u(14), reporterName: '张伟', projectName: '电池Pack',
    plannedStart: daysAgo(2), plannedEnd: daysFromNow(5),
    actualStart: daysAgo(2),
    progress: 60, tags: '质量,标准',
    plannedHours: 16, actualHours: 10,
    isWatching: false, isOverdue: false, isWarning: false,
    commentCount: 2, watcherCount: 1,
    createdAt: daysAgo(2) + 'T08:00:00Z', updatedAt: today() + 'T11:00:00Z',
  },

  // ═══════════════════════════════════════════════════════════
  // 里程碑（跨项目）
  // ═══════════════════════════════════════════════════════════
  {
    id: 29, taskNo: 'M-001', title: 'Q2项目进度检查点', description: '第二季度整体项目进度检查与评审',
    type: 'MILESTONE', projectId: 1,
    milestoneId: 10,
    priority: TaskPriority.HIGH, status: TaskStatus.PENDING,
    ...u(6), reporterName: '张伟', projectName: '汽车',
    plannedStart: daysFromNow(20), plannedEnd: daysFromNow(20),
    progress: 0, tags: '里程碑,季度',
    plannedHours: 8, actualHours: 0,
    isWatching: true, isOverdue: false, isWarning: false,
    commentCount: 0, watcherCount: 10,
    createdAt: '2025-01-01T08:00:00Z', updatedAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 30, taskNo: 'M-002', title: 'SOP量产启动', description: '电池Pack小批量试产启动节点',
    type: 'MILESTONE', projectId: 4,
    milestoneId: 4,
    priority: TaskPriority.URGENT, status: TaskStatus.PENDING,
    ...u(6), reporterName: '张伟', projectName: '电池Pack',
    plannedStart: daysFromNow(200), plannedEnd: daysFromNow(200),
    progress: 0, tags: '里程碑,量产',
    plannedHours: 8, actualHours: 0,
    isWatching: true, isOverdue: false, isWarning: false,
    commentCount: 0, watcherCount: 8,
    createdAt: '2025-03-01T08:00:00Z', updatedAt: '2025-03-01T08:00:00Z',
  },

  // ═══════════════════════════════════════════════════════════
  // 审批类任务 (APPROVAL type) — 覆盖审批引擎全链路
  // ═══════════════════════════════════════════════════════════
  {
    id: 31, taskNo: 'AP-001', title: 'BOM变更审批-电芯型号替换', description: '因供应商产能问题，申请将A型号电芯替换为B型号，需审批确认',
    type: 'APPROVAL', projectId: 4,
    priority: TaskPriority.HIGH, status: TaskStatus.PENDING_REVIEW,
    ...u(8), reporterName: '王晓明', projectName: '电池Pack',
    plannedStart: daysAgo(2), plannedEnd: daysFromNow(3),
    actualStart: daysAgo(2),
    progress: 50, tags: '审批,BOM',
    plannedHours: 8, actualHours: 4,
    isWatching: true, isOverdue: false, isWarning: false,
    commentCount: 3, watcherCount: 4,
    participants: ['邓智豪', '王美玲'],
    createdAt: daysAgo(2) + 'T09:00:00Z', updatedAt: today() + 'T08:00:00Z',
  },
  {
    id: 32, taskNo: 'AP-002', title: '设计变更审批-Pack外壳材料调整', description: '外壳材料从铝合金改为高强度塑料，需设计主管审批',
    type: 'APPROVAL', projectId: 4,
    priority: TaskPriority.MEDIUM, status: TaskStatus.PENDING_REVIEW,
    ...u(1), reporterName: '陈思远', projectName: '电池Pack',
    plannedStart: daysAgo(1), plannedEnd: daysFromNow(5),
    actualStart: daysAgo(1),
    progress: 30, tags: '审批,设计',
    plannedHours: 4, actualHours: 1,
    isWatching: false, isOverdue: false, isWarning: false,
    commentCount: 1, watcherCount: 2,
    createdAt: daysAgo(1) + 'T10:00:00Z', updatedAt: today() + 'T09:00:00Z',
  },
  {
    id: 33, taskNo: 'AP-003', title: '概念设计评审审批', description: '概念设计阶段完成，提交评审审批',
    type: 'APPROVAL', projectId: 4,
    priority: TaskPriority.HIGH, status: TaskStatus.COMPLETED,
    ...u(6), reporterName: '张伟', projectName: '电池Pack',
    plannedStart: '2025-04-10', plannedEnd: '2025-04-15',
    actualStart: '2025-04-10', actualEnd: '2025-04-14',
    progress: 100, tags: '审批,评审',
    plannedHours: 8, actualHours: 6,
    isWatching: true, isOverdue: false, isWarning: false,
    commentCount: 5, watcherCount: 8,
    createdAt: '2025-04-10T08:00:00Z', updatedAt: '2025-04-14T16:00:00Z',
  },
];

/** 按阶段分组的任务（用于甘特图和项目树） */
export const mockProjectTasks = mockTasks;

/** 所有依赖关系（用于甘特图渲染箭头） */
export const mockDependencies = allDependencies;
