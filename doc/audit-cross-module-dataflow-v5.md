# SyncFlow 跨模块数据流审计报告 v5

> **审计日期**：2026-05-12  
> **审计范围**：Admin + Project + Task + Workflow（前三模块 + 审批引擎）  
> **审计方法**：3 并行 Agent（后端数据流 / 前端API对齐 / UI/UX布局）  
> **测试验证**：255 后端测试 + 1854 前端测试 全部通过

---

## 一、模块间数据流拓扑

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (React 19)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │AuthStore │  │ProjectSt │  │ TaskStore│  │ WorkflowStore    │   │
│  │login/me  │  │tree/phase│  │CRUD/stat │  │ pending/approve  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│       │              │              │                  │             │
│  auth.service  project.service  task.service  workflow.service      │
└───────┼──────────────┼──────────────┼─────────────────┼─────────────┘
        │              │              │                  │
   /api/auth      /api/projects   /api/tasks        /api/wf
        │              │              │                  │
┌───────┼──────────────┼──────────────┼─────────────────┼─────────────┐
│       ▼              ▼              ▼                  ▼             │
│  ┌─────────┐   ┌──────────┐   ┌─────────┐   ┌──────────────────┐  │
│  │  Admin  │   │ Project  │   │  Task   │   │    Workflow      │  │
│  │AuthCtrl │   │ProjectCtrl│  │TaskCtrl │   │WorkflowCtrl     │  │
│  │UserCtrl │   │          │   │DepCtrl  │   │ApprovalConfigCtrl│  │
│  └────┬────┘   └────┬─────┘   └────┬────┘   └────────┬─────────┘  │
│       │              │              │                  │             │
│       ▼              ▼              ▼                  ▼             │
│  ┌─────────┐   ┌──────────┐   ┌─────────┐   ┌──────────────────┐  │
│  │AuthSvc  │   │ProjectSvc│   │TaskSvc  │   │WorkflowSvc      │  │
│  │UserSvc  │   │MileSvc   │   │DepSvc   │   │CallbackRegistry │  │
│  └─────────┘   └──────────┘   └─────────┘   │AssigneeResolver │  │
│                      │              │         │EventListener    │  │
│                      │              │         └──────────────────┘  │
│                      │              │                  ▲             │
│                      │              ├──────────────────┘             │
│                      ├──────────────┘ (startProcess)                │
│                      │                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL 16                              │   │
│  │  sys_user  prj_project  tsk_task  wf_business_object        │   │
│  │  sys_role  prj_phase    tsk_comment  wf_approval_config     │   │
│  │  sys_dept  prj_milestone tsk_activity  wf_delegation        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 二、核心验证路径

### 路径 1：用户认证 → 项目创建 → 审批触发

```
1. POST /api/auth/login
   → AuthService.login() → JWT token 生成
   → 前端 useAuthStore.loginAsync() 存储 token + user

2. POST /api/projects (携带 JWT)
   → ProjectService.createProject() [@Transactional]
   → 插入 prj_project + 6 个 prj_phase
   → WorkflowService.startProcess("GENERIC_APPROVAL", projectId, "PROJECT", ...)
   → 创建 wf_business_object (status=2 PENDING)
   → Flowable 引擎启动流程实例

3. 审批人解析
   → ApprovalAssigneeResolver.resolveAssignees()
   → 查询 wf_approval_config 获取规则
   → 按 ruleType 分发: PROJECT_ROLE / USER / DEPARTMENT / DYNAMIC

4. 审批完成回调
   → ApprovalEventListener.onProcessCompleted()
   → ApprovalCallbackRegistry.onApproved("PROJECT", projectId, approverId)
   → ProjectApprovalCallback.onApproved() → project.status = 2 (in_progress)
```

### 路径 2：任务创建 → 完成 → 审批 → 项目进度更新

```
1. POST /api/tasks
   → TaskService.createTask() → 插入 tsk_task
   → 自动生成 task_no (日期+序号)
   → 记录 tsk_task_activity (CREATE)

2. PUT /api/tasks/{id}/complete
   → TaskService.completeTask()
   → 判断是否需要审批 (MILESTONE/ISSUE/RISK 类型或关联里程碑)

   [需要审批]:
   → task.status = 3 (PENDING_REVIEW)
   → WorkflowService.startProcess("GENERIC_APPROVAL", taskId, task.type, ...)
   → applicantId = SecurityUtils.getUserId() (当前操作人)
   → 创建 wf_business_object, 关联 flowInstanceId 回写到 task

   [不需要审批]:
   → task.status = 4 (COMPLETED), progress = 100
   → recalcProjectProgress(projectId)

3. 审批通过回调
   → TaskApprovalCallback.onApproved(taskId, approverId)
   → task.status = 4, progress = 100, actualEnd = today
   → recalcProjectProgress(projectId)
   → 进度公式: done(COMPLETED + PENDING_REVIEW) / total(非CANCELLED)

4. 前端响应
   → useTaskStore 乐观更新 task status/progress
   → 触发 useProjectStore.fetchProjectById() 刷新项目进度
```

### 路径 3：里程碑完成 → 独立审批路径

```
1. POST /api/projects/milestones/{id}/complete
   → MilestoneService.completeMilestone()
   → milestone.status = 3 (completed) 或触发审批

2. 审批回调 (objectType = "MILESTONE")
   → MilestoneApprovalCallback.onApproved(milestoneId, approverId)
   → milestone.status = 3, actualDate = today, progress = 100
   ⚠️ 注意: 此路径与 TaskApprovalCallback 已解耦
      (本次修复移除了 TaskApprovalCallback 对 "MILESTONE" 的注册)
```

### 路径 4：阶段门审批 → 项目阶段推进

```
1. 阶段门触发
   → ProjectService 或手动触发 StageGate 审批
   → WorkflowService.startProcess("GENERIC_APPROVAL", stageGateId, "STAGE_GATE", ...)

2. 审批回调
   → StageGateApprovalCallback.onApproved()
   → stageGate.status = APPROVED
   → 可触发下一阶段开始
```

### 路径 5：变更审批 → 拦截器模式

```
1. 变更拦截
   → ChangeApprovalInterceptor 拦截特定操作
   → 创建 ChangeRequest 记录
   → 启动 CHANGE_APPROVAL 流程

2. 审批回调
   → ChangeRequestApprovalCallback.onApproved()
   → 执行原始变更操作
   → 更新 ChangeRequest 状态
```

---

## 三、本次审计发现的问题及修复

### CRITICAL 级别（已修复）

| # | 问题 | 影响 | 修复 |
|---|------|------|------|
| 1 | MILESTONE objectType 回调冲突 | TaskApprovalCallback 和 MilestoneApprovalCallback 都注册了 "MILESTONE"，Spring bean 加载顺序不确定导致回调错乱 | 从 TaskApprovalCallback 移除 "MILESTONE"，仅保留 "TASK", "ISSUE", "RISK" |
| 2 | 前端 useTaskStore.completeTask 重复触发 workflow | 后端 completeTask 已启动审批流程，前端又调用 startWorkflow，导致双重流程实例 | 移除前端 startWorkflow 调用，完全由后端控制 |
| 3 | Mock 响应结构与后端不一致 | login 返回 `{user: obj}` 而非扁平 LoginVO；/auth/me 返回 `{user, team}` 而非 UserVO | 修正 mock 结构对齐后端 |
| 4 | Mock 响应 code:0 vs 后端 code:200 | 所有 mock 使用错误的成功码 | 全局替换为 code:200 |
| 5 | ApprovalCallbackRegistry 对未知类型抛异常 | 工作流回调中抛异常会导致 Flowable 流程卡死 | 改为 log.error + 返回 null（优雅降级） |
| 6 | 双回调风险 (EventListener + BPMN ServiceTask) | 两条路径都触发回调导致实体状态双重更新 | ApprovalCallbackServiceImpl 添加幂等守卫（检查 BO status=2） |
| 7 | 项目删除不保护活跃任务和审批 | 删除项目后任务和审批记录成为孤儿 | 添加 active tasks + pending approvals 前置检查 |

### MAJOR 级别（已修复）

| # | 问题 | 影响 | 修复 |
|---|------|------|------|
| 6 | ApprovalAssigneeResolver DEPARTMENT 规则传入 projectId 而非 applicantId | APPLICANT_DEPT 规则永远解析失败 | 修正参数为 applicantId |
| 7 | TaskServiceImpl 进度公式与 TaskApprovalCallback 不一致 | 直接完成 vs 审批完成计算出不同进度 | 统一为 COMPLETED + PENDING_REVIEW 都算 done |
| 8 | ProjectServiceImpl.updateProjectStatus 无验证 | 可设置任意整数为状态 | 添加 1-5 范围校验 |
| 9 | TaskServiceImpl.completeTask 用 assigneeId 作为 applicantId | 代操作时审批申请人错误 | 改用 SecurityUtils.getUserId() |
| 10 | completeTask 固定传 objectType="TASK" | ISSUE/RISK 类型任务回调路由错误 | 改用 task.getType() |
| 11 | ProjectServiceImpl.createProject 无 @Transactional | 阶段插入失败时项目已提交 | 添加 @Transactional |
| 12 | SlidePanel 传 size={width} 给 Drawer | Ant Design Drawer 的 size 只接受 'default'/'large' | 改为 width={width} |
| 13 | Header 组件未集成到 AppLayout | 通知、搜索、用户信息不可见 | 在 AppLayout 中渲染 Header |
| 14 | Sidebar 无 ARIA 属性 | 屏幕阅读器无法识别导航 | 添加 aria-label, aria-current, role, tabIndex |

### 遗留问题（未修复，需后续处理）

| # | 问题 | 严重度 | 建议 |
|---|------|--------|------|
| 1 | 软删除用户不清理项目成员/任务分配/委托 | MAJOR | 添加 UserDeletionListener 清理关联数据 |
| 2 | wf_business_object 无 FK 约束 | MAJOR | 添加 FK 到 sys_user 和 prj_project |
| 3 | tsk_task_dependency 无 FK 约束 | MAJOR | 添加 FK 到 tsk_task |
| 4 | generateTaskNo() 竞态条件 | MINOR | 使用 biz_code_sequence 表的原子递增 |
| 5 | 前端 auth.service 8 个端点无后端实现 | MAJOR | 后端实现 register/forgot-password/reset-password/profile/api-keys |
| 6 | TaskActivity 前端展示逻辑需适配 | MINOR | 前端组件需用 fieldName/oldValue/newValue 渲染变更详情 |
| 7 | 响应式布局缺失 (hardcoded marginLeft:60px) | P0 | 添加 sidebar 折叠机制 |
| 8 | 三种不同的任务详情模式 (Todo/Project/MyTasks) | P0 | 统一为共享 TaskDetailDrawer 组件 |

---

## 四、UI/UX 审计摘要

### 已修复

- Header 组件集成到主布局（通知铃铛、全局搜索、用户信息可见）
- Sidebar 添加无障碍属性（aria-label, aria-current, role, tabIndex, keyboard nav）
- SlidePanel Drawer 宽度属性修正（size → width）
- Dashboard 硬编码用户名改为动态读取 currentUser.realName
- 工作空间添加"指派给我"分类（TaskCategoryNav），替代独立 MyTasks 页面入口
- Todo/MyTasks 任务详情面板增强（状态标签、进度条、网格布局、完整字段展示）
- 响应式 Sidebar（768px 以下自动隐藏，Content 区域全宽）

### 待优化（建议后续迭代）

| 优先级 | 问题 | 建议 |
|--------|------|------|
| P1 | 三种任务详情仍为独立实现 | 抽取为共享 TaskDetailContent 组件（当前已统一展示风格，但代码未复用） |
| P1 | MyTasks 页面侧边栏不可达 | 添加到 NAV_ITEMS |
| P1 | 页面 Header 模式不一致 | 使用共享 PageHeader 组件 |
| P2 | 13 个图标导航认知负荷高 | 分组或添加文字标签 |
| P2 | i18n 基础设施存在但页面未使用 | 逐步国际化 |

---

## 五、测试验证结果

```
Frontend (Vitest):
  Test Files:  168 passed (168)
  Tests:       1854 passed (1854)

Backend (Maven):
  syncflow-workflow:  82 tests passed
  syncflow-project:  85 tests passed
  syncflow-task:     88 tests passed
  Total:             255 tests passed

Grand Total: 2109 tests, 0 failures
```

---

## 六、下一步建议

1. **P0 — 统一任务详情组件**：创建共享 `TaskDetailDrawer` 替代 Todo/Project/MyTasks 三种不同实现
2. **P0 — 响应式布局**：Sidebar 折叠 + Content marginLeft 由状态驱动
3. **P1 — 后端 Auth 端点补全**：实现 register/forgot-password/reset-password/profile/api-keys
4. **P1 — 软删除用户清理**：添加 UserDeletionListener 清理项目成员/任务分配/委托
5. **P2 — 数据库约束补全**：wf_business_object 添加 FK，tsk_task_dependency 添加 FK
6. **P2 — TaskNo 竞态修复**：使用 biz_code_sequence 表原子递增
