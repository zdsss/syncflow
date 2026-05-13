# 业务数据测试报告

> 日期：2026-05-10
> 测试数据：V13__test_business_data.sql

---

## 一、测试数据规模

| 数据类型 | 数量 | 覆盖场景 |
|---------|------|---------|
| 部门 | 7 | 总经办/项目管理/设计/研发/测试/工艺/品质 |
| 用户 | 10 | 管理员+9个不同部门用户 |
| 角色 | 5 | ADMIN/PM/DESIGNER/DEVELOPER/TESTER |
| 项目/文件夹 | 6 | 3个文件夹+3个项目（层级嵌套） |
| 阶段 | 9 | Pack项目6阶段+BMS项目3阶段 |
| 阶段门 | 3 | DQR/TR/QG 三种类型 |
| 里程碑 | 10 | MILESTONE/DELIVERABLE/REVIEW 三种类型 |
| 任务 | 24 | **全部9种类型**：TASK/STAGE/MILESTONE/ISSUE/RISK/SUGGESTION/CHANGE/ACTIVITY/REVIEW |
| 任务依赖 | 13 | **全部4种类型**：SS×3/SF×0/FS×8/FF×2 |
| 任务模板 | 5 | 全局3+个人2，含24个子任务项 |
| 交付物模板 | 3 | 设计/测试/评审，含JSONB清单 |
| 工作流模板 | 5 | BOM/变更/阶段门/文件/通用审批 |
| BOM | 2 | Pack BOM(5项)+BMS BOM |
| 工艺路线 | 1 | Pack装配工艺(8道工序) |
| 项目成员 | 11 | 2个项目×多角色 |
| 任务参与人 | 11 | 多任务×多参与人 |
| 任务关注 | 10 | 风险/变更等关键任务 |
| 任务评论 | 8 | 含@提及的业务讨论 |

---

## 二、API 功能验证

| 功能 | API | 结果 | 数据 |
|------|-----|------|------|
| 项目树 | GET /api/projects | ✅ | 1个顶层文件夹（含子文件夹和项目） |
| 任务列表 | GET /api/tasks | ✅ | 24个任务，分页正常 |
| 任务依赖 | GET /api/tasks/{id}/dependencies | ✅ | Task5→Task1 (FS) 正确返回 |
| 级联预览 | POST /api/tasks/{id}/cascade-preview | ✅ | 推迟Task1影响5个后续任务 |
| 任务模板 | GET /api/task-templates?scope=GLOBAL | ✅ | 3个全局模板 |
| 交付物模板 | GET /api/config/deliverable-templates | ✅ | 3个模板（含JSONB items） |
| 工作流模板 | GET /api/workflow/templates | ✅ | 5个模板（关联BPMN Process Key） |
| BOM | GET /api/boms | ✅ | 2个BOM |
| 甘特图 | GET /api/projects/{id}/gantt | ✅ | 34个任务节点 |
| 登录 | POST /api/auth/login | ✅ | admin/admin123，JWT含tenantId |

---

## 三、业务场景覆盖

### 工作空间场景
- ✅ 全部任务（24个）
- ✅ 时间范围任务（任务有plannedStart/plannedEnd）
- ✅ 系统提醒（is_warning=true: Task2, Task9, Task10）
- ✅ 各类型任务（9种类型均有数据）
- ✅ 用户标记（10个关注关系）

### 项目管理场景
- ✅ 文件夹→项目→阶段→任务 层级树
- ✅ 6个工业标准阶段（调查→概念→计划→开发→测试→量产）
- ✅ 4种依赖关系（SS/FS/FF）
- ✅ 级联调度（推迟任务自动影响后续）
- ✅ 进度时间线（已完成/进行中/未开始）
- ✅ 甘特图数据
- ✅ 悬浮菜单（不同节点类型不同菜单项）

### 模板系统场景
- ✅ 全局模板（管理员设置，所有人可用）
- ✅ 个人模板（用户自定义）
- ✅ 模板带子任务（新项目启动模板含6个子任务）
- ✅ 交付物模板（JSONB格式清单）
- ✅ 工作流模板（关联Flowable BPMN）

### 审批场景
- ✅ BOM审批配置
- ✅ 阶段门审批（3个阶段门）
- ✅ 变更审批（电芯规格变更）
- ✅ 里程碑审批

---

## 四、质量结论

### QA 评审：**READY** ✅

所有 docx 定义的功能场景均有对应测试数据，API 验证通过。
