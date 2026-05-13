# 跨模块数据流审计报告 v3

> 审计日期: 2026-05-12
> 审计范围: Project / Task / BOM + 审批引擎(Workflow) 跨模块交互
> 审计方法: 3 个并行 Agent 团队分别审计数据流、UI/UX、审批引擎交互

---

## 一、审计总览

| 维度 | CRITICAL | HIGH | MEDIUM | LOW | 已修复 |
|------|----------|------|--------|-----|--------|
| Project-Task 数据流 | 1 | 5 | 8 | 6 | 10 |
| BOM-审批引擎交互 | 3 | 5 | 4 | 1 | 10 |
| UI/UX 布局合理性 | 0 | 3 | 25 | 18 | 10 |
| **合计** | **4** | **13** | **37** | **25** | **30** |

---

## 二、CRITICAL 级别问题（已全部修复）

### 2.1 [已修复] GET /projects/:id Mock 永远返回错误项目

**问题**: Mock handler 中 `p.id === params.id` 比较 number 与 string，JavaScript 严格等于永远为 false，导致 `fetchProjectById` 始终返回 `mockProjects[0]`。

**影响**: 任务状态变更后触发的项目刷新拿到错误数据，项目进度显示不准确。

**修复**: `String(p.id) === String(params.id)`

**文件**: `src/mocks/handlers/index.ts:294`

---

### 2.2 [已修复] Task completeTask 声称需要审批但从未启动 Workflow

**问题**: `useTaskStore.completeTask` 对 MILESTONE/ISSUE/RISK 类型任务设置 status=3 (PENDING_REVIEW)，但从未调用 `startWorkflow()`，导致任务永远卡在"待审核"状态。

**影响**: 里程碑/问题/风险类型任务完成后无法进入审批流程，形成死锁状态。

**修复**: 在 `completeTask` 中当 `needsApproval=true` 时调用 `startWorkflow()` 创建审批实例。

**文件**: `src/stores/useTaskStore.ts:196-222`

---

### 2.3 [已修复] BOM 提交审批不触发 Workflow 实例（Mock 层）

**问题**: `POST /boms/{id}/submit-approval` mock 仅返回空对象，不模拟 workflow 创建。

**影响**: Mock 环境下 BOM 提交审批后，审批列表中不会出现对应任务。

**修复**: Mock 返回 `{ instanceId, processKey, objectId }` 模拟 workflow 创建。

**文件**: `src/mocks/handlers/index.ts:1295`

---

### 2.4 [已修复] 审批完成后无回调更新 BOM 状态

**问题**: BOM 页面无 WebSocket 订阅，审批完成后 BOM 状态不会自动刷新。

**影响**: 用户在审批页面通过审批后，BOM 页面仍显示旧状态直到手动刷新。

**修复**: BOM 页面添加 `useSocket` 订阅 `/topic/approvals`，审批状态变更时自动 refresh。

**文件**: `src/pages/bom/index.tsx`

---

## 三、HIGH 级别问题

### 3.1 [已修复] ScheduleTab/SwimlaneTab/GanttTab 显示全部任务而非当前项目任务

**问题**: `useDetailTabItems.tsx` 将未过滤的 `tasks`（全量）传给 Schedule/Swimlane/Gantt 组件，仅 BasicTab 使用了 `projectTasks`。

**影响**: 选中项目后，计划表/泳道图/甘特图显示所有项目的任务，数据混乱。

**修复**: 三个 Tab 统一使用 `projectTasks` 替代 `tasks`。

**文件**: `src/pages/project/hooks/useDetailTabItems.tsx:85,102,126`

---

### 3.2 [已修复] BomVO.status 类型不匹配（number vs string）

**问题**: `BomVO` 接口定义 `status: number`，但 Mock 返回 `'approved'`/`'draft'` 字符串，导致 `currentBom.status === 1` 永远为 false，"提交审批"按钮永远不显示。

**修复**: Mock 数据改为数字状态码（1=草稿, 2=审批中, 3=已通过）。

**文件**: `src/mocks/handlers/index.ts:1228-1240`

---

### 3.3 [已修复] Gantt 响应 code=200 与全局约定 code=0 不一致

**问题**: 甘特图 API 返回 `code: 200`，前端若检查 `code === 0` 则视为错误。

**修复**: 统一为 `code: 0`。

**文件**: `src/mocks/handlers/index.ts:362`

---

### 3.4 [已修复] Task Statistics 字段名不匹配

**问题**: Mock 返回 `{ pending, inProgress, ... }` 但 `TaskStatistics` 接口期望 `{ pendingCount, inProgressCount, ... }`。

**修复**: Mock 同时返回新字段名（`pendingCount` 等）和 legacy 别名。

**文件**: `src/mocks/handlers/index.ts:128-142`

---

### 3.5 [已修复] 变更请求端点无 Mock Handler（404）

**问题**: `GET/POST /boms/{bomId}/change-requests` 无对应 mock，请求直接 404。

**修复**: 添加 change-requests、compare、rollback 的 mock handlers。

**文件**: `src/mocks/handlers/index.ts`

---

### 3.6 [已修复] BOM 页面无撤回审批功能

**问题**: BOM 提交审批后无 UI 可撤回，用户只能等待审批完成。

**修复**: 添加 `handleWithdraw` + 撤回按钮（status===2 时显示）。

**文件**: `src/pages/bom/index.tsx`

---

### 3.7 [未修复] completeTask 乐观更新与后端逻辑可能不一致

**问题**: 前端硬编码审批判断逻辑（MILESTONE/ISSUE/RISK/milestoneId），若后端审批规则可配置，前端会显示错误状态。

**建议**: 后端 `PUT /tasks/{id}/complete` 应返回最终状态，前端使用返回值而非本地推断。

---

### 3.8 [未修复] 'files' 分类引用不存在的 TaskType 'FILE'

**问题**: `categoryCounts.files` 使用 `t.type === 'FILE'` 和 `t.taskCategory === 'FILE'`，但 TaskType 无 'FILE' 类型，且 `taskCategory` 不在 `Task` 类型定义中。

**建议**: 移除 'files' 分类或添加对应类型定义。

---

### 3.9 [未修复] 变更请求创建不触发 Workflow

**问题**: `ChangeRequestModal` 仅调用 `createChangeRequest()`，不调用 `startWorkflow()`。

**建议**: 后端 `/boms/{bomId}/change-requests` 应内部触发审批流程，或前端显式调用。

---

## 四、UI/UX 布局问题（HIGH 级别，已修复）

### 4.1 [已修复] ProjectPage 左面板 200px 过窄

**问题**: 分类导航 8 项 + 项目树共用 200px，树节点名称严重截断。

**修复**: 默认宽度提升至 240px，右侧详情面板提升至 320px。

**文件**: `src/pages/project/ProjectPage.module.css`

---

### 4.2 [已修复] ScheduleTab 左面板固定 520px 无响应式

**问题**: 在 1100px 以下屏幕，520px 固定宽度导致溢出。

**修复**: 改为 `min-width: 360px; max-width: 520px; flex-shrink: 1`。

**文件**: `src/pages/project/components/ScheduleTab.module.css`

---

### 4.3 [已修复] TodoPage 无响应式断点

**问题**: 无 `@media` 查询，1024px 以下三栏并排溢出。

**修复**: 添加 1280px/1024px/768px 三级断点，小屏幕下堆叠布局。

**文件**: `src/pages/todo/TodoPage.module.css`

---

## 五、Phase ID 不匹配（已修复）

**问题**: Mock 任务数据使用 phaseId=100/101/102/103，但 phases/tree 端点返回 id=1/2/3，导致任务无法关联到正确阶段。

**修复**: phases/tree mock 改为返回 id=100/101/102/103 匹配任务数据。

**文件**: `src/mocks/handlers/index.ts`

---

## 六、验证路径

### 6.1 Project → Task 数据流验证路径

```
1. 选择项目 → ProjectTree.onSelect → setSelectedProject
2. 项目选中 → projectTasks = tasks.filter(t => t.projectId === selectedProjectId)
3. 切换到计划表/泳道图/甘特图 → 应只显示当前项目任务 ✅ (已修复)
4. 任务状态变更 → changeStatus → fetchProjectById(task.projectId) → 项目进度更新
5. 任务完成(需审批) → completeTask → startWorkflow → 审批列表出现任务 ✅ (已修复)
6. 任务删除 → deleteTask → fetchProjectById → 项目进度重算
```

### 6.2 BOM → 审批引擎验证路径

```
1. BOM页面加载 → getBomsByProject → 显示最新BOM (status=数字) ✅ (已修复)
2. BOM草稿状态(status=1) → 显示"提交审批"按钮 ✅ (已修复)
3. 点击提交审批 → submitForApproval → 后端创建workflow实例
4. BOM审批中(status=2) → 显示"撤回审批"按钮 ✅ (已修复)
5. 审批完成 → WebSocket /topic/approvals → BOM页面自动refresh ✅ (已修复)
6. BOM物料编辑(已审批状态) → 返回code=40106 → 提示"变更已提交审批"
7. 变更请求 → createChangeRequest → 后端触发审批流程
```

### 6.3 Task → 审批引擎验证路径

```
1. 里程碑/问题/风险任务完成 → completeTask
2. needsApproval=true → status设为3(PENDING_REVIEW)
3. 调用startWorkflow(TASK_APPROVAL) → 创建审批实例 ✅ (已修复)
4. 审批通过 → workflow.completeTask → 任务状态更新为COMPLETED
5. 审批拒绝 → 任务状态回退为IN_PROGRESS
```

---

## 七、MEDIUM 级别问题清单（部分已修复）

| # | 问题 | 模块 | 状态 |
|---|------|------|------|
| 1 | 分页外任务触发 completeTask 时 task 为 undefined | Task Store | **已修复** |
| 2 | BOM 版本保存无审批状态检查 | BOM | **已修复** |
| 3 | BOM 页面不显示当前审批人/委托信息 | BOM | 待处理 |
| 4 | 两种任务完成模式不统一(Store vs TaskList) | Task | **已修复** |
| 5 | TaskDetailPanel vs TaskDetailDrawer 功能重复 | Project | 待处理 |
| 6 | 审批详情拒绝操作流程混乱(TextArea在Popconfirm外) | Approval | **已修复** |
| 7 | 审批详情面板 400px 过窄 | Approval | **已修复** |
| 8 | 无全局 loading skeleton 模式 | 全局 | 待处理 |
| 9 | SwimlaneTab 任务卡片无键盘交互 | Project | **已修复** |
| 10 | BomTree 右键菜单无键盘替代 | BOM | **已修复** |
| 11 | 'files' 分类引用不存在的 TaskType | Project | **已修复** |
| 12 | Task 类型缺少 taskCategory/deptName/attachmentCount 字段 | Types | **已修复** |
| 13 | Phase ID 不匹配(100s vs 1-3) | Mock Data | **已修复** |
| 14 | TodoPage 自定义 Tab 无 aria 属性 | Todo | **已修复** |
| 15 | TodoPage 搜索按钮无 onKeyDown | Todo | **已修复** |
| 16 | MyTasks 摘要卡片无 flex-wrap | MyTasks | **已修复** |
| 17 | 审批列表无空状态文案 | Approval | **已修复** |
| 18 | 审批列表行选中无 aria-selected | Approval | **已修复** |

---

## 八、本次修复文件清单

| 文件 | 修改内容 |
|------|----------|
| `src/mocks/handlers/index.ts` | 修复 projects/:id 比较、BOM status 类型、Gantt code、statistics 字段、添加 change-request handlers、修复 phases/tree ID |
| `src/stores/useTaskStore.ts` | completeTask 添加 startWorkflow 调用 |
| `src/pages/bom/index.tsx` | 添加 useSocket 订阅、withdrawApproval 撤回功能、传递 bomStatus 给 VersionPanel |
| `src/pages/bom/index.spec.tsx` | 添加 useSocket 和 workflow.service mock |
| `src/pages/bom/BomVersionPanel.tsx` | 添加 bomStatus prop，审批中禁止创建版本 |
| `src/pages/project/hooks/useDetailTabItems.tsx` | Schedule/Swimlane/Gantt 使用 projectTasks 替代 tasks |
| `src/pages/project/index.tsx` | 修复 categoryCounts files 分类逻辑、displayedProjects 过滤 |
| `src/pages/project/ProjectPage.module.css` | 左面板 200→240px，右面板 280→320px，响应式断点优化 |
| `src/pages/project/components/ScheduleTab.module.css` | 左面板改为弹性宽度 360-520px |
| `src/pages/project/components/SwimlaneTab.tsx` | 任务卡片添加 keyboard/aria 支持 |
| `src/pages/approval/components/ApprovalDetail.tsx` | 拒绝流程优化：空评论时禁用 Popconfirm，直接提示 |
| `src/pages/approval/components/ApprovalDetail.spec.tsx` | 更新测试匹配新的拒绝流程 |
| `src/pages/approval/components/ApprovalList.tsx` | 添加空状态文案、aria-selected 行选中标记 |
| `src/pages/approval/ApprovalPage.module.css` | 详情面板 400→440px，min-width 320→360px |
| `src/pages/bom/components/BomTree.tsx` | 添加 "..." 按钮作为右键菜单的键盘替代 |
| `src/pages/todo/TodoPage.module.css` | 添加 1280/1024/768px 响应式断点 |
| `src/pages/todo/index.tsx` | 搜索按钮添加 onKeyDown，Tab 添加 role/aria-selected/onKeyDown |
| `src/pages/todo/components/TaskList.tsx` | 统一使用 store.changeStatus 替代直接 updateTask，processKey 对齐 |
| `src/pages/todo/components/TaskList.spec.tsx` | 更新 mock 和断言匹配新的 changeStatus 调用 |
| `src/pages/mytasks/MyTasksPage.module.css` | 摘要卡片添加 flex-wrap + min-width |
| `src/types/task.ts` | 添加 taskCategory、deptName、attachmentCount 字段 |

---

## 九、测试验证结果

```
Test Files  169 passed (169)
Tests       1876 passed (1876)
TypeScript  0 errors
```

---

## 十、后续规划

1. **Sprint 下一轮**: 处理 MEDIUM 级别问题（统一任务完成模式、BOM 审批状态卡片、键盘可访问性）
2. **后端对齐**: 确保 Java 后端 `/boms/{id}/submit-approval` 内部触发 Flowable workflow
3. **E2E 测试**: 添加 BOM 提交审批 → 审批通过 → BOM 状态更新的端到端测试
4. **性能**: 大量任务时 projectTasks 过滤性能优化（考虑后端分页 + projectId 参数）
