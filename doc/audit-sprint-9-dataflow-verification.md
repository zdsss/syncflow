# SyncFlow Sprint 9 — 三大模块数据流验证报告

> 审计日期: 2026-05-12 | 范围: Project / Task / BOM + 审批引擎交互
> 基于: core-modules-audit-report.md (2026-05-11) 的后续跟进

---

## 一、问题修复状态总览

| 编号 | 问题描述 | 严重级 | 状态 | 修复位置 |
|------|---------|--------|------|---------|
| C-1 | 审批回调双路径重复执行 | CRITICAL | ✅ 已修复 | `ApprovalEventListener.java:244-248` |
| C-2 | BOM 字段名 materialName vs name | CRITICAL | ✅ 已修复 | `bom/index.tsx`, `BomTree.tsx`, `BomTable.tsx` |
| C-3 | sourceType 枚举 MAKE/BUY vs MADE/PURCHASED | CRITICAL | ✅ 已修复 | `BomTable.tsx:56-64`, `ChangeRequestModal.tsx:14-18` |
| C-4 | ChangeRequestModal 发送错误数据格式 | CRITICAL | ✅ 已修复 | `ChangeRequestModal.tsx` 完整重写 |
| C-5 | applyAddItem 硬编码 level=1 | CRITICAL | ✅ 已修复 | `BomChangeApprovalCallback.java:127-144` |
| C-6 | 前端缺少 startMilestone 调用 | CRITICAL | ✅ 已修复 | `project.service.ts:172`, `SwimlaneTab.tsx:85` |
| H-1 | types.ts 旧字段名 partNumber/supplier | HIGH | ✅ 已修复 | `bom/index.tsx` 内联类型替代 |
| H-2 | unit vs unitOfMeasure 命名不一致 | HIGH | ✅ 已修复 | `BomChangeApprovalCallback.java:118-121` (本次修复) |
| H-3 | 项目状态无法变更 | HIGH | ✅ 已修复 | `ProjectController.java:87-92`, `project.service.ts:182` |
| H-4 | applyChange 无事务原子性 | HIGH | ✅ 已修复 | `BomChangeApprovalCallback.java:41 @Transactional` |
| H-5 | 重复更新 CR status | HIGH | ✅ 已修复 | `ChangeApprovalService.java` 委托给 callback |
| H-6 | applyDeleteItem 不级联删除 | HIGH | ✅ 已修复 | `BomChangeApprovalCallback.java:170-182` |

**所有 CRITICAL 和 HIGH 级问题已全部修复。**

---

## 二、完整数据流验证路径

### 路径 1: Project → Phase → Milestone → Task 全链路

```
[前端] 创建项目
  POST /api/projects
  → ProjectController.createProject()
  → ProjectServiceImpl.createProject()
  → prj_project 表插入 (status=1 未开始)

[前端] 更新项目状态
  PUT /api/projects/{id}/status { status: 2 }
  → ProjectController.updateProjectStatus()
  → ProjectServiceImpl.updateProjectStatus()
  → prj_project.status = 2 (进行中)

[前端] 创建阶段
  POST /api/projects/{id}/phases
  → PhaseServiceImpl.createPhase()
  → prj_phase 表插入

[前端] 创建里程碑
  POST /api/projects/{id}/milestones
  → MilestoneServiceImpl.createMilestone()
  → prj_milestone 表插入 (status=1 未开始)

[前端 SwimlaneTab] 启动里程碑
  PUT /api/projects/milestones/{id}/start
  → MilestoneServiceImpl.startMilestone()
  → prj_milestone.status = 2 (进行中)

[前端] 创建任务 (关联里程碑)
  POST /api/tasks
  → TaskServiceImpl.createTask()
  → tsk_task 表插入 (status=1)

[前端] 完成任务
  PUT /api/tasks/{id}/complete
  → TaskServiceImpl.completeTask()
  → 如需审批: startProcess("GENERIC_APPROVAL", taskId, "TASK")
    → tsk_task.status = 3 (PENDING_REVIEW)
  → 无需审批: tsk_task.status = 4 (COMPLETED)

[审批引擎] 任务审批通过
  BPMN ServiceTask → ApprovalCallbackServiceImpl.onApproved()
  → callbackRegistry.onApproved("TASK", taskId, approverId)
  → TaskApprovalCallback.onApproved()
  → tsk_task.status = 4 (COMPLETED)
  [幂等保护: ApprovalEventListener 检查 bo.status==3 跳过重复]

[前端 SwimlaneTab] 完成里程碑
  POST /api/projects/milestones/{id}/complete
  → MilestoneServiceImpl.completeMilestone()
  → 如有 deliverable: 启动 GENERIC_APPROVAL 审批
  → 无 deliverable: prj_milestone.status = 3 (COMPLETED)
```

**验证要点:**
- ✅ 里程碑状态机: 1(未开始) → 2(进行中) → 3(已完成)
- ✅ 任务状态机: 1(待处理) → 2(进行中) → 3(待审批) → 4(已完成)
- ✅ 审批回调幂等保护

---

### 路径 2: BOM 创建 → 审批 → 发布

```
[前端] 创建 BOM
  POST /api/boms { name, projectId, productCode, productName }
  → BomServiceImpl.createBom()
  → bom_bom 表插入 (status=EDITING=1)

[前端] 添加物料
  POST /api/boms/{id}/items { name, quantity, sourceType, ... }
  → BomServiceImpl.addBomItem()
  → 计算 level/path/levelNo/seqNo
  → bom_item 表插入

[前端] 提交审批
  POST /api/boms/{id}/submit-approval
  → BomServiceImpl.submitForApproval()
  → 启动 BOM_APPROVAL 流程
  → bom_bom.status = 2 (PENDING_APPROVAL)

[审批引擎] BOM 审批通过
  → BomApprovalCallback.onApproved()
  → bom_bom.status = 3 (PUBLISHED)
  → 记录 approvedBy/approvedAt
  [幂等保护: 检查 status==PUBLISHED 跳过重复]
```

**验证要点:**
- ✅ BOM 状态机: EDITING(1) → PENDING_APPROVAL(2) → PUBLISHED(3)
- ✅ 物料树结构正确计算 (level/path/levelNo)
- ✅ sourceType 枚举: MADE/PURCHASED/SUBCONTRACT

---

### 路径 3: BOM 变更请求 → 审批 → 应用 (最关键跨模块交互)

```
[前端 ChangeRequestModal] 提交变更申请
  POST /api/boms/{id}/change-requests {
    changeType: "ADD_ITEM"|"UPDATE_ITEM"|"DELETE_ITEM",
    itemId?: number,       // UPDATE/DELETE 时必填
    name?: string,         // ADD/UPDATE 时填写
    sourceType?: string,   // MADE|PURCHASED|SUBCONTRACT
    quantity?: number,
    specification?: string,
    materialCode?: string,
    unitOfMeasure?: string,
    description: string
  }
  → ChangeRequestServiceImpl.createChangeRequest()
  → wf_change_request 表插入 (status=1 pending)
  → 启动 CHANGE_APPROVAL 流程 (3级审批)

[审批引擎] 变更审批通过
  BPMN ServiceTask → ChangeApprovalService.execute()
  → callbackRegistry.onApproved("BOM_CHANGE", crId, approverId)
  → BomChangeApprovalCallback.onApproved()
  → 幂等检查: cr.status==2 则跳过
  → applyChange(cr):
    ADD_ITEM:    计算树元数据(level/path/levelNo) → bom_item 插入
    UPDATE_ITEM: 按 itemId 更新字段
    DELETE_ITEM: 递归删除子节点 → bom_item 删除
  → cr.status = 2 (applied)
  [幂等保护: ApprovalEventListener 检查 bo.status==3 跳过重复]

[字段映射说明]
  前端 unitOfMeasure → 后端 BomItem.unit (BomChangeApprovalCallback 双字段兼容)
  前端 name          → 后端 BomItem.name ✅
  前端 sourceType    → 后端 BomItem.sourceType (MADE/PURCHASED/SUBCONTRACT) ✅
```

**验证要点:**
- ✅ 变更申请数据格式正确
- ✅ 审批回调幂等保护 (status==2 跳过)
- ✅ ADD_ITEM 正确计算树元数据
- ✅ DELETE_ITEM 递归删除子节点
- ✅ unit/unitOfMeasure 双字段兼容
- ✅ @Transactional 保证原子性

---

### 路径 4: Task 完成审批交互

```
[前端] 完成任务 (MILESTONE/ISSUE/RISK 类型)
  PUT /api/tasks/{id}/complete
  → TaskServiceImpl.completeTask()
  → 检查任务类型是否需要审批
  → 需要: startProcess("GENERIC_APPROVAL", taskId, taskType)
    → wf_business_object 插入
    → Flowable 启动 GENERIC_APPROVAL 流程
    → tsk_task.status = 3 (PENDING_REVIEW)

[审批引擎] 审批通过
  路径A: BPMN ServiceTask → ApprovalCallbackServiceImpl.onApproved()
    → callbackRegistry.onApproved("TASK", taskId, approverId)
    → TaskApprovalCallback.onApproved()
    → tsk_task.status = 4 (COMPLETED)
    → wf_business_object.status = 3 (approved)

  路径B: ApprovalEventListener.onProcessCompleted()
    → 检查 bo.status == 3 → 跳过 (幂等保护)

[审批引擎] 审批拒绝
  → TaskApprovalCallback.onRejected()
  → tsk_task.status = 2 (IN_PROGRESS) 回退
```

---

## 三、UI/UX 审查结果

### Project 模块 (`src/pages/project/`)

| 组件 | 问题 | 严重度 |
|------|------|--------|
| `index.tsx` | 分类导航 (项目/单体/设计/BOM...) 的计数部分使用硬编码乘数估算，非真实数据 | MEDIUM |
| `ScheduleTab.tsx` | 仅显示任务甘特，无里程碑管理入口（里程碑操作在 SwimlaneTab） | LOW |
| `TaskDetailPanel.tsx` | 状态变更通过 `onStatusChange` 回调，但未直接调用 `startMilestone`/`completeMilestone` | LOW |

### BOM 模块 (`src/pages/bom/`)

| 组件 | 问题 | 严重度 |
|------|------|--------|
| `BomTable.tsx` | `unitOfMeasure` 列显示后端 `unit` 字段值，两字段并存于 `BomItemTreeVO`，语义重叠 | MEDIUM |
| `BomVersionPanel.tsx` | 版本历史只显示当前 BOM 版本，不链式查询 parentBomId | MEDIUM |
| `ProcessRouteView.tsx` | 全部硬编码 mock 数据，无后端集成 | HIGH |

### Approval 模块 (`src/pages/approval/`)

| 组件 | 问题 | 严重度 |
|------|------|--------|
| `ApprovalList.tsx` | 审批列表正确调用后端 API | ✅ 正常 |
| `ApprovalDetail.tsx` | 审批通过/拒绝操作正确 | ✅ 正常 |

---

## 四、遗留问题 (MEDIUM/LOW 优先级)

| 编号 | 问题 | 优先级 | 预估工时 |
|------|------|--------|---------|
| M-1 | 版本历史只显示单条，不链式查询 parentBomId | MEDIUM | 2h |
| M-2 | rollbackBomVersion 前端已接入后端，但未测试 | MEDIUM | 1h |
| M-3 | ProcessRouteView 全部 mock 数据，无后端集成 | HIGH | 4h |
| M-4 | 项目分类导航计数使用估算乘数，非真实统计 | MEDIUM | 2h |
| M-5 | BomItemTreeVO 中 unit/unitOfMeasure 双字段语义重叠，建议统一 | LOW | 1h |

---

## 五、测试覆盖状态

| 模块 | 测试数 | 通过 | 说明 |
|------|--------|------|------|
| syncflow-bom | 54 | 54 | 含本次新增 3 个测试 |
| syncflow-project | — | — | 待运行 |
| syncflow-task | — | — | 待运行 |
| syncflow-workflow | — | — | 待运行 |
| 前端 (vitest) | — | — | 待运行 |

---

## 六、本次修复内容 (2026-05-12)

### 后端修复
1. **`BomChangeApprovalCallback.java:118-121`** — `applyAddItem` 新增 `unitOfMeasure` 字段兼容读取，解决前端发 `unitOfMeasure` 但后端读 `unit` 的不匹配

### 测试新增
1. **`BomChangeApprovalCallbackTest.java`** — 新增 3 个测试：
   - `onApproved_addItem_unitOfMeasureFallback` — 验证 unitOfMeasure 字段映射
   - `onApproved_addItem_withParent_computesTreeMetadata` — 验证树元数据计算
   - `onApproved_deleteItem_cascadesChildren` — 验证级联删除

### 已确认修复 (前次 sprint 完成)
- C-1 审批双路径去重 (ApprovalEventListener status 检查)
- C-2/C-3/C-4 BOM 前端字段名/枚举/数据格式
- C-5 applyAddItem 树元数据计算
- C-6 startMilestone 前端调用 (SwimlaneTab)
- H-4/H-5/H-6 事务/重复更新/级联删除
