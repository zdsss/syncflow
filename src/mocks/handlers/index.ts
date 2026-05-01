import { http, HttpResponse, delay } from 'msw';
import { mockUsers, mockTeams, mockProjects, mockTasks, mockDepartments, mockRoles, mockFiles } from '../data';

export const handlers = [
  // Auth
  http.get('/api/auth/me', async () => {
    await delay(100);
    return HttpResponse.json({ code: 0, data: { user: mockUsers[0], team: mockTeams[0] } });
  }),

  // Teams
  http.get('/api/teams', async () => {
    await delay(100);
    return HttpResponse.json({ code: 0, data: mockTeams });
  }),

  // Projects
  http.get('/api/projects', async () => {
    await delay(150);
    return HttpResponse.json({ code: 0, data: mockProjects });
  }),

  // Tasks
  http.get('/api/tasks', async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const keyword = url.searchParams.get('keyword');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

    let filtered = [...mockTasks];
    if (status) filtered = filtered.filter((t) => t.status === status);
    if (priority) filtered = filtered.filter((t) => t.priority === priority);
    if (keyword) filtered = filtered.filter((t) => t.name.includes(keyword));

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return HttpResponse.json({ code: 0, data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  }),

  http.patch('/api/tasks/:id', async ({ params, request }) => {
    await delay(100);
    const body = await request.json();
    return HttpResponse.json({ code: 0, data: { id: params.id, ...body } });
  }),

  // Files
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
      code: 0,
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      storageStats: { totalFiles: mockFiles.length, usedSpace: 1.3 * 1024 * 1024 * 1024, totalSpace: 20 * 1024 * 1024 * 1024 },
    });
  }),

  // Config
  http.get('/api/config/departments', async () => {
    await delay(100);
    return HttpResponse.json({ code: 0, data: mockDepartments });
  }),

  http.get('/api/config/roles', async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const deptId = url.searchParams.get('departmentId');
    const filtered = deptId ? mockRoles.filter((r) => r.departmentId === deptId) : mockRoles;
    return HttpResponse.json({ code: 0, data: filtered });
  }),

  http.get('/api/config/members', async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const roleId = url.searchParams.get('roleId');
    const filtered = roleId ? mockUsers.filter((u) => u.roleIds.includes(roleId)) : mockUsers;
    return HttpResponse.json({ code: 0, data: filtered });
  }),

  // Dashboard
  http.get('/api/dashboard/summary', async () => {
    await delay(200);
    const byStatus = (s: string) => mockTasks.filter((t) => t.status === s).length;
    return HttpResponse.json({
      code: 0,
      data: {
        totalTasks: mockTasks.length,
        completed: byStatus('completed'),
        inProgress: byStatus('in_progress'),
        overdue: byStatus('overdue'),
        notStarted: byStatus('not_started'),
        pendingAssign: byStatus('pending_assign'),
        urgent: byStatus('urgent'),
        warnings: 3,
        risks: 2,
        suggestions: 4,
      },
    });
  }),
];
