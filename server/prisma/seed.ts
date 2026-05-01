import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Departments
  const departments = await Promise.all([
    prisma.department.create({ data: { id: 'd1', name: '公司管理层', sortOrder: 1 } }),
    prisma.department.create({ data: { id: 'd2', name: '设计部', sortOrder: 2 } }),
    prisma.department.create({ data: { id: 'd3', name: '产品部', sortOrder: 3 } }),
    prisma.department.create({ data: { id: 'd4', name: '研发部', sortOrder: 4 } }),
    prisma.department.create({ data: { id: 'd5', name: '测试部', sortOrder: 5 } }),
  ]);
  console.log(`Created ${departments.length} departments`);

  // Roles
  const roles = await Promise.all([
    prisma.role.create({ data: { id: 'r1', name: '管理层 - 总经理', departmentId: 'd1', permissions: ['*'], memberCount: 1 } }),
    prisma.role.create({ data: { id: 'r2', name: '管理层 - 副总经理', departmentId: 'd1', permissions: ['project:*', 'task:*'], memberCount: 2 } }),
    prisma.role.create({ data: { id: 'r3', name: '管理层 - 财务总监', departmentId: 'd1', permissions: ['finance:*'], memberCount: 1 } }),
    prisma.role.create({ data: { id: 'r4', name: '管理层 - 设计主管', departmentId: 'd2', permissions: ['design:*', 'task:*'], memberCount: 1 } }),
    prisma.role.create({ data: { id: 'r5', name: '设计师', departmentId: 'd2', permissions: ['design:edit', 'task:edit'], memberCount: 4 } }),
    prisma.role.create({ data: { id: 'r6', name: '管理层 - 产品经理', departmentId: 'd3', permissions: ['product:*', 'task:*'], memberCount: 1 } }),
    prisma.role.create({ data: { id: 'r7', name: '需求分析师', departmentId: 'd3', permissions: ['product:edit', 'task:edit'], memberCount: 3 } }),
    prisma.role.create({ data: { id: 'r8', name: '产品助理', departmentId: 'd3', permissions: ['product:read', 'task:edit'], memberCount: 2 } }),
    prisma.role.create({ data: { id: 'r9', name: '管理层 - 研发主管', departmentId: 'd4', permissions: ['dev:*', 'task:*'], memberCount: 1 } }),
    prisma.role.create({ data: { id: 'r10', name: '前端工程师', departmentId: 'd4', permissions: ['dev:edit', 'task:edit'], memberCount: 3 } }),
    prisma.role.create({ data: { id: 'r11', name: '后端工程师', departmentId: 'd4', permissions: ['dev:edit', 'task:edit'], memberCount: 3 } }),
    prisma.role.create({ data: { id: 'r12', name: '测试主管', departmentId: 'd5', permissions: ['test:*', 'task:*'], memberCount: 1 } }),
    prisma.role.create({ data: { id: 'r13', name: '测试工程师', departmentId: 'd5', permissions: ['test:edit', 'task:edit'], memberCount: 3 } }),
  ]);
  console.log(`Created ${roles.length} roles`);

  // Users (with hashed passwords)
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
  const users = await Promise.all(
    userData.map((u) => prisma.user.create({ data: { ...u, password: hashedPassword } })),
  );
  console.log(`Created ${users.length} users`);

  // Teams
  const teams = await Promise.all([
    prisma.team.create({ data: { id: 't1', name: '电池Pack研发团队', description: '电池Pack产品研发团队', memberCount: 12, leaderId: 'u1' } }),
    prisma.team.create({ data: { id: 't2', name: '设计团队', description: '工业设计团队', memberCount: 30, leaderId: 'u1' } }),
  ]);
  console.log(`Created ${teams.length} teams`);

  // Projects
  const projectData = [
    { id: 'p1', name: '汽车', category: '行业', phase: 'development', status: 'in_progress', leaderId: 'u6', startDate: new Date('2025-01-01'), endDate: new Date('2026-12-31'), completion: 45 },
    { id: 'p2', name: '新能源', category: '领域', phase: 'development', status: 'in_progress', leaderId: 'u6', startDate: new Date('2025-01-01'), endDate: new Date('2026-12-31'), completion: 42, parentId: 'p1' },
    { id: 'p3', name: '电池', category: '产品线', phase: 'development', status: 'in_progress', leaderId: 'u8', startDate: new Date('2025-02-01'), endDate: new Date('2026-10-31'), completion: 38, parentId: 'p2' },
    { id: 'p4', name: '电池Pack', category: '子系统', phase: 'development', status: 'in_progress', leaderId: 'u1', startDate: new Date('2025-03-01'), endDate: new Date('2026-06-30'), completion: 35, parentId: 'p3' },
    { id: 'p5', name: '电池模组', category: '模组', phase: 'planning', status: 'in_progress', leaderId: 'u2', startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31'), completion: 25, parentId: 'p4' },
    { id: 'p6', name: '电池包', category: '组件', phase: 'concept', status: 'not_started', leaderId: 'u3', startDate: new Date('2025-05-01'), endDate: new Date('2025-12-31'), completion: 10, parentId: 'p5' },
    { id: 'p7', name: '电池冷却液', category: '零件', phase: 'survey', status: 'not_started', leaderId: 'u4', startDate: new Date('2025-06-01'), endDate: new Date('2025-11-30'), completion: 5, parentId: 'p6' },
    { id: 'p8', name: '智能驾驶系统', category: '子系统', phase: 'concept', status: 'in_progress', leaderId: 'u8', startDate: new Date('2025-03-15'), endDate: new Date('2026-09-30'), completion: 20, parentId: 'p2' },
    { id: 'p9', name: '充电桩控制系统', category: '子系统', phase: 'development', status: 'delayed', leaderId: 'u10', startDate: new Date('2025-01-15'), endDate: new Date('2025-08-31'), completion: 60, parentId: 'p2' },
    { id: 'p10', name: '车载信息娱乐系统', category: '子系统', phase: 'testing', status: 'in_progress', leaderId: 'u11', startDate: new Date('2025-02-01'), endDate: new Date('2025-07-31'), completion: 75, parentId: 'p1' },
  ];
  const projects = await Promise.all(projectData.map((p) => prisma.project.create({ data: p as any })));
  console.log(`Created ${projects.length} projects`);

  // Tasks (generate 50 tasks)
  const taskNames = [
    '上海新能源电池pack外观设计', '确认新项目需求评审文档', '首页样式修改',
    '电池模组结构强度分析', 'BOM清单审核', '电池Pack热管理方案评审',
    '冷却液选型测试报告', '电池包外壳材料选型', '模组焊接工艺验证',
    'Pack装配工艺流程定义', '电池管理系统接口设计', 'BMS软件功能测试',
    '电池安全性测试方案', '热失控防护设计评审', '电气连接器选型',
    'Pack密封性测试', '模组绝缘电阻测试', '电池包跌落测试',
    '充电兼容性测试', '低温放电性能测试', '振动测试方案制定',
    'Pack气密性检测标准', '电池一致性分选方案', '模组组装SOP编写',
    'Pack终检流程定义',
  ];
  const statuses = ['not_started', 'in_progress', 'completed', 'overdue', 'pending_assign'];
  const priorities = ['urgent', 'high', 'medium', 'low'];

  const taskData = taskNames.map((name, i) => ({
    id: `t${i + 1}`,
    name,
    description: `任务描述：${name}`,
    projectId: `p${(i % 10) + 1}`,
    priority: priorities[i % 4],
    status: statuses[i % 5],
    assigneeId: `u${(i % 15) + 1}`,
    participantIds: [`u${(i % 15) + 1}`, `u${((i + 3) % 15) + 1}`],
    planStart: new Date(2025, i % 12, (i % 28) + 1),
    planEnd: new Date(2025, (i % 12) + 3, (i % 28) + 1),
    progress: statuses[i % 5] === 'completed' ? 100 : statuses[i % 5] === 'not_started' ? 0 : Math.floor(Math.random() * 80) + 10,
    milestone: i % 10 === 0,
    tags: i % 3 === 0 ? ['设计'] : i % 3 === 1 ? ['测试'] : ['开发'],
  }));
  const tasks = await Promise.all(taskData.map((t) => prisma.task.create({ data: t as any })));
  console.log(`Created ${tasks.length} tasks`);

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
