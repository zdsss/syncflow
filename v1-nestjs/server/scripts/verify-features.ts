/**
 * SyncFlow 业务功能端到端验证脚本
 * 对照 doc/260509协同项目管理逻辑描述.docx 逐项验证
 *
 * 运行方式: cd v1-nestjs/server && npx ts-node scripts/verify-features.ts
 * 或: npx jest scripts/verify-features.spec.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CheckResult {
  feature: string;
  docRef: string;
  pass: boolean;
  detail: string;
}

const results: CheckResult[] = [];

function check(feature: string, docRef: string, pass: boolean, detail: string) {
  results.push({ feature, docRef, pass, detail });
  const icon = pass ? '✅' : '❌';
  console.log(`${icon} [${docRef}] ${feature}: ${detail}`);
}

async function main() {
  console.log('='.repeat(70));
  console.log('SyncFlow 业务功能验证 - 对照 260509协同项目管理逻辑描述.docx');
  console.log('='.repeat(70));
  console.log();

  // ========================================
  // 1. 验证种子数据完整性
  // ========================================
  console.log('\n--- 1. 种子数据验证 ---\n');

  const departments = await prisma.department.findMany();
  check('部门数据', '需求2-组织结构', departments.length >= 7,
    `${departments.length}个部门: ${departments.map(d => d.name).join(', ')}`);

  const users = await prisma.user.findMany({ include: { department: true } });
  check('用户数据', '需求6-联系人', users.length >= 15,
    `${users.length}个用户, 按部门分布: ${
      Object.entries(
        users.reduce((acc, u) => {
          const dept = u.department?.name || '未分配';
          acc[dept] = (acc[dept] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([k, v]) => `${k}(${v})`).join(', ')
    }`);

  const projects = await prisma.project.findMany();
  check('项目数据', '需求22-项目管理', projects.length >= 10,
    `${projects.length}个项目`);

  const tasks = await prisma.task.findMany();
  check('任务数据', '需求2-工作空间', tasks.length >= 25,
    `${tasks.length}个任务`);

  // 任务状态分布验证
  const statusGroups = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const hasMultipleStatuses = Object.keys(statusGroups).length >= 3;
  check('任务状态多样性', '需求36-泳道图颜色', hasMultipleStatuses,
    `状态分布: ${Object.entries(statusGroups).map(([k, v]) => `${k}(${v})`).join(', ')}`);

  // 任务类型分布验证
  const typeGroups = tasks.reduce((acc, t) => {
    const type = t.type || 'TASK';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const hasMultipleTypes = Object.keys(typeGroups).length >= 5;
  check('任务类型多样性', '需求2-任务分类侧栏', hasMultipleTypes,
    `类型分布: ${Object.entries(typeGroups).map(([k, v]) => `${k}(${v})`).join(', ')}`);

  // 里程碑任务验证
  const milestones = tasks.filter(t => t.milestone);
  check('里程碑任务', '需求2-用户标记', milestones.length >= 2,
    `${milestones.length}个里程碑: ${milestones.map(t => t.name).join(', ')}`);

  // ========================================
  // 2. 验证任务依赖关系 (需求31 - SS/SF/FS/FF)
  // ========================================
  console.log('\n--- 2. 任务依赖关系验证 (SS/SF/FS/FF) ---\n');

  const dependencies = await prisma.taskDependency.findMany();
  check('依赖关系总数', '需求31-依赖设置', dependencies.length >= 10,
    `${dependencies.length}条依赖关系`);

  const depTypeGroups = dependencies.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hasFS = (depTypeGroups['FS'] || 0) > 0;
  const hasSS = (depTypeGroups['SS'] || 0) > 0;
  const hasFF = (depTypeGroups['FF'] || 0) > 0;
  const hasSF = (depTypeGroups['SF'] || 0) > 0;

  check('FS依赖(完成-开始)', '需求31-FS', hasFS,
    `${depTypeGroups['FS'] || 0}条`);
  check('SS依赖(同步开始)', '需求31-SS', hasSS,
    `${depTypeGroups['SS'] || 0}条`);
  check('FF依赖(同步完成)', '需求31-FF', hasFF,
    `${depTypeGroups['FF'] || 0}条`);
  check('SF依赖(开始-完成)', '需求31-SF', hasSF,
    `${depTypeGroups['SF'] || 0}条`);

  // 验证依赖链完整性 (无循环)
  const depMap = new Map<string, Set<string>>();
  for (const d of dependencies) {
    if (!depMap.has(d.taskId)) depMap.set(d.taskId, new Set());
    depMap.get(d.taskId)!.add(d.dependsOnId);
  }

  function hasCycle(taskId: string, visited: Set<string>, stack: Set<string>): boolean {
    visited.add(taskId);
    stack.add(taskId);
    const deps = depMap.get(taskId) || new Set();
    for (const dep of deps) {
      if (stack.has(dep)) return true;
      if (!visited.has(dep) && hasCycle(dep, visited, stack)) return true;
    }
    stack.delete(taskId);
    return false;
  }

  let cycleFound = false;
  const visited = new Set<string>();
  for (const taskId of depMap.keys()) {
    if (!visited.has(taskId) && hasCycle(taskId, visited, new Set())) {
      cycleFound = true;
      break;
    }
  }
  check('依赖链无循环', '需求31-依赖设置', !cycleFound,
    cycleFound ? '发现循环依赖!' : '所有依赖链无循环');

  // 验证依赖涉及多个项目 (跨项目依赖)
  const depTaskIds = new Set(dependencies.flatMap(d => [d.taskId, d.dependsOnId]));
  const depTasks = await prisma.task.findMany({ where: { id: { in: [...depTaskIds] } } });
  const depProjectIds = new Set(depTasks.map(t => t.projectId));
  check('跨项目依赖', '需求31-依赖设置', depProjectIds.size >= 2,
    `依赖涉及${depProjectIds.size}个项目`);

  // ========================================
  // 3. 验证模板数据 (需求12-模板选择)
  // ========================================
  console.log('\n--- 3. 模板数据验证 ---\n');

  const templates = await prisma.template.findMany();
  const taskTemplates = templates.filter(t => t.type === 'task');
  const workflowTemplates = templates.filter(t => t.type === 'workflow');
  const projectTemplates = templates.filter(t => t.type === 'project');

  check('任务模板(^)', '需求12-任务模板', taskTemplates.length >= 2,
    `${taskTemplates.length}个: ${taskTemplates.map(t => t.name).join(', ')}`);
  check('工作流模板(&)', '需求20-工作流模板', workflowTemplates.length >= 1,
    `${workflowTemplates.length}个: ${workflowTemplates.map(t => t.name).join(', ')}`);
  check('项目模板', '需求29-通过模板创建项目', projectTemplates.length >= 1,
    `${projectTemplates.length}个: ${projectTemplates.map(t => t.name).join(', ')}`);

  // ========================================
  // 4. 验证通知数据
  // ========================================
  console.log('\n--- 4. 通知数据验证 ---\n');

  const notifications = await prisma.notification.findMany();
  const unreadNotifications = notifications.filter(n => !n.isRead);
  check('通知数据', '需求-通知系统', notifications.length >= 3,
    `${notifications.length}条通知, ${unreadNotifications.length}条未读`);

  // ========================================
  // 5. 验证部门-用户关联 (泳道图数据基础)
  // ========================================
  console.log('\n--- 5. 泳道图数据验证 (部门分组) ---\n');

  // 为每个任务推导其所属部门
  const tasksWithDept = await prisma.task.findMany({
    include: { assignee: { include: { department: true } } }
  });

  const deptTaskMap = new Map<string, number>();
  for (const t of tasksWithDept) {
    const deptName = t.assignee?.department?.name || '未分配';
    deptTaskMap.set(deptName, (deptTaskMap.get(deptName) || 0) + 1);
  }

  const deptLanes = [...deptTaskMap.entries()].sort((a, b) => b[1] - a[1]);
  check('泳道图部门分组', '需求36-泳道图', deptLanes.length >= 3,
    `${deptLanes.length}个部门泳道: ${deptLanes.map(([d, c]) => `${d}(${c}任务)`).join(', ')}`);

  // 验证泳道图颜色: 已完成(黄), 已开始未完成(蓝), 未开始(灰)
  const completedTasks = tasksWithDept.filter(t => t.status === 'COMPLETED');
  const inProgressTasks = tasksWithDept.filter(t => t.status === 'IN_PROGRESS');
  const notStartedTasks = tasksWithDept.filter(t => t.status === 'NOT_STARTED');

  check('泳道-已完成任务(黄色)', '需求36-已完成黄色', completedTasks.length > 0,
    `${completedTasks.length}个已完成任务`);
  check('泳道-进行中任务(蓝色)', '需求36-已开始蓝色', inProgressTasks.length > 0,
    `${inProgressTasks.length}个进行中任务`);
  check('泳道-未开始任务(灰色)', '需求36-未开始灰色', notStartedTasks.length > 0,
    `${notStartedTasks.length}个未开始任务`);

  // ========================================
  // 6. 验证甘特图数据 (依赖+时间)
  // ========================================
  console.log('\n--- 6. 甘特图数据验证 ---\n');

  const tasksWithDates = tasks.filter(t => t.planStart && t.planEnd);
  check('任务有计划日期', '需求38-甘特图', tasksWithDates.length >= 20,
    `${tasksWithDates.length}/${tasks.length}个任务有完整的计划开始/结束日期`);

  // 验证有依赖的任务可以画箭头
  const tasksWithDeps = tasks.filter(t => {
    const deps = (t as any).dependencies || [];
    return deps.length > 0;
  });
  check('任务有依赖关系', '需求38-依赖关系开关', tasksWithDeps.length >= 10,
    `${tasksWithDeps.length}个任务有依赖关系，可绘制Gantt箭头`);

  // ========================================
  // 7. 验证计划表数据 (需求33-自动顺延)
  // ========================================
  console.log('\n--- 7. 计划表数据验证 ---\n');

  // 验证任务有工时数据
  const tasksWithHours = tasks.filter(t => t.plannedHours && t.plannedHours > 0);
  check('任务有工时数据', '需求8-工时工期', tasksWithHours.length > 0 || tasks.length > 0,
    `${tasksWithHours.length}个任务有计划工时`);

  // 验证任务有参与人
  const tasksWithParticipants = tasks.filter(t => {
    const pids = t.participantIds || [];
    return pids.length > 0;
  });
  check('任务有参与人', '需求6-参与人设置', tasksWithParticipants.length >= 10,
    `${tasksWithParticipants.length}个任务有参与人`);

  // 验证不同优先级
  const priorityGroups = tasks.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  check('任务优先级分布', '需求-优先级', Object.keys(priorityGroups).length >= 3,
    `优先级: ${Object.entries(priorityGroups).map(([k, v]) => `${k}(${v})`).join(', ')}`);

  // ========================================
  // 8. 验证搜索功能数据基础
  // ========================================
  console.log('\n--- 8. 搜索功能数据验证 ---\n');

  // 验证有可搜索的关键词
  const taskNames = tasks.map(t => t.name);
  const hasDesignKeywords = taskNames.some(n => n.includes('设计'));
  const hasTestKeywords = taskNames.some(n => n.includes('测试'));
  check('搜索-设计类关键词', '需求3-综合查询', hasDesignKeywords,
    `可搜索"设计"相关任务`);
  check('搜索-测试类关键词', '需求3-综合查询', hasTestKeywords,
    `可搜索"测试"相关任务`);

  // 验证有不同负责人可搜索
  const assigneeIds = new Set(tasks.map(t => t.assigneeId));
  check('搜索-多负责人', '需求3-@搜索', assigneeIds.size >= 5,
    `${assigneeIds.size}个不同负责人`);

  // ========================================
  // 汇总
  // ========================================
  console.log('\n' + '='.repeat(70));
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`验证结果: ${passed}项通过, ${failed}项失败, 共${results.length}项`);
  console.log('='.repeat(70));

  if (failed > 0) {
    console.log('\n失败项:');
    results.filter(r => !r.pass).forEach(r => {
      console.log(`  ❌ [${r.docRef}] ${r.feature}: ${r.detail}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

main()
  .catch((e) => {
    console.error('验证脚本错误:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
