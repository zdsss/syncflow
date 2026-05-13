# SyncFlow 前三模块 + 审批引擎 全链路数据流审计

> 审计日期: 2026-05-11 | 版本: Sprint 8 | 范围: Project / Task / BOM + 审批引擎全链路

---

## 一、模块拓扑与数据流总览

```
┌──────────────────────────────────────────────────────────────────────┐
│                         前端 (React 19 + Ant Design 6)               │
│  project.service.ts  task.service.ts  bom.service.ts  workflow.service.ts │
└──────────┬───────────────┬──────────────┬──────────────┬─────────────┘
           │               │              │              │
           ▼               ▼              ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────────────┐
│ syncflow-    │  │ syncflow-    │  │syncflow- │  │ syncflow-        │
│ project      │  │ task         │  │bom       │  │ workflow         │
│              │  │              │  │          │  │ (Flowable 7.x)   │
│ prj_project  │  │ tsk_task     │  │bom_bom   │  │ wf_business_obj  │
│ prj_phase    │  │ tsk_comment  │  │bom_item  │  │ wf_approval_cfg  │
│ prj_milestone│  │ tsk_activity │  │bom_ver   │  │ wf_change_req    │
│ prj_stage_gt │  │              │  │          │  │ ACT_* (Flowable) │
└──────┬───────┘  └──────┬───────┘  └────┬─────┘  └────────┬─────────┘
       │                 │               │                  │
       └─────────────────┴───────────────┴──────────────────┘
                                    │
                         ApprovalCallbackRegistry
                         (dispatch by objectType)
                                    │
          ┌─────────────────────────┼──────────────────────────┐
          ▼                         ▼                          ▼
 TaskApprovalCallback    MilestoneApprovalCallback   BomApprovalCallback
 StageGateApprovalCallback  BomChangeApprovalCallback  ProjectApprovalCallback
```

---

## 二、审批引擎架构

### 2.1 回调路径（已修复双路径问题）

```
BPMN ServiceTask → ApprovalCallbackServiceImpl.onApproved(execution)
                 → callbackRegistry.onApproved(objectType, objectId, approverId)
                 → 对应 Handler.onApproved()
                 → BusinessObject.status = 3 (approved)

流程结束 → ApprovalEventListener.onProcessCompleted()
         → 检查 bo.status == 3 || 4 → 跳过（去重保护）✅
```

**C-1 双路径回调重复执行 — 已修复** ✅
`ApprovalEventListener.onProcessCompleted()` 第244-248行已添加状态检查，若 BPMN ServiceTask 已将 status 设为 3/4，则跳过 Listener 的回调。

### 2.2 已注册回调处理器

| Handler | objectType | 模块 | 状态 |
|---------|-----------|------|------|
| TaskApprovalCallback | TASK, ISSUE, RISK | syncflow-task | ✅ 正常 |
| MilestoneApprovalCallback | MILESTONE | syncflow-project | ✅ 正常 |
| BomApprovalCallback | BOM | syncflow-bom | ✅ 正常 |
| BomChangeApprovalCallback | BOM_CHANGE | syncflow-bom | ✅ 正常（有幂等保护）|
| StageGateApprovalCallback | STAGE_GATE | syncflow-project | ✅ 正常 |
| ProjectApprovalCallback | PROJECT | syncflow-project | ✅ 正常 |

### 2.3 BPMN 流程定义状态

| 流程 | 文件 | 状态 |
|------|------|------|
| GENERIC_APPROVAL | generic_approval.bpmn | ✅ 正常，单级审批 |
| CHANGE_APPROVAL | change_approval.bpmn | ✅ 正常，3级审批链 |
| BOM_APPROVAL | bom_approval.bpmn | ✅ 正常 |
| STAGE_GATE_APPROVAL | stage_gate_approval.bpmn | ✅ **Sprint 8 已修复**（见下） |
| FILE_APPROVAL | file_approval.bpmn | 未审计 |
| MODULE_SPEC_APPROVAL | module_spec_approval.bpmn | 未审计 |
| PROCESS_APPROVAL | process_approval.bpmn | 未审计 |

---

## 三、验证路径详细分析

### 路径 1: Project → Phase → Milestone → Task 全链路

```
创建 Project → POST /api/projects
  ↓ 自动生成6个阶段 (prj_phase × 6)
  ↓ 启动 GENERIC_APPROVAL 流程 (objectType=PROJECT)
  ↓
审批通过 → ProjectApprovalCallback.onApproved() → project.status = 2 (in_progress)
  ↓
创建 Milestone → POST /api/projects/{id}/milestones (status=1, not_started)
  ↓
启动 Milestone → PUT /api/projects/milestones/{id}/start (status 1→2)  ✅ 前端已有 startMilestone()
  ↓
完成 Milestone → POST /api/projects/milestones/{id}/complete
  ├── 无 deliverable → 直接 status=3 (completed)
  └── 有 deliverable → 启动 GENERIC_APPROVAL (objectType=MILESTONE)
        ↓
      审批通过 → MilestoneApprovalCallback.onApproved() → status=3, progress=100
```

**验证要点:**

| # | 检查项 | 状态 |
|---|--------|------|
| 1.1 | startMilestone 前端调用 | ✅ project.service.ts:172 已有 |
| 1.2 | completeMilestone 要求 status=2 | ✅ MilestoneServiceImpl:120 有校验 |
| 1.3 | 里程碑拒绝后 progress 重置为 0 | ✅ MilestoneApprovalCallback:59 已修复 |
| 1.4 | 项目审批驳回不永久取消 | ✅ ProjectApprovalCallback 已修复 |
| 1.5 | 阶段门禁审批通过后不自动推进阶段 | ⚠️ 已知设计 gap，需产品确认 |

---

### 路径 2: Task 完成 → 审批 → 状态回写 → 项目进度更新

```
完成 Task → PUT /api/tasks/{id}/complete
  ├── 不需要审批 (普通任务，无 milestoneId) → status=4 (COMPLETED)
  │     ↓ recalcProjectProgress() ✅
  └── 需要审批 (milestoneId≠null 或 type∈{MILESTONE,ISSUE,RISK})
        ↓ status=3 (PENDING_REVIEW)
        ↓ 启动 GENERIC_APPROVAL
        ↓
      审批通过 → TaskApprovalCallback.onApproved()
        ↓ status=4 (COMPLETED), progress=100
        ↓ recalcProjectProgress() ✅ Sprint 8 新增
      审批驳回 → TaskApprovalCallback.onRejected()
        ↓ status=2 (IN_PROGRESS)
```

**验证要点:**

| # | 检查项 | 状态 |
|---|--------|------|
| 2.1 | 直接完成后项目进度更新 | ✅ TaskServiceImpl:390 |
| 2.2 | 审批完成后项目进度更新 | ✅ **Sprint 8 新增** TaskApprovalCallback:60 |
| 2.3 | 幂等保护：重复点击不启动重复审批 | ✅ TaskServiceImpl:342-347 |
| 2.4 | 状态机校验 | ✅ isValidTransition() |
| 2.5 | 前端乐观更新 MILESTONE/ISSUE/RISK → status=3 | ✅ 已修复 |
| 2.6 | MILESTONE 不再由 TaskApprovalCallback 处理 | ✅ supportedObjectTypes 已移除 |

---

### 路径 3: BOM 创建 → 审批 → 发布

```
创建 BOM → POST /api/boms (status=EDITING/1)
  ↓
添加物料 → POST /api/boms/{id}/items
  ↓ CreateBomItemDTO: name, sourceType(MADE/PURCHASED/SUBCONTRACT), quantity
  ↓
提交审批 → POST /api/boms/{id}/submit-approval (status=PENDING_APPROVAL/2)
  ↓ 启动 BOM_APPROVAL 流程
  ↓
审批通过 → BomApprovalCallback.onApproved() → status=PUBLISHED(3)
```

**验证要点:**

| # | 检查项 | 状态 |
|---|--------|------|
| 3.1 | 前端 BomItem 字段名使用 `name` | ✅ index.tsx:22 已修复 |
| 3.2 | sourceType 枚举 MADE/PURCHASED/SUBCONTRACT | ✅ ChangeRequestModal:14-18 已修复 |
| 3.3 | 提交审批按钮仅在 status=1 时显示 | ✅ index.tsx:162 |
| 3.4 | BomApprovalCallback 有幂等保护 | ✅ 检查 PUBLISHED 状态 |

---

### 路径 4: BOM 变更申请 → 3级审批 → 变更应用

```
点击"变更申请" → ChangeRequestModal
  ↓ 选择 changeType: ADD_ITEM / UPDATE_ITEM / DELETE_ITEM
  ↓ 填写变更字段 (name, sourceType, quantity, ...)
  ↓
POST /api/boms/{id}/change-requests
  ↓ BomController 构建 changeData JSON
  ↓ changeRequestService.createRequest("BOM_CHANGE", bomId, changeType, changeData, ...)
  ↓ workflowService.startProcess("CHANGE_APPROVAL", crId, "BOM_CHANGE", ...)
  ↓
CHANGE_APPROVAL 流程: submit → impactReview → techReview → pmApproval
  ↓ 任一环节驳回 → approvalCallbackService.onRejected() → BomChangeApprovalCallback.onRejected()
  ↓ 全部通过 → approvalCallbackService.onApproved() → BomChangeApprovalCallback.onApproved()
  ↓
BomChangeApprovalCallback.onApproved():
  ↓ 幂等检查: cr.status == 2 → 跳过 ✅
  ↓ applyChange(cr) → 解析 changeData → ADD/UPDATE/DELETE
  ↓ cr.status = 2 (applied)
```

**验证要点:**

| # | 检查项 | 状态 |
|---|--------|------|
| 4.1 | ChangeRequestModal 发送正确字段 | ✅ 已重写，使用 name/sourceType/quantity |
| 4.2 | BomController 构建 changeData JSON | ✅ 已实现，字段映射正确 |
| 4.3 | applyAddItem 计算树元数据 | ✅ 已修复，从 parent 计算 level/path/levelNo |
| 4.4 | applyDeleteItem 级联删除子节点 | ✅ 已修复，递归删除 |
| 4.5 | BomChangeApprovalCallback 幂等保护 | ✅ cr.status==2 检查 |
| 4.6 | H-5 重复更新 CR status | ✅ 已修复，只在 BomChangeApprovalCallback 更新 |
| 4.7 | applyChange 事务原子性 | ⚠️ 部分执行风险仍存在（见遗留问题） |

---

### 路径 5: 阶段门禁审批 (StageGate)

```
提交门禁 → StageGateService.submitStageGate()
  ↓ prj_stage_gate 表 + 启动 STAGE_GATE_APPROVAL 流程
  ↓ 流程变量: stageGateId, objectType=STAGE_GATE
  ↓
STAGE_GATE_APPROVAL 流程:
  fillInfo(申请人) → startApproval → gate1
    ├── approved=false → handleEarlyRejection(onRejected) → endRejectedEarly ✅ Sprint 8 新增
    └── approved=true → finalApproval → resultGate
          ├── approved=true → updateStatus(onApproved) → endApproved ✅ Sprint 8 修复
          └── approved=false → handleFinalRejection(onRejected) → endRejected ✅ Sprint 8 新增
  ↓
StageGateApprovalCallback.onApproved() → gate.status=2, approverId, approvedAt
StageGateApprovalCallback.onRejected() → gate.status=3, comments
StageGateApprovalCallback.onWithdrawn() → gate.status=1
```

**Sprint 8 修复内容:**
- **修复前**: `flowable:delegateExpression="${stageGateService}"` → `StageGateService` 不是 `JavaDelegate`，运行时抛 `ClassCastException`
- **修复后**: 改为 `flowable:expression="${approvalCallbackService.onApproved(execution)}"` ✅
- **新增**: 两条拒绝路径均添加 `onRejected` 回调 service task ✅

**验证要点:**

| # | 检查项 | 状态 |
|---|--------|------|
| 5.1 | stageGateId 流程变量 | ✅ WorkflowServiceImpl:129 |
| 5.2 | approverId 流程变量 | ✅ WorkflowServiceImpl:215 |
| 5.3 | 审批通过回调 | ✅ Sprint 8 修复 |
| 5.4 | 审批驳回回调（两条路径） | ✅ Sprint 8 新增 |
| 5.5 | 撤回回调 | ✅ ApprovalEventListener.onProcessCancelled() |

---

### 路径 6: 项目成员 → 审批委派人解析

```
添加成员 → POST /api/projects/{id}/members
  ↓ { userId, projectRole }
  ↓ prj_project_member 表
  ↓
审批配置 → wf_approval_config: rule_type=PROJECT_ROLE, rule_value=PM
  ↓
委派解析 → ApprovalAssigneeResolver
  ↓ CrossModuleMapper.selectUsersByProjectRole(projectId, "PM")
  ↓ → prj_project_member WHERE project_id=? AND project_role=?
  ↓ → 返回 userId 列表
  ↓
ApprovalEventListener.onTaskCreated() → flowableTaskService.setAssignee(taskId, userId)
```

**验证要点:**

| # | 检查项 | 状态 |
|---|--------|------|
| 6.1 | projectRole 字段名 | ✅ 前端已修复 |
| 6.2 | addMember 后端返回 void | ✅ 前端重新 fetch 成员列表 |
| 6.3 | 委托链解析 | ✅ DelegationService.resolveDelegatedApprover() |
| 6.4 | 部门负责人 SQL | ⚠️ selectDepartmentHead 返回任意用户而非负责人 |

---

## 四、Sprint 8 修复清单

| # | 问题 | 严重度 | 修复内容 | 文件 |
|---|------|--------|---------|------|
| F1 | StageGate BPMN delegateExpression 无效 | CRITICAL | 改为 `approvalCallbackService.onApproved(execution)` | stage_gate_approval.bpmn |
| F2 | StageGate 拒绝路径无回调 | HIGH | 两条拒绝路径各添加 `onRejected` service task | stage_gate_approval.bpmn |
| F3 | 任务审批完成后项目进度不更新 | HIGH | TaskApprovalCallback.onApproved() 添加 recalcProjectProgress() | TaskApprovalCallback.java |
| F4 | 重复审批流程无防护 | HIGH | WorkflowServiceImpl.startProcess() 添加幂等检查 | WorkflowServiceImpl.java |
| F5 | 创建任务时 projectId 不校验 | MEDIUM | TaskServiceImpl.createTask() 添加 projectMapper.selectById 校验 | TaskServiceImpl.java |
| F6 | 部门负责人 SQL 返回任意用户 | MEDIUM | 新增 V16 migration 添加 leader_id 列，修复 CrossModuleMapper SQL | CrossModuleMapper.java, V16__add_department_leader.sql |
| F7 | Antd Select value=null 警告 | LOW | TaskForm.tsx: TaskStatus.NOT_STARTED → TaskStatus.PENDING | TaskForm.tsx |
| F8 | Antd Timeline deprecated props | LOW | ApprovalChainView.tsx: dot→icon, children→content | ApprovalChainView.tsx |
| F9 | Antd message 静态调用警告 | LOW | App.tsx 包裹 AntdApp 组件 | App.tsx |
| F10 | 计划表左侧列头显示错误 | MEDIUM | ScheduleView 第二列头 "状态"→"负责人 / 进度"，列宽 160→220px | ScheduleView.tsx, ScheduleView.module.css |

---

## 五、历史已修复问题（Sprint 1-7）

### 审批引擎
| # | 问题 | 修复版本 |
|---|------|---------|
| C-1 | 双路径回调重复执行 | Sprint 7 |
| A-1 | MILESTONE 重复注册 TaskApprovalCallback + MilestoneApprovalCallback | Sprint 6 |
| A-2 | stageGateId/approverId 未设为流程变量 | Sprint 6 |

### BOM 模块
| # | 问题 | 修复版本 |
|---|------|---------|
| C-2 | BOM 字段名 materialName vs name | Sprint 7 |
| C-3 | sourceType 枚举 MAKE/BUY/OUTSOURCE vs MADE/PURCHASED/SUBCONTRACT | Sprint 7 |
| C-4 | ChangeRequestModal 发送错误数据格式 | Sprint 7 |
| C-5 | applyAddItem 硬编码 level=1 | Sprint 7 |
| H-5 | ChangeApprovalService 与 BomChangeApprovalCallback 重复更新 CR status | Sprint 7 |
| H-6 | applyDeleteItem 不处理子节点 | Sprint 7 |

### Project 模块
| # | 问题 | 修复版本 |
|---|------|---------|
| C-6 | 前端缺少 startMilestone 调用 | Sprint 7 |
| P1 | addMember 发送 role 而非 projectRole | Sprint 6 |
| P3 | createProject 缺少必填 code 字段 | Sprint 6 |
| P4 | 项目状态比较 string vs number | Sprint 6 |
| P5 | 驳回/撤回状态不再永久取消项目 | Sprint 6 |

### Task 模块
| # | 问题 | 修复版本 |
|---|------|---------|
| T1 | getComments 返回 PageResult 但前端期望数组 | Sprint 6 |
| T2 | TaskStatistics 字段名完全不匹配 | Sprint 6 |
| T3 | status vs statuses 查询参数 | Sprint 6 |
| T4 | completeTask 乐观更新硬编码 status=4 | Sprint 6 |

### Dashboard 模块
| # | 问题 | 修复版本 |
|---|------|---------|
| D1 | 审批按钮传递 BusinessObject id 而非 Flowable taskId | Sprint 6 |
| D2 | 审批待办显示所有人而非当前用户 | Sprint 6 |
| D3 | ApprovalItem 字段名不匹配 | Sprint 6 |

---

## 六、遗留问题（待处理）

### 中优先级

| # | 问题 | 影响 |
|---|------|------|
| ~~R-7~~ | ~~前端任务计数限制 1000 条~~ — **Sprint 8 已修复**：pageSize 提升至 5000（useProjectActions.ts × 3，dashboard/index.tsx × 1） |
| R-8 | 硬编码 tenantId=1 | 多租户场景下所有审批都写入 tenant 1 |
| R-9 | 审批意见存储 approverId 而非姓名 | approver_name 列存数字 ID（crossModuleMapper.selectUserRealName 已缓解） |

### 低优先级

| # | 问题 |
|---|------|
| R-13 | ProcessRouteView 全部硬编码 mock 数据，无后端集成 |
| ~~R-14~~ | ~~exportBomData 为 no-op stub~~ — **Sprint 8 已修复**：直接从已加载的 flatItems 生成 CSV 下载 |
| R-15 | rollbackBomVersion 前端为 no-op（后端无回滚端点） |

---

## 七、数据一致性风险矩阵

| 场景 | 风险 | 当前保护 | 残余风险 |
|------|------|---------|---------|
| 审批回调重复执行 | 数据重复写入 | ApprovalEventListener 状态检查 + BomChangeApprovalCallback 幂等检查 | 低 |
| BOM 变更部分执行 | 数据不一致 | `@Transactional` on `onApproved()` — 任一步骤失败全部回滚 | 低 ✅ |
| 重复审批流程 | 多个 Flowable 实例竞争 | Sprint 8: WorkflowServiceImpl 应用层幂等检查 + V15 DB 唯一约束 | 低 ✅ |
| 任务完成后项目进度不更新 | 进度显示错误 | Sprint 8 已修复（直接完成+审批完成均调用 recalcProjectProgress） | 低 ✅ |
| StageGate 审批 ClassCastException | 审批流程崩溃 | Sprint 8 已修复 BPMN delegateExpression | 低 ✅ |
| 创建任务关联不存在项目 | 数据完整性破坏 | Sprint 8: createTask() 添加 projectId 存在性校验 | 低 ✅ |
| 部门负责人解析错误 | 审批分配给错误用户 | Sprint 8: CrossModuleMapper SQL 改用 leader_id | 低 ✅ |

---

## 八、前端 API 对齐状态

| 服务 | 后端端点 | 前端调用 | 状态 |
|------|---------|---------|------|
| project.service.ts | GET /api/projects | getProjects() | ✅ |
| project.service.ts | PUT /api/projects/milestones/{id}/start | startMilestone() | ✅ |
| project.service.ts | POST /api/projects/milestones/{id}/complete | completeMilestone() | ✅ |
| bom.service.ts | POST /api/boms/{id}/change-requests | createChangeRequest() | ✅ |
| bom.service.ts | GET /api/boms/{id}/compare | compareBomVersions() | ⚠️ stub |
| workflow.service.ts | GET /api/workflow/pending-tasks | getPendingTasks() | ✅ |
| task.service.ts | GET /api/tasks/statistics | getTaskStatistics() | ✅ |

---

## 九、下一步建议

1. **R-5/R-6 (中)**: Dashboard 查询优化，改为聚合 SQL，避免全表 selectList
2. **R-11 (低)**: BOM 版本历史链式查询 parentBomId，展示完整版本树
3. **R-12 (低)**: 实现 rollbackBomVersion 和 compareBomVersions 后端端点
4. **R-8 (低)**: 多租户支持，从 SecurityContext 读取 tenantId 替代硬编码
