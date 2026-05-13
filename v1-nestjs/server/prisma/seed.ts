import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Departments (upsert for idempotency)
  const deptData = [
    { id: 'd1', name: '公司管理层', sortOrder: 1 },
    { id: 'd2', name: '设计部', sortOrder: 2 },
    { id: 'd3', name: '产品部', sortOrder: 3 },
    { id: 'd4', name: '研发部', sortOrder: 4 },
    { id: 'd5', name: '测试部', sortOrder: 5 },
    { id: 'd6', name: '品质部', sortOrder: 6 },
    { id: 'd7', name: '工程部', sortOrder: 7 },
  ];
  for (const d of deptData) {
    await prisma.department.upsert({ where: { id: d.id }, update: d, create: d });
  }
  console.log(`Upserted ${deptData.length} departments`);

  // Roles
  const roleData = [
    { id: 'r1', name: '管理层 - 总经理', departmentId: 'd1', permissions: ['project', 'task', 'file', 'bom', 'approval', 'config', 'data:global'], memberCount: 1 },
    { id: 'r2', name: '管理层 - 副总经理', departmentId: 'd1', permissions: ['project', 'task', 'file', 'bom', 'approval', 'data:department'], memberCount: 2 },
    { id: 'r3', name: '管理层 - 财务总监', departmentId: 'd1', permissions: ['project', 'task', 'file', 'data:department'], memberCount: 1 },
    { id: 'r4', name: '管理层 - 设计主管', departmentId: 'd2', permissions: ['project', 'task', 'file', 'bom', 'data:department'], memberCount: 1 },
    { id: 'r5', name: '设计师', departmentId: 'd2', permissions: ['project', 'task', 'file', 'data:project'], memberCount: 4 },
    { id: 'r6', name: '管理层 - 产品经理', departmentId: 'd3', permissions: ['project', 'task', 'file', 'bom', 'approval', 'data:department'], memberCount: 1 },
    { id: 'r7', name: '需求分析师', departmentId: 'd3', permissions: ['project', 'task', 'file', 'data:project'], memberCount: 3 },
    { id: 'r8', name: '产品助理', departmentId: 'd3', permissions: ['project', 'task', 'data:project'], memberCount: 2 },
    { id: 'r9', name: '管理层 - 研发主管', departmentId: 'd4', permissions: ['project', 'task', 'file', 'bom', 'approval', 'data:department'], memberCount: 1 },
    { id: 'r10', name: '前端工程师', departmentId: 'd4', permissions: ['project', 'task', 'file', 'data:project'], memberCount: 3 },
    { id: 'r11', name: '后端工程师', departmentId: 'd4', permissions: ['project', 'task', 'file', 'data:project'], memberCount: 3 },
    { id: 'r12', name: '测试主管', departmentId: 'd5', permissions: ['project', 'task', 'file', 'bom', 'data:department'], memberCount: 1 },
    { id: 'r13', name: '测试工程师', departmentId: 'd5', permissions: ['project', 'task', 'file', 'data:project'], memberCount: 3 },
  ];
  for (const r of roleData) {
    await prisma.role.upsert({ where: { id: r.id }, update: r, create: r });
  }
  console.log(`Upserted ${roleData.length} roles`);

  // Users
  const userData = [
    { id: 'u1', name: '邓智豪', email: 'deng@syncflow.com', departmentId: 'd2' },
    { id: 'u2', name: '王美玲', email: 'wang.ml@syncflow.com', departmentId: 'd2' },
    { id: 'u3', name: '陈思远', email: 'chen.sy@syncflow.com', departmentId: 'd2' },
    { id: 'u4', name: '李小龙', email: 'li.xl@syncflow.com', departmentId: 'd2' },
    { id: 'u5', name: '赵雨薇', email: 'zhao.yw@syncflow.com', departmentId: 'd2' },
    { id: 'u6', name: '张伟', email: 'zhang.w@syncflow.com', departmentId: 'd1' },
    { id: 'u7', name: '李娜', email: 'li.n@syncflow.com', departmentId: 'd1' },
    { id: 'u8', name: '王晓明', email: 'wang.xm@syncflow.com', departmentId: 'd3' },
    { id: 'u9', name: '赵静怡', email: 'zhao.jy@syncflow.com', departmentId: 'd3' },
    { id: 'u10', name: '刘伟', email: 'liu.w@syncflow.com', departmentId: 'd4' },
    { id: 'u11', name: '陈晨', email: 'chen.c@syncflow.com', departmentId: 'd4' },
    { id: 'u12', name: '周鑫', email: 'zhou.x@syncflow.com', departmentId: 'd4' },
    { id: 'u13', name: '孙小雨', email: 'sun.xy@syncflow.com', departmentId: 'd5' },
    { id: 'u14', name: '吴文杰', email: 'wu.wj@syncflow.com', departmentId: 'd5' },
    { id: 'u15', name: '刘婷婷', email: 'liu.tt@syncflow.com', departmentId: 'd3' },
  ];
  for (const u of userData) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { ...u, password: hashedPassword },
      create: { ...u, password: hashedPassword },
    });
  }
  console.log(`Upserted ${userData.length} users`);

  // Teams
  const teamData = [
    { id: 't1', name: '电池Pack研发团队', description: '电池Pack产品研发团队', memberCount: 12, leaderId: 'u1' },
    { id: 't2', name: '设计团队', description: '工业设计团队', memberCount: 30, leaderId: 'u1' },
  ];
  for (const t of teamData) {
    await prisma.team.upsert({ where: { id: t.id }, update: t, create: t });
  }
  console.log(`Upserted ${teamData.length} teams`);

  // Projects
  const projectData = [
    { id: 'p1', name: '汽车', category: '行业', phase: 'DEVELOPMENT', status: 'IN_PROGRESS', leaderId: 'u6', startDate: new Date('2025-01-01'), endDate: new Date('2026-12-31'), completion: 45 },
    { id: 'p2', name: '新能源', category: '领域', phase: 'DEVELOPMENT', status: 'IN_PROGRESS', leaderId: 'u6', startDate: new Date('2025-01-01'), endDate: new Date('2026-12-31'), completion: 42, parentId: 'p1' },
    { id: 'p3', name: '电池', category: '产品线', phase: 'DEVELOPMENT', status: 'IN_PROGRESS', leaderId: 'u8', startDate: new Date('2025-02-01'), endDate: new Date('2026-10-31'), completion: 38, parentId: 'p2' },
    { id: 'p4', name: '电池Pack', category: '子系统', phase: 'DEVELOPMENT', status: 'IN_PROGRESS', leaderId: 'u1', startDate: new Date('2025-03-01'), endDate: new Date('2026-06-30'), completion: 35, parentId: 'p3' },
    { id: 'p5', name: '电池模组', category: '模组', phase: 'PLANNING', status: 'IN_PROGRESS', leaderId: 'u2', startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31'), completion: 25, parentId: 'p4' },
    { id: 'p6', name: '电池包', category: '组件', phase: 'CONCEPT', status: 'NOT_STARTED', leaderId: 'u3', startDate: new Date('2025-05-01'), endDate: new Date('2025-12-31'), completion: 10, parentId: 'p5' },
    { id: 'p7', name: '电池冷却液', category: '零件', phase: 'SURVEY', status: 'NOT_STARTED', leaderId: 'u4', startDate: new Date('2025-06-01'), endDate: new Date('2025-11-30'), completion: 5, parentId: 'p6' },
    { id: 'p8', name: '智能驾驶系统', category: '子系统', phase: 'CONCEPT', status: 'IN_PROGRESS', leaderId: 'u8', startDate: new Date('2025-03-15'), endDate: new Date('2026-09-30'), completion: 20, parentId: 'p2' },
    { id: 'p9', name: '充电桩控制系统', category: '子系统', phase: 'DEVELOPMENT', status: 'DELAYED', leaderId: 'u10', startDate: new Date('2025-01-15'), endDate: new Date('2025-08-31'), completion: 60, parentId: 'p2' },
    { id: 'p10', name: '车载信息娱乐系统', category: '子系统', phase: 'TESTING', status: 'IN_PROGRESS', leaderId: 'u11', startDate: new Date('2025-02-01'), endDate: new Date('2025-07-31'), completion: 75, parentId: 'p1' },
  ];
  for (const p of projectData) {
    await prisma.project.upsert({ where: { id: p.id }, update: p as any, create: p as any });
  }
  console.log(`Upserted ${projectData.length} projects`);

  // Tasks - business-realistic data covering all features
  const taskData = [
    // === Project 1: 汽车 → 新能源 → 电池 → 电池Pack ===
    // Stage tasks (阶段)
    { id: 't1', name: '需求分析阶段', projectId: 'p4', type: 'STAGE', priority: 'HIGH', status: 'COMPLETED', assigneeId: 'u8', participantIds: ['u8', 'u9', 'u1'], planStart: new Date('2025-01-15'), planEnd: new Date('2025-02-28'), progress: 100, milestone: true, tags: ['设计', '需求'] },
    { id: 't2', name: '概念设计阶段', projectId: 'p4', type: 'STAGE', priority: 'HIGH', status: 'COMPLETED', assigneeId: 'u1', participantIds: ['u1', 'u2', 'u3'], planStart: new Date('2025-03-01'), planEnd: new Date('2025-04-30'), progress: 100, milestone: true, tags: ['设计'] },
    { id: 't3', name: '详细设计阶段', projectId: 'p4', type: 'STAGE', priority: 'URGENT', status: 'IN_PROGRESS', assigneeId: 'u2', participantIds: ['u2', 'u3', 'u4', 'u5'], planStart: new Date('2025-05-01'), planEnd: new Date('2025-08-31'), progress: 45, milestone: false, tags: ['设计'] },
    { id: 't4', name: '样件试制阶段', projectId: 'p4', type: 'STAGE', priority: 'MEDIUM', status: 'NOT_STARTED', assigneeId: 'u10', participantIds: ['u10', 'u11', 'u12'], planStart: new Date('2025-09-01'), planEnd: new Date('2025-12-31'), progress: 0, milestone: false, tags: ['开发'] },
    { id: 't5', name: '测试验证阶段', projectId: 'p4', type: 'STAGE', priority: 'MEDIUM', status: 'NOT_STARTED', assigneeId: 'u13', participantIds: ['u13', 'u14'], planStart: new Date('2026-01-01'), planEnd: new Date('2026-03-31'), progress: 0, milestone: true, tags: ['测试'] },
    // Tasks under stages
    { id: 't6', name: '电池Pack外观设计', projectId: 'p4', type: 'TASK', priority: 'HIGH', status: 'COMPLETED', assigneeId: 'u1', participantIds: ['u1', 'u5'], planStart: new Date('2025-01-20'), planEnd: new Date('2025-02-20'), progress: 100, milestone: false, tags: ['设计'] },
    { id: 't7', name: '确认需求评审文档', projectId: 'p4', type: 'TASK', priority: 'HIGH', status: 'COMPLETED', assigneeId: 'u8', participantIds: ['u8', 'u9'], planStart: new Date('2025-02-01'), planEnd: new Date('2025-02-28'), progress: 100, milestone: false, tags: ['需求'] },
    { id: 't8', name: '电池模组结构强度分析', projectId: 'p5', type: 'TASK', priority: 'URGENT', status: 'IN_PROGRESS', assigneeId: 'u2', participantIds: ['u2', 'u4'], planStart: new Date('2025-05-01'), planEnd: new Date('2025-06-30'), progress: 65, milestone: false, tags: ['设计'] },
    { id: 't9', name: 'BOM清单审核', projectId: 'p4', type: 'TASK', priority: 'HIGH', status: 'IN_PROGRESS', assigneeId: 'u3', participantIds: ['u3', 'u8'], planStart: new Date('2025-05-15'), planEnd: new Date('2025-06-15'), progress: 30, milestone: false, tags: ['设计'] },
    { id: 't10', name: '热管理方案评审', projectId: 'p4', type: 'TASK', priority: 'URGENT', status: 'PENDING_ASSIGN', assigneeId: 'u10', participantIds: ['u10', 'u11'], planStart: new Date('2025-06-01'), planEnd: new Date('2025-07-15'), progress: 0, milestone: false, tags: ['开发'] },
    // Issues and risks
    { id: 't11', name: '冷却液泄漏风险', projectId: 'p7', type: 'RISK', priority: 'URGENT', status: 'IN_PROGRESS', assigneeId: 'u4', participantIds: ['u4', 'u12'], planStart: new Date('2025-06-01'), planEnd: new Date('2025-07-31'), progress: 20, milestone: false, tags: ['测试'] },
    { id: 't12', name: '焊接工艺缺陷问题', projectId: 'p5', type: 'ISSUE', priority: 'HIGH', status: 'IN_PROGRESS', assigneeId: 'u11', participantIds: ['u11', 'u12'], planStart: new Date('2025-05-15'), planEnd: new Date('2025-06-30'), progress: 40, milestone: false, tags: ['开发'] },
    // Suggestions and changes
    { id: 't13', name: '建议增加温控传感器', projectId: 'p4', type: 'SUGGESTION', priority: 'MEDIUM', status: 'PENDING_ASSIGN', assigneeId: 'u8', participantIds: ['u8', 'u10'], planStart: new Date('2025-07-01'), planEnd: new Date('2025-08-15'), progress: 0, milestone: false, tags: ['设计'] },
    { id: 't14', name: '变更Pack外壳材料为铝合金', projectId: 'p4', type: 'CHANGE', priority: 'HIGH', status: 'PENDING_ASSIGN', assigneeId: 'u3', participantIds: ['u3', 'u1'], planStart: new Date('2025-07-15'), planEnd: new Date('2025-08-31'), progress: 0, milestone: false, tags: ['设计'] },
    // === Project 2: 充电桩控制系统 ===
    { id: 't15', name: '充电桩硬件选型', projectId: 'p9', type: 'TASK', priority: 'HIGH', status: 'COMPLETED', assigneeId: 'u10', participantIds: ['u10', 'u12'], planStart: new Date('2025-01-20'), planEnd: new Date('2025-03-15'), progress: 100, milestone: false, tags: ['开发'] },
    { id: 't16', name: '充电桩控制软件开发', projectId: 'p9', type: 'TASK', priority: 'URGENT', status: 'IN_PROGRESS', assigneeId: 'u11', participantIds: ['u11', 'u12'], planStart: new Date('2025-03-16'), planEnd: new Date('2025-06-30'), progress: 70, milestone: false, tags: ['开发'] },
    { id: 't17', name: '充电桩通信协议测试', projectId: 'p9', type: 'TASK', priority: 'MEDIUM', status: 'NOT_STARTED', assigneeId: 'u13', participantIds: ['u13', 'u14'], planStart: new Date('2025-07-01'), planEnd: new Date('2025-08-31'), progress: 0, milestone: false, tags: ['测试'] },
    // === Project 3: 车载信息娱乐系统 ===
    { id: 't18', name: '车载系统UI设计', projectId: 'p10', type: 'TASK', priority: 'MEDIUM', status: 'COMPLETED', assigneeId: 'u5', participantIds: ['u5', 'u1'], planStart: new Date('2025-02-01'), planEnd: new Date('2025-03-31'), progress: 100, milestone: false, tags: ['设计'] },
    { id: 't19', name: '车载系统功能测试', projectId: 'p10', type: 'TASK', priority: 'HIGH', status: 'IN_PROGRESS', assigneeId: 'u13', participantIds: ['u13', 'u14', 'u15'], planStart: new Date('2025-05-01'), planEnd: new Date('2025-07-31'), progress: 55, milestone: false, tags: ['测试'] },
    { id: 't20', name: '车载系统集成测试', projectId: 'p10', type: 'TASK', priority: 'MEDIUM', status: 'NOT_STARTED', assigneeId: 'u14', participantIds: ['u14', 'u11'], planStart: new Date('2025-08-01'), planEnd: new Date('2025-09-30'), progress: 0, milestone: true, tags: ['测试'] },
    // === Additional tasks for comprehensive coverage ===
    { id: 't21', name: '电池安全性测试方案', projectId: 'p4', type: 'TASK', priority: 'URGENT', status: 'NOT_STARTED', assigneeId: 'u13', participantIds: ['u13', 'u14'], planStart: new Date('2026-01-01'), planEnd: new Date('2026-02-28'), progress: 0, milestone: false, tags: ['测试'] },
    { id: 't22', name: 'Pack装配工艺流程定义', projectId: 'p4', type: 'TASK', priority: 'MEDIUM', status: 'IN_PROGRESS', assigneeId: 'u12', participantIds: ['u12', 'u11'], planStart: new Date('2025-06-01'), planEnd: new Date('2025-09-30'), progress: 25, milestone: false, tags: ['开发'] },
    { id: 't23', name: '智能驾驶传感器选型', projectId: 'p8', type: 'TASK', priority: 'HIGH', status: 'IN_PROGRESS', assigneeId: 'u10', participantIds: ['u10', 'u8'], planStart: new Date('2025-04-01'), planEnd: new Date('2025-06-30'), progress: 50, milestone: false, tags: ['开发'] },
    { id: 't24', name: 'BMS软件功能测试', projectId: 'p4', type: 'TASK', priority: 'HIGH', status: 'NOT_STARTED', assigneeId: 'u14', participantIds: ['u14', 'u13'], planStart: new Date('2025-10-01'), planEnd: new Date('2025-12-15'), progress: 0, milestone: false, tags: ['测试'] },
    { id: 't25', name: '模组组装SOP编写', projectId: 'p5', type: 'TASK', priority: 'LOW', status: 'NOT_STARTED', assigneeId: 'u9', participantIds: ['u9', 'u8'], planStart: new Date('2025-09-01'), planEnd: new Date('2025-10-31'), progress: 0, milestone: false, tags: ['设计'] },
  ];
  for (const t of taskData) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: t as any,
      create: { id: t.id, ...t, description: `任务描述：${t.name}` } as any,
    });
  }
  console.log(`Upserted ${taskData.length} tasks`);

  // Task Dependencies (various types for testing SS/SF/FS/FF)
  const depData = [
    // Chain 1: t1 → t2 → t3 → t4 (FS chain)
    { taskId: 't2', dependsOnId: 't1', type: 'FS' },
    { taskId: 't3', dependsOnId: 't2', type: 'FS' },
    { taskId: 't4', dependsOnId: 't3', type: 'FS' },
    // Chain 2: t5 → t6 (SS - synchronized start)
    { taskId: 't6', dependsOnId: 't5', type: 'SS' },
    // Chain 3: t7 → t8 (FF - synchronized finish)
    { taskId: 't8', dependsOnId: 't7', type: 'FF' },
    // Chain 4: t9 → t10 (SF - start-to-finish)
    { taskId: 't10', dependsOnId: 't9', type: 'SF' },
    // Parallel chains with mixed types
    { taskId: 't11', dependsOnId: 't4', type: 'FS' },
    { taskId: 't12', dependsOnId: 't4', type: 'FS' },
    { taskId: 't13', dependsOnId: 't6', type: 'SS' },
    { taskId: 't14', dependsOnId: 't8', type: 'FF' },
    { taskId: 't15', dependsOnId: 't10', type: 'FS' },
    // Cross-project dependencies
    { taskId: 't16', dependsOnId: 't11', type: 'FS' },
    { taskId: 't17', dependsOnId: 't12', type: 'SS' },
    { taskId: 't18', dependsOnId: 't13', type: 'FS' },
    { taskId: 't19', dependsOnId: 't14', type: 'FF' },
    // Additional diverse dependencies
    { taskId: 't20', dependsOnId: 't15', type: 'FS' },
    { taskId: 't21', dependsOnId: 't16', type: 'SS' },
    { taskId: 't22', dependsOnId: 't17', type: 'FS' },
    { taskId: 't23', dependsOnId: 't18', type: 'FF' },
    { taskId: 't24', dependsOnId: 't19', type: 'SF' },
    { taskId: 't25', dependsOnId: 't20', type: 'FS' },
  ];
  for (const dep of depData) {
    await prisma.taskDependency.upsert({
      where: { taskId_dependsOnId: { taskId: dep.taskId, dependsOnId: dep.dependsOnId } },
      update: { type: dep.type },
      create: dep,
    });
  }
  // Also update legacy dependencies field for backward compat
  for (const dep of depData) {
    const task = await prisma.task.findUnique({ where: { id: dep.taskId } });
    if (task) {
      const existingDeps = (task as any).dependencies || [];
      if (!existingDeps.includes(dep.dependsOnId)) {
        await prisma.task.update({
          where: { id: dep.taskId },
          data: { dependencies: [...existingDeps, dep.dependsOnId] },
        });
      }
    }
  }
  console.log(`Upserted ${depData.length} task dependencies`);

  // Templates for task template picker and workflow template picker
  const templateData = [
    { id: 'tpl1', name: '通用任务模板', type: 'task', description: '标准任务创建模板', content: { steps: ['需求确认', '方案设计', '开发实施', '测试验证', '交付'] }, creatorId: 'u6' },
    { id: 'tpl2', name: '设计任务模板', type: 'task', description: '设计类任务标准流程', content: { steps: ['概念草图', '3D建模', '设计评审', '出图', '会签'] }, creatorId: 'u1' },
    { id: 'tpl3', name: '测试任务模板', type: 'task', description: '测试类任务标准流程', content: { steps: ['测试方案', '用例设计', '测试执行', '缺陷跟踪', '测试报告'] }, creatorId: 'u13' },
    { id: 'tpl4', name: '项目审批工作流', type: 'workflow', description: '项目立项审批流程', content: { steps: ['提交申请', '部门主管审批', '技术评审', '财务审核', '总经理审批'] }, creatorId: 'u6' },
    { id: 'tpl5', name: '变更管理工作流', type: 'workflow', description: '工程变更审批流程', content: { steps: ['变更申请', '影响分析', '评审会议', '批准实施', '验证关闭'] }, creatorId: 'u8' },
    { id: 'tpl6', name: '新产品导入模板', type: 'project', description: 'NPI项目模板', content: { phases: ['概念', '计划', '开发', '验证', '量产'] }, creatorId: 'u6' },
  ];
  for (const tpl of templateData) {
    await prisma.template.upsert({
      where: { id: tpl.id },
      update: tpl as any,
      create: tpl as any,
    });
  }
  console.log(`Upserted ${templateData.length} templates`);

  // Notifications for testing notification bell
  const notificationData = [
    { id: 'n1', userId: 'u1', type: 'task_assigned', title: '新任务分配', content: '您被分配了任务：电池Pack外观设计', relatedType: 'task', relatedId: 't6', isRead: true },
    { id: 'n2', userId: 'u1', type: 'task_status', title: '任务状态变更', content: '任务"热管理方案评审"状态变更为待分配', relatedType: 'task', relatedId: 't10', isRead: false },
    { id: 'n3', userId: 'u2', type: 'approval', title: '审批提醒', content: '您有新的审批待处理', relatedType: 'approval', relatedId: 'a1', isRead: false },
    { id: 'n4', userId: 'u8', type: 'task_overdue', title: '任务预警', content: '任务"BOM清单审核"即将到期', relatedType: 'task', relatedId: 't9', isRead: false },
    { id: 'n5', userId: 'u13', type: 'task_assigned', title: '新任务分配', content: '您被分配了任务：电池安全性测试方案', relatedType: 'task', relatedId: 't21', isRead: false },
  ];
  for (const n of notificationData) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: n,
      create: n,
    });
  }
  console.log(`Upserted ${notificationData.length} notifications`);

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
