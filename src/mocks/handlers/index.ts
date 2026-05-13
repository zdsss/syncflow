import { http, HttpResponse, delay } from 'msw';
import { mockUsers, mockTeams, mockProjects, mockTasks, mockDependencies, mockDepartments, mockRoles, mockFiles } from '../data';
import { TaskStatus, TaskPriority } from '@/types';

export const handlers = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Auth
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.post('/api/auth/login', async () => {
    await delay(100);
    return HttpResponse.json({ code: 200, data: { token: 'mock-token', refreshToken: 'mock-refresh', userId: 1, username: 'dengzhihao', realName: '邓智豪', avatar: '', roles: ['PM', 'ENGINEER'] }, message: 'ok', timestamp: Date.now() });
  }),

  http.get('/api/auth/me', async () => {
    await delay(100);
    return HttpResponse.json({ code: 200, data: { id: 1, username: 'dengzhihao', realName: '邓智豪', email: 'deng@syncflow.com', phone: '13800138000', avatar: '', status: 1, roles: ['PM', 'ENGINEER'] } });
  }),

  http.get('/api/auth/users', async () => {
    await delay(100);
    return HttpResponse.json({ code: 200, data: mockUsers });
  }),

  http.post('/api/auth/refresh', async () => {
    return HttpResponse.json({ code: 200, data: { token: 'mock-new-token', refreshToken: 'mock-new-refresh' }, message: 'ok', timestamp: Date.now() });
  }),

  http.post('/api/auth/logout', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  http.post('/api/auth/forgot-password', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  http.post('/api/auth/reset-password', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  http.post('/api/auth/register', async () => {
    return HttpResponse.json({ code: 200, data: { token: 'mock-token' } });
  }),

  http.put('/api/auth/profile', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  http.put('/api/auth/password', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  // ── Login Records ─────────────────────────────────────────────
  http.get('/api/auth/login-records', async ({ request }) => {
    const url = new URL(request.url);
    const pageNum = parseInt(url.searchParams.get('pageNum') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const allRecords = [
      { id: 'lr-1', userId: 'u1', username: '张伟', ip: '192.168.1.100', userAgent: 'Chrome/120.0 (Windows NT 10.0)', loginTime: '2026-05-08T08:30:00Z', status: 'success' },
      { id: 'lr-2', userId: 'u2', username: '王美玲', ip: '192.168.1.101', userAgent: 'Firefox/121.0 (Mac OS X)', loginTime: '2026-05-08T09:15:00Z', status: 'success' },
      { id: 'lr-3', userId: 'u3', username: '陈思远', ip: '10.0.0.55', userAgent: 'Safari/17.2 (iPhone)', loginTime: '2026-05-07T14:00:00Z', logoutTime: '2026-05-07T18:00:00Z', status: 'success' },
      { id: 'lr-4', userId: 'u4', username: '未知', ip: '203.0.113.42', userAgent: 'curl/8.4.0', loginTime: '2026-05-07T03:22:00Z', status: 'failed' },
      { id: 'lr-5', userId: 'u1', username: '张伟', ip: '192.168.1.100', userAgent: 'Chrome/120.0 (Windows NT 10.0)', loginTime: '2026-05-06T08:00:00Z', logoutTime: '2026-05-06T17:30:00Z', status: 'success' },
    ];
    const start = (pageNum - 1) * pageSize;
    const records = allRecords.slice(start, start + pageSize);
    return HttpResponse.json({ code: 200, data: { records, total: allRecords.length, pageNum, pageSize } });
  }),

  // ── API Keys ──────────────────────────────────────────────────
  http.get('/api/auth/api-keys', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 'ak-1', name: 'CI/CD Pipeline', keyPrefix: 'sf_abc1', permissions: ['task:read', 'task:write'], expiresAt: '2027-01-01T00:00:00Z', lastUsedAt: '2026-05-07T12:00:00Z', status: 1, createdAt: '2026-01-15T00:00:00Z' },
      { id: 'ak-2', name: 'Monitoring Bot', keyPrefix: 'sf_def2', permissions: ['dashboard:read'], expiresAt: '2026-12-31T00:00:00Z', lastUsedAt: '2026-05-08T06:00:00Z', status: 1, createdAt: '2026-03-01T00:00:00Z' },
      { id: 'ak-3', name: 'Legacy Integration', keyPrefix: 'sf_ghi3', permissions: ['task:read', 'project:read'], expiresAt: '2025-06-01T00:00:00Z', lastUsedAt: '2025-05-15T10:00:00Z', status: 0, createdAt: '2025-01-10T00:00:00Z' },
    ]});
  }),

  http.post('/api/auth/api-keys', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: {
      id: 'ak-new',
      name: body.name,
      keyPrefix: 'sf_new1',
      fullKey: 'sf_new1_full_secret_key_abcdef123456',
      permissions: body.permissions,
      expiresAt: body.expiresAt,
      status: 1,
      createdAt: new Date().toISOString(),
    }});
  }),

  http.delete('/api/auth/api-keys/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Teams
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/teams', async () => {
    await delay(100);
    return HttpResponse.json({ code: 200, data: mockTeams });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Tasks
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/tasks', async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const keyword = url.searchParams.get('keyword');
    const page = parseInt(url.searchParams.get('pageNum') || url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

    let filtered = [...mockTasks];
    if (status) filtered = filtered.filter((t) => t.status === parseInt(status));
    if (priority) filtered = filtered.filter((t) => t.priority === parseInt(priority));
    if (keyword) filtered = filtered.filter((t) => t.title.includes(keyword) || t.taskNo.includes(keyword));

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const records = filtered.slice(start, start + pageSize);

    return HttpResponse.json({ code: 200, data: { records, total, size: pageSize, current: page } });
  }),

  http.get('/api/tasks/statistics', async () => {
    const byStatus = (s: TaskStatus) => mockTasks.filter((t) => t.status === s).length;
    const byType = (type: string) => mockTasks.filter((t) => t.type === type).length;
    const today = new Date().toISOString().split('T')[0];
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    return HttpResponse.json({
      code: 200,
      data: {
        total: mockTasks.length,
        today: mockTasks.filter((t) => t.plannedEnd === today).length,
        thisWeek: mockTasks.filter((t) => t.plannedEnd && new Date(t.plannedEnd) <= weekEnd).length,
        thisMonth: mockTasks.length,
        warning: mockTasks.filter((t) => t.isWarning).length,
        overdue: mockTasks.filter((t) => t.isOverdue).length,
        taskCount: byType('TASK'),
        milestoneCount: byType('MILESTONE'),
        issueCount: byType('ISSUE'),
        riskCount: byType('RISK'),
        suggestionCount: byType('SUGGESTION'),
        activityCount: byType('ACTIVITY'),
        changeCount: byType('CHANGE'),
        stageCount: byType('STAGE'),
        approvalCount: byType('APPROVAL'),
        pendingCount: byStatus(TaskStatus.PENDING),
        inProgressCount: byStatus(TaskStatus.IN_PROGRESS),
        completedCount: byStatus(TaskStatus.COMPLETED),
        cancelledCount: byStatus(TaskStatus.CANCELLED),
        onHoldCount: 0,
        overdueCount: mockTasks.filter((t) => t.isOverdue).length,
        // Legacy aliases
        pending: byStatus(TaskStatus.PENDING),
        inProgress: byStatus(TaskStatus.IN_PROGRESS),
        reviewing: byStatus(TaskStatus.PENDING_REVIEW),
        completed: byStatus(TaskStatus.COMPLETED),
        cancelled: byStatus(TaskStatus.CANCELLED),
      },
    });
  }),

  http.get('/api/tasks/:id', async ({ params }) => {
    const task = mockTasks.find((t) => String(t.id) === params.id);
    return HttpResponse.json({ code: 200, data: task || mockTasks[0] });
  }),

  http.post('/api/tasks', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newId = Math.max(...mockTasks.map((t) => t.id), 0) + 1;
    const newTask = {
      id: newId,
      taskNo: `TSK-${String(newId).padStart(3, '0')}`,
      title: (body.title || body.name || '新任务') as string,
      description: (body.description || '') as string,
      type: (body.type || 'TASK') as string,
      projectId: (body.projectId || 0) as number,
      priority: (body.priority || 3) as number,
      status: (body.status || 1) as number,
      assigneeId: (body.assigneeId || 0) as number,
      assigneeName: (body.assigneeName || '') as string,
      reporterName: '管理员',
      projectName: (body.projectName || '') as string,
      plannedStart: (body.plannedStart || new Date().toISOString().split('T')[0]) as string,
      plannedEnd: (body.plannedEnd || '') as string,
      progress: 0,
      dependencies: [] as string[],
      tags: (body.tags || '') as string,
      plannedHours: (body.plannedHours || 0) as number,
      actualHours: 0,
      isWatching: false,
      isOverdue: false,
      isWarning: false,
      commentCount: 0,
      watcherCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTasks.push(newTask as any);
    return HttpResponse.json({ code: 200, data: newTask });
  }),

  http.post('/api/tasks/quick', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newId = Math.max(...mockTasks.map((t) => t.id), 0) + 1;
    const input = (body.input || '') as string;
    const newTask = {
      id: newId,
      taskNo: `TSK-${String(newId).padStart(3, '0')}`,
      title: input,
      description: '',
      type: 'TASK' as string,
      projectId: (body.projectId || 0) as number,
      priority: 3,
      status: 1,
      assigneeId: (body.assigneeId || 0) as number,
      assigneeName: (body.assigneeName || '') as string,
      reporterName: '管理员',
      projectName: '',
      plannedStart: new Date().toISOString().split('T')[0],
      plannedEnd: '',
      progress: 0,
      dependencies: [] as string[],
      tags: '',
      plannedHours: 0,
      actualHours: 0,
      isWatching: false,
      isOverdue: false,
      isWarning: false,
      commentCount: 0,
      watcherCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTasks.push(newTask as any);
    return HttpResponse.json({ code: 200, data: newTask });
  }),

  http.put('/api/tasks/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const idx = mockTasks.findIndex((t) => String(t.id) === params.id);
    if (idx >= 0) {
      Object.assign(mockTasks[idx], body, { updatedAt: new Date().toISOString() });
      return HttpResponse.json({ code: 200, data: mockTasks[idx] });
    }
    return HttpResponse.json({ code: 200, data: { id: params.id, ...body } });
  }),

  http.patch('/api/tasks/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const idx = mockTasks.findIndex((t) => String(t.id) === params.id);
    if (idx >= 0) {
      Object.assign(mockTasks[idx], body, { updatedAt: new Date().toISOString() });
      return HttpResponse.json({ code: 200, data: mockTasks[idx] });
    }
    return HttpResponse.json({ code: 200, data: { id: params.id, ...body } });
  }),

  http.delete('/api/tasks/:id', async ({ params }) => {
    const idx = mockTasks.findIndex((t) => String(t.id) === params.id);
    if (idx >= 0) mockTasks.splice(idx, 1);
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.put('/api/tasks/:id/status', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const idx = mockTasks.findIndex((t) => String(t.id) === params.id);
    if (idx >= 0) {
      mockTasks[idx].status = body.status as number;
      mockTasks[idx].updatedAt = new Date().toISOString();
    }
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.put('/api/tasks/:id/complete', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.put('/api/tasks/:id/progress', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.get('/api/tasks/:id/comments', async () => {
    return HttpResponse.json({ code: 200, data: [] });
  }),

  http.post('/api/tasks/:id/comments', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 1, taskId: Number(params.id), userId: 1, userName: '张伟', content: body.content, createdAt: new Date().toISOString() } });
  }),

  http.get('/api/tasks/:id/activities', async () => {
    return HttpResponse.json({ code: 200, data: [] });
  }),

  http.post('/api/tasks/:id/watch', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.delete('/api/tasks/:id/watch', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Projects
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/projects', async () => {
    await delay(150);
    return HttpResponse.json({ code: 200, data: mockProjects });
  }),

  http.get('/api/projects/:id', async ({ params }) => {
    const project = mockProjects.find((p) => String(p.id) === String(params.id));
    return HttpResponse.json({ code: 200, data: project || mockProjects[0] });
  }),

  http.post('/api/projects', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newId = Math.max(...mockProjects.map((p) => p.id), 0) + 1;
    const newProject = {
      id: newId,
      code: (body.code || `P${newId}`) as string,
      name: (body.name || '新项目') as string,
      description: (body.description || '') as string,
      projectType: (body.projectType || '子系统') as string,
      status: (body.status || 1) as number,
      ownerId: (body.ownerId || 1) as number,
      ownerName: (body.ownerName || '管理员') as string,
      plannedStart: (body.plannedStart || new Date().toISOString().split('T')[0]) as string,
      plannedEnd: (body.plannedEnd || '') as string,
      progress: 0,
      parentId: body.parentId as number ?? null,
      priority: (body.priority || 3) as number,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockProjects.push(newProject as any);
    return HttpResponse.json({ code: 200, data: newProject });
  }),

  http.put('/api/projects/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const idx = mockProjects.findIndex((p) => String(p.id) === params.id);
    if (idx >= 0) {
      Object.assign(mockProjects[idx], body, { updatedAt: new Date().toISOString() });
      return HttpResponse.json({ code: 200, data: mockProjects[idx] });
    }
    return HttpResponse.json({ code: 200, data: { id: params.id, ...body } });
  }),

  http.delete('/api/projects/:id', async ({ params }) => {
    const idx = mockProjects.findIndex((p) => String(p.id) === params.id);
    if (idx >= 0) mockProjects.splice(idx, 1);
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.get('/api/projects/:id/phases/tree', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 100, name: '概念设计', order: 1, milestones: [{ id: 3, name: '概念评审', dueDate: '2025-04-15', status: 4 }], stageGates: [{ id: 1, name: '概念评审门', gateDate: '2025-04-15', passed: true }] },
      { id: 101, name: '详细设计', order: 2, milestones: [{ id: 8, name: '设计评审', dueDate: '2025-07-01', status: 1 }], stageGates: [{ id: 2, name: '设计评审门', gateDate: '2025-07-15', passed: false }] },
      { id: 102, name: '样件制作', order: 3, milestones: [{ id: 11, name: '样件确认', dueDate: '2025-09-01', status: 1 }], stageGates: [] },
      { id: 103, name: '验证测试', order: 4, milestones: [], stageGates: [] },
    ]});
  }),

  http.get('/api/projects/:id/members', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: [
      { userId: 1, userName: '张伟', role: '负责人', joinedAt: '2025-01-01T00:00:00Z' },
      { userId: 2, userName: '王美玲', role: '设计师', joinedAt: '2025-01-05T00:00:00Z' },
      { userId: 3, userName: '陈思远', role: '工程师', joinedAt: '2025-01-10T00:00:00Z' },
    ]});
  }),

  http.post('/api/projects/:id/members', async () => {
    return HttpResponse.json({ code: 200, data: { userId: 99, userName: '新成员', role: '成员', joinedAt: new Date().toISOString() } });
  }),

  http.delete('/api/projects/:id/members/:userId', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.get('/api/projects/:id/gantt', async ({ params }) => {
    const projectId = parseInt(params.id as string);
    const tasks = mockTasks.filter((t) => t.projectId === projectId);
    const taskIds = new Set(tasks.map((t) => String(t.id)));
    const deps = mockDependencies.filter((d) => taskIds.has(d.taskId) && taskIds.has(d.dependsOnId));
    return HttpResponse.json({ code: 200, data: { startDate: '2025-01-01', endDate: '2026-12-31', tasks, dependencies: deps }, success: true });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Files
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/files', async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');

    let filtered = [...mockFiles];
    if (type && type !== 'all') filtered = filtered.filter((f) => f.type === type);

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return HttpResponse.json({
      code: 200,
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      storageStats: { totalFiles: mockFiles.length, usedSpace: 1.3 * 1024 * 1024 * 1024, totalSpace: 20 * 1024 * 1024 * 1024 },
    });
  }),

  http.get('/api/files/:id', async ({ params }) => {
    const file = mockFiles.find((f) => f.id === params.id);
    return HttpResponse.json({ code: 200, data: file || mockFiles[0] });
  }),

  http.post('/api/files/upload', async () => {
    return HttpResponse.json({ code: 200, data: { id: 'f-new', name: 'uploaded-file.pdf', type: 'document', size: 1024000, createdAt: new Date().toISOString() } });
  }),

  http.get('/api/files/:id/download', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  http.delete('/api/files/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.post('/api/files/folders', async () => {
    return HttpResponse.json({ code: 200, data: { id: 'folder-new', name: '新文件夹' } });
  }),

  http.get('/api/files/folders/tree', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 'folder1', name: '设计文档', children: [{ id: 'folder1-1', name: '2025版', children: [] }] },
      { id: 'folder2', name: '测试报告', children: [] },
      { id: 'folder3', name: '工艺文件', children: [] },
    ]});
  }),

  http.get('/api/files/:id/breadcrumbs', async () => {
    return HttpResponse.json({ code: 200, data: [{ id: 'root', name: '全部文件' }, { id: 'folder1', name: '设计文档' }] });
  }),

  http.post('/api/files/batch-delete', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  http.post('/api/files/batch-download', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Config (legacy /config paths)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/config/departments', async () => {
    await delay(100);
    return HttpResponse.json({ code: 200, data: mockDepartments });
  }),

  http.get('/api/config/roles', async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const deptId = url.searchParams.get('departmentId');
    const filtered = deptId ? mockRoles.filter((r) => r.departmentId === deptId) : mockRoles;
    return HttpResponse.json({ code: 200, data: filtered });
  }),

  http.get('/api/config/members', async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const roleId = url.searchParams.get('roleId');
    const filtered = roleId ? mockUsers.filter((u) => u.roleIds.includes(roleId)) : mockUsers;
    return HttpResponse.json({ code: 200, data: filtered });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Config (/sys paths)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/sys/departments/tree', async () => {
    return HttpResponse.json({ code: 200, data: mockDepartments });
  }),

  http.post('/api/sys/departments', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 'd-new', ...body } });
  }),

  http.put('/api/sys/departments/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: params.id, ...body } });
  }),

  http.delete('/api/sys/departments/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.get('/api/sys/roles', async () => {
    return HttpResponse.json({ code: 200, data: mockRoles });
  }),

  http.post('/api/sys/roles', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 'r-new', ...body } });
  }),

  http.put('/api/sys/roles/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: params.id, ...body } });
  }),

  http.delete('/api/sys/roles/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.get('/api/sys/users', async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword');
    let filtered = [...mockUsers];
    if (keyword) filtered = filtered.filter((u: any) => u.name?.includes(keyword) || u.email?.includes(keyword));
    const records = filtered.map((u: any) => ({
      id: u.id,
      username: u.email?.split('@')[0] || u.id,
      realName: u.name,
      email: u.email,
      deptName: mockDepartments.find((d) => d.id === u.departmentId)?.name || '未分配',
      status: u.status === 'active' ? 1 : 0,
      avatar: u.avatar || '',
    }));
    return HttpResponse.json({ code: 200, data: { records, total: records.length, pageNum: 1, pageSize: 200 } });
  }),

  http.post('/api/sys/users', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 'u-new', ...body } });
  }),

  http.put('/api/sys/users/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: params.id, ...body } });
  }),

  http.delete('/api/sys/users/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.get('/api/sys/roles/members', async ({ request }) => {
    const url = new URL(request.url);
    const roleId = url.searchParams.get('roleId');
    const filtered = roleId ? mockUsers.filter((u: any) => u.roleIds?.includes(roleId)) : mockUsers;
    return HttpResponse.json({ code: 200, data: filtered });
  }),

  http.post('/api/sys/roles/:roleId/members', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  http.delete('/api/sys/roles/members/:userId', async () => {
    return HttpResponse.json({ code: 200, message: 'ok' });
  }),

  http.get('/api/sys/roles/:roleId/permissions', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 'p1', name: '项目管理', code: 'project:*', type: 'menu', enabled: true },
      { id: 'p2', name: '任务管理', code: 'task:*', type: 'menu', enabled: true },
      { id: 'p3', name: '系统配置', code: 'config:*', type: 'menu', enabled: false },
    ]});
  }),

  http.put('/api/sys/roles/:roleId/permissions', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  http.get('/api/sys/params', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: '1', key: 'site.name', value: 'SyncFlow', description: '站点名称' },
      { id: '2', key: 'task.maxAssignees', value: '5', description: '任务最大指派人数' },
    ]});
  }),

  http.put('/api/sys/params', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Notification Settings (config.service)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/notifications/settings', async () => {
    return HttpResponse.json({ code: 200, data: { emailEnabled: true, pushEnabled: true, taskAssignment: true, approvalReminder: true, weeklyReport: false } });
  }),

  http.put('/api/notifications/settings', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Module Library (config.service)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/config/modules/categories', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, name: '电池模组', sortOrder: 1 },
      { id: 2, name: '冷却系统', sortOrder: 2 },
      { id: 3, name: '电气系统', sortOrder: 3 },
    ]});
  }),

  http.get('/api/config/modules', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, name: '标准电池模组-75Ah', categoryId: 1, code: 'BM-75A', status: 1 },
      { id: 2, name: '液冷板-C型', categoryId: 2, code: 'CL-C01', status: 1 },
      { id: 3, name: '高压线束-HV2', categoryId: 3, code: 'WH-HV2', status: 1 },
    ]});
  }),

  http.get('/api/config/modules/:moduleId/specs', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, name: '75Ah-355V', moduleId: 1, status: 1 },
      { id: 2, name: '75Ah-400V', moduleId: 1, status: 0 },
    ]});
  }),

  http.get('/api/config/modules/specs/:specId/params', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, name: '额定容量', value: '75Ah', unit: 'Ah' },
      { id: 2, name: '额定电压', value: '355.2V', unit: 'V' },
    ]});
  }),

  http.post('/api/config/modules/specs/:specId/publish', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Order Config (config.service)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/config/orders/categories', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, name: '乘用车', sortOrder: 1 },
      { id: 2, name: '商用车', sortOrder: 2 },
      { id: 3, name: '储能', sortOrder: 3 },
    ]});
  }),

  http.get('/api/config/orders/products', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, name: 'EV-标准包-75kWh', categoryId: 1, code: 'EV-75' },
      { id: 2, name: 'EV-长续航包-100kWh', categoryId: 1, code: 'EV-100' },
      { id: 3, name: 'HEV-轻混包-12kWh', categoryId: 1, code: 'HEV-12' },
    ]});
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Notifications
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/notifications', async () => {
    await delay(100);
    return HttpResponse.json({
      code: 200,
      data: [
        { id: 1, type: 'task_assigned', title: '任务指派', message: '张伟 指派了任务「BOM清单审核」给你', isRead: false, createdAt: '2025-04-28T10:00:00Z' },
        { id: 2, type: 'approval_pending', title: '审批提醒', message: '你有一条待审批的BOM变更请求', isRead: false, createdAt: '2025-04-28T09:00:00Z' },
        { id: 3, type: 'comment_mention', title: '评论提及', message: '王美玲 在任务评论中提到了你', isRead: true, createdAt: '2025-04-27T15:00:00Z' },
      ],
      total: 3,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });
  }),

  http.get('/api/notifications/unread-count', async () => {
    return HttpResponse.json({ code: 200, data: { count: 2 } });
  }),

  http.put('/api/notifications/:id/read', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: { id: params.id, isRead: true } });
  }),

  // PATCH fallback for legacy callers
  http.patch('/api/notifications/:id/read', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: { id: params.id, isRead: true } });
  }),

  http.put('/api/notifications/read-all', async () => {
    return HttpResponse.json({ code: 200, data: { success: true } });
  }),

  // PATCH fallback for legacy callers
  http.patch('/api/notifications/read-all', async () => {
    return HttpResponse.json({ code: 200, data: { success: true } });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Dashboard
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/dashboard/summary', async () => {
    await delay(200);
    const byStatus = (s: TaskStatus) => mockTasks.filter((t) => t.status === s).length;
    const today = new Date().toISOString().split('T')[0];
    return HttpResponse.json({
      code: 200,
      data: {
        totalTasks: mockTasks.length,
        completed: byStatus(TaskStatus.COMPLETED),
        inProgress: byStatus(TaskStatus.IN_PROGRESS),
        overdue: mockTasks.filter((t) => t.isOverdue).length,
        notStarted: byStatus(TaskStatus.PENDING),
        pendingReview: byStatus(TaskStatus.PENDING_REVIEW),
        urgent: mockTasks.filter((t) => t.priority === TaskPriority.URGENT).length,
        warnings: mockTasks.filter((t) => t.isWarning).length,
        risks: mockTasks.filter((t) => t.type === 'RISK').length,
        suggestions: mockTasks.filter((t) => t.type === 'SUGGESTION').length,
        todayTasks: mockTasks.filter((t) => t.plannedEnd === today).length,
        weekTasks: mockTasks.filter((t) => {
          if (!t.plannedEnd) return false;
          const end = new Date(t.plannedEnd);
          const now = new Date();
          const weekEnd = new Date(now);
          weekEnd.setDate(weekEnd.getDate() + 7);
          return end >= now && end <= weekEnd;
        }).length,
      },
    });
  }),

  http.get('/api/dashboard', async () => {
    const byStatus = (s: TaskStatus) => mockTasks.filter((t) => t.status === s);
    return HttpResponse.json({
      code: 200,
      data: {
        summary: {
          totalTasks: mockTasks.length,
          completed: byStatus(TaskStatus.COMPLETED).length,
          inProgress: byStatus(TaskStatus.IN_PROGRESS).length,
          overdue: mockTasks.filter((t) => t.isOverdue).length,
        },
        completedTasks: byStatus(TaskStatus.COMPLETED).slice(0, 5),
        overdueTasks: mockTasks.filter((t) => t.isOverdue).slice(0, 5),
        currentTasks: byStatus(TaskStatus.IN_PROGRESS).slice(0, 5),
        nextTasks: byStatus(TaskStatus.PENDING).slice(0, 5),
        risks: mockTasks.filter((t) => t.type === 'RISK'),
        manHourRanking: [
          { userId: 'u1', userName: '邓智豪', totalHours: 168 },
          { userId: 'u2', userName: '王美玲', totalHours: 152 },
          { userId: 'u10', userName: '刘伟', totalHours: 140 },
          { userId: 'u8', userName: '王晓明', totalHours: 125 },
          { userId: 'u13', userName: '孙小雨', totalHours: 110 },
        ],
        onTimeRateRanking: [
          { userId: 'u6', userName: '张伟', rate: 95 },
          { userId: 'u7', userName: '李娜', rate: 92 },
          { userId: 'u8', userName: '王晓明', rate: 88 },
          { userId: 'u11', userName: '陈晨', rate: 85 },
          { userId: 'u1', userName: '邓智豪', rate: 82 },
        ],
        inProgressActivities: byStatus(TaskStatus.IN_PROGRESS).filter((t) => t.type === 'ACTIVITY').slice(0, 5),
      },
    });
  }),

  http.get('/api/dashboard/completed-tasks', async () => {
    return HttpResponse.json({ code: 200, data: mockTasks.filter((t) => t.status === TaskStatus.COMPLETED).slice(0, 10) });
  }),

  http.get('/api/dashboard/overdue-tasks', async () => {
    return HttpResponse.json({ code: 200, data: mockTasks.filter((t) => t.isOverdue).slice(0, 10) });
  }),

  http.get('/api/dashboard/risks', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, type: '进度', description: '电池Pack设计进度落后计划2周', severity: 'high', owner: '邓智豪' },
      { id: 2, type: '资源', description: '测试设备排期冲突', severity: 'medium', owner: '孙小雨' },
    ]});
  }),

  http.get('/api/dashboard/warnings', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, type: '质量', description: '电芯来料检验合格率低于目标值', severity: 'medium' },
      { id: 2, type: '成本', description: 'BOM成本超出预算5%', severity: 'low' },
      { id: 3, type: '进度', description: '测试阶段即将逾期', severity: 'high' },
    ]});
  }),

  http.get('/api/dashboard/suggestions', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, type: '效率', description: '建议将模组组装和Pack装配并行执行', impact: 'high' },
      { id: 2, type: '资源', description: '建议增加一名测试工程师', impact: 'medium' },
      { id: 3, type: '流程', description: '建议简化BOM审核流程', impact: 'medium' },
      { id: 4, type: '质量', description: '建议增加电芯来料抽检频次', impact: 'low' },
    ]});
  }),

  http.get('/api/dashboard/pending-approvals', async () => {
    const approvalTasks = mockTasks.filter((t) => t.type === 'APPROVAL' && t.status === TaskStatus.PENDING_REVIEW);
    const data = approvalTasks.map((t) => ({
      id: t.id,
      title: t.title,
      type: 'change',
      applicantName: t.assigneeName,
      createdAt: t.plannedStart,
      status: 'pending',
      projectName: t.projectName,
      currentTaskId: `task-${t.id}`,
    }));
    return HttpResponse.json({ code: 200, data });
  }),

  http.get('/api/dashboard/current-tasks', async () => {
    return HttpResponse.json({ code: 200, data: mockTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).slice(0, 10) });
  }),

  http.get('/api/dashboard/next-tasks', async () => {
    return HttpResponse.json({ code: 200, data: mockTasks.filter((t) => t.status === TaskStatus.PENDING).slice(0, 10) });
  }),

  http.get('/api/dashboard/man-hour-ranking', async () => {
    return HttpResponse.json({ code: 200, data: [
      { userId: 'u1', userName: '邓智豪', totalHours: 168 },
      { userId: 'u2', userName: '王美玲', totalHours: 152 },
      { userId: 'u3', userName: '陈思远', totalHours: 140 },
      { userId: 'u4', userName: '李小龙', totalHours: 128 },
      { userId: 'u5', userName: '赵雨薇', totalHours: 115 },
    ]});
  }),

  http.get('/api/dashboard/on-time-rate-ranking', async () => {
    return HttpResponse.json({ code: 200, data: [
      { userId: 'u6', userName: '张伟', rate: 95 },
      { userId: 'u7', userName: '李娜', rate: 92 },
      { userId: 'u8', userName: '王晓明', rate: 88 },
      { userId: 'u10', userName: '刘伟', rate: 85 },
      { userId: 'u11', userName: '陈晨', rate: 82 },
    ]});
  }),

  http.get('/api/dashboard/in-progress-activities', async () => {
    return HttpResponse.json({ code: 200, data: mockTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).slice(0, 5) });
  }),

  // M10: Dashboard project-progress mock
  http.get('/api/dashboard/project-progress', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, name: '电池Pack产线建设', progress: 72, status: 'in_progress', dueDate: '2026-06-30' },
      { id: 2, name: 'BMS系统开发', progress: 45, status: 'in_progress', dueDate: '2026-07-15' },
      { id: 3, name: '模组自动化产线', progress: 90, status: 'in_progress', dueDate: '2026-05-31' },
    ]});
  }),

  // M10: Dashboard upcoming-milestones mock
  http.get('/api/dashboard/upcoming-milestones', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, name: '电芯来料检验完成', projectName: '电池Pack产线建设', plannedDate: '2026-05-20', status: 2 },
      { id: 2, name: 'BMS原型验证', projectName: 'BMS系统开发', plannedDate: '2026-05-25', status: 1 },
      { id: 3, name: '产线FAT验收', projectName: '模组自动化产线', plannedDate: '2026-06-01', status: 1 },
    ]});
  }),

  // M10: Dashboard overview mock
  http.get('/api/dashboard/overview', async () => {
    return HttpResponse.json({ code: 200, data: {
      totalProjects: 8, inProgress: 5, completed: 2, delayed: 1,
      totalTasks: mockTasks.length,
      completedTasks: mockTasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
      inProgressTasks: mockTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
    }});
  }),

  // M13: Workflow remind mock
  http.post('/api/wf/business-objects/:id/remind', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  // M12: Approval config mocks
  http.get('/api/approval-configs', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, objectType: 'TASK', processKey: 'GENERIC_APPROVAL', nodeId: 'node1', nodeName: '部门主管审批', ruleType: 'ROLE', ruleValue: 'DEPT_MANAGER', priority: 1, required: true, enabled: true },
      { id: 2, objectType: 'MILESTONE', processKey: 'GENERIC_APPROVAL', nodeId: 'node2', nodeName: '项目经理审批', ruleType: 'ROLE', ruleValue: 'PROJECT_MANAGER', priority: 2, required: true, enabled: true },
    ]});
  }),

  http.get('/api/approval-configs/:id', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: { id: Number(params.id), objectType: 'TASK', processKey: 'GENERIC_APPROVAL', nodeId: 'node1', nodeName: '部门主管审批', ruleType: 'ROLE', ruleValue: 'DEPT_MANAGER', priority: 1, required: true, enabled: true }});
  }),

  http.post('/api/approval-configs', async () => {
    return HttpResponse.json({ code: 200, data: { id: 3, objectType: 'TASK', processKey: 'GENERIC_APPROVAL', nodeId: 'node3', nodeName: '新审批节点', ruleType: 'USER', ruleValue: '1', priority: 3, required: false, enabled: true }});
  }),

  http.put('/api/approval-configs/:id', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: { id: Number(params.id), objectType: 'TASK', processKey: 'GENERIC_APPROVAL', nodeId: 'node1', nodeName: '更新后节点', ruleType: 'ROLE', ruleValue: 'DEPT_MANAGER', priority: 1, required: true, enabled: true }});
  }),

  http.delete('/api/approval-configs/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.put('/api/approval-configs/:id/toggle', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Knowledge
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/knowledge', async () => {
    await delay(100);
    return HttpResponse.json({ code: 200, data: [
      { id: 1, title: '电池Pack设计规范V3.0', category: '设计标准', author: '邓智豪', status: 'published', createdAt: '2025-03-15T00:00:00Z', updatedAt: '2025-04-20T00:00:00Z' },
      { id: 2, title: '热管理选型指南', category: '技术指南', author: '王美玲', status: 'published', createdAt: '2025-02-10T00:00:00Z', updatedAt: '2025-04-10T00:00:00Z' },
      { id: 3, title: 'FMEA分析模板', category: '模板文档', author: '王晓明', status: 'draft', createdAt: '2025-04-01T00:00:00Z', updatedAt: '2025-04-25T00:00:00Z' },
    ], total: 3, page: 1, pageSize: 20, totalPages: 1 });
  }),

  http.get('/api/knowledge/categories', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 'cat1', name: '设计标准', count: 12 },
      { id: 'cat2', name: '技术指南', count: 8 },
      { id: 'cat3', name: '模板文档', count: 5 },
      { id: 'cat4', name: '培训资料', count: 3 },
    ]});
  }),

  http.get('/api/knowledge/by-category/:category', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, title: `${params.category}相关文章1`, category: params.category, status: 'published' },
    ]});
  }),

  http.get('/api/knowledge/:id', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: {
      id: Number(params.id), title: '电池Pack设计规范V3.0', category: '设计标准',
      content: '# 设计规范\n\n## 1. 概述\n\n本文档定义了电池Pack的标准化设计流程...',
      author: '邓智豪', status: 'published',
      createdAt: '2025-03-15T00:00:00Z', updatedAt: '2025-04-20T00:00:00Z',
    }});
  }),

  http.post('/api/knowledge', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 99, ...body, createdAt: new Date().toISOString() } });
  }),

  http.patch('/api/knowledge/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: Number(params.id), ...body } });
  }),

  http.delete('/api/knowledge/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.get('/api/knowledge/:id/comments', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, authorId: 'u2', authorName: '王美玲', content: '建议补充高温工况下的测试要求', createdAt: '2025-04-21T10:00:00Z' },
    ]});
  }),

  http.post('/api/knowledge/:id/comments', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 1, authorName: '当前用户', content: body.content, createdAt: new Date().toISOString() } });
  }),

  // ── Knowledge Tags ──────────────────────────────────────────────
  http.get('/api/knowledge/tags', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 'tag1', name: '电池技术', articleCount: 15 },
      { id: 'tag2', name: '热管理', articleCount: 8 },
      { id: 'tag3', name: '安全规范', articleCount: 6 },
    ]});
  }),

  http.post('/api/knowledge/tags', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 'tag-new', ...body, articleCount: 0 } });
  }),

  http.delete('/api/knowledge/tags/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  // ── Knowledge Category CRUD ─────────────────────────────────────
  http.post('/api/knowledge/categories', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 'cat-new', ...body, count: 0 } });
  }),

  http.patch('/api/knowledge/categories/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: params.id, ...body } });
  }),

  http.delete('/api/knowledge/categories/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Templates
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/templates', async () => {
    await delay(100);
    return HttpResponse.json({ code: 200, data: [
      { id: 'tpl1', name: '电池Pack标准设计模板', category: '设计模板', description: '适用于标准电池Pack设计的项目模板', usageCount: 15, createdAt: '2025-01-10T00:00:00Z' },
      { id: 'tpl2', name: 'BOM审核流程模板', category: '流程模板', description: '标准BOM清单审核流程', usageCount: 8, createdAt: '2025-02-05T00:00:00Z' },
      { id: 'tpl3', name: '测试报告模板', category: '文档模板', description: '电池测试标准报告模板', usageCount: 22, createdAt: '2025-01-20T00:00:00Z' },
    ], total: 3, page: 1, pageSize: 20, totalPages: 1 });
  }),

  http.get('/api/templates/categories', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 'tc1', name: '设计模板', count: 5 },
      { id: 'tc2', name: '流程模板', count: 3 },
      { id: 'tc3', name: '文档模板', count: 8 },
    ]});
  }),

  http.get('/api/templates/:id', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: {
      id: params.id, name: '电池Pack标准设计模板', category: '设计模板',
      description: '适用于标准电池Pack设计的项目模板',
      content: { phases: ['概念设计', '详细设计', '验证测试', '量产准备'], defaultTasks: ['需求评审', '方案设计', '样件制作'] },
      createdAt: '2025-01-10T00:00:00Z',
    }});
  }),

  http.post('/api/templates', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 'tpl-new', ...body, createdAt: new Date().toISOString() } });
  }),

  http.patch('/api/templates/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: params.id, ...body } });
  }),

  http.delete('/api/templates/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.get('/api/templates/:id/preview', async () => {
    return HttpResponse.json({
      code: 200,
      data: {
        phases: [
          {
            name: '概念设计',
            tasks: [
              { name: '需求评审', priority: 'high' },
              { name: '方案设计', priority: 'medium' },
            ],
          },
          {
            name: '详细设计',
            tasks: [
              { name: '样件制作', priority: 'high' },
              { name: '测试验证', priority: 'medium' },
            ],
          },
        ],
      },
    });
  }),

  http.post('/api/templates/:id/apply', async () => {
    return HttpResponse.json({ code: 200, data: { projectId: 'p-new', message: '模板应用成功' } });
  }),

  http.post('/api/templates/:id/duplicate', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: { id: `${params.id}-copy`, name: '模板副本' } });
  }),

  http.get('/api/templates/:id/export', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  http.post('/api/templates/import', async () => {
    return HttpResponse.json({ code: 200, data: { id: 'tpl-imported', name: '导入的模板' } });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Personal
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/personal/files', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 'pf1', name: '个人工作笔记.docx', type: 'document', size: 245000, createdAt: '2025-04-15T00:00:00Z' },
      { id: 'pf2', name: '项目进度截图.png', type: 'image', size: 1200000, createdAt: '2025-04-20T00:00:00Z' },
    ]});
  }),

  http.post('/api/personal/files', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 'pf-new', ...body, createdAt: new Date().toISOString() } });
  }),

  http.delete('/api/personal/files/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.get('/api/personal/notes', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, title: '今日待办', content: '1. 审核BOM清单\n2. 评审热管理方案\n3. 跟进样品制作', createdAt: '2025-04-28T08:00:00Z', updatedAt: '2025-04-28T08:00:00Z' },
      { id: 2, title: '会议纪要-4/25', content: '讨论了电池模组选型方案，决定采用75Ah方案...', createdAt: '2025-04-25T14:00:00Z', updatedAt: '2025-04-25T16:00:00Z' },
    ]});
  }),

  http.post('/api/personal/notes', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 99, ...body, createdAt: new Date().toISOString() } });
  }),

  http.patch('/api/personal/notes/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: Number(params.id), ...body } });
  }),

  http.delete('/api/personal/notes/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  // ── Favorites ─────────────────────────────────────────────────
  http.get('/api/personal/favorites', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 'fav1', entityType: 'task', entityId: 't1', entityName: 'BOM清单审核', createdAt: '2025-04-28T10:00:00Z' },
      { id: 'fav2', entityType: 'article', entityId: '1', entityName: '电池Pack设计规范V3.0', createdAt: '2025-04-27T15:00:00Z' },
    ]});
  }),

  http.post('/api/personal/favorites', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 'fav-new', ...body, createdAt: new Date().toISOString() } });
  }),

  http.delete('/api/personal/favorites/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Resources
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/resources', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 'res1', name: '3D打印机-01', type: '设备', status: '在用', location: 'A栋3楼实验室', currentTask: '电池模组样件打印' },
      { id: 'res2', name: '振动测试台', type: '设备', status: '空闲', location: 'B栋1楼测试中心', currentTask: null },
      { id: 'res3', name: '高低温试验箱', type: '设备', status: '在用', location: 'B栋1楼测试中心', currentTask: '低温放电性能测试' },
    ], total: 3, page: 1, pageSize: 20, totalPages: 1 });
  }),

  http.get('/api/resources/types', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 'rt1', name: '设备', count: 12 },
      { id: 'rt2', name: '工装', count: 8 },
      { id: 'rt3', name: '检具', count: 5 },
    ]});
  }),

  http.get('/api/resources/:id', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: { id: params.id, name: '3D打印机-01', type: '设备', status: '在用', location: 'A栋3楼实验室' } });
  }),

  http.post('/api/resources', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 'res-new', ...body } });
  }),

  http.patch('/api/resources/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: params.id, ...body } });
  }),

  http.delete('/api/resources/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  // ── Equipment ──────────────────────────────────────────────────
  http.get('/api/resources/equipment', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 'eq1', name: '3D打印机-01', type: '设备', status: '在用', location: 'A栋3楼实验室', currentTask: '电池模组样件打印' },
      { id: 'eq2', name: '振动测试台', type: '设备', status: '空闲', location: 'B栋1楼测试中心', currentTask: null },
    ]});
  }),

  http.get('/api/resources/equipment/:id', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: { id: params.id, name: '3D打印机-01', type: '设备', status: '在用', location: 'A栋3楼实验室' } });
  }),

  http.post('/api/resources/equipment', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 'eq-new', ...body } });
  }),

  http.patch('/api/resources/equipment/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: params.id, ...body } });
  }),

  http.delete('/api/resources/equipment/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  // ── Suppliers ──────────────────────────────────────────────────
  http.get('/api/resources/suppliers', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 'sup1', name: '宁德时代', contact: '张经理', phone: '13800001111', email: 'zhang@catl.com', status: 'active' },
      { id: 'sup2', name: '比亚迪电池', contact: '李经理', phone: '13800002222', email: 'li@byd.com', status: 'active' },
    ]});
  }),

  http.get('/api/resources/suppliers/:id', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: { id: params.id, name: '宁德时代', contact: '张经理', phone: '13800001111', status: 'active' } });
  }),

  http.post('/api/resources/suppliers', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 'sup-new', ...body } });
  }),

  http.patch('/api/resources/suppliers/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: params.id, ...body } });
  }),

  http.delete('/api/resources/suppliers/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  // ── Borrowing ──────────────────────────────────────────────────
  http.get('/api/resources/borrows', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 'br1', resourceId: 'eq1', resourceName: '3D打印机-01', borrowerId: 'u1', borrowerName: '邓智豪', borrowDate: '2025-04-25T10:00:00Z', status: 'borrowed', purpose: '样件打印' },
      { id: 'br2', resourceId: 'eq2', resourceName: '振动测试台', borrowerId: 'u3', borrowerName: '陈思远', borrowDate: '2025-04-20T09:00:00Z', returnDate: '2025-04-22T17:00:00Z', status: 'returned', purpose: '振动测试' },
    ]});
  }),

  http.post('/api/resources/borrows', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 'br-new', ...body, status: 'borrowed' } });
  }),

  http.put('/api/resources/borrows/:id/return', async () => {
    return HttpResponse.json({ code: 200, data: { success: true } });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Process Routes
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/process-routes', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, name: '电池Pack标准工艺路线', bomId: 1, projectId: 1, productCode: 'BP-75A', productName: '75Ah电池Pack', status: 'approved', operations: [
        { id: 1, name: '电芯来料检验', sortOrder: 1, workCenterCode: 'QC-01' },
        { id: 2, name: '模组组装', sortOrder: 2, workCenterCode: 'ASM-01' },
        { id: 3, name: 'Pack装配', sortOrder: 3, workCenterCode: 'ASM-02' },
        { id: 4, name: 'EOL测试', sortOrder: 4, workCenterCode: 'TEST-01' },
      ]},
    ]});
  }),

  http.get('/api/process-routes/:id', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: {
      id: Number(params.id), name: '电池Pack标准工艺路线', bomId: 1, projectId: 1,
      productCode: 'BP-75A', productName: '75Ah电池Pack', status: 'approved',
      operations: [
        { id: 1, name: '电芯来料检验', sortOrder: 1, description: '对来料电芯进行外观和性能检测' },
        { id: 2, name: '模组组装', sortOrder: 2, description: '将电芯组装成模组' },
      ],
    }});
  }),

  http.post('/api/process-routes', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 99, ...body, operations: [] } });
  }),

  http.delete('/api/process-routes/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.post('/api/process-routes/:routeId/operations', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 99, ...body, sortOrder: 1 } });
  }),

  http.put('/api/process-routes/operations/:operationId', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: Number(params.operationId), ...body } });
  }),

  http.delete('/api/process-routes/operations/:operationId', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.put('/api/process-routes/:routeId/operations/reorder', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  http.post('/api/process-routes/:routeId/steps', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 99, ...body } });
  }),

  http.post('/api/process-routes/:id/submit-approval', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  http.post('/api/process-routes/:id/withdraw-approval', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  http.get('/api/process-routes/:id/versions', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: '1', version: 1, description: '初始版本', status: 'published', routeId: '1', createdAt: '2025-04-01T10:00:00Z' },
    ]});
  }),

  http.post('/api/process-routes/:id/versions', async () => {
    return HttpResponse.json({ code: 200, data: { id: '2', version: 2, status: 'draft' } });
  }),

  // Legacy /api/process path
  http.get('/api/process', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, name: '电池Pack标准工艺路线', status: 'approved', project: '电池Pack' },
    ]});
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BOM
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/boms', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, name: '75Ah电池Pack BOM', projectId: 1, productCode: 'BP-75A', productName: '75Ah电池Pack', status: 3, version: '3.0', itemCount: 42, isLatest: true },
      { id: 2, name: '100Ah电池Pack BOM', projectId: 1, productCode: 'BP-100A', productName: '100Ah电池Pack', status: 1, version: '1.0', itemCount: 38 },
    ]});
  }),

  http.get('/api/boms/:id', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: {
      id: Number(params.id), name: '75Ah电池Pack BOM', projectId: 1,
      productCode: 'BP-75A', productName: '75Ah电池Pack', status: 3, version: '3.0', isLatest: true,
    }});
  }),

  http.get('/api/boms/:id/structure', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, name: '电芯模组', parentId: null, materialCode: 'CM-75A', quantity: 6, children: [
        { id: 2, name: '电芯', parentId: 1, materialCode: 'CELL-75A', quantity: 24, specification: '75Ah/3.6V' },
        { id: 3, name: '模组壳体', parentId: 1, materialCode: 'MH-01', quantity: 6, material: '铝合金' },
      ]},
      { id: 4, name: 'BMS控制器', parentId: null, materialCode: 'BMS-01', quantity: 1 },
      { id: 5, name: 'Pack外壳', parentId: null, materialCode: 'PK-H01', quantity: 1, material: '钢铝混合' },
    ]});
  }),

  http.post('/api/boms', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 99, ...body, version: '1.0' } });
  }),

  http.post('/api/boms/:bomId/items', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 99, ...body } });
  }),

  http.put('/api/boms/items/:itemId', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: Number(params.itemId), ...body } });
  }),

  http.delete('/api/boms/items/:itemId', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.post('/api/boms/:id/submit-approval', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: { instanceId: 'wf-bom-001', processKey: 'BOM_APPROVAL', objectId: Number(params.id) } });
  }),

  http.post('/api/boms/:id/withdraw-approval', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.post('/api/boms/:id/save-version', async () => {
    return HttpResponse.json({ code: 200, data: { version: '3.1' } });
  }),

  http.get('/api/boms/:id/versions', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, version: '3.0', changeSummary: '替换冷却液供应商', createdAt: '2025-04-20T00:00:00Z', createdBy: '邓智豪' },
      { id: 2, version: '2.0', changeSummary: '新增模组绝缘层', createdAt: '2025-03-10T00:00:00Z', createdBy: '王美玲' },
      { id: 3, version: '1.0', changeSummary: '初始版本', createdAt: '2025-01-15T00:00:00Z', createdBy: '邓智豪' },
    ]});
  }),

  http.get('/api/boms/:bomId/change-requests', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, bomId: 1, changeType: 'MODIFY', itemId: 2, name: '电芯规格变更', description: '将电芯容量从75Ah升级为80Ah', status: 'approved', createdBy: '邓智豪', createdAt: '2025-04-20T10:00:00Z' },
      { id: 2, bomId: 1, changeType: 'ADD', name: '新增温度传感器', description: '增加模组温度监测传感器', status: 'pending', createdBy: '王美玲', createdAt: '2025-04-25T14:00:00Z' },
    ]});
  }),

  http.post('/api/boms/:bomId/change-requests', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 99, bomId: Number(params.bomId), ...body, status: 'pending', createdBy: '当前用户', createdAt: new Date().toISOString() } });
  }),

  http.get('/api/boms/:id/compare', async () => {
    return HttpResponse.json({ code: 200, data: {
      added: [{ id: 10, name: '温度传感器', materialCode: 'TS-01', quantity: 6 }],
      removed: [],
      modified: [{ id: 2, name: '电芯', field: 'specification', oldValue: '75Ah/3.6V', newValue: '80Ah/3.6V' }],
    }});
  }),

  http.post('/api/boms/:id/rollback', async () => {
    return HttpResponse.json({ code: 200, data: { version: '2.0' } });
  }),

  // Legacy BOM paths
  http.get('/api/boms/tree', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, name: '电芯模组', parentId: null, children: [
        { id: 2, name: '电芯', parentId: 1, children: [] },
        { id: 3, name: '模组壳体', parentId: 1, children: [] },
      ]},
      { id: 4, name: 'BMS控制器', parentId: null, children: [] },
    ]});
  }),

  http.post('/api/boms/items', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 99, ...body } });
  }),

  http.get('/api/boms/export', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  // Legacy /api/bom paths
  http.get('/api/bom', async () => {
    return HttpResponse.json({ code: 200, data: [] });
  }),

  http.get('/api/bom/tree', async () => {
    return HttpResponse.json({ code: 200, data: [] });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Workflow / Approval
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.post('/api/wf/start', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { instanceId: 'wf-inst-001', processKey: body.processKey, objectId: body.objectId } });
  }),

  http.post('/api/wf/tasks/:taskId/complete', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const approved = body.approved as boolean;
    // Extract task ID from wf-{id} format
    const taskIdStr = String(params.taskId).replace('wf-', '');
    const idx = mockTasks.findIndex((t) => String(t.id) === taskIdStr);
    if (idx >= 0) {
      mockTasks[idx].status = approved ? TaskStatus.COMPLETED : TaskStatus.PENDING;
      mockTasks[idx].progress = approved ? 100 : mockTasks[idx].progress;
      mockTasks[idx].updatedAt = new Date().toISOString();
    }
    return HttpResponse.json({ code: 200, data: { taskId: params.taskId, approved, completedAt: new Date().toISOString() } });
  }),

  http.get('/api/wf/tasks/pending', async () => {
    const approvalTasks = mockTasks.filter((t) => t.type === 'APPROVAL' && t.status === TaskStatus.PENDING_REVIEW);
    const data = approvalTasks.map((t) => ({
      taskId: `wf-${t.id}`,
      taskName: t.title,
      businessObjectId: t.id,
      objectType: 'TASK',
      objectName: t.title,
      projectId: t.projectId,
      applicantName: t.assigneeName,
      createdAt: t.createdAt,
    }));
    return HttpResponse.json({ code: 200, data });
  }),

  http.get('/api/wf/tasks/completed', async () => {
    const completedTasks = mockTasks.filter((t) => t.type === 'APPROVAL' && t.status === TaskStatus.COMPLETED);
    const data = completedTasks.map((t) => ({
      taskId: `wf-done-${t.id}`,
      taskName: t.title,
      businessObjectId: t.id,
      objectType: 'TASK',
      objectName: t.title,
      projectId: t.projectId,
      applicantName: t.assigneeName,
      createdAt: t.createdAt,
    }));
    return HttpResponse.json({ code: 200, data });
  }),

  http.get('/api/wf/business-objects/:id', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: {
      id: Number(params.id), objectType: 'BOM', objectId: 1, objectName: '75Ah电池Pack BOM',
      objectCode: 'BP-75A', projectId: 1, status: 2, currentNode: '技术审核',
      currentTaskId: 'task-wf-1', flowInstanceId: 'wf-inst-001',
      applicantId: 1, applicantName: '邓智豪', appliedAt: '2025-04-25T10:00:00Z',
    }});
  }),

  http.get('/api/wf/business-objects/:id/history', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, nodeName: '提交申请', approverName: '邓智豪', action: 'APPROVE', comment: '提交BOM审核', createdAt: '2025-04-25T10:00:00Z' },
    ]});
  }),

  http.post('/api/wf/business-objects/:id/withdraw', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  http.post('/api/wf/delegation', async () => {
    return HttpResponse.json({ code: 200, data: { id: 1, isActive: true } });
  }),

  http.delete('/api/wf/delegation/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.get('/api/wf/delegation', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, businessObjectId: 1, fromUserId: 1, toUserId: 7, reason: '出差期间', isActive: true, createdAt: '2025-04-20T00:00:00Z' },
    ]});
  }),

  http.post('/api/wf/cc', async () => {
    return HttpResponse.json({ code: 200, data: { id: 1 } });
  }),

  http.post('/api/wf/tasks/:taskId/reassign', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  http.post('/api/wf/tasks/:taskId/add-candidate', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  http.post('/api/wf/business-objects/:id/remind', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  http.put('/api/wf/cc/:id/read', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  http.get('/api/wf/cc', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, businessObjectId: 1, userId: 2, isRead: false, createdAt: '2025-04-25T10:00:00Z' },
      { id: 2, businessObjectId: 3, userId: 2, isRead: true, readAt: '2025-04-26T08:00:00Z', createdAt: '2025-04-24T14:00:00Z' },
    ]});
  }),

  // Legacy approvals paths
  http.get('/api/approvals', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, name: 'BOM审核', type: 'BOM', status: 'pending', applicant: '邓智豪', createdAt: '2025-04-25T00:00:00Z' },
      { id: 2, name: '工艺路线审核', type: 'ProcessRoute', status: 'pending', applicant: '王美玲', createdAt: '2025-04-26T00:00:00Z' },
    ], total: 2, page: 1, pageSize: 20, totalPages: 1 });
  }),

  http.get('/api/approvals/:id', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: {
      id: Number(params.id), name: 'BOM审核', type: 'BOM', status: 'pending',
      applicant: '邓智豪', currentApprover: '张伟', createdAt: '2025-04-25T00:00:00Z',
    }});
  }),

  http.post('/api/approvals', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 99, ...body, status: 'pending' } });
  }),

  http.post('/api/approvals/:id/chain', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: { approvalId: params.id, chainCreated: true } });
  }),

  http.patch('/api/approvals/:id/transfer', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Comments
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/comments', async ({ request }) => {
    const url = new URL(request.url);
    const entityId = url.searchParams.get('entityId');
    return HttpResponse.json({ code: 200, data: [
      { id: 1, content: '方案已确认，可以进入下阶段', entityType: 'task', entityId, authorId: 'u1', authorName: '邓智豪', createdAt: '2025-04-28T10:00:00Z' },
    ]});
  }),

  http.post('/api/comments', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 99, ...body, createdAt: new Date().toISOString() } });
  }),

  http.patch('/api/comments/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: Number(params.id), ...body } });
  }),

  http.delete('/api/comments/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Query
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/query/task-stats', async () => {
    return HttpResponse.json({ code: 200, data: [
      { projectId: 'p1', projectName: '汽车', totalTasks: 50, completed: 20, inProgress: 15, overdue: 5 },
      { projectId: 'p4', projectName: '电池Pack', totalTasks: 30, completed: 10, inProgress: 12, overdue: 3 },
    ]});
  }),

  http.get('/api/query/project-stats', async () => {
    return HttpResponse.json({ code: 200, data: [
      { projectId: 'p1', projectName: '汽车', progress: 45, totalTasks: 50, completedTasks: 20 },
      { projectId: 'p4', projectName: '电池Pack', progress: 35, totalTasks: 30, completedTasks: 10 },
    ]});
  }),

  http.get('/api/query/overdue-tasks', async () => {
    return HttpResponse.json({ code: 200, data: mockTasks.filter((t) => t.status === 'overdue').slice(0, 10) });
  }),

  http.get('/api/query/project-progress/:projectId', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: {
      projectId: params.projectId, progress: 35, totalTasks: 30, completed: 10, inProgress: 12, overdue: 3,
      phaseProgress: [{ phase: '概念设计', progress: 100 }, { phase: '详细设计', progress: 60 }, { phase: '验证测试', progress: 0 }],
    }});
  }),

  http.get('/api/query/user-workload/:userId', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: {
      userId: params.userId, userName: '邓智豪', totalTasks: 12, inProgress: 5, overdue: 2,
      plannedHours: 160, loggedHours: 120, tasks: [],
    }});
  }),

  http.get('/api/query/department-stats/:departmentId', async ({ params }) => {
    return HttpResponse.json({ code: 200, data: {
      departmentId: params.departmentId, departmentName: '设计部', memberCount: 4,
      totalTasks: 25, completed: 10, inProgress: 8, overdue: 2,
    }});
  }),

  http.get('/api/query/export/tasks', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  http.get('/api/query/export/projects', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Search
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/search', async ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    return HttpResponse.json({ code: 200, data: {
      projects: q ? [{ id: 'p1', name: '汽车', status: 'in_progress' }] : [],
      tasks: q ? [{ id: 't1', name: 'BOM清单审核', status: 'in_progress', priority: 'high' }] : [],
      files: q ? [{ id: 'f1', name: '电池Pack设计规格书.docx' }] : [],
      bomItems: q ? [{ id: '1', name: '电芯模组', partNumber: 'CM-75A' }] : [],
      articles: q ? [{ id: '1', title: '电池Pack设计规范V3.0', status: 'published' }] : [],
      users: q ? [{ id: 'u1', name: '邓智豪', email: 'deng@syncflow.com' }] : [],
    }});
  }),

  http.get('/api/search/suggestions', async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword');
    return HttpResponse.json({ code: 200, data: [
      keyword ? `${keyword}相关建议1` : '建议1',
      keyword ? `${keyword}相关建议2` : '建议2',
      keyword ? `${keyword}相关建议3` : '建议3',
    ]});
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Activity
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/activity', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, user: '邓智豪', action: '创建了任务', target: 'BOM清单审核', timestamp: '2025-04-28T10:00:00Z' },
      { id: 2, user: '王美玲', action: '完成了任务', target: '电池模组结构强度分析', timestamp: '2025-04-28T09:30:00Z' },
      { id: 3, user: '张伟', action: '审批通过了', target: 'BOM变更申请', timestamp: '2025-04-28T09:00:00Z' },
    ]});
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Audit Logs
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/audit-logs', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 1, userId: 'u1', userName: '邓智豪', action: 'CREATE', targetType: 'Task', targetId: 't1', detail: '创建任务 BOM清单审核', timestamp: '2025-04-28T10:00:00Z' },
      { id: 2, userId: 'u2', userName: '王美玲', action: 'UPDATE', targetType: 'Task', targetId: 't2', detail: '更新任务进度至80%', timestamp: '2025-04-28T09:30:00Z' },
    ]});
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Menu Management
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/sys/menus/tree', async () => {
    return HttpResponse.json({ code: 200, data: [
      {
        id: 'm1', code: 'system', name: '系统管理', icon: 'SettingOutlined', sortOrder: 1, status: 1, type: 'menu',
        children: [
          { id: 'm1-1', code: 'system:user', name: '用户管理', parentId: 'm1', icon: 'UserOutlined', link: '/config', page: 'UserManagement', sortOrder: 1, status: 1, type: 'menu', children: [
            { id: 'm1-1-1', code: 'system:user:add', name: '新增用户', parentId: 'm1-1', sortOrder: 1, status: 1, type: 'button', children: [] },
            { id: 'm1-1-2', code: 'system:user:edit', name: '编辑用户', parentId: 'm1-1', sortOrder: 2, status: 1, type: 'button', children: [] },
          ]},
          { id: 'm1-2', code: 'system:role', name: '角色管理', parentId: 'm1', icon: 'TeamOutlined', link: '/config', page: 'RoleManagement', sortOrder: 2, status: 1, type: 'menu', children: [] },
        ],
      },
      {
        id: 'm2', code: 'project', name: '项目管理', icon: 'ProjectOutlined', sortOrder: 2, status: 1, type: 'menu',
        children: [
          { id: 'm2-1', code: 'project:list', name: '项目列表', parentId: 'm2', icon: 'UnorderedListOutlined', link: '/projects', page: 'ProjectList', sortOrder: 1, status: 1, type: 'menu', children: [] },
          { id: 'm2-2', code: 'project:create', name: '创建项目', parentId: 'm2', sortOrder: 2, status: 1, type: 'button', children: [] },
        ],
      },
      {
        id: 'm3', code: 'task', name: '任务管理', icon: 'CheckSquareOutlined', sortOrder: 3, status: 1, type: 'menu',
        children: [
          { id: 'm3-1', code: 'task:list', name: '任务列表', parentId: 'm3', link: '/tasks', sortOrder: 1, status: 1, type: 'menu', children: [] },
        ],
      },
    ]});
  }),

  http.post('/api/sys/menus', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 'm-new', ...body, status: 1, children: [] } });
  }),

  http.put('/api/sys/menus/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: params.id, ...body } });
  }),

  http.delete('/api/sys/menus/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.put('/api/sys/roles/:roleId/menus', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Dictionary Management
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/sys/dictionaries', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 'dict1', code: 'task_priority', name: '任务优先级', description: '任务优先级选项', status: 1 },
      { id: 'dict2', code: 'task_status', name: '任务状态', description: '任务状态选项', status: 1 },
    ]});
  }),

  http.post('/api/sys/dictionaries', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 'dict-new', ...body, status: 1 } });
  }),

  http.put('/api/sys/dictionaries/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: params.id, ...body } });
  }),

  http.delete('/api/sys/dictionaries/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  http.get('/api/sys/dictionaries/:dictId/values', async ({ params }) => {
    const dictValues: Record<string, any[]> = {
      dict1: [
        { id: 'dv1', dictId: 'dict1', code: 'urgent', value: '紧急', sortOrder: 1, status: 1 },
        { id: 'dv2', dictId: 'dict1', code: 'high', value: '高', sortOrder: 2, status: 1 },
        { id: 'dv3', dictId: 'dict1', code: 'medium', value: '中', sortOrder: 3, status: 1 },
      ],
      dict2: [
        { id: 'dv4', dictId: 'dict2', code: 'pending', value: '待开始', sortOrder: 1, status: 1 },
        { id: 'dv5', dictId: 'dict2', code: 'in_progress', value: '进行中', sortOrder: 2, status: 1 },
        { id: 'dv6', dictId: 'dict2', code: 'completed', value: '已完成', sortOrder: 3, status: 1 },
      ],
    };
    return HttpResponse.json({ code: 200, data: dictValues[params.dictId as string] || [] });
  }),

  http.post('/api/sys/dictionaries/:dictId/values', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 'dv-new', dictId: params.dictId, ...body, status: 1 } });
  }),

  http.put('/api/sys/dictionaries/:dictId/values/:valueId', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: params.valueId, dictId: params.dictId, ...body } });
  }),

  http.delete('/api/sys/dictionaries/:dictId/values/:valueId', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Data Permissions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/sys/data-permissions', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 'dp1', code: 'data:global', description: '全局数据 - 管理员可见所有数据', type: 'record', optional: false, status: 1 },
      { id: 'dp2', code: 'data:department', description: '部门数据 - 同部门成员可见', type: 'record', optional: true, status: 1 },
      { id: 'dp3', code: 'data:project', description: '项目数据 - 项目成员可见', type: 'record', optional: true, status: 1 },
      { id: 'dp4', code: 'data:personal', description: '个人数据 - 仅自己可见', type: 'record', optional: false, status: 1 },
    ]});
  }),

  http.post('/api/sys/data-permissions', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 'dp-new', ...body, status: 1 } });
  }),

  http.put('/api/sys/data-permissions/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: params.id, ...body } });
  }),

  http.delete('/api/sys/data-permissions/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // App Authorization
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/sys/app-authorizations', async () => {
    return HttpResponse.json({ code: 200, data: [
      { id: 'aa1', keyName: 'api:task:read', description: '任务读取接口', type: 'api', scope: 'task', status: 1 },
      { id: 'aa2', keyName: 'api:task:write', description: '任务写入接口', type: 'api', scope: 'task', status: 1 },
      { id: 'aa3', keyName: 'func:export:excel', description: 'Excel导出功能', type: 'function', scope: 'report', status: 1 },
    ]});
  }),

  http.post('/api/sys/app-authorizations', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 'aa-new', ...body, status: 1 } });
  }),

  http.put('/api/sys/app-authorizations/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: params.id, ...body } });
  }),

  http.delete('/api/sys/app-authorizations/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Role Permissions (4-dimension per type)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/sys/roles/:roleId/permissions', async ({ request }) => {
    const url = new URL(request.url);
    const permType = url.searchParams.get('permType');
    const allPerms: Record<string, any[]> = {
      function: [
        { id: 'rp1', roleId: 'r1', permType: 'function', permCode: 'task:create', permValue: true },
        { id: 'rp2', roleId: 'r1', permType: 'function', permCode: 'task:edit', permValue: true },
        { id: 'rp3', roleId: 'r1', permType: 'function', permCode: 'task:delete', permValue: false },
        { id: 'rp4', roleId: 'r1', permType: 'function', permCode: 'project:manage', permValue: true },
      ],
      data: [
        { id: 'rp5', roleId: 'r1', permType: 'data', permCode: 'data:global', permValue: false },
        { id: 'rp6', roleId: 'r1', permType: 'data', permCode: 'data:department', permValue: true },
        { id: 'rp7', roleId: 'r1', permType: 'data', permCode: 'data:project', permValue: true },
        { id: 'rp8', roleId: 'r1', permType: 'data', permCode: 'data:personal', permValue: true },
      ],
      app: [
        { id: 'rp9', roleId: 'r1', permType: 'app', permCode: 'api:task:read', permValue: true },
        { id: 'rp10', roleId: 'r1', permType: 'app', permCode: 'api:task:write', permValue: false },
        { id: 'rp11', roleId: 'r1', permType: 'app', permCode: 'func:export:excel', permValue: true },
      ],
      menu: [
        { id: 'rp12', roleId: 'r1', permType: 'menu', permCode: 'm1', permValue: true },
        { id: 'rp13', roleId: 'r1', permType: 'menu', permCode: 'm1-1', permValue: true },
        { id: 'rp14', roleId: 'r1', permType: 'menu', permCode: 'm1-2', permValue: true },
        { id: 'rp15', roleId: 'r1', permType: 'menu', permCode: 'm2', permValue: true },
        { id: 'rp16', roleId: 'r1', permType: 'menu', permCode: 'm2-1', permValue: true },
      ],
    };
    if (permType && allPerms[permType]) {
      return HttpResponse.json({ code: 200, data: allPerms[permType] });
    }
    const combined = Object.values(allPerms).flat();
    return HttpResponse.json({ code: 200, data: combined });
  }),

  http.put('/api/sys/roles/:roleId/permissions/:permType', async () => {
    return HttpResponse.json({ code: 200, data: {} });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Code Management
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http.get('/api/sys/codes', async ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const mockCodes = [
      { id: 'code1', code: 'PRJ-001', description: '项目编码规则', type: 'project', status: 1, createdAt: '2025-01-10T00:00:00Z' },
      { id: 'code2', code: 'TSK-001', description: '任务编码规则', type: 'task', status: 1, createdAt: '2025-01-15T00:00:00Z' },
      { id: 'code3', code: 'FILE-001', description: '文件编码规则', type: 'file', status: 1, createdAt: '2025-02-01T00:00:00Z' },
      { id: 'code4', code: 'BOM-001', description: 'BOM编码规则', type: 'project', status: 0, createdAt: '2025-02-10T00:00:00Z' },
      { id: 'code5', code: 'DOC-001', description: '文档编码规则', type: 'file', status: 1, createdAt: '2025-03-01T00:00:00Z' },
    ];
    let filtered = mockCodes;
    if (type) filtered = filtered.filter((c) => c.type === type);
    return HttpResponse.json({ code: 200, data: filtered });
  }),

  http.post('/api/sys/codes', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: 'code-new', ...body, status: 1, createdAt: new Date().toISOString() } });
  }),

  http.put('/api/sys/codes/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ code: 200, data: { id: params.id, ...body } });
  }),

  http.delete('/api/sys/codes/:id', async () => {
    return HttpResponse.json({ code: 200, data: null });
  }),
];
