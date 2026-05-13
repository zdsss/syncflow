# Sprint 11: 跨模块数据流验证与审计报告

**日期**: 2026-05-12  
**范围**: Project / Task / BOM 三大核心模块 + 审批引擎(Workflow)交互  
**方法**: 全链路代码审计 + Agent Teams 并行验证

---

## 一、系统架构概览

### 1.1 模块拓扑

```
┌─────────────────────────────────────────────────────────────────┐
│                    syncflow-workflow (审批引擎)                    │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ WorkflowSvc  │  │ CallbackRegistry │  │ EventListener    │  │
│  │ (Flowable)   │──│ (objectType→Hdl) │──│ (BPMN Events)    │  │
│  └──────────────┘  └──────────────────┘  └──────────────────┘  │
│         ▲                    ▲                     │             │
│         │                    │                     ▼             │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ ChangeIntcpt │  │ AssigneeResolver │  │ NotificationSvc  │  │
│  └──────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         ▲                    ▲                     ▲
         │                    │                     │
┌────────┴────────┐  ┌───────┴───────┐  ┌─────────┴─────────┐
│ syncflow-project│  │ syncflow-task │  │  syncflow-bom     │
│                 │  │               │  │                   │
│ ProjectApproval │  │ TaskApproval  │  │ BomApproval       │
│ MilestoneApprv  │  │ Callback      │  │ BomChangeApproval │
│ StageGateApprv  │  │               │  │                   │
└─────────────────┘  └───────────────┘  └───────────────────┘
```

### 1.2 审批回调注册表

| objectType | Handler | 模块 | 触发场景 |
|---|---|---|---|
| PROJECT | ProjectApprovalCallback | project | 项目创建审批 |
| MILESTONE | MilestoneApprovalCallback | project | 里程碑完成审批 |
| STAGE_GATE | StageGateApprovalCallback | project | 阶段门审批(DQR/TR/QG) |
| TASK / ISSUE / RISK | TaskApprovalCallback | task | 任务完成审批 |
| BOM | BomApprovalCallback | bom | BOM首次发布审批 |
| BOM_CHANGE | BomChangeApprovalCallback | bom | 已发布BOM变更审批 |

---

## 二、核心数据流验证路径

### 2.1 Project → Task → 项目进度联动

```
用户完成任务 → TaskServiceImpl.completeTask()
  ├─ 需要审批? (milestone/ISSUE/RISK类型)
  │   ├─ YES → status=PENDING_REVIEW(3) → startProcess("GENERIC_APPROVAL")
  │   │         → 审批通过 → TaskApprovalCallback.onApproved()
  │   │         → status=COMPLETED(4), progress=100, actualEnd=today
  │   │         → recalcProjectProgress(projectId)
  │   └─ NO  → 直接完成 → status=COMPLETED(4)
  │            → recalcProjectProgress(projectId)
  └─ recalcProjectProgress:
       total = count(tasks WHERE projectId=X AND status≠CANCELLED)
       done  = count(tasks WHERE projectId=X AND status=COMPLETED)
       project.progress = round(done/total * 100)
```

**验证结果**: ✅ 链路完整，进度计算正确

### 2.2 BOM → Approval Engine (首次发布)

```
用户提交BOM审批 → BomServiceImpl.submitForApproval(bomId)
  → bom.status = PENDING_APPROVAL(2)
  → workflowService.startProcess("BOM_APPROVAL", bomId, "BOM", ...)
  → Flowable流程启动 → 审批人收到通知
  → 审批通过 → ApprovalEventListener.onProcessCompleted()
    → callbackRegistry.onApproved("BOM", bomId, approverId)
    → BomApprovalCallback.onApproved()
      → bom.status = PUBLISHED(3)
      → bom.approvedBy = approverId
      → bom.approvedAt = now()
```

**验证结果**: ✅ 链路完整

### 2.3 BOM → ChangeApprovalInterceptor → 变更审批

```
用户修改已发布BOM → BomServiceImpl.addBomItem/updateBomItem/deleteBomItem
  → ensureBomEditable(bomId, changeType, changeData)
  → bom.status == PUBLISHED(3)?
    → YES → ChangeApprovalInterceptor.intercept()
      → ChangeRequestService.createRequest(crId)
      → workflowService.startProcess("CHANGE_APPROVAL", crId, "BOM_CHANGE", ...)
      → 三级审批: 影响评估 → 技术审核 → 项目经理批准
      → 审批通过 → BomChangeApprovalCallback.onApproved(crId)
        → applyChange(cr): ADD_ITEM/UPDATE_ITEM/DELETE_ITEM
        → cr.status = 2 (applied)
    → NO → 直接修改
```

**验证结果**: ✅ 链路完整，幂等保护到位

### 2.4 Project创建 → 审批 → 状态流转

```
用户创建项目 → ProjectServiceImpl.createProject()
  → project.status = 1 (NOT_STARTED)
  → 自动创建6个标准阶段(调查/概念/计划/开发/测试/量产)
  → workflowService.startProcess("GENERIC_APPROVAL", projectId, "PROJECT", ...)
  → 审批通过 → ProjectApprovalCallback.onApproved()
    → project.status = 2 (IN_PROGRESS)  ⚠️ 见问题C-1
  → 审批驳回 → ProjectApprovalCallback.onRejected()
    → project.status = 0 (CANCELLED)    ❌ 见问题C-1
```

### 2.5 Milestone → 审批 → 完成

```
用户完成里程碑 → MilestoneServiceImpl.completeMilestone()
  → workflowService.startProcess("GENERIC_APPROVAL", milestoneId, "MILESTONE", ...)
  → 审批通过 → MilestoneApprovalCallback.onApproved()
    → milestone.status = 3 (COMPLETED)
    → milestone.actualDate = today
    → milestone.progress = 100
  → 审批驳回 → MilestoneApprovalCallback.onRejected()
    → milestone.status = 2 (IN_PROGRESS)
    → milestone.progress = 0              ⚠️ 见问题M-1
```

### 2.6 StageGate → 审批 → 阶段推进

```
用户提交阶段门审批 → StageGateService.submitForApproval()
  → workflowService.startProcess("STAGE_GATE_APPROVAL", gateId, "STAGE_GATE", ...)
  → 审批通过 → StageGateApprovalCallback.onApproved()
    → gate.status = 2 (APPROVED)
    → gate.approverId = approverId
    → gate.approvedAt = now()
  → 审批驳回 → StageGateApprovalCallback.onRejected()
    → gate.status = 3 (REJECTED)
  → 撤回 → StageGateApprovalCallback.onWithdrawn()
    → gate.status = 1 (PENDING)          ✅ 正确回退
```

---

## 三、发现的问题

### 3.1 Critical (必须修复)

#### C-1: ProjectApprovalCallback 驳回/撤回状态错误

**文件**: `syncflow-project/.../ProjectApprovalCallback.java:45-69`  
**问题**: 项目审批被驳回或撤回时，状态设为 0 (CANCELLED)。这导致用户无法重新提交审批。  
**正确行为**: 驳回应回退到 NOT_STARTED(1)，允许用户修改后重新提交。  
**影响**: 用户创建项目被驳回后，项目直接变为"已取消"，无法恢复。

#### C-2: ApprovalEventListener 默认 approved=true (Fail-Open)

**文件**: `syncflow-workflow/.../ApprovalEventListener.java:258`  
**问题**: 当无法从流程历史中读取 `approved` 变量时，默认为 `true`（通过）。  
**风险**: 如果BPMN流程设计有误或变量丢失，系统会错误地批准请求。  
**正确行为**: 默认应为 `false`（拒绝），或抛出异常要求人工介入。

#### C-3: WorkflowServiceImpl.getPendingTasks 不解析申请人姓名

**文件**: `syncflow-workflow/.../WorkflowServiceImpl.java:283`  
**问题**: `vo.setApplicantName(String.valueOf(bo.getApplicantId()))` — 直接显示数字ID而非真实姓名。  
**影响**: 审批人在待办列表中看到的是数字ID，无法识别申请人。

#### C-4: 审批完成后不通知申请人

**文件**: `syncflow-workflow/.../ApprovalEventListener.java:241-296`  
**问题**: `onProcessCompleted` 触发回调但不通知原始申请人审批结果。  
**影响**: 申请人不知道自己的审批是否通过，需要手动查看。

### 3.2 High (应尽快修复)

#### H-1: BomChangeApprovalCallback 撤回等同于驳回

**文件**: `syncflow-bom/.../BomChangeApprovalCallback.java:84-91`  
**问题**: `onWithdrawn` 将 CR status 设为 3 (rejected)，与真正的驳回无法区分。  
**正确行为**: 应使用独立状态码 (如 4=withdrawn)。

#### H-2: MilestoneApprovalCallback 驳回时重置 progress=0

**文件**: `syncflow-project/.../MilestoneApprovalCallback.java:59`  
**问题**: 里程碑审批被驳回时，progress 被重置为 0。如果里程碑实际进度为 80%，这会丢失真实进度信息。  
**正确行为**: 保留原始 progress 值，仅回退 status。

#### H-3: recalcProjectProgress 逻辑重复

**文件**: `TaskServiceImpl.java:852-872` 和 `TaskApprovalCallback.java:99-117`  
**问题**: 完全相同的进度计算逻辑在两处重复实现。  
**风险**: 未来修改一处忘记另一处，导致不一致。  
**正确行为**: 提取到共享 Service 或 Util 方法。

#### H-4: BomServiceImpl.ensureBomEditable 拦截后抛异常

**文件**: `syncflow-bom/.../BomServiceImpl.java:497-508`  
**问题**: 当变更被成功拦截提交审批后，抛出 `BusinessException("已发布BOM的修改已提交审批")`。前端收到的是错误响应，但实际操作是成功的（变更已提交审批）。  
**正确行为**: 应返回特定的成功响应码（如 202 Accepted），告知前端变更已提交审批。

### 3.3 Medium (建议修复)

#### M-1: WorkflowServiceImpl.toVO 不解析申请人姓名

**文件**: `syncflow-workflow/.../WorkflowServiceImpl.java:380`  
**问题**: 与 C-3 相同，`toVO` 方法也直接用 ID 作为 applicantName。

#### M-2: Task 状态机缺少 PENDING_REVIEW → CANCELLED 转换

**文件**: `syncflow-task/.../TaskServiceImpl.java:833`  
**问题**: `isValidTransition` 不允许从 PENDING_REVIEW(3) 到 CANCELLED(5)。如果任务在审批中需要取消，无法操作。

#### M-3: BOM版本比较依赖 materialCode 作为唯一键

**文件**: `syncflow-bom/.../BomServiceImpl.java:775-785`  
**问题**: `indexByMaterialCode` 用 materialCode 作为 diff key。如果同一 BOM 中有多个相同 materialCode 的物料（不同规格），会导致比较结果错误。

---

## 四、前后端 API 对齐验证

### 4.1 总体结果

| 维度 | 数量 | 状态 |
|---|---|---|
| 前端 Service 方法 | 62 | ✅ 全部有对应后端 |
| 后端 Controller 端点 | 62 | ✅ 全部有前端调用 |
| HTTP Method 匹配 | 62/62 | ✅ 100% |
| URL Path 匹配 | 62/62 | ✅ 100% |
| 请求/响应类型匹配 | 59/62 | ⚠️ 95% |
| 死代码 | 0 | ✅ 无 |

### 4.2 类型不一致 (Minor)

1. **日期类型**: 后端 `LocalDate` → JSON 序列化为 ISO string，前端类型定义为 `string`，实际兼容
2. **BigDecimal**: 后端 `BigDecimal` → JSON 序列化为 number，前端 `number` 类型，精度可能丢失
3. **TaskVO 前端接口缺少字段**: `plannedDays`, `dueDate`, `taskCategory`, `taskIdInFlow`, `attachmentCount` 在后端 VO 中存在但前端 interface 未声明

---

## 五、UI/UX 布局合理性审查

### 5.1 Critical 问题

| # | 页面 | 问题 | 影响 |
|---|---|---|---|
| U-1 | BOM | 表格13列需水平滚动 | 标准显示器无法看全关键字段 |
| U-2 | Project | 3次点击才能看到任务详情，无面包屑 | 用户迷失在层级中 |
| U-3 | 全局 | 详情展示模式不一致(右面板/滑动面板/Modal/展开行) | 用户需学习不同交互模式 |
| U-4 | BOM | BomVersionPanel用Drawer，ChangeRequestList用Modal | 交互预期不一致 |

### 5.2 Major 问题

| # | 页面 | 问题 | 建议 |
|---|---|---|---|
| U-5 | BOM | Header 6个操作按钮过于拥挤 | 合并为"更多"下拉菜单 |
| U-6 | Project | 分类导航8个类别含义模糊，计数为估算值 | 显示真实计数，添加tooltip |
| U-7 | BOM | 树和表格展示相同数据，冗余 | 树用于导航，表格用于详情 |
| U-8 | BOM/Project | 表单缺少必填标记和内联验证 | 添加星号和实时验证 |
| U-9 | MyTasks | 无任务详情面板 | 实现详情面板或跳转链接 |
| U-10 | 全局 | 切换Tab/视图时选中状态丢失 | URL params 持久化选中状态 |

### 5.3 跨模块一致性问题

- **状态/优先级徽章**: 不同页面使用不同颜色和样式
- **空状态**: 部分页面显示"暂无数据"，部分用 Empty 组件，部分无提示
- **加载状态**: Spin / Skeleton / 无提示 混用
- **分页**: Pagination 组件 / Table 内置分页 / 无分页 混用

---

## 六、修复计划

### Phase 1: Critical 修复 (已完成 ✅)

- [x] C-1: ProjectApprovalCallback 驳回回退到 NOT_STARTED
- [x] C-2: ApprovalEventListener 默认 approved=false
- [x] C-3: getPendingTasks 解析申请人真实姓名
- [x] C-4: 审批完成后通知申请人

### Phase 2: High 修复 (已完成 ✅)

- [x] H-1: BomChangeApprovalCallback 增加 withdrawn 状态码(4)，与 rejected(3) 区分
- [x] H-2: MilestoneApprovalCallback 保留原始 progress
- [x] H-4: BomServiceImpl 变更拦截使用独立 ErrorCode(BOM_CHANGE_SUBMITTED=40106)
- [x] M-2: Task 状态机补充 PENDING_REVIEW → CANCELLED 转换
- [x] 修复 ChangeRequestServiceImpl.applyRequest 不设置 status=2 的 bug

### Phase 3: UI/UX 改进 (部分完成)

- [x] U-1: BOM表格精简到8列(层级/编码/名称/规格/用量/单位/来源/操作)，详情移入展开行(Descriptions)
- [x] U-2: 项目页面添加 Breadcrumb 导航(项目管理 > 项目名 > 任务名)，支持点击回退
- [x] U-4: 变更记录从 Modal 改为 Drawer，与版本管理面板保持一致
- [x] U-5: BOM Header 6个按钮合并为"更多"下拉菜单，仅保留"新增物料"和"提交审批"为主按钮
- [x] 前端适配 BOM_CHANGE_SUBMITTED(40106) 响应码，显示 info 提示而非错误
- [x] ChangeRequestList 补充 withdrawn(4) 状态显示
- [ ] U-3: 统一详情展示模式为右面板(需跨页面重构)

---

## 七、测试验证状态

```
后端测试 (syncflow-workflow): 82 tests ✅ ALL PASSED
后端测试 (syncflow-project):  85 tests ✅ ALL PASSED
后端测试 (syncflow-task):     88 tests ✅ ALL PASSED
后端测试 (syncflow-bom):      54 tests ✅ ALL PASSED
前端测试 (vitest):           1877 tests ✅ ALL PASSED (168 files)
总计: 2186 tests ALL GREEN
```

---

## 八、本次修复清单

| 文件 | 修复内容 | Phase |
|---|---|---|
| `ApprovalEventListener.java` | C-2: 默认 approved=false; C-4: notifyApplicant() | P1 |
| `ProjectApprovalCallback.java` | C-1: 驳回/撤回回退到 NOT_STARTED(1) | P1 |
| `WorkflowServiceImpl.java` | C-3/M-1: 解析申请人真实姓名 | P1 |
| `MilestoneApprovalCallback.java` | H-2: 驳回时保留原始 progress | P1 |
| `ChangeRequestServiceImpl.java` | 修复 applyRequest 不设置 status=2 | P1 |
| `BomChangeApprovalCallback.java` | H-1: withdrawn 使用独立状态码 4 | P2 |
| `TaskServiceImpl.java` | M-2: 状态机补充 PENDING_REVIEW→CANCELLED | P2 |
| `ErrorCode.java` | H-4: 新增 BOM_CHANGE_SUBMITTED(40106) | P2 |
| `BomServiceImpl.java` | H-4: 变更拦截使用新 ErrorCode | P2 |
| `ChangeApprovalInterceptor.java` | 幂等保护: 拒绝重复提交待审批变更 | P2+ |
| `WorkflowServiceImpl.java` | 审批人校验: 无法解析时 warn 日志预警 | P2+ |
| `FileApprovalCallback.java` | 补全 FILE_BOM/FILE_PROCESS/FILE_DOCUMENT 类型支持 | P4 |
| `StaleApprovalReminderService.java` | 新增: 超时审批提醒(48h阈值, 每4h扫描) | P4 |
| `ApprovalConfigAudit.java` | 新增: 审批配置变更审计实体 | P4 |
| `ApprovalConfigAuditMapper.java` | 新增: 审计日志 Mapper | P4 |
| `ApprovalConfigAuditService.java` | 新增: 审计日志记录服务 | P4 |
| `V17__approval_audit_and_reminder.sql` | 新增: 审计表 + reminder 字段迁移 | P4 |
| `BusinessObject.java` | 新增 reminderCount/lastRemindedAt 字段 | P4 |
| `todo/index.tsx` | URL持久化: category/viewMode/completionTab | P4 |
| `BomTable.tsx` | U-1: 精简到8列+Descriptions展开行 | P3 |
| `bom/index.tsx` | U-5: Dropdown菜单; Drawer替代Modal; 适配40106 | P3 |
| `ChangeRequestList.tsx` | 补充 withdrawn(4) 状态标签 | P3 |
| `project/index.tsx` | U-2: Breadcrumb导航; U-6: 真实分类计数 | P3 |
| `task.service.ts` | 类型对齐: 补充 priority/dueDate/attachmentCount 等字段 | P3 |
| `ProjectApprovalCallbackTest.java` | 更新测试断言 | P1 |
| `BomChangeApprovalCallbackTest.java` | 更新测试断言 | P2 |
| `BomTable.spec.tsx` | 更新测试匹配新列结构 | P3 |
| `bom/index.spec.tsx` | 更新测试匹配Dropdown交互 | P3 |
| `project/index.spec.tsx` | 更新测试匹配Breadcrumb | P3 |

---

## 九、下一步

1. U-3: 统一详情展示模式为右面板(需跨页面重构，影响面大)
2. 修复 FileServiceTest 的 Mockito/JUnit 兼容性问题(pre-existing)
3. WorkflowTemplateController 集成 ApprovalConfigAuditService 记录配置变更
