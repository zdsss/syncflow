# SyncFlow 核心模块数据流审计报告

> 审计日期: 2026-05-11 | 范围: Project / Task / BOM + 审批引擎交互

---

## 一、审批引擎架构总览

### 回调路径

```
┌─────────────────────────────────────────────────────────────────┐
│                    Flowable BPMN Engine                         │
│                                                                 │
│  用户任务(approval) → 条件分支(approved/rejected)                │
│       ↓                    ↓                                    │
│  ServiceTask:           ServiceTask:                            │
│  approvalCallbackService  approvalCallbackService               │
│  .onApproved()          .onRejected()          ← 路径A (BPMN)  │
│       ↓                    ↓                                    │
│  ApprovalCallbackRegistry → domain handler                     │
└─────────────────────────────────────────────────────────────────┘
                           ↓ 流程结束
┌─────────────────────────────────────────────────────────────────┐
│  ApprovalEventListener                                          │
│  PROCESS_COMPLETED → callbackRegistry.onApproved() ← 路径B     │
│  PROCESS_CANCELLED → callbackRegistry.onWithdrawn()            │
└─────────────────────────────────────────────────────────────────┘
```

**已注册的回调处理器:**

| Handler | objectType | 模块 |
|---------|-----------|------|
| TaskApprovalCallback | TASK, ISSUE, RISK | syncflow-task |
| MilestoneApprovalCallback | MILESTONE | syncflow-project |
| BomApprovalCallback | BOM | syncflow-bom |
| BomChangeApprovalCallback | BOM_CHANGE | syncflow-bom |
| StageGateApprovalCallback | STAGE_GATE | syncflow-project |
| FileApprovalCallback | FILE | syncflow-file |
| ModuleSpecApprovalCallback | MODULE_SPEC | syncflow-config |
| ProcessRouteApprovalCallback | PROCESS_CHANGE | syncflow-process |

---

## 二、CRITICAL 级问题 (必须立即修复)

### C-1: 审批回调双路径导致重复执行 ⭐ 最严重

**问题**: GENERIC_APPROVAL 流程中，BPMN ServiceTask 和 ApprovalEventListener 都会触发 `callbackRegistry.onApproved()`，导致回调执行两次。

**影响链路**:
```
BPMN ServiceTask → ApprovalCallbackServiceImpl.onApproved()
                  → callbackRegistry.onApproved("TASK", taskId, approverId)
                  → TaskApprovalCallback.onApproved() [第一次: 标记完成]

流程结束 → ApprovalEventListener.onProcessCompleted()
         → callbackRegistry.onApproved("TASK", taskId, approverId)
         → TaskApprovalCallback.onApproved() [第二次: 幂等保护跳过]
```

**受影响场景**:
- **Task/Issue/Risk 完成审批**: `TaskApprovalCallback.onApproved()` 有幂等保护（检查COMPLETED状态），第二次调用安全跳过。**低风险**。
- **Milestone 完成审批**: `MilestoneApprovalCallback.onApproved()` 有幂等保护。**低风险**。
- **BOM 首次发布**: `BomApprovalCallback.onApproved()` 设置PUBLISHED状态，第二次设置approvedBy/approvedAt覆盖。**中风险**。
- **BOM 变更审批**: `BomChangeApprovalCallback.onApproved()` **没有幂等保护**，会执行两次 `applyChange()`！第二次会重复插入BOM物料。**极高风险**。

**文件位置**:
- `syncflow-java/syncflow-workflow/.../service/impl/ApprovalCallbackServiceImpl.java:28-39` — 路径A
- `syncflow-java/syncflow-workflow/.../listener/ApprovalEventListener.java:270-274` — 路径B
- `syncflow-java/syncflow-workflow/src/main/resources/processes/generic_approval.bpmn:16` — BPMN定义

**修复方案**: 在 ApprovalEventListener.onProcessCompleted() 中添加去重逻辑，如果 BPMN ServiceTask 已经处理过，则跳过。

---

### C-2: BOM 前端字段名与后端完全不匹配

**问题**: 前端使用 `materialName`，后端使用 `name`。BOM 页面所有物料名称显示 `undefined`。

**影响**:
- BOM 树节点显示空白名称
- BOM 表格名称列为空
- 创建物料时后端验证失败 (`@NotBlank name`)

**文件位置**:
- `src/pages/bom/index.tsx:21` — `materialName: string` (前端)
- `src/pages/bom/components/BomTree.tsx:27` — `item.materialName`
- `src/pages/bom/components/BomTable.tsx:41` — `dataIndex: 'materialName'`
- `syncflow-java/syncflow-bom/.../entity/BomItem.java:46` — `private String name` (后端)
- `syncflow-java/syncflow-bom/.../dto/BomItemTreeVO.java:36` — `private String name` (后端)

**修复方案**: 统一使用后端字段名 `name`，或在前端做映射。

---

### C-3: sourceType 枚举值前后端不匹配

**问题**: 前端使用 `MAKE/BUY/OUTSOURCE`，后端使用 `MADE/PURCHASED/SUBCONTRACT`。

**文件位置**:
- `src/pages/bom/components/BomTable.tsx:56-59` — 前端枚举
- `syncflow-java/syncflow-bom/.../enums/SourceType.java` — 后端枚举

**影响**: 所有来源类型标签显示原始枚举值而非中文。

---

### C-4: ChangeRequestModal 发送错误数据格式

**问题**: `ChangeRequestModal` 通过 `createBomItem` 发送变更请求，但发送的字段完全错误：

```typescript
// 当前发送 (错误):
{ materialName: description, quantity: 0, _changeType: changeType, _changeDescription: description }

// 后端 CreateBomItemDTO 期望:
{ name: "xxx", sourceType: "MADE", quantity: 1, ... }
```

**问题链路**:
1. `materialName` → 后端期望 `name`，验证失败
2. `_changeType` / `_changeDescription` → Jackson 忽略下划线前缀字段
3. `sourceType` 缺失 → `@NotBlank` 验证失败
4. 即使通过，changeData 只包含 `{materialName, quantity}`，回调 `applyAddItem()` 读取 `name` 为空

**文件位置**:
- `src/pages/bom/ChangeRequestModal.tsx:30-35`
- `syncflow-java/syncflow-bom/.../dto/CreateBomItemDTO.java`

**影响**: BOM 变更申请功能完全不可用。

---

### C-5: BomChangeApprovalCallback.applyAddItem 硬编码 level=1

**问题**: 审批通过后新增的 BOM 物料始终在根级别，不计算 path/levelNo/seqNo。

**文件位置**:
- `syncflow-java/syncflow-bom/.../service/impl/BomChangeApprovalCallback.java:115` — `item.setLevel(1)`

**对比**: `BomServiceImpl.addBomItem()` 正确计算所有树元数据。

**影响**: 审批通过的变更物料丢失树结构信息。

---

### C-6: 里程碑前端缺少 startMilestone 调用

**问题**: 后端有 `PUT /projects/milestones/{milestoneId}/start` 端点（status 1→2），但前端 `project.service.ts` 没有对应的 `startMilestone` 函数。

**文件位置**:
- `syncflow-java/syncflow-project/.../controller/prj/ProjectController.java:120-124` — 端点存在
- `src/services/project.service.ts` — 无 `startMilestone` 函数

**影响**: 里程碑创建后卡在 status=1（未开始），无法启动。用户只能通过 `completeMilestone` 跳过启动直接完成（如果 status 不校验的话）。

---

## 三、HIGH 级问题

### H-1: types.ts BomItem 类型与后端/主页双重不一致

**问题**: `src/pages/bom/types.ts` 使用旧字段名（`partNumber`, `supplier`, `parentName`），被 `UsageLookupView` 和 `BomCompareModal` 导入使用。

**文件位置**:
- `src/pages/bom/types.ts`
- `src/pages/bom/UsageLookupView.tsx:17` — `item.partNumber`
- `src/pages/bom/BomCompareModal.tsx:6-16`

---

### H-2: unit vs unitOfMeasure 命名不一致

**问题**: 后端 BomItem 使用 `unit`，前端 types.ts 使用 `unitOfMeasure`。

---

### H-3: 项目状态创建后无法变更

**问题**: 后端无项目状态更新端点（只有 CRUD），项目创建后状态固定。

---

### H-4: 审批失败时部分应用风险

**问题**: `BomChangeApprovalCallback.onApproved()` 中，`applyChange()` 可能部分执行（如 ADD_ITEM 成功但 UPDATE_ITEM 失败），导致数据不一致。

**文件位置**: `syncflow-java/syncflow-bom/.../service/impl/BomChangeApprovalCallback.java:48-58`

---

### H-5: ChangeApprovalService 与 BomChangeApprovalCallback 重复更新 ChangeRequest

**问题**: 两个类都尝试将 CR status 设为 2(applied)，导致重复更新。

**文件位置**:
- `syncflow-java/syncflow-workflow/.../service/ChangeApprovalService.java:79` — 设 status=2
- `syncflow-java/syncflow-bom/.../service/impl/BomChangeApprovalCallback.java:50` — 也设 status=2

---

### H-6: BOM 变更 DELETE_ITEM 不处理子节点

**问题**: `BomChangeApprovalCallback.applyDeleteItem()` 只删除单个物料，不级联删除子节点。而 `BomServiceImpl.deleteBomItem()` 正确处理级联删除。

**文件位置**: `syncflow-java/syncflow-bom/.../service/impl/BomChangeApprovalCallback.java:140-144`

---

## 四、MEDIUM 级问题

### M-1: 版本历史只显示单条记录

`getVersionHistory(bomId)` 只查当前 BOM 行的版本，不通过 `parentBomId` 链式查询完整历史。

### M-2: rollbackBomVersion / compareBomVersions 为 no-op

前端 stub 返回空 Promise，功能不可用。

### M-3: BomCompareModal props 不匹配

`bomId` vs `projectId`、`string` vs `number` 类型不匹配。

### M-4: ProcessRouteView 全部硬编码 mock 数据

无后端集成，纯静态 UI 占位。

### M-5: exportBomData 为 no-op

导出按钮不产生任何输出。

### M-6: 前端 BOM 页面无独立 Store

所有 BOM 状态通过 `useAsyncData` hooks 管理，无集中式状态管理。

---

## 五、数据流验证路径

### 路径 1: Project → Task → Milestone 全链路

```
创建Project → GET/POST /api/projects
  ↓
创建Phase → POST /api/projects/{id}/phases
  ↓
创建Milestone → POST /api/projects/{id}/milestones (status=1)
  ↓ ⚠️ 缺少前端 startMilestone 调用
启动Milestone → PUT /api/projects/milestones/{id}/start (status=1→2)
  ↓
创建Task (关联milestone) → POST /api/tasks
  ↓
完成Task → PUT /api/tasks/{id}/complete
  ↓ (如果需要审批)
审批Task → GENERIC_APPROVAL → TaskApprovalCallback.onApproved()
  ↓ ⚠️ 双路径回调(但有幂等保护)
  ↓
完成Milestone → POST /api/projects/milestones/{id}/complete
  ↓ (如果有deliverable)
审批Milestone → GENERIC_APPROVAL → MilestoneApprovalCallback.onApproved()
```

### 路径 2: BOM 创建 → 审批 → 发布

```
创建BOM → POST /api/boms (status=EDITING)
  ↓
添加物料 → POST /api/boms/{id}/items
  ↓ ⚠️ 字段名不匹配(materialName vs name)
提交审批 → POST /api/boms/{id}/submit-approval (status=PENDING_APPROVAL)
  ↓
审批流程 → BOM_APPROVAL
  ↓
审批通过 → BomApprovalCallback.onApproved() (status=PUBLISHED)
```

### 路径 3: BOM 变更请求 (最关键的跨模块交互)

```
编辑已发布BOM → ensureBomEditable() → ChangeApprovalInterceptor.intercept()
  ↓
创建ChangeRequest → wf_change_request 表
  ↓
启动CHANGE_APPROVAL流程 → 3级审批(影响评估→技术审核→项目经理)
  ↓
审批通过 → ChangeApprovalService.execute()
  ↓
  → callbackRegistry.onApproved("BOM_CHANGE", cr.objectId, approverId)
  → BomChangeApprovalCallback.onApproved()
  → applyChange(cr) → 解析changeData → 执行ADD/UPDATE/DELETE
  ↓ ⚠️ 双路径回调: ApprovalEventListener 也会触发一次
  ↓ ⚠️ applyAddItem 硬编码 level=1
  ↓ ⚠️ changeData 字段名错误(materialName vs name)
更新CR状态 → status=2(applied)
```

### 路径 4: Task 完成审批交互

```
完成Task(milestone/issue/risk类型) → completeTask()
  ↓
检查是否需要审批 → startProcess("GENERIC_APPROVAL", taskId, taskType)
  ↓
Task状态 → PENDING_REVIEW(3)
  ↓
审批流程 → GENERIC_APPROVAL → 单级审批
  ↓
审批通过 → BPMN ServiceTask → TaskApprovalCallback.onApproved()
  ↓ (同时)
  → ApprovalEventListener.onProcessCompleted() → callbackRegistry.onApproved()
  ↓ ⚠️ 双路径(有幂等保护)
Task状态 → COMPLETED(4)
```

---

## 六、修复优先级建议

| 优先级 | 问题 | 预计工作量 |
|--------|------|-----------|
| P0 | C-1 审批回调双路径去重 | 2h |
| P0 | C-2 BOM 字段名统一 | 3h |
| P0 | C-3 sourceType 枚举统一 | 1h |
| P0 | C-4 ChangeRequestModal 重写 | 2h |
| P1 | C-5 applyAddItem 树元数据计算 | 2h |
| P1 | C-6 前端添加 startMilestone | 1h |
| P1 | H-4 applyChange 事务原子性 | 2h |
| P1 | H-5 去除重复 CR 状态更新 | 1h |
| P1 | H-6 applyDeleteItem 级联删除 | 1h |
| P2 | H-1~H-3 类型/字段对齐 | 3h |
| P3 | M-1~M-6 中等优先级修复 | 5h |

**总预估: ~23h**

---

## 七、已验证正常的部分

✅ 审批引擎核心架构（ApprovalCallbackRegistry 模式）设计良好
✅ 任务状态机完整覆盖所有转换路径
✅ BOM 树结构构建逻辑正确（parentId + path + levelNo）
✅ BOM-Project 关联查询链路正确
✅ 版本控制 saveVersion 正确复制物料
✅ 前端 API 路径大部分已对齐
✅ Task/Milestone/BOM 首次发布审批回调有幂等保护
✅ CHANGE_APPROVAL BPMN 流程设计合理（3级审批）
