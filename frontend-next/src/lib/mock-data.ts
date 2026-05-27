// 超简协同项目管理系统 - Mock 数据
// 后端接口只需做注释，不用实现

export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  department?: string;
}

export interface Task {
  id: string;
  name: string;
  type: string; // 事务/问题/风险/阶段/建议/变更/审批/里程碑
  projectId: string;
  projectName: string;
  progress: number;
  assignees: User[];
  plannedHours: string;
  feedbackHours: string;
  approvedHours: string;
  plannedDuration: string;
  actualEnd?: string;
  reminder?: string;
  archiveLocation?: string;
  dependencies?: { taskId: string; type: string }[];
  attachments?: Attachment[];
  status: 'todo' | 'in_progress' | 'done';
  isMilestone?: boolean;
  isWatched?: boolean;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  date: string;
  status: string;
  operator: string;
}

export interface ProjectStage {
  id: string;
  name: string;
  progress: number;
  startDate: string;
  endDate: string;
  children: ProjectStage[];
  tasks: Task[];
}

export interface Project {
  id: string;
  name: string;
  progress: number;
  type: string;
  assignees: User[];
  stages: ProjectStage[];
  plannedHours: string;
  feedbackHours: string;
  approvedHours: string;
  plannedDuration: string;
  actualEnd?: string;
  archiveLocation?: string;
  attachments?: Attachment[];
}

export interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'project' | 'stage' | 'task' | 'module' | 'file';
  icon?: string;
  children?: TreeNode[];
  progress?: number;
  status?: string;
}

// --- Mock Users ---
export const mockUsers: User[] = [
  { id: 'u1', name: '张晓菁', phone: '180****880', department: '市场部' },
  { id: 'u2', name: '王虎', phone: '180****881', department: '研发部' },
  { id: 'u3', name: '徐涛', phone: '180****882', department: '研发部' },
  { id: 'u4', name: '郑传力', phone: '180****883', department: '技术部' },
  { id: 'u5', name: '李如云', phone: '180****884', department: '市场部' },
  { id: 'u6', name: '黄奕鹤', phone: '180****885', department: '技术部' },
  { id: 'u7', name: '董华建', phone: '180****886', department: '研发部' },
  { id: 'u8', name: '孙茜茜', phone: '180****887', department: '市场部' },
  { id: 'u9', name: '吴小云', phone: '180****888', department: '工艺部' },
  { id: 'u10', name: '周华健', phone: '180****889', department: '制造部' },
  { id: 'u11', name: '郑传亮', phone: '180****890', department: '计划部' },
  { id: 'u12', name: '谢燕客', phone: '180****891', department: '制造部' },
  { id: 'u13', name: '乐嘉霖', phone: '180****892', department: '研发部' },
];

export const currentUser = mockUsers[0];

// --- Mock Tasks ---
export const mockTasks: Task[] = [
  {
    id: 't1', name: '手动执行部件设计', type: '任务', projectId: 'p1',
    projectName: '比亚迪底部水冷项目', progress: 30,
    assignees: [mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3]],
    plannedHours: '20h30m', feedbackHours: '30h', approvedHours: '20h',
    plannedDuration: '25.8.11 17:30 - 25.10.11 17:30', actualEnd: '25.8.11 17:30',
    reminder: '每天17:00', archiveLocation: '2SA系列/比亚迪水冷/手动执行机构/',
    dependencies: [
      { taskId: 't2', type: 'FS' },
      { taskId: 't3', type: 'FS' },
    ],
    attachments: [
      { id: 'a1', name: '手动执行机构.dwg', size: '213M', date: '20250301', status: '已发布', operator: '张晓菁' },
      { id: 'a2', name: '手动执行机构.sldasm', size: '213M', date: '20250301', status: '编辑中', operator: '张晓菁' },
      { id: 'a3', name: '手动执行机构设计说明书.docx', size: '213M', date: '20250301', status: '审批中', operator: '王虎' },
    ],
    status: 'in_progress', isWatched: true, createdAt: '2025.8.11',
  },
  {
    id: 't2', name: '基础底座部件设计', type: '任务', projectId: 'p1',
    projectName: '比亚迪底部水冷项目', progress: 30,
    assignees: [mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3]],
    plannedHours: '20h', feedbackHours: '15h', approvedHours: '18h',
    plannedDuration: '25.8.11 17:30 - 25.9.11 17:30',
    archiveLocation: '2SA系列/比亚迪水冷/手动执行机构/',
    status: 'in_progress', createdAt: '2025.8.11',
  },
  {
    id: 't3', name: '底座结构设计', type: '任务', projectId: 'p1',
    projectName: '比亚迪底部水冷项目', progress: 30,
    assignees: [mockUsers[0], mockUsers[1]],
    plannedHours: '20h', feedbackHours: '10h', approvedHours: '20h',
    plannedDuration: '25.8.11 17:30 - 25.9.11 17:30',
    status: 'in_progress', createdAt: '2025.8.11',
  },
  {
    id: 't4', name: '支架结构图纸设计', type: '任务', projectId: 'p1',
    projectName: '比亚迪底部水冷项目', progress: 30,
    assignees: [mockUsers[0], mockUsers[3]],
    plannedHours: '20h', feedbackHours: '8h', approvedHours: '18h',
    plannedDuration: '25.8.11 17:30 - 25.9.11 17:30',
    status: 'in_progress', isWatched: true, createdAt: '2025.8.11',
  },
  {
    id: 't5', name: '底座结构图纸设计', type: '任务', projectId: 'p1',
    projectName: '比亚迪底部水冷项目', progress: 30,
    assignees: [mockUsers[0], mockUsers[4]],
    plannedHours: '20h', feedbackHours: '12h', approvedHours: '20h',
    plannedDuration: '25.8.11 17:30 - 25.9.11 17:30',
    status: 'in_progress', createdAt: '2025.8.11',
  },
  {
    id: 't6', name: '底座结构图纸批准', type: '审批', projectId: 'p1',
    projectName: '比亚迪底部水冷项目', progress: 30,
    assignees: [mockUsers[0], mockUsers[1]],
    plannedHours: '5h', feedbackHours: '2h', approvedHours: '5h',
    plannedDuration: '25.8.11 17:30 - 25.8.15 17:30',
    status: 'in_progress', createdAt: '2025.8.11',
  },
  {
    id: 't7', name: '底座结构设计复核', type: '任务', projectId: 'p1',
    projectName: '比亚迪底部水冷项目', progress: 30,
    assignees: [mockUsers[2], mockUsers[3]],
    plannedHours: '10h', feedbackHours: '3h', approvedHours: '10h',
    plannedDuration: '25.8.11 17:30 - 25.8.20 17:30',
    status: 'in_progress', createdAt: '2025.8.11',
  },
  {
    id: 't8', name: '产品技术可行性分析', type: '任务', projectId: 'p1',
    projectName: '比亚迪底部水冷项目', progress: 100,
    assignees: [mockUsers[0], mockUsers[5]],
    plannedHours: '15h', feedbackHours: '15h', approvedHours: '15h',
    plannedDuration: '25.7.01 17:30 - 25.7.15 17:30',
    status: 'done', createdAt: '2025.7.1',
  },
];

// --- Task Statistics ---
export const taskStats = [
  { key: 'today', label: '今日', icon: 'sun', count: 5 },
  { key: 'week', label: '本周', icon: 'calendar', count: 10 },
  { key: 'month', label: '本月', icon: 'calendar-days', count: 35 },
  { key: 'all', label: '全部', icon: 'infinity', count: 285 },
  { key: 'warning', label: '预警', icon: 'bell', count: 8 },
  { key: 'overdue', label: '超期', icon: 'clock', count: 12 },
  { key: 'issue', label: '问题', icon: 'help-circle', count: 5 },
  { key: 'risk', label: '风险', icon: 'alert-triangle', count: 3 },
  { key: 'suggestion', label: '建议', icon: 'send', count: 12 },
  { key: 'watch', label: '关注', icon: 'star', count: 12 },
  { key: 'task', label: '任务', icon: 'check-square', count: 12 },
  { key: 'stage', label: '阶段', icon: 'git-branch', count: 12 },
  { key: 'activity', label: '活动', icon: 'stamp', count: 12 },
  { key: 'change', label: '变更', icon: 'refresh-cw', count: 12 },
  { key: 'milestone', label: '里程碑', icon: 'flag', count: 12 },
];

// --- Project Structure Tree ---
export const projectTree: TreeNode[] = [
  {
    id: 'cat1', name: '大类100', type: 'folder', children: [],
  },
  {
    id: 'cat2', name: '大类210', type: 'folder', children: [
      {
        id: 'cat21', name: '大类211', type: 'folder', children: [],
      },
      {
        id: 'p1', name: '比亚迪底部水冷项目', type: 'project', progress: 30, children: [
          { id: 's1', name: '概念阶段', type: 'stage', progress: 100, children: [
            { id: 's1t1', name: '思维导图', type: 'task', progress: 100, status: 'done' },
            { id: 's1t2', name: '原型设计', type: 'task', progress: 100, status: 'done' },
          ]},
          { id: 's2', name: '计划阶段', type: 'stage', progress: 90, children: [
            { id: 's2t1', name: '概念设计审核', type: 'task', progress: 100, status: 'done' },
            { id: 's2t2', name: '概念设计批准', type: 'task', progress: 100, status: 'done' },
            { id: 's2t3', name: '可行性分析', type: 'task', progress: 40, status: 'in_progress' },
            { id: 's2t4', name: '计划制定', type: 'task', progress: 100, status: 'done' },
            { id: 's2t5', name: '启动审批', type: 'task', progress: 0 },
            { id: 's2t6', name: '启动审批', type: 'task', progress: 0 },
            { id: 's2t7', name: '批准完成', type: 'task', progress: 0 },
            { id: 's2t8', name: '批准计划', type: 'task', progress: 0 },
          ]},
        ],
      },
    ],
  },
];

// --- BOM Data ---
export interface BOMItem {
  id: string;
  level: number;
  materialCode: string;
  drawingNo: string;
  name: string;
  material: string;
  weight: string;
  sourceType: string;
  location: string;
  unit: string;
  quantity: number;
  remark: string;
}

export const bomItems: BOMItem[] = [
  { id: 'b1', level: 0, materialCode: 'DSW2135001', drawingNo: '', name: '前封头模块', material: '304不锈钢', weight: '12.5kg', sourceType: 'M', location: 'A-01', unit: '件', quantity: 1, remark: '' },
  { id: 'b2', level: 1, materialCode: 'DSW2135002', drawingNo: 'DWG-001', name: '金属软管DN25', material: '304不锈钢', weight: '2.3kg', sourceType: 'B', location: 'A-02', unit: '米', quantity: 3, remark: '' },
  { id: 'b3', level: 1, materialCode: 'DSW2135003', drawingNo: 'DWG-002', name: '管网管体H60S-I', material: '304不锈钢', weight: '5.8kg', sourceType: 'M', location: 'A-03', unit: '件', quantity: 1, remark: '' },
  { id: 'b4', level: 2, materialCode: 'DSW2135004', drawingNo: 'DWG-003', name: '标准前封头', material: 'PV', weight: '3.2kg', sourceType: 'M', location: 'B-01', unit: '件', quantity: 2, remark: '椭圆截面' },
  { id: 'b5', level: 2, materialCode: 'DSW2135005', drawingNo: 'DWG-004', name: '异形前封头1', material: 'PV', weight: '4.1kg', sourceType: 'M', location: 'B-02', unit: '件', quantity: 1, remark: '五边形截面' },
  { id: 'b6', level: 2, materialCode: 'DSW2135006', drawingNo: 'DWG-005', name: '异形前封头2', material: 'PV', weight: '5.0kg', sourceType: 'M', location: 'B-03', unit: '件', quantity: 1, remark: '七边形截面' },
  { id: 'b7', level: 2, materialCode: 'DSW2135007', drawingNo: 'DWG-006', name: '异形前封头3', material: 'PV', weight: '3.8kg', sourceType: 'M', location: 'B-04', unit: '件', quantity: 1, remark: '内凹八边形' },
];

// --- Module Specification ---
export interface ModuleSpec {
  id: string;
  name: string;
  sectionForm: string;
  material: string;
  wallThickness: string;
  connectionMethod: string;
  moduleCode: string;
  status?: string;
}

export const moduleSpecs: ModuleSpec[] = [
  { id: 'ms1', name: '标准前封头', sectionForm: '椭圆', material: 'PV', wallThickness: '20mm', connectionMethod: '螺口', moduleCode: 'DSW234002', status: '已发布' },
  { id: 'ms2', name: '异形前封头1', sectionForm: '五边形', material: 'PV', wallThickness: '23mm', connectionMethod: '套盖', moduleCode: 'DSW234003', status: '编辑中' },
  { id: 'ms3', name: '异形前封头2', sectionForm: '七边形', material: 'PV', wallThickness: '33mm', connectionMethod: '套盖', moduleCode: 'DSW234004', status: '编辑中' },
  { id: 'ms4', name: '异形前封头3', sectionForm: '内凹八边形', material: 'PV', wallThickness: '23mm', connectionMethod: '卡口', moduleCode: 'DSW234005', status: '编辑中' },
];

// --- Navigation Items ---
export const navItems = [
  { key: 'workspace', label: '工作空间', icon: 'layout-dashboard' },
  { key: 'project', label: '项目管理', icon: 'folder-kanban' },
  { key: 'dashboard', label: '中控看板', icon: 'monitor' },
  { key: 'files', label: '文件管理', icon: 'file-text' },
  { key: 'bom', label: 'BOM管理', icon: 'table-2' },
  { key: 'process', label: '工艺管理', icon: 'cog' },
  { key: 'config', label: '配置管理', icon: 'settings-2' },
  { key: 'query', label: '查询统计', icon: 'bar-chart-2' },
  { key: 'resource', label: '通用资源', icon: 'wrench' },
  { key: 'knowledge', label: '知识管理', icon: 'bookmark' },
  { key: 'workflow', label: '流程定义', icon: 'git-merge' },
  { key: 'personal', label: '个人文件夹', icon: 'user' },
];

// --- File Management ---
export interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'dwg' | 'sldasm' | 'docx' | 'pdf';
  project?: string;
  status?: string;
  modifiedDate: string;
}

export const fileItems: FileItem[] = [
  { id: 'f1', name: '文件夹', type: 'folder', project: '比亚迪底部水冷项目/济南鲁能自动线项目', modifiedDate: '20250809' },
  { id: 'f2', name: '文件夹', type: 'folder', project: '济南鲁能自动线项目', modifiedDate: '20250809' },
  { id: 'f3', name: '文件夹', type: 'folder', project: '比亚迪底部水冷项目', modifiedDate: '20250809' },
  { id: 'f4', name: '文件夹', type: 'folder', project: '比亚迪底部水冷项目', modifiedDate: '20250809' },
  { id: 'f5', name: '手动执行机构.dwg', type: 'dwg', project: '济南鲁能自动线项目', status: '张晓菁 编辑中...', modifiedDate: '20250809' },
  { id: 'f6', name: '手动执行机构.sldasm', type: 'sldasm', project: '济南鲁能自动线项目', status: '已发布', modifiedDate: '20250809' },
  { id: 'f7', name: '手动执行机构设计说明书.docx', type: 'docx', project: '未关联', status: '已锁定', modifiedDate: '20250809' },
];

// --- Config Tree ---
export const configOrderTree: TreeNode[] = [
  {
    id: 'order_root', name: '订单库', type: 'folder', icon: 'home', children: [
      {
        id: 'order_cat1', name: '订单大类', type: 'folder', children: [
          {
            id: 'order_sub1', name: '订单小类', type: 'folder', children: [
              {
                id: 'order_series1', name: '系列分类', type: 'folder', children: [
                  {
                    id: 'order_product1', name: '订单产品1', type: 'module', children: [
                      { id: 'om1', name: '模块部件1', type: 'module' },
                      { id: 'om2', name: '模块部件2', type: 'module' },
                      { id: 'om3', name: '模块部件3', type: 'module' },
                      { id: 'om4', name: '模块部件4', type: 'module' },
                      { id: 'om5', name: '模块部件5', type: 'module' },
                      { id: 'om6', name: '模块部件6', type: 'module' },
                      { id: 'om7', name: '模块部件7', type: 'module' },
                      { id: 'om8', name: '模块部件8', type: 'module' },
                      { id: 'om9', name: '模块部件9', type: 'module' },
                      { id: 'om10', name: '模块部件10', type: 'module' },
                      { id: 'om11', name: '模块部件11', type: 'module' },
                      { id: 'om12', name: '模块部件12', type: 'module' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export const configModuleTree: TreeNode[] = [
  {
    id: 'module_root', name: '模块库', type: 'folder', icon: 'home', children: [
      {
        id: 'module_cat1', name: '模块大类', type: 'folder', children: [
          {
            id: 'module_sub1', name: '模块小类', type: 'folder', children: [
              {
                id: 'module_series1', name: '产品系列1', type: 'folder', children: [
                  {
                    id: 'module_product1', name: '订单产品1', type: 'module', children: [
                      { id: 'mm1', name: '前封头模块', type: 'module' },
                      { id: 'mm2', name: '后封头模块', type: 'module' },
                      { id: 'mm3', name: '管道模块', type: 'module' },
                      { id: 'mm4', name: '防爆板模块', type: 'module' },
                      { id: 'mm5', name: '连接杆模块', type: 'module' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// --- Dashboard Data ---
export const dashboardData = {
  activeProjects: 15,
  completedTasks: 128,
  overdueTasks: 12,
  risks: 3,
  currentTasks: 45,
  nextTasks: 22,
  inTransitIssues: 8,
  hoursRanking: [
    { name: '董小旭', hours: 68 },
    { name: '张晓菁', hours: 55 },
    { name: '王虎', hours: 52 },
    { name: '郑传力', hours: 48 },
    { name: '李如云', hours: 45 },
    { name: '黄奕鹤', hours: 42 },
    { name: '周华健', hours: 40 },
    { name: '徐涛', hours: 38 },
    { name: '孙茜茜', hours: 35 },
    { name: '吴小云', hours: 32 },
  ],
  onTimeRate: [
    { name: '张晓菁', rate: 95 },
    { name: '王虎', rate: 88 },
    { name: '郑传力', rate: 85 },
    { name: '李如云', rate: 82 },
  ],
};
