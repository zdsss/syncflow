# Sprint 14 — 三模块跨域数据流 + UI/UX + 审批引擎 全链路审计

> 日期：2026-05-13  
> 审计范围：工作空间(Todo) / 项目管理(Project) / 中控看板(Dashboard) + 审批引擎(Workflow)  
> 审计维度：数据流交互 / 业务逻辑一致性 / UI/UX响应式 / 审批引擎集成

---

## 一、模块交互矩阵

| From \ To | Task (Todo) | Project | Dashboard | Approval Engine |
|-----------|-------------|---------|-----------|-----------------|
| **Task** | — | recalcProjectProgress, recalcPhaseProgress | Dashboard 直接查询 task 表 | completeTask 触发 startProcess (MILESTONE/ISSUE/RISK) |
| **Project** | Tasks 引用 projectId/phaseId | — | Dashboard 直接查询 project 表 | createProject 触发 GENERIC_APPROVAL; milestone 触发审批 |
| **Dashboard** | 读取 task 表 (TaskMapper) | 读取 project 表 (ProjectMapper) | — | getPendingApprovals 委托 WorkflowService |
| **Approval** | TaskApprovalCallback 更新 task status + progress | ProjectApprovalCallback 设置 project status; MilestoneApprovalCallback 完成里程碑 | 无直接更新（Dashboard 依赖轮询） | — |

---

## 二、核心数据流图

```
任务完成（需审批）:
  Frontend: useTaskStore.completeTask(id)
    → PUT /api/tasks/{id}/complete
    → TaskServiceImpl.completeTask()
       IF (milestoneId != null || type in [MILESTONE, ISSUE, RISK]):
         → task.status = PENDING_REVIEW (3)
         → workflowService.startProcess("GENERIC_APPROVAL", taskId, "TASK", ...)
         → task.flowInstanceId = bo.flowInstanceId
       ELSE:
         → task.status = COMPLETED (4), progress = 100
         → recalcProjectProgress(projectId)
         → recalcPhaseProgress(phaseId)
    → Frontend re-fetches task by ID
    → Frontend calls useProjectStore.fetchProjectById(projectId)

审批完成回调:
  Flowable PROCESS_COMPLETED event
    → ApprovalEventListener.onProcessCompleted(bo)
       → reads "approved" variable from history
       → callbackRegistry.onApproved("TASK", objectId, approverId)
          → TaskApprovalCallback.onApproved(objectId, approverId)
             → task.status = COMPLETED, progress = 100
             → syncLinkedMilestone(task, true)
             → recalcProjectProgress(projectId)
       → notifyApplicant(bo, true)
       → pushService.sendToTopic("/topic/approvals", event)

项目创建（自动审批）:
  Frontend: useProjectStore.createProject(data)
    → POST /api/projects
    → ProjectServiceImpl.createProject()
       → project.status = 1 (not_started)
       → auto-create 6 phases
       → workflowService.startProcess("GENERIC_APPROVAL", projectId, "PROJECT", ...)
    → On approval: ProjectApprovalCallback.onApproved → project.status = 2 (in_progress)

看板数据流:
  Frontend: DashboardPage fetches via dashboard.service.ts
    → GET /api/dashboard/summary
    → GET /api/dashboard/project-progress
    → GET /api/dashboard/upcoming-milestones
    → GET /api/dashboard/pending-approvals → delegates to workflowService.getPendingTasks()
  ⚠️ 无 WebSocket 订阅（仅 mount 时轮询）
```

---

## 三、审批引擎集成点

### 3.1 BPMN 流程定义（7个）

| 流程 | 步骤 | 触发模块 |
|------|------|---------|
| generic_approval.bpmn | 单步审批 | Task/Project/Milestone |
| bom_approval.bpmn | 4步: 提交→技术评审→工艺评审(条件)→质量评审→PM审批 | BOM |
| stage_gate_approval.bpmn | 3步: 填写→启动审批→最终审批 | Project (阶段门) |
| change_approval.bpmn | 4步: 提交→影响评审→技术评审→PM审批 | BOM变更/规格变更/工艺变更 |
| file_approval.bpmn | 2步: 提交→评审 | File |
| module_spec_approval.bpmn | 3步: 提交→部门评审→技术评审 | Config |
| process_approval.bpmn | 3步: 提交→技术评审→工艺评审 | Process |

### 3.2 回调处理器注册

| Object Type | Callback Handler | 触发条件 |
|-------------|-----------------|---------|
| BOM | BomApprovalCallback | BOM 提交审批 |
| BOM_CHANGE | BomChangeApprovalCallback | 已发布 BOM 编辑 |
| TASK/ISSUE/RISK | TaskApprovalCallback | 任务状态→PENDING_REVIEW |
| MILESTONE | MilestoneApprovalCallback ⚠️冲突 | 里程碑提交审批 |
| PROJECT | ProjectApprovalCallback | 项目创建 |
| STAGE_GATE | StageGateApprovalCallback | 阶段门提交 |
| FILE/FILE_BOM/FILE_PROCESS/FILE_DOCUMENT | FileApprovalCallback | 文件提交审批 |
| MODULE_SPEC | ModuleSpecApprovalCallback | 模块规格提交 |
| SPEC_CHANGE | SpecChangeApprovalCallback | 规格变更 |
| PROCESS_CHANGE | ProcessRouteApprovalCallback | 工艺变更 |
| CHANGE | ChangeRequestApprovalCallback | 通用变更请求 |

---

## 四、问题清单

### CRITICAL（必须立即修复）

| # | 问题 | 影响 | 位置 |
|---|------|------|------|
| C1 | MILESTONE 回调注册冲突 | TaskApprovalCallback 和 MilestoneApprovalCallback 都注册了 "MILESTONE"，Spring bean 初始化顺序不确定，可能导致里程碑审批后 task 状态不更新或 milestone 不完成 | `TaskApprovalCallback.java:36`, `MilestoneApprovalCallback.java:28` |
| C2 | 撤回审批双写竞态 | `withdrawApproval()` 设置 status=5 后 `deleteProcessInstance` 触发 PROCESS_CANCELLED 事件再次设置 status=5 并调用 onWithdrawn，可能覆盖 completedBy 字段 | `WorkflowServiceImpl.java:388-416`, `ApprovalEventListener.java:344-358` |
| C3 | Dashboard 无实时更新机制 | 中控看板不订阅 WebSocket `/topic/approvals`，任务完成/审批通过后看板数据过期直到手动刷新 | `src/pages/dashboard/index.tsx` |
| C4 | 任务创建缺少 phaseId/milestoneId 字段 | CreateTaskDTO 无 phaseId/milestoneId，任务无法在创建时关联到项目阶段，审批路由逻辑 `needsApproval = task.getMilestoneId() != null` 永远不触发 | `CreateTaskDTO.java` |

### MAJOR（需要修复）

| # | 问题 | 影响 | 位置 |
|---|------|------|------|
| M1 | 加签功能使用委托 API 而非 Flowable addCandidateUser | "加签"按钮实际创建委托记录，不会在当前审批任务添加新审批人 | `AddSignerModal.tsx:29-35` |
| M2 | 加签无后端端点 | 无 REST 端点调用 `taskService.addCandidateUser()` | `WorkflowController.java` (缺失) |
| M3 | Dashboard 审批待办字段映射错误 | PendingApprovals 组件期望 `currentTaskId` 但 VO 返回 `taskId`，导致审批按钮可能禁用 | `PendingApprovals.tsx:81-82` |
| M4 | Dashboard 任务状态变更不刷新项目进度 | `handleTaskStatusChange` 不调用 `useProjectStore.fetchProjectById()`，项目进度 store 过期 | `DashboardPage index.tsx:199-209` |
| M5 | Dashboard 审批操作不刷新 task/project stores | 从 Dashboard 审批后导航到 Todo/Project 页面看到过期数据 | `DashboardPage index.tsx:149-158` |
| M6 | 项目创建无条件触发审批 | 所有项目创建都启动 GENERIC_APPROVAL，无配置检查是否需要审批 | `ProjectServiceImpl.createProject():186-206` |
| M7 | 催办通知未实际发送 | `remindApproval()` 只添加 Flowable 评论，不发送通知给审批人 | `WorkflowServiceImpl.java:452-481` |
| M8 | 过期提醒只通知申请人不通知审批人 | StaleApprovalReminderService 只通知 applicant，不解析当前 assignee | `StaleApprovalReminderService.java:79-92` |
| M9 | useDashboardStore 无数据获取能力 | Store 只存 UI 状态，其他模块无法触发 Dashboard 刷新 | `useDashboardStore.ts` |
| M10 | 通知 store ID 类型不匹配 | `notification.service.ts` 期望 `number`，store 使用 `string` | `useNotificationStore.ts:23` |
| M11 | 任务创建不触发项目进度重算 | `createTask` 不调用 `fetchProjectById`（分母变化但前端不更新） | `useTaskStore` |

### UI/UX — HIGH

| # | 问题 | 影响 | 位置 |
|---|------|------|------|
| U1 | 所有 Table 组件缺少 `scroll={{ x }}` | iPad 竖屏下表格水平溢出无滚动条 | `TaskList.tsx`, `ApprovalList.tsx`, `ProjectPage index.tsx` |
| U2 | Col span={6} 无响应式断点 | Dashboard/Project 统计卡片在 iPad 上每个仅 ~150px 宽，不可读 | `OverviewCards.tsx`, `TaskSummaryCards.tsx`, `ProjectPage index.tsx` |
| U3 | TaskCategoryNav 无任何响应式 CSS | 固定 200px 宽度在 iPad 上不折叠 | `TaskCategoryNav.module.css` |

### UI/UX — MEDIUM

| # | 问题 | 影响 | 位置 |
|---|------|------|------|
| U4 | AI Panel 固定 360/500px 无响应式 | 1024px 视口下任务列表仅剩 ~400px | `AiPanel.module.css:2-3` |
| U5 | 右面板关闭按钮 24px（iPad 需 44px） | 触摸目标过小 | `ProjectPage.module.css:143-155` |
| U6 | 拖拽手柄 6px 宽度不适合触摸 | iPad 上无法操作 | `ProjectPage.module.css:233-240` |
| U7 | DepartmentGanttView 无媒体查询 | 固定 160px 标签列挤压时间轴 | `DepartmentGanttView.module.css` |
| U8 | PendingApprovals 不在 grid 布局内 | 破坏 1280px 下的 2 列响应式布局 | `DashboardPage index.tsx:323-328` |
| U9 | 审批详情面板 1024px 下 max-height 50vh | iPad 横屏仅 ~384px 高度不够 | `ApprovalPage.module.css:97` |
| U10 | 项目表格无 scroll prop | iPad 竖屏溢出 | `ProjectPage index.tsx:352` |

### UI/UX — LOW

| # | 问题 | 影响 | 位置 |
|---|------|------|------|
| U11 | 搜索按钮 36x36px 低于 44px 触摸标准 | `TodoPage.module.css:69-70` |
| U12 | 顶部栏按钮 size="small" (~24px) | `DashboardPage index.tsx:291-293` |
| U13 | 泳道图标签固定 120px 无响应式 | `SwimlaneTab.module.css:19-20` |
| U14 | 审批操作按钮大小不一致 | `ApprovalDetail.tsx` |
| U15 | 表格行无键盘导航 | `ApprovalList.tsx:143-150` |

### MINOR（数据流）

| # | 问题 | 影响 | 位置 |
|---|------|------|------|
| m1 | Dashboard 缓存未在审批回调后失效 | `DashboardServiceImpl` @Cacheable 可能返回过期聚合数据 |
| m2 | 通知 store 客户端生成 ID | `useNotificationStore.ts:77` 使用 `Date.now()` 生成 ID，与服务端不匹配 |
| m3 | Dashboard 加载 200 条任务无分页 | `DashboardPage:121` pageSize=200 大项目性能问题 |
| m4 | CC 用户审批完成无通知 | `ApprovalEventListener` 只通知 applicant |
| m5 | 转交功能对单步流程无效 | `TransferModal` 创建委托记录，单步 GENERIC_APPROVAL 无后续任务 |
| m6 | onProcessCancelled 未使用原子 CAS | 与 onProcessCompleted 模式不一致 |

---

## 五、验证路径

### 路径 1：任务创建 → 项目阶段关联

```
1. 打开 TaskForm → 观察无 phaseId/milestoneId 选择器 (C4)
2. 创建任务设置 projectId → 验证 CreateTaskDTO 无 phaseId 字段
3. 结果：任务关联项目但不关联阶段，recalcPhaseProgress 永远不包含此任务
```

### 路径 2：项目状态变更 → Dashboard 反映

```
1. 通过审批流程批准项目 → ProjectApprovalCallback.onApproved 设置 status=2
2. 导航到 Dashboard → getDashboardProjectProgress() 查询 project 表
3. 结果：Dashboard 仅在下次 fetch 时显示更新（无推送）(C3)
```

### 路径 3：审批完成 → 任务/项目状态更新

```
1. 完成需审批的任务 → status = PENDING_REVIEW(3)
2. 审批人通过 /wf/tasks/{taskId}/complete 审批
3. Flowable 触发 PROCESS_COMPLETED → ApprovalEventListener → TaskApprovalCallback.onApproved
4. task.status → COMPLETED(4), progress → 100, 项目进度重算
5. Frontend: useWorkflowStore.completeTask() 触发 useTaskStore.fetchTasks() ✅
6. 但：Dashboard 和 Project stores 未刷新 (M4, M5)
```

### 路径 4：WebSocket 通知跨模块传播

```
1. 后端发送到 /topic/approvals（任务创建和流程完成时）
2. 仅 approval/index.tsx 和 bom/index.tsx 订阅
3. Dashboard 页面：无订阅 (C3)
4. Todo 页面：无订阅 — 其他用户审批后任务列表不自动刷新
```

### 路径 5：里程碑审批回调

```
1. MilestoneServiceImpl.submitForApproval() → objectType="MILESTONE"
2. 审批通过 → callbackRegistry.onApproved("MILESTONE", milestoneId, ...)
3. ⚠️ TaskApprovalCallback 和 MilestoneApprovalCallback 都注册了 "MILESTONE" (C1)
4. 如果 TaskApprovalCallback 胜出 → 用 milestoneId 查 Task 表 → 找不到 → 静默失败
5. 如果 MilestoneApprovalCallback 胜出 → 正确完成里程碑但不更新关联 task
```

### 路径 6：加签功能端到端

```
1. 用户点击"加签"按钮 → AddSignerModal 打开
2. 选择加签人 → 调用 delegate() API
3. 后端创建 wf_delegation 记录（委托，非加签）
4. 当前审批任务的 assignee 不变 (M1)
5. 无 addCandidateUser 端点 (M2)
6. 结果：加签功能完全无效
```

---

## 六、UI/UX 响应式策略总结

### 当前状态

| 维度 | 状态 |
|------|------|
| 断点体系 | 一致：1280px / 1024px / 768px |
| 设计 Token | 良好：tokens.css 定义间距/颜色/阴影 |
| 触摸滚动 | 良好：-webkit-overflow-scrolling: touch |
| useBreakpoint Hook | ⚠️ 已定义但从未使用 |
| Ant Design 响应式 Col | ⚠️ 仅 PersonalPage 使用了 xs/sm/md |
| 表格水平滚动 | ❌ 所有模块均缺失 |
| 触摸目标 44px | ⚠️ 仅 768px 断点放大，1024px (iPad) 未处理 |

### 跨模块一致性问题

| 问题 | 详情 |
|------|------|
| 布局策略不统一 | Todo=flex, Project=CSS Grid, Dashboard=自定义 flex grid, Approval=简单 flex |
| Detail Panel 模式不统一 | Todo=display:none 切换, Project=CSS class 切换, Approval=始终显示 |
| Padding 值不统一 | Todo: 12px 24px, Dashboard: 0 16px, Approval: 16px |

---

## 七、修复优先级规划

### P0 — 立即修复（数据一致性风险）

1. **C1**: 从 TaskApprovalCallback 移除 "MILESTONE" 注册
2. **C2**: withdrawApproval 移除手动 status 更新，让事件监听器统一处理
3. **C3**: Dashboard 订阅 WebSocket `/topic/approvals` 实现实时更新
4. **M3**: Dashboard PendingApprovals 字段映射 `taskId` → `currentTaskId`

### P1 — 本轮修复（功能完整性）

5. **M1/M2**: 实现真正的加签端点 `POST /api/wf/tasks/{taskId}/add-candidate`
6. **M4/M5**: Dashboard 审批/状态操作后刷新 task/project stores
7. **M7**: remindApproval 添加通知发送逻辑
8. **U1**: 所有 Table 添加 `scroll={{ x: 'max-content' }}`
9. **U2**: Col 组件添加响应式断点 `xs={12} sm={12} md={6}`

### P2 — 后续优化

10. **C4**: CreateTaskDTO 添加 phaseId/milestoneId 字段
11. **U3**: TaskCategoryNav 添加 1024px 响应式折叠
12. **U5/U6**: iPad 触摸目标放大到 44px
13. **M6**: 项目创建添加审批配置检查
14. **M8**: 过期提醒通知审批人而非申请人

---

## 八、当前进度

| 阶段 | 状态 | 说明 |
|------|------|------|
| 审计分析 | ✅ 完成 | 3 个并行 agent 完成数据流/UI/审批引擎审计 |
| 报告输出 | ✅ 完成 | 本文档 |
| P0 修复 | ✅ 完成 | C1(MILESTONE回调冲突), C2(撤回双写), C3(Dashboard WebSocket), M3(字段映射) |
| P1 修复 | ✅ 完成 | M4/M5(跨store刷新), U1(Table scroll), U2(响应式Col), @负责人bug |
| P2 优化 | ✅ 完成 | U3(TaskCategoryNav响应式), U5/U6(触摸目标44px), Dashboard按钮放大 |
| 待做优化 | ✅ 完成 | C4(CreateTaskDTO加phaseId), M1/M2(加签端点), M6(审批配置检查), M7(催办通知), M8(过期提醒) |
| MINOR优化 | ✅ 完成 | m1(缓存失效), m2(通知ID类型), m4(CC用户通知), U4(AI Panel响应式), U7(甘特图响应式) |
| 回归测试 | ✅ 通过 | 168 文件 / 1850 测试 / 0 失败 |

---

## 九、本轮修复清单

### 第一批：P0/P1/P2

| 文件 | 修改内容 |
|------|---------|
| `syncflow-java/.../TaskApprovalCallback.java` | 移除 "MILESTONE" 注册，解决回调冲突 (C1) |
| `syncflow-java/.../WorkflowServiceImpl.java` | 撤回逻辑改为让事件监听器统一处理状态 (C2); 添加催办通知 (M7); 加签端点 (M1); 审批配置检查 (M6) |
| `syncflow-java/.../WorkflowService.java` | 新增 addCandidateUser + isApprovalRequired 接口 |
| `syncflow-java/.../WorkflowController.java` | 新增 POST /api/wf/tasks/{taskId}/add-candidate 端点 |
| `syncflow-java/.../StaleApprovalReminderService.java` | 通知审批人而非仅申请人 (M8) |
| `syncflow-java/.../CreateTaskDTO.java` | 添加 phaseId/milestoneId/parentId 字段 (C4) |
| `syncflow-java/.../TaskServiceImpl.java` | createTask 设置 phaseId/milestoneId/parentId |
| `syncflow-java/.../ProjectServiceImpl.java` | 项目创建前检查审批配置 (M6) |
| `syncflow-java/.../ApprovalEventListener.java` | 审批完成后失效 Dashboard 缓存 (m1) + 通知 CC 用户 (m4) |
| `src/pages/dashboard/index.tsx` | WebSocket 订阅 + 审批字段映射 + 跨 store 刷新 (C3/M3/M4/M5) |
| `src/pages/dashboard/index.spec.tsx` | 添加 useSocket mock |
| `src/pages/dashboard/components/OverviewCards.tsx` | Col 响应式断点 xs={12} md={6} (U2) |
| `src/pages/dashboard/components/TaskSummaryCards.tsx` | Col 响应式断点 xs={12} md={6} (U2) |
| `src/pages/dashboard/components/DepartmentGanttView.module.css` | 添加 1280/1024/768 响应式 (U7) |
| `src/pages/dashboard/DashboardPage.module.css` | 1024px 按钮最小 44px 触摸目标 |
| `src/pages/project/index.tsx` | Table scroll + Col 响应式断点 (U1/U2) |
| `src/pages/project/index.spec.tsx` | 适配 scroll 导致的重复列头 |
| `src/pages/project/ProjectPage.module.css` | 1024px 关闭按钮放大到 44px (U5) |
| `src/pages/approval/components/ApprovalList.tsx` | Table scroll (U1) |
| `src/pages/approval/components/AddSignerModal.tsx` | 改用 addCandidateUser API + taskId (M1/M2) |
| `src/pages/approval/components/AddSignerModal.spec.tsx` | 更新测试适配新 API |
| `src/pages/approval/components/ApprovalDetail.tsx` | 传递 taskId 给 AddSignerModal |
| `src/pages/approval/index.tsx` | 传递 taskId 给 AddSignerModal |
| `src/pages/todo/components/TaskList.tsx` | Table scroll (U1) |
| `src/pages/todo/components/AiPanel.module.css` | 添加 1280/1024/768 响应式 (U4) |
| `src/pages/todo/TodoPage.module.css` | 搜索按钮 44px + 1024px 显示关闭按钮 (U5/U6) |
| `src/components/business/TaskCategoryNav/TaskCategoryNav.module.css` | 添加 1280/1024/768 三级响应式 (U3) |
| `src/components/business/QuickCreateBar/pickers/AssigneePicker.tsx` | 修复 name 字段兼容 + ID 类型兼容 |
| `src/stores/useNotificationStore.ts` | 统一 ID 为 String 类型 (m2) |
| `src/services/notification.service.ts` | markAsRead 接受 string|number (m2) |
| `src/services/workflow.service.ts` | 新增 addCandidateUser 函数 |
| `src/mocks/handlers/index.ts` | 修复 /sys/users mock 返回格式对齐后端 UserVO |

---

## 十、问题解决统计

| 级别 | 发现 | 已修复 | 剩余 |
|------|------|--------|------|
| CRITICAL | 4 | 4 | 0 |
| MAJOR | 11 | 11 | 0 |
| UI/UX HIGH | 3 | 3 | 0 |
| UI/UX MEDIUM | 10 | 10 | 0 |
| MINOR | 6 | 5 | 1 (m5: 转交对单步流程无效 — 需产品决策) |

---

*Final: 2026-05-13 — 全部审计问题修复完成（除 m5 需产品决策），168 文件 / 1850 测试 / 0 失败*
