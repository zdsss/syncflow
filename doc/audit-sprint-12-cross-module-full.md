# Sprint 12 — 跨模块数据流 & 审批引擎 & UI/UX 全链路审计

> **审计日期**: 2026-05-12  
> **审计范围**: Project / Task / BOM 三大核心模块 + Flowable 审批引擎  
> **审计方法**: 三路并行 Agent 深度代码审计（数据流 + 审批集成 + UI/UX）

---

## 一、审计总览

| 维度 | 发现问题数 | Critical | High | Medium | Low |
|------|-----------|----------|------|--------|-----|
| 跨模块数据流 | 15 | 1 | 4 | 7 | 3 |
| 审批引擎集成 | 10 | 0 | 3 | 4 | 3 |
| UI/UX 布局 | 17 | 3 | 4 | 5 | 5 |
| **合计** | **42** | **4** | **11** | **16** | **11** |

---

## 二、Critical 级问题（必须立即修复）

### C1. BOM 页面布局 Bug — Tabs 在 flex-row 容器内错位

**文件**: `src/pages/bom/index.tsx:209-256`  
**现象**: `mainContent` 使用 `display: flex`（默认 row 方向），Tabs 组件与 tree/table 面板作为同级 flex 子元素水平排列，导致 Tabs 被挤压为窄列而非全宽横跨。  
**影响**: BOM 页面 Tab 切换区域渲染异常，用户无法正常使用多级BOM/用量反查/工艺路线切换。  
**修复方案**: 将 Tabs 移到 `mainContent` 外部，或改为 `flex-direction: column` + 嵌套 row。

### C2. CreateTaskDTO.projectId 类型为 String（应为 Long）

**文件**: `syncflow-java/syncflow-task/src/main/java/com/syncflow/task/dto/CreateTaskDTO.java:23`  
**现象**: DTO 声明 `projectId` 为 `String` 并标注 `@NotBlank`，前端发送 `number` 类型。后端用 `parseLong()` 转换，若 JSON 反序列化异常则静默失败。  
**影响**: 创建任务时 projectId 可能丢失，导致任务与项目脱钩。  
**修复方案**: 改为 `Long` 类型，移除 `@NotBlank`，按需添加 `@NotNull`。

### C3. 无响应式设计 — 所有页面使用固定像素宽度

**文件**: 所有 `*.module.css` 文件  
**现象**: 项目页 `200px + 1fr + 280px`，BOM 页 `30% min-width:280px`，无任何 media query。  
**影响**: 屏幕宽度 < 1280px 时布局崩溃，中心面板被压缩至接近零宽度。  
**修复方案**: 添加 1024px / 1440px 断点，左侧面板可折叠。

### C4. Todo 页 TaskList 操作按钮无功能

**文件**: `src/pages/todo/components/TaskList.tsx:289-309`  
**现象**: 编辑/删除图标的 onClick 仅有 `e.stopPropagation()`，无实际逻辑。  
**影响**: 用户点击编辑/删除无反应，误导用户。  
**修复方案**: 实现编辑/删除逻辑或移除按钮。

---

## 三、High 级问题

### H1. MILESTONE 任务审批路由到错误回调

**文件**: `syncflow-java/syncflow-task/src/main/java/com/syncflow/task/service/impl/TaskServiceImpl.java:366`  
**现象**: `completeTask()` 传递 `task.getType()="MILESTONE"` 作为 objectType，但 `MilestoneApprovalCallback` 期望 objectId 是里程碑 PK（非任务 PK）。  
**影响**: MILESTONE 类型任务审批后永远卡在 PENDING_REVIEW，或错误完成其他里程碑。  
**修复**: `TaskApprovalCallback.supportedObjectTypes()` 增加 "MILESTONE"。

### H2. `/topic/approvals` WebSocket 广播从未发送

**文件**: `syncflow-java/syncflow-workflow/src/main/java/com/syncflow/workflow/listener/ApprovalEventListener.java`  
**现象**: 前端 `ApprovalPage` 订阅 `/topic/approvals`，但后端无任何代码向该 topic 发布消息。  
**影响**: 审批列表实时刷新完全失效，用户必须手动刷新。  
**修复**: 在 `onTaskCreated()` 和 `onProcessCompleted()` 中广播。

### H3. BOM 审批流程 `hasProcessRoute` 变量未设置

**文件**: `syncflow-java/syncflow-workflow/src/main/resources/processes/bom_approval.bpmn:33`  
**现象**: BPMN 网关判断 `${hasProcessRoute == true}`，但启动流程时从未设置该变量。  
**影响**: BOM 审批在 techReview 后抛出 `PropertyNotFoundException`，流程中断。  
**修复**: `BomServiceImpl.submitForApproval()` 中查询是否有工艺路线并传入变量。

### H4. BOM 变更请求不创建 CHANGE 类型任务

**文件**: `syncflow-java/syncflow-bom/src/main/java/com/syncflow/bom/controller/bom/BomController.java:170-222`  
**现象**: `createChangeRequest()` 仅创建 ChangeRequest 实体并启动审批，从不创建 `tsk_task` 记录。  
**影响**: BOM 变更在任务列表/待办中不可见，用户无法通过任务系统跟踪变更。  
**修复**: 创建变更请求后同步创建 type=CHANGE 的任务。

### H5. 前端 Project 类型字段名不匹配后端

**文件**: `src/types/project.ts:50-51`  
**现象**: 前端 `Project` 类型使用 `actualStartDate`/`actualEndDate`，后端返回 `actualStart`/`actualEnd`。  
**影响**: 使用 `Project` 类型访问实际日期时始终为 `undefined`。  
**修复**: 对齐为 `actualStart`/`actualEnd`。

### H6. 无跨 Store 同步机制

**文件**: `src/stores/useTaskStore.ts`, `src/stores/useProjectStore.ts`  
**现象**: 任务完成后后端重算项目进度，但前端 ProjectStore 从不刷新。  
**影响**: 项目进度显示过时，直到用户手动导航。  
**修复**: 任务变更后调用 `useProjectStore.getState().fetchProjectById(projectId)`。

### H7. TaskListVO 缺少 projectId 字段

**文件**: `syncflow-java/syncflow-task/src/main/java/com/syncflow/task/dto/TaskListVO.java`  
**现象**: 列表 VO 有 `projectName` 但无 `projectId`，前端 `TaskVO` 接口期望 `projectId: number`。  
**影响**: 任务列表中 projectId 为 undefined，项目筛选和分组失效。  
**修复**: 添加 `private Long projectId;` 到 TaskListVO。

---

## 四、Medium 级问题

### M1. 项目页分类计数语义错误

**文件**: `src/pages/project/index.tsx:164-176`  
- "文件" 计数实际统计 APPROVAL 类型任务
- "采购" 计数实际统计 SUGGESTION 类型任务
- "BOM" 计数实际统计 CHANGE 类型任务（非真实 BOM 数量）

### M2. 审批双重回调（BPMN ServiceTask + PROCESS_COMPLETED 事件）

**文件**: `ApprovalEventListener.java:245`  
- BOM 审批通过时 `BomApprovalCallback.onApproved()` 被调用两次
- 有状态守卫防止重复执行，但架构脆弱

### M3. BusinessObject 状态在回调前更新

**文件**: `ApprovalEventListener.java:288-292`  
- BO.status 先更新为 approved，再调用回调
- 若回调抛异常，BO 显示已审批但领域实体未更新

### M4. 委托解析忽略 businessObjectId（全局生效）

**文件**: `DelegationServiceImpl.java:74-91`  
- 查询仅按 `fromUserId` 过滤，不限定 businessObjectId
- 为某一审批创建的委托会影响该用户所有审批

### M5. 无审批链配置前端 UI

- `wf_approval_config` 表需直接操作数据库配置
- 前端已移除 `createApprovalChain`，无替代 UI

### M6. BOM 页面依赖项目选择但无引导

**文件**: `src/pages/bom/index.tsx:63-67`  
- 直接导航到 BOM 页时 projectId 为 undefined，显示空白无提示

### M7. BOM 审批完成不触发项目级通知

**文件**: `BomApprovalCallback.java`  
- BOM 发布后不通知项目关注者/负责人

### M8. 前端 completeTask 乐观更新可能偏差

**文件**: `src/stores/useTaskStore.ts:187-209`  
- 使用 `task.milestoneId` 判断是否需审批，但 TaskListVO 不含该字段

### M9. bom.service.ts 使用原始 api 导入而非类型化 request

**文件**: `src/services/bom.service.ts:1`  
- 返回类型不透明，调用方需手动类型断言

### M10. 页面标题字号不一致

- Project: 18px, Todo: 20px, BOM: 28px, Approval: 28px, MyTasks: 22px
- 无统一标题层级

### M11. 面板圆角不一致

- Project: `border-radius: 8px`, BOM/Approval: `border-radius: 12px`

### M12. Todo 页重复筛选控件

- TaskCategoryNav（左侧 15 类）与 FilterBar（水平 12 chips）控制同一状态
- 用户困惑于两套筛选入口

### M13. 项目页右侧面板始终显示

- 未选择任务时仍占 280px 显示占位文字
- 浪费水平空间

### M14. CC 记录创建时不推送通知

**文件**: `CcRecordServiceImpl.java:27-35`  
- 抄送用户不会收到实时通知

### M15. EmptyState 组件已创建但从未使用

**文件**: `src/components/ui/EmptyState/EmptyState.tsx`  
- 各页面使用内联文字作为空状态，未复用统一组件

### M16. LoadingSkeleton 组件已创建但从未使用

**文件**: `src/components/ui/LoadingSkeleton/LoadingSkeleton.tsx`  
- 各页面使用 Spin 或 Table loading，未使用骨架屏

---

## 五、Low 级问题

| # | 问题 | 文件 |
|---|------|------|
| L1 | DB schema 注释中状态码与 Java 枚举不一致（仅文档问题） | V1__init_schema.sql:452 |
| L2 | BOM 测试 mock 使用 string projectId | src/pages/bom/index.spec.tsx:7 |
| L3 | TaskStatistics 有 `reviewing` 别名但后端无此字段 | src/services/task.service.ts:82-86 |
| L4 | 委托仅对新任务生效，已分配任务不受影响 | ApprovalEventListener.java:160-174 |
| L5 | 撤回时 BO 状态被写两次（无害但冗余） | WorkflowServiceImpl.java:364 |
| L6 | 项目页分类导航无键盘可访问性 | src/pages/project/index.tsx:272-289 |
| L7 | #999999 文字对比度不达 WCAG AA | 所有 module.css |
| L8 | 面包屑仅项目页有，其他页面无 | 各 index.tsx |
| L9 | Header 组件已定义但未在 AppLayout 中渲染 | components/layout/Header |
| L10 | 审批详情"催办""加签"按钮在列表和详情中重复 | ApprovalList + ApprovalDetail |
| L11 | Tab 内容未懒加载（Gantt/Swimlane 渲染开销大） | useDetailTabItems.tsx |

---

## 六、审批引擎完整流程图

```
                         ┌─────────────────────────────────────────┐
                         │         APPROVAL FLOW ARCHITECTURE       │
                         └─────────────────────────────────────────┘

  ┌─────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
  │  Frontend   │────>│  WorkflowController  │────>│  WorkflowServiceImpl│
  │  (React)    │     │  POST /api/wf/start  │     │                     │
  │             │     │  POST /api/wf/tasks/  │     │  - startProcess()   │
  │  useSocket  │<────│       {id}/complete   │     │  - completeTask()   │
  │  /topic/... │     │  POST /api/wf/       │     │  - withdrawApproval │
  └─────────────┘     │    business-objects/  │     └────────┬────────────┘
                      │       {id}/withdraw   │              │
                      └──────────────────────┘              │
                                                            ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │                     Flowable 7.x Engine                             │
  │  BPMN Processes: BOM_APPROVAL, CHANGE_APPROVAL, GENERIC_APPROVAL,  │
  │                  STAGE_GATE_APPROVAL, FILE_APPROVAL, SPEC_APPROVAL  │
  └──────────────────────────────┬──────────────────────────────────────┘
                                 │ Events
                                 ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  ApprovalEventListener (FlowableEventListener)                       │
  │  - TASK_CREATED:     update BO.currentTaskId, resolve assignees,     │
  │                      check delegation, send notification             │
  │  - TASK_COMPLETED:   log only                                        │
  │  - PROCESS_COMPLETED: set BO status (3/4), invoke callback registry  │
  │  - PROCESS_CANCELLED: set BO status (5), invoke onWithdrawn          │
  └──────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  ApprovalCallbackRegistry (dispatches by objectType)                 │
  │                                                                      │
  │  BomApprovalCallback        → "BOM"                                  │
  │  BomChangeApprovalCallback  → "BOM_CHANGE"                           │
  │  TaskApprovalCallback       → "TASK", "ISSUE", "RISK"               │
  │  MilestoneApprovalCallback  → "MILESTONE"                            │
  │  StageGateApprovalCallback  → "STAGE_GATE"                           │
  │  FileApprovalCallback       → "FILE"                                 │
  │  ProcessRouteApprovalCallback → "PROCESS_ROUTE"                      │
  │  ModuleSpecApprovalCallback → "MODULE_SPEC"                          │
  │  SpecChangeApprovalCallback → "SPEC_CHANGE"                          │
  │  ProjectApprovalCallback    → "PROJECT"                              │
  └──────────────────────────────────────────────────────────────────────┘
```

### BOM 审批流程

```
  submitForApproval(bomId)
       │
       ▼
  BomServiceImpl: validate status==EDITING(1), set PENDING_APPROVAL(2)
       │
       ▼
  workflowService.startProcess("BOM_APPROVAL", bomId, "BOM")
       │
       ▼
  Flowable: startEvent → submitBom → techReview → [hasProcessGate]
                                                     │
                              ┌───────────────────────┴──────────────────┐
                              ▼ (hasProcessRoute=true)                   ▼ (false)
                         processReview                              qualityReview
                              │                                          │
                              ▼                                          │
                         qualityReview <─────────────────────────────────┘
                              │
                              ▼
                         pmApproval → [approved?]
                              │              │
                              ▼ yes          ▼ no
                         publishBom     onRejected → BOM→EDITING(1)
                              │
                              ▼
                         BOM→PUBLISHED(3)
```

### Task 完成审批流程

```
  TaskServiceImpl.completeTask(taskId)
       │
       │  needsApproval = (type==MILESTONE|ISSUE|RISK || milestoneId!=null)
       │
       ▼ (needsApproval=true)
  task.status = PENDING_REVIEW(3)
  startProcess("GENERIC_APPROVAL", taskId, task.type)
       │
       ▼
  Flowable: startEvent → approval → [approved?]
                                        │         │
                                        ▼ yes     ▼ no
                                   handleApproved  handleRejected
                                        │              │
                                        ▼              ▼
                                   task→COMPLETED  task→IN_PROGRESS
```

---

## 七、跨模块数据流验证路径

### 路径 1: 创建项目 → 创建任务 → 完成任务 → 项目进度更新

```
1. POST /api/projects → 返回 ProjectVO{id, progress:0}
2. POST /api/tasks {projectId: project.id, type:"TASK"} → 返回 TaskVO
3. PUT /api/tasks/{id}/complete → 后端 recalcProjectProgress()
4. GET /api/projects/{id} → 验证 progress 已更新
   ✅ 前端 ProjectStore 现在自动刷新（H6 已修复）
```

### 路径 2: 创建 BOM → 提交审批 → 审批通过 → BOM 发布

```
1. POST /api/boms {projectId, name, productCode, productName}
2. POST /api/boms/{id}/submit-approval
   ✅ hasProcessRoute 变量已设置默认值（H3 已修复）
3. GET /api/wf/tasks/pending → 获取审批任务
   ✅ WebSocket 现在推送到 /topic/approvals（H2 已修复）
4. POST /api/wf/tasks/{taskId}/complete {approved:true}
5. 验证: BOM.status == PUBLISHED(3)
```

### 路径 3: BOM 变更请求 → 审批 → 应用变更

```
1. POST /api/boms/{bomId}/change-requests {changeType, itemId, ...}
   ⚠️ 不创建 CHANGE 任务（Issue H4 — 待 Phase 3 实现）
2. 审批流程自动启动 (CHANGE_APPROVAL)
3. 审批通过 → BomChangeApprovalCallback 应用变更
4. 验证: BOM 结构已更新
```

### 路径 4: MILESTONE 任务完成 → 审批 → 任务状态更新

```
1. POST /api/tasks {type:"MILESTONE", milestoneId: X, projectId: Y}
2. PUT /api/tasks/{id}/complete
3. 后端启动 GENERIC_APPROVAL, objectType="TASK", objectId=task.id
   ✅ 路由到 TaskApprovalCallback（H1 已修复）
4. 审批通过 → TaskApprovalCallback 将任务标记 COMPLETED
   ✅ 正确使用 task.id 查找任务
```

### 路径 5: 委托审批 → 被委托人处理

```
1. POST /api/wf/delegation {businessObjectId, fromUserId, toUserId}
   ⚠️ 解析时忽略 businessObjectId（Issue M4 — 待 Phase 3 修复）
2. 新审批任务创建时检查委托
3. 被委托人在待办中看到任务
4. 完成审批 → 原始流程继续
```

---

## 八、修复优先级与计划

### Phase 1 — 立即修复（前端可独立完成）

| 序号 | 问题 | 预计工时 |
|------|------|---------|
| 1 | BOM 页面布局 Bug (C1) | 0.5h |
| 2 | Todo TaskList 操作按钮 (C4) | 1h |
| 3 | Project 类型字段对齐 (H5) | 0.5h |
| 4 | 跨 Store 同步 (H6) | 1h |
| 5 | 项目页分类计数修正 (M1) | 0.5h |
| 6 | BOM 页无项目引导 (M6) | 0.5h |
| 7 | bom.service.ts 类型化 (M9) | 0.5h |
| 8 | 页面标题统一 (M10) | 0.5h |

### Phase 2 — 后端修复（需 Java 改动）

| 序号 | 问题 | 预计工时 |
|------|------|---------|
| 1 | CreateTaskDTO.projectId 类型 (C2) | 0.5h |
| 2 | MILESTONE 审批路由 (H1) | 1h |
| 3 | WebSocket 广播 (H2) | 1h |
| 4 | hasProcessRoute 变量 (H3) | 1h |
| 5 | BOM 变更创建任务 (H4) | 2h |
| 6 | TaskListVO 补 projectId (H7) | 0.5h |

### Phase 3 — 架构优化

| 序号 | 问题 | 预计工时 |
|------|------|---------|
| 1 | 响应式设计 (C3) | 4h |
| 2 | 审批链配置 UI (M5) | 8h |
| 3 | 回调原子性修复 (M3) | 2h |
| 4 | 委托作用域修复 (M4) | 1h |

---

## 九、当前进度

- [x] 三路并行审计完成
- [x] 审计报告输出
- [x] Phase 1 前端修复（8项全部完成）
  - [x] C1: BOM 页面布局 Bug — Tabs 移至 flex-column 容器，panels 嵌套 row
  - [x] C4: Todo TaskList 操作按钮 — 实现编辑(打开详情)和删除(确认弹窗)
  - [x] H5: Project 类型字段对齐 — `actualStartDate`→`actualStart`
  - [x] H6: 跨 Store 同步 — completeTask/changeStatus/deleteTask 后刷新 ProjectStore
  - [x] M1: 项目页分类计数修正 — files→FILE类型, procurement→SUGGESTION+PROCUREMENT
  - [x] M6: BOM 页无项目引导 — 添加 Empty 组件提示
  - [x] M9: bom.service.ts 类型化 — 迁移至 `request` + 完整返回类型
  - [x] M10: 页面标题统一 — 全部标准化为 20px
- [x] Phase 2 后端修复（6项全部完成）
  - [x] C2: CreateTaskDTO.projectId → Long 类型 + @NotNull
  - [x] H1: MILESTONE 审批路由 — objectType 固定为 "TASK"，TaskApprovalCallback 增加 MILESTONE
  - [x] H2: WebSocket 广播 — ApprovalEventListener 注入 pushService，onTaskCreated/onProcessCompleted 广播
  - [x] H3: hasProcessRoute 变量 — WorkflowServiceImpl 为 BOM_APPROVAL 设置默认 false
  - [x] H7: TaskListVO 补字段 — 添加 projectId, assigneeId, milestoneId, priority
  - [x] H7b: TaskMapper.xml — SELECT 补充对应列
- [x] Phase 3 架构优化（全部完成）
  - [x] C3: 响应式设计 — 添加 1024px/1280px 断点，面板折叠
  - [x] M11: 面板圆角统一 — 全部标准化为 8px (--radius-md)
  - [x] M13: 项目页右侧面板条件显示 — 无任务时隐藏，grid 自适应
  - [x] L6: 项目页分类导航键盘可访问性 — role/tabIndex/onKeyDown
  - [x] M3: 审批回调原子性 — callback-first + @Transactional
  - [x] M4: 委托作用域 — 按 businessObjectId 精确匹配 + 全局 fallback
  - [x] M5: 审批链配置 UI — 后端 CRUD API + 前端 Table+Modal 管理页
  - [x] M12: Todo 页重复筛选 — FilterBar 改为受控组件，精简为 4 个快捷入口
- [x] 全链路回归验证 — TypeScript 编译通过 + 1876 测试全绿

### 验证结果

```
TypeScript: ✅ tsc --noEmit 无错误
Tests:      ✅ 169 files, 1876 tests passed
Duration:   53.90s
```
