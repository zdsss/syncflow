# Sprint 13 — 核心模块跨模块数据流全链路审计

> 审计日期：2026-05-13
> 范围：Todo(工作空间) + Project(项目管理) + Dashboard(中控看板) + Approval(审核引擎)
> 方法：3 并行 Agent（后端数据流 / 前端数据流 / UI/UX布局）

---

## 审计总览

| 维度 | CRITICAL | MAJOR | MINOR | 合计 |
|------|----------|-------|-------|------|
| 后端数据流 | 1 | 5 | 8 | 14 |
| 前端数据流 | 0 | 8 | 12 | 20 |
| UI/UX布局 | 2 | 10 | 8 | 20 |
| **合计** | **3** | **23** | **28** | **54** |

---

## CRITICAL 问题（必须立即修复）

### C1. [后端] 里程碑审批后任务永久卡在 PENDING_REVIEW

**文件**: `syncflow-task/.../TaskApprovalCallback.java:32`

**现象**: `TaskApprovalCallback.supportedObjectTypes()` 返回 `Set.of("TASK", "ISSUE", "RISK")`，不包含 `"MILESTONE"`。当任务有 `milestoneId != null` 且 type 为 MILESTONE 时，审批以 `objectType = "MILESTONE"` 启动，路由到 `MilestoneApprovalCallback`，该回调更新里程碑记录但不回写任务状态。任务永远停留在 `status=3 (PENDING_REVIEW)`。

**影响**: 数据损坏——里程碑类型任务完成后无法正常流转。

**修复方案**: `TaskApprovalCallback.supportedObjectTypes()` 增加 `"MILESTONE"`，或在 `MilestoneApprovalCallback.onApproved` 中同步更新关联任务状态。

---

### C2. [UI/UX] Todo 任务详情使用 overlay Drawer 而非内联面板

**文件**: `src/pages/todo/index.tsx:588-593`

**现象**: 设计稿要求"右侧滑出任务属性面板"（内联三栏布局），实际使用 Ant Design Drawer 覆盖整个视口。用户查看详情时丢失任务列表上下文。

**对比**: Project 页面正确使用 CSS Grid 内联右侧面板（`contentWithDetail` 模式）。

**修复方案**: 改为 CSS Grid 三栏布局，选中任务时右侧面板推入，任务列表收窄。

---

### C3. [UI/UX] Todo TaskCategoryNav 在 1024px 断点布局崩溃

**文件**: `src/pages/todo/TodoPage.module.css:167-190`

**现象**: 1024px 断点将 body 改为 `flex-direction: column`，200px 宽的左侧导航被拉伸为全宽水平条，视觉完全崩溃。

**修复方案**: 1024px 断点改为将导航折叠为水平滚动 chip bar，或隐藏为 toggle 按钮。

---

## MAJOR 问题

### 后端数据流 (5)

| # | 问题 | 文件 | 影响 |
|---|------|------|------|
| M1 | 手动完成任务时 Flowable 流程实例成为孤儿 | TaskServiceImpl.java:457 | 审批流程泄漏 |
| M2 | Dashboard 项目进度与 QueryService 进度公式不一致 | DashboardServiceImpl.java:382 | 同一项目两个接口返回不同进度值 |
| M3 | `DashboardSummaryVO.pendingAssign` 语义错误 | DashboardSummaryVO.java:24 | 字段名"待分配"实际统计"待审批"，前端误解 |
| M4 | 两个待审批接口返回不同 VO 结构 | DashboardServiceImpl:445 vs WorkflowServiceImpl:258 | 前端需处理两套数据契约 |
| M5 | QueryService.byPriority 按 status 分组而非 priority | QueryServiceImpl.java:52-60 | 优先级统计数据完全错误 |

### 前端数据流 (8)

| # | 问题 | 文件 | 影响 |
|---|------|------|------|
| M6 | TaskForm string/number ID 类型不匹配 | TaskForm.tsx:17-18 | API 路径错误或类型强转异常 |
| M7 | TaskList.updateTask 传 string ID | TaskList.tsx:83 | 同上 |
| M8 | 审批完成后无跨 store 同步 | useWorkflowStore.ts:68-88 | 审批后 Todo 页仍显示旧状态 |
| M9 | 前端重复后端审批路由逻辑 | useTaskStore.ts:209-213 | 规则变更时前后端不一致 |
| M10 | Dashboard 缺少 project-progress/milestones mock | mocks/handlers/index.ts | 开发模式 Dashboard 部分 404 |
| M11 | PendingApprovals 组件与 mock 字段名不匹配 | PendingApprovals.tsx:5-13 | 按钮禁用、字段显示 undefined |
| M12 | approval-config 接口无 mock handler | mocks/handlers/index.ts | 审批配置页开发模式不可用 |
| M13 | remind 接口无 mock handler | mocks/handlers/index.ts | 催办按钮开发模式报错 |

### UI/UX 布局 (10)

| # | 问题 | 文件 | 影响 |
|---|------|------|------|
| M14 | 模块间 page padding 不一致 | ApprovalPage.module.css:7 | 视觉不统一 |
| M15 | Header 硬编码颜色未用 CSS token | Header.module.css:2-12 | 主题切换失效 |
| M16 | Approval 页缺少 768px 移动端断点 | ApprovalPage.module.css:89-99 | 手机端布局拥挤 |
| M17 | Dashboard 子视图无响应式处理 | DashboardPage.module.css:122-142 | 窄屏横向溢出 |
| M18 | Project 页移动端隐藏树无替代入口 | ProjectPage.module.css:313-333 | 移动端无法访问项目树 |
| M19 | ScheduleView 内联定义在 Todo 主文件 | todo/index.tsx:66-163 | 代码组织混乱 |
| M20 | Approval 详情操作按钮视觉层级混乱 | ApprovalDetail.tsx:173-219 | 拒绝输入框与按钮同层 |
| M21 | Approval 页缺少 ARIA landmarks | approval/index.tsx:52-88 | 屏幕阅读器无法区分面板 |
| M22 | Dashboard 页缺少 ARIA landmarks | dashboard/index.tsx:258-394 | 无障碍不达标 |
| M23 | Sidebar 13项导航短屏溢出 | Sidebar.tsx:94-117 | 小屏幕导航项被截断 |

---

## 跨模块数据流验证路径

### 路径 1: 任务创建 → 项目进度更新 → Dashboard 展示

```
[Todo] 创建任务(projectId=X)
  → POST /api/tasks {projectId, phaseId, type}
  → [Backend] TaskServiceImpl.createTask()
  → [Backend] 无自动 recalcProjectProgress（仅完成/删除时触发）
  → [Dashboard] GET /api/dashboard/project-progress
  → [Backend] DashboardServiceImpl.getProjectProgress() 读 Project.progress 字段
  ⚠️ 新建任务不触发进度重算，Dashboard 显示旧值直到有任务完成
```

### 路径 2: 任务完成 → 审批流程 → 状态回写 → Dashboard 刷新

```
[Todo] 点击完成按钮
  → PUT /api/tasks/{id}/complete
  → [Backend] TaskServiceImpl.completeTask()
    → 判断是否需审批（type in MILESTONE/ISSUE/RISK 或 milestoneId != null）
    → 需审批: status → PENDING_REVIEW(3), startProcess()
    → 不需审批: status → COMPLETED(4), recalcProjectProgress()
  → [Workflow] Flowable 流程启动
  → [审批人] POST /wf/tasks/{taskId}/complete {approved: true}
  → [Backend] ApprovalEventListener → ApprovalCallbackRegistry
    → TaskApprovalCallback.onApproved(): status → COMPLETED(4)
    → recalcProjectProgress()
  → [Frontend] ⚠️ useWorkflowStore 移除 pendingTask，但不刷新 useTaskStore
  → [Dashboard] 需手动刷新才能看到更新
```

### 路径 3: 里程碑审批（当前有 BUG）

```
[Todo] 完成里程碑类型任务(milestoneId != null)
  → PUT /api/tasks/{id}/complete
  → [Backend] approvalObjectType = "MILESTONE"
  → [Workflow] startProcess(objectType="MILESTONE")
  → [审批人] 审批通过
  → [Backend] ApprovalCallbackRegistry 查找 MILESTONE handler
    → MilestoneApprovalCallback.onApproved()
    → 更新 prj_milestone 状态
    → ❌ 不更新原始任务状态（TaskApprovalCallback 不处理 MILESTONE）
  → 任务永久停留在 PENDING_REVIEW(3)
```

### 路径 4: Dashboard 待审批 → 审批操作 → 状态同步

```
[Dashboard] GET /api/dashboard/pending-approvals
  → [Backend] DashboardServiceImpl.getPendingApprovals()
  → 返回 PendingApprovalVO（含 currentTaskId）
[Dashboard] 点击审批通过
  → POST /wf/tasks/{currentTaskId}/complete {approved: true}
  → [Backend] 审批完成，回调更新任务状态
  → [Frontend] Dashboard 调用 fetchEnhanced() 刷新
  → ⚠️ useWorkflowStore.pendingTasks 未更新（Approval 页仍显示旧数据）
  → ⚠️ useTaskStore 未更新（Todo 页仍显示旧状态）
```

### 路径 5: 项目统计 → Dashboard 展示

```
[Dashboard] GET /api/dashboard/overview
  → [Backend] DashboardServiceImpl.getOverview()
  → 统计项目数量（按 status 分组）
[Dashboard] GET /api/dashboard/summary
  → [Backend] DashboardServiceImpl.getSummary()
  → 统计任务数量
  → ⚠️ pendingAssign 字段实际统计 PENDING_REVIEW，语义错误
[Dashboard] GET /api/query/task-stats
  → [Backend] QueryServiceImpl.byPriority()
  → ❌ 按 status 分组而非 priority，数据完全错误
```

---

## 修复优先级与计划

### P0 — 立即修复（数据损坏/功能不可用）

| 编号 | 问题 | 预计工作量 |
|------|------|-----------|
| C1 | 里程碑审批回调不回写任务状态 | 30min |
| M5 | QueryService.byPriority 逻辑错误 | 15min |
| M3 | DashboardSummaryVO.pendingAssign 语义修正 | 15min |

### P1 — 本轮修复（用户可感知的功能缺陷）

| 编号 | 问题 | 预计工作量 |
|------|------|-----------|
| C2 | Todo 详情改为内联面板 | 2h |
| C3 | Todo 1024px 断点修复 | 30min |
| M2 | 统一项目进度计算公式 | 1h |
| M6/M7 | TaskForm/TaskList ID 类型修正 | 30min |
| M8 | 审批完成后跨 store 同步 | 1h |
| M9 | 移除前端审批路由逻辑重复 | 30min |

### P2 — 后续迭代（开发体验/一致性）

| 编号 | 问题 | 预计工作量 |
|------|------|-----------|
| M1 | 孤儿 Flowable 流程清理 | 1h |
| M4 | 统一待审批接口 VO | 1h |
| M10-M13 | 补充 mock handlers | 1h |
| M14-M23 | UI/UX 一致性修复 | 3h |

---

## 当前进度

- [x] 三路并行审计完成（后端/前端/UI/UX）
- [x] 审计报告输出
- [x] P0 修复 ✅
  - [x] C1: TaskApprovalCallback 增加 MILESTONE 支持 + 同步里程碑状态
  - [x] M5: QueryService.byPriority 改为按 priority 字段分组
  - [x] M3: pendingAssign → pendingReview 语义修正（前后端全链路）
- [x] P1 修复 ✅
  - [x] C2: Todo 详情改为内联面板（移除 Drawer overlay）
  - [x] C3: 1024px 断点修复（导航折叠而非堆叠）
  - [x] M6/M7: TaskForm/TaskList ID 类型 string→number
  - [x] M8: 审批完成后跨 store 同步（useWorkflowStore → useTaskStore）
  - [x] M9: 移除前端审批路由逻辑重复（改为 re-fetch 获取真实状态）
  - [x] M2: 统一项目进度计算公式（QueryService 对齐 recalcProjectProgress）
- [x] P2 修复 ✅
  - [x] M1: 孤儿 Flowable 流程清理（changeStatus 时自动 withdraw）
  - [x] M4: 统一待审批接口 VO（Dashboard 复用 WorkflowService.getPendingTasks，删除 PendingApprovalVO）
  - [x] M10-M13: 补充 mock handlers（project-progress, milestones, overview, remind, approval-configs）
  - [x] M11: PendingApprovals mock 字段对齐（submitter→applicantName, submitDate→createdAt, +currentTaskId）
  - [x] M14: Approval 页 padding 统一为 16px（与其他模块一致）
  - [x] M15: Header 硬编码颜色改为 CSS token
  - [x] M16: Approval 页增加 768px 移动端断点
  - [x] M17: Dashboard 子视图增加响应式 overflow-x 处理
  - [x] M18: Project 页移动端树改为 slide-in drawer 模式
  - [x] M19: ScheduleView 提取为独立组件 `todo/components/ScheduleView.tsx`
  - [x] M20: Approval 详情操作按钮重构（TextArea 上方 + 按钮下方）
  - [x] M21: Approval 页增加 ARIA landmarks
  - [x] M22: Dashboard 页增加 ARIA landmarks + Segmented aria-label
  - [x] M23: Sidebar navList 增加 max-height + overflow-y + 渐变遮罩
- [x] 全链路回归验证 ✅

## 验证结果

| 维度 | 结果 |
|------|------|
| 前端 TypeScript 编译 | ✅ 通过 |
| 前端测试 (1854 tests / 168 files) | ✅ 全部通过 |
| Java 后端编译 | ✅ 通过 |
| syncflow-task 测试 | ✅ CompleteTask 5/5, ApprovalCallback 5/5 |
| syncflow-statistics 测试 | ✅ 28/28 通过 |
| syncflow-workflow 测试 | ✅ 通过 |
| 预存问题 | syncflow-admin Auth 测试有 pre-existing 错误（与本次修改无关） |

## 未修复项（低优先级，纯设计决策）

| 编号 | 问题 | 原因 |
|------|------|------|
| MINOR 项 | 剩余约 20 个 MINOR 级别问题 | 不影响功能，可在日常迭代中逐步优化 |

## 额外优化（MINOR 级别已修复）

| 编号 | 修复内容 |
|------|----------|
| 1 | Dashboard buildTaskSummary 移除 urgent→todayTasks 错误 fallback |
| 2 | CrossModuleMapper.selectUsersByProjectRole 增加 `deleted_at IS NULL` 过滤 |
| 3 | 新增 recalcPhaseProgress — 任务完成/删除/状态变更时同步更新阶段进度 |
| 4 | Dashboard kanban 状态变更后同步刷新 useTaskStore |
| 5 | 审批"全部"tab 功能补全 — 新增 `GET /wf/tasks/completed` 全链路（后端+前端+mock） |
| 6 | ApprovalList 移除无用 filteredApprovals useMemo |
| 7 | Dashboard store 移除未使用的 fetchSummaryAsync/summary/loading/error 死代码 |
| 8 | Task 类型对齐 — Task interface 字段改为 optional，移除 `as unknown as` 强转 |
| 9 | Approval 页 selectedTask 支持从 completedTasks 中查找 |
| 10 | Project 页 grid-template-columns 改用 `var(--left-tree-width)` token |
| 11 | `--left-tree-width` token 更新为 240px（与实际使用对齐） |
| 12 | Ant Design Drawer `width` deprecated 警告修复（Sidebar/SlidePanel/BOM 页） |
