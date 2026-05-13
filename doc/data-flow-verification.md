# SyncFlow 前三模块 + 审核引擎 数据流向与验证路径

## 一、模块概览与数据流拓扑

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  工作空间     │────▶│  项目管理      │────▶│  中控看板      │
│  (Task)      │     │  (Project)    │     │  (Dashboard)  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │    projectId/FK    │   聚合查询          │
       │◀───────────────────┘                    │
       │                                         │
       └────────────┬────────────────────────────┘
                    │
              ┌─────▼──────┐
              │  审核引擎    │
              │ (Workflow)  │
              │  Flowable   │
              └─────────────┘
```

---

## 二、详细验证路径

### 路径 1: 任务创建 → 项目关联 → 看板展示

| 步骤 | 操作 | 前端调用 | 后端处理 | 数据流向 |
|------|------|---------|---------|---------|
| 1.1 | 创建任务 | `POST /api/tasks` (task.service.ts:createTask) | TaskController.createTask → TaskServiceImpl.createTask | 前端JSON → CreateTaskDTO → Task entity → tsk_task表 |
| 1.2 | 关联项目 | 请求体含 `projectId` | `task.setProjectId(parseLong(dto.getProjectId()))` | projectId写入tsk_task.project_id (FK→prj_project.id) |
| 1.3 | 看板聚合 | `GET /api/dashboard/summary` | DashboardServiceImpl.getSummary → taskMapper.selectList | 统计所有非取消任务的各状态计数 |
| 1.4 | 看板展示 | DashboardPage → TaskSummaryCards | 前端buildTaskSummary(summary) | summary.todayTasks/overdue → 卡片数据 |

**验证要点:**
- [x] projectId类型: 前端number → DTO String → entity Long (已修复: DTO使用String, parseLong转换)
- [ ] projectId存在性: 后端未校验project是否存在 (已知gap)
- [x] 任务统计字段名: 前端todayTasks/weekTasks vs 后端today/thisWeek (已修复: 前端类型已更新)

---

### 路径 2: 任务完成 → 审批流程 → 状态回写

| 步骤 | 操作 | 前端调用 | 后端处理 | 数据流向 |
|------|------|---------|---------|---------|
| 2.1 | 完成任务 | store.completeTask(id) | TaskServiceImpl.completeTask | 判断是否需要审批 |
| 2.2 | 审批判断 | — | `needsApproval = milestoneId≠null ∨ type∈{MILESTONE,ISSUE,RISK}` | 分支: 直接完成 vs 提交审批 |
| 2.3a | 直接完成 | — | status→COMPLETED(4), progress→100, actualEnd→today | tsk_task表更新 |
| 2.3b | 提交审批 | — | status→PENDING_REVIEW(3), workflowService.startProcess | tsk_task + wf_business_object + Flowable process |
| 2.4 | 审批人操作 | workflowService.completeTask(taskId) | WorkflowServiceImpl.completeTask → Flowable taskService.complete | wf_approval_comment + Flowable变量 |
| 2.5 | 审批通过回调 | — | ApprovalEventListener → TaskApprovalCallback.onApproved | status→COMPLETED(4), progress→100 |
| 2.6 | 审批驳回回调 | — | ApprovalEventListener → TaskApprovalCallback.onRejected | status→IN_PROGRESS(2) |

**验证要点:**
- [x] 幂等性: 重复点击complete不会启动重复审批 (已修复: 添加flowInstanceId检查)
- [x] 状态机: completeTask现在验证isValidTransition (已修复: 添加状态机校验)
- [x] 乐观更新: store.completeTask根据任务类型设置正确状态 (已修复: MILESTONE/ISSUE/RISK→status=3)
- [x] 审批回调状态守卫: onApproved检查CANCELLED/COMPLETED状态 (已修复: 添加状态守卫)
- [x] MILESTONE处理: 从TaskApprovalCallback移除,由MilestoneApprovalCallback处理 (已修复: 解决重复handler竞争)

---

### 路径 3: 项目创建 → 阶段自动生成 → 审批启动

| 步骤 | 操作 | 前端调用 | 后端处理 | 数据流向 |
|------|------|---------|---------|---------|
| 3.1 | 创建项目 | createProject({code, name, ownerId, ...}) | ProjectController → ProjectServiceImpl.createProject | prj_project表 |
| 3.2 | 自动生成阶段 | — | 创建6个阶段: 调查→概念→计划→开发→测试→量产 | prj_phase表 × 6 |
| 3.3 | 启动审批 | — | workflowService.startProcess("GENERIC_APPROVAL", projectId, "PROJECT") | wf_business_object + Flowable |
| 3.4 | 审批通过 | — | ProjectApprovalCallback.onApproved | status→2(in_progress) |
| 3.5 | 审批驳回 | — | ProjectApprovalCallback.onRejected | status→1(not_started) (已修复: 原为0/cancelled) |
| 3.6 | 撤回 | — | ProjectApprovalCallback.onWithdrawn | status→1(not_started) (已修复: 原为0/cancelled) |

**验证要点:**
- [x] code字段必填: 前端表单已添加code输入框 (已修复)
- [x] ownerId字段名: 前端已从leaderId改为ownerId (已修复)
- [x] 驳回/撤回状态: 不再永久取消项目,允许重新提交 (已修复)
- [ ] 阶段门禁: StageGate审批通过后不自动推进阶段 (已知设计gap)

---

### 路径 4: 看板审批待办 → 审批操作 (关键修复路径)

| 步骤 | 操作 | 前端调用 | 后端处理 | 数据流向 |
|------|------|---------|---------|---------|
| 4.1 | 获取待办 | `GET /api/dashboard/pending-approvals` | DashboardServiceImpl.getPendingApprovals(userId) | wf_business_object JOIN Flowable task query |
| 4.2 | 展示待办 | PendingApprovals组件 | 渲染ApprovalItem列表 | applicantName/createdAt/currentTaskId |
| 4.3 | 通过操作 | completeApprovalTask(currentTaskId, {approved:true}) | WorkflowServiceImpl.completeTask | **使用Flowable taskId,非BusinessObject id** |
| 4.4 | 驳回操作 | completeApprovalTask(currentTaskId, {approved:false}) | WorkflowServiceImpl.completeTask | 同上 |

**验证要点:**
- [x] **关键修复**: 前端现在使用currentTaskId(Flowable taskId)而非BusinessObject id (已修复)
- [x] **用户范围**: 后端通过Flowable taskQuery过滤当前用户的待办 (已修复: 原来显示所有人)
- [x] **字段对齐**: 前端ApprovalItem字段名与后端PendingApprovalVO一致 (已修复: applicantName/createdAt)
- [x] **类型标签**: APPROVAL_TYPE_CONFIG使用大写key匹配后端objectType (已修复)

---

### 路径 5: 阶段门禁审批 (StageGate)

| 步骤 | 操作 | 后端处理 | 数据流向 |
|------|------|---------|---------|
| 5.1 | 提交门禁 | StageGateService.submitStageGate | prj_stage_gate表 + STAGE_GATE_APPROVAL流程 |
| 5.2 | 流程变量 | WorkflowServiceImpl.startProcess | objectId→stageGateId变量 (已修复: 原来缺失) |
| 5.3 | 审批完成 | StageGateService.updateStatus + StageGateApprovalCallback | gate.status→2(approved)/3(rejected) |
| 5.4 | 审批人记录 | completeTask设置approverId变量 | approverId传递到StageGateService (已修复: 原来缺失) |

**验证要点:**
- [x] stageGateId流程变量: 已添加到startProcess (已修复)
- [x] approverId流程变量: 已添加到completeTask (已修复)
- [ ] BPMN并行网关: 两个审批任务共享approved变量,后写覆盖先写 (已知设计问题)
- [ ] 拒绝回调: BPMN拒绝路径无service task,onRejected可能不触发 (已知设计问题)

---

### 路径 6: 项目成员 → 审批委派人解析

| 步骤 | 操作 | 后端处理 | 数据流向 |
|------|------|---------|---------|
| 6.1 | 添加成员 | ProjectServiceImpl.addMember(userId, projectRole) | prj_project_member表 |
| 6.2 | 审批配置 | wf_approval_config: rule_type=PROJECT_ROLE, rule_value=PM | 配置表 |
| 6.3 | 委派解析 | ApprovalAssigneeResolver → CrossModuleMapper.selectUsersByProjectRole | prj_project_member → 审批人列表 |

**验证要点:**
- [x] projectRole字段名: 前端已从role改为projectRole (已修复: 否则role存null导致委派解析失败)
- [ ] 部门负责人SQL: selectDepartmentHead返回同部门任意用户而非负责人 (已知bug)
- [x] addMember响应: 后端返回void,前端重新获取成员列表 (已修复)

---

## 三、已修复问题清单 (16项)

### Dashboard模块 (5项)
| # | 严重度 | 问题 | 修复 |
|---|--------|------|------|
| D1 | CRITICAL | 审批按钮传递BusinessObject id而非Flowable taskId | 返回currentTaskId,前端使用它调用completeTask |
| D2 | HIGH | 审批待办显示所有人而非当前用户 | 通过Flowable taskQuery过滤当前用户分配的任务 |
| D3 | HIGH | ApprovalItem字段名不匹配(submitter/submitDate) | 改为applicantName/createdAt |
| D4 | MEDIUM | 审批类型标签大小写不匹配 | APPROVAL_TYPE_CONFIG改为大写key |
| D5 | MEDIUM | EMPTY_SUMMARY有假数据(warnings:3,risks:2) | 全部改为0 |

### Project模块 (5项)
| # | 严重度 | 问题 | 修复 |
|---|--------|------|------|
| P1 | HIGH | addMember发送role而非projectRole | 前端改为projectRole,后端存储正确 |
| P2 | HIGH | addMember后端返回void前端期望对象 | 前端改为重新fetch成员列表 |
| P3 | HIGH | createProject缺少必填code字段 | 表单添加code输入框 |
| P4 | HIGH | 状态比较string vs number | 改为ProjectStatus.IN_PROGRESS等数值比较 |
| P5 | HIGH | Project类型不统一(两套类型系统) | 统一Project类型字段名 |

### Task模块 (4项)
| # | 严重度 | 问题 | 修复 |
|---|--------|------|------|
| T1 | BREAKING | getComments返回PageResult但前端期望数组 | 前端类型改为TaskCommentPageData |
| T2 | BREAKING | TaskStatistics字段名完全不匹配 | 前端类型更新为匹配后端VO |
| T3 | BUG | status(单数) vs statuses(复数) 查询参数 | 前端改为statuses数组 |
| T4 | BUG | completeTask乐观更新硬编码status=4 | 根据任务类型设置正确状态 |

### Approval引擎 (2项)
| # | 严重度 | 问题 | 修复 |
|---|--------|------|------|
| A1 | CRITICAL | MILESTONE重复注册(TaskApprovalCallback + MilestoneApprovalCallback) | 从TaskApprovalCallback移除MILESTONE |
| A2 | HIGH | stageGateId/approverId未设为流程变量 | 在startProcess和completeTask中添加 |

---

## 四、已知遗留问题 (需后续处理)

### 高优先级
1. **StageGate BPMN并行网关设计缺陷**: 两个审批任务共享`approved`变量,后完成的覆盖先完成的
2. **StageGate BPMN拒绝路径无回调**: 拒绝直接结束,不触发StageGateApprovalCallback.onRejected
3. **ChangeApprovalService未实现JavaDelegate**: change_approval.bpmN的service task会抛ClassCastException
4. **前端缺少8个里程碑/阶段管理API调用**: 无法通过前端创建/更新/完成里程碑
5. **BasicTab组件引用9个不存在的字段**: 需要重写以使用ProjectVO字段

### 中优先级
6. **Dashboard N+1查询**: toTaskStatVO等方法每条记录额外查询project/user
7. **getSummary全表加载**: 应改为count查询而非selectList+stream filter
8. **部门负责人SQL错误**: selectDepartmentHead返回任意用户而非负责人
9. **Project.progress不自动更新**: 任务完成后不触发项目进度重算
10. **前端任务计数限制100条**: projectTaskCounts只看前100条任务

### 低优先级
11. **硬编码tenantId=1**: 多租户场景下所有审批都写入tenant 1
12. **wf_business_object缺少唯一约束**: 可能创建重复审批流程
13. **审批意见存储approverId而非姓名**: approver_name列存数字ID
14. **MilestoneApprovalCallback拒绝不重置progress**: 100%进度的任务被拒绝后仍显示100%
