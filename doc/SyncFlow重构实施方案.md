# SyncFlow 重构实施方案（NestJS → Spring Boot）

## 文档信息
- **版本**：v1.0
- **日期**：2026-05-06
- **依据**：当前代码库分析 + `SyncFlow重构方案.md` 目标架构
- **现状**：NestJS 11 + Prisma + PostgreSQL | React 19 + Vite + Ant Design + Zustand

---

## 一、现状总览

### 1.1 技术栈现状

| 层级 | 当前技术 | 目标技术 | 变更程度 |
|------|---------|---------|---------|
| **后端框架** | NestJS 11 + TypeScript | Spring Boot 3.x + Java 17+ | 完全重写 |
| **ORM** | Prisma 5.22 | MyBatis-Plus | 完全替换 |
| **数据库** | PostgreSQL 16 (UUID PK) | PostgreSQL 16 (BIGSERIAL PK) | 结构迁移 |
| **审批引擎** | 自建 Approval + ApprovalChain | Flowable 7.x (嵌入式) | 完全替换 |
| **缓存** | 无 | Redis | 新增 |
| **文件存储** | 本地磁盘 | MinIO | 新增 |
| **消息队列** | 无 | RabbitMQ | 新增 |
| **WebSocket** | Socket.IO | STOMP over SockJS | 替换 |
| **前端框架** | React 19 + Vite 8 | React 19 + Vite 8 (保留) | 保持 |
| **UI组件** | Ant Design 6 | Ant Design Pro | 升级 |
| **状态管理** | Zustand 5 | Zustand 5 (保留) | 保持 |
| **图表** | ECharts 6 | ECharts 6 (保留) | 保持 |
| **测试** | Vitest + Jest + Playwright | JUnit 5 + Spring Test + Playwright | 后端替换 |

### 1.2 代码库规模

| 维度 | 当前数量 | 目标数量 |
|------|---------|---------|
| 后端模块 | 19 个 NestJS 模块 | 11 个 Spring Boot 模块 |
| 数据库模型 | 29 个 Prisma 模型 + 7 枚举 | ~46 张表 + 枚举 |
| 前端页面 | 24 个页面模块 | 24+ 页面（增强） |
| API 端点 | 100+ | 150+ |
| 前端测试 | 133 文件 / 1614 用例 | 需全部更新 |
| 后端测试 | 32 套件 / 485 用例 | 需全部重写 |
| E2E 测试 | 11 文件 | 需更新适配 |

---

## 二、架构对比与差距分析

### 2.1 模块映射

| 当前 NestJS 模块 | 目标 Spring Boot 模块 | 变更类型 | 复杂度 |
|---|---|---|---|
| `auth` | `syncflow-admin` (controller/sys/) | 重构 | 中 |
| `config` (部门/角色) | `syncflow-admin` (controller/sys/) | 重构 | 中 |
| `projects` | `syncflow-project` (controller/prj/) | 重构 | 高 |
| `tasks` | `syncflow-task` (controller/tsk/) | 重构 | 高 |
| `bom` | `syncflow-bom` (controller/bom/) | 重构 | 高 |
| `process` | `syncflow-process` (controller/prc/) | 重构 | 高 |
| `approval` | `syncflow-workflow` (controller/wf/) | 完全重写 | 很高 |
| `files` | `syncflow-file` | 重构 | 中 |
| `dashboard` + `query` | `syncflow-statistics` (controller/sta/) | 重构 | 中 |
| `notifications` | `syncflow-message` | 重构 | 低 |
| `resources` + `knowledge` + `template` + `audit` + `activity` + `comments` + `search` + `personal` | `syncflow-common` 或合并 | 整合 | 中 |
| *(新增)* | `syncflow-config` (三库架构) | 新建 | 高 |

### 2.2 数据库差距分析

#### 2.2.1 关键架构变更

| 变更项 | 当前 | 目标 | 影响范围 |
|--------|------|------|---------|
| **主键策略** | UUID (String) | BIGSERIAL (Long) | 所有表、所有外键、前端类型 |
| **多租户** | 无 | `tenant_id` 字段 | 所有业务表 |
| **层级存储** | `parentId` (邻接表) | `parent_path` (物化路径) | Project, Task, BOM Item |
| **审批集成** | 自建 Approval + Chain | Flowable BPMN 绑定 | 新增 5 张表 |

#### 2.2.2 模型映射详情

**保留并重构的模型 (18个)**

| 当前模型 | 目标表 | 主要变更 |
|----------|--------|---------|
| `User` (users) | `sys_user` | PK: UUID→BIGSERIAL; 新增 `real_name`, `tenant_id`, `phone` |
| `Department` (departments) | `sys_department` | PK: UUID→BIGSERIAL; 新增 `code`, `tenant_id` |
| `Role` (roles) | `sys_role` | PK: UUID→BIGSERIAL; 拆分 `permissions[]` 为独立表 |
| `UserRole` (user_roles) | `sys_user_role` | PK: UUID→BIGSERIAL; 新增 `scope_type`, `scope_id` |
| `Project` (projects) | `prj_project` | PK: UUID→BIGSERIAL; `parentId` → `parent_path`; `phase` 枚举移除; 新增 `project_type`, `tenant_id` |
| `Task` (tasks) | `tsk_task` | PK: UUID→BIGSERIAL; `type` 从 nullable 变为 NOT NULL 并扩展为 9 种; `participantIds[]` 移至关联表; 新增 `flow_instance_id`, `task_no` |
| `TaskDependency` (task_dependencies) | `tsk_task` (自引用) | 简化或融入 `parent_path` |
| `Comment` (comments) | `tsk_task_comment` | 限定为任务评论; PK: UUID→BIGSERIAL |
| `ActivityLog` (activity_logs) | `tsk_task_activity` | 限定为任务活动; PK: UUID→BIGSERIAL |
| `BomItem` (bom_items) | `bom_item` | 拆分: 新增 `bom_bom` 主表; `partNumber` → `material_code` |
| `BomVersion` (bom_versions) | `bom_version` | 引用 `bom_bom.id` 替代 `project_id` |
| `ProcessRoute` (process_routes) | `prc_process_route` | 新增 `bom_id`, `work_center_code`, `tenant_id` |
| `ProcessStep` (process_steps) | `prc_operation` | 完全重构为工序; 新增 `material_code`, `work_center`, `operation_no` |
| `File` (files) | `fil_file` | `projectId` → `biz_type` + `biz_id` 多态绑定; 新增 `storage_path`, `bucket`, `check_sum` |
| `FileVersion` (file_versions) | `fil_file_version` | 新增 `storage_path`, `check_sum` |
| `Notification` (notifications) | `notifications` | 微调: 新增 `tenant_id` |
| `AuditLog` (audit_logs) | `audit_logs` | 微调: 新增 `tenant_id` |
| `Note` (notes) | `notes` | 保持不变 |

**移除/替换的模型 (8个)**

| 当前模型 | 处置 | 替代方案 |
|----------|------|---------|
| `Team` / `TeamMember` | 移除 | `prj_project_member` (项目级成员) |
| `ProcessVersion` | 移除 | 版本管理合并至 `prc_process_route.version` |
| `FilePermission` | 移除 | RBAC 权限控制 |
| `Resource` | 移除 | 三库配置 (`cfg_*` 表) |
| `Approval` / `ApprovalChain` | 移除 | `wf_business_object` + `wf_approval_config` (Flowable) |

**新增的表 (30个)**

| 分类 | 新表 | 说明 |
|------|------|------|
| **权限** | `sys_permission` | 独立权限表 (RBAC) |
| **项目** | `prj_phase` | 项目阶段生命周期 |
| | `prj_stage_gate` | 阶段门审批 (嵌入项目结构) |
| | `prj_milestone` | 里程碑 (含 `flow_instance_id`) |
| | `prj_project_member` | 项目成员 + 角色 |
| **任务** | `tsk_task_participant` | 任务参与者 (替换 `participantIds[]`) |
| | `tsk_task_watcher` | 任务关注者 |
| | `tsk_task_quick_template` | 快速创建模板 |
| **BOM** | `bom_bom` | BOM 主表 (版本/状态/审批) |
| **工艺** | `prc_man_hour` | 工序工时定额 |
| | `prc_operation_material` | 工序材料定额 |
| | `prc_template` | 工艺库模板 |
| | `prc_term` | 工艺术语库 |
| | `prc_tool` | 工具库 |
| **配置 (三库)** | `cfg_module_category` | 模块分类 |
| | `cfg_module` | 模块 |
| | `cfg_module_spec` | 模块规格 |
| | `cfg_spec_param` | 规格参数 |
| | `cfg_process_category` | 工艺分类 |
| | `cfg_typical_process` | 典型工艺 |
| | `cfg_order_category` | 订单分类 |
| | `cfg_order_product` | 订单产品 |
| | `cfg_product_bom` | 产品-BOM关联 |
| **文件** | `fil_folder` | 文件夹管理 |
| **审批** | `wf_business_object` | Flowable 业务绑定 |
| | `wf_approval_config` | 动态审批人配置 |
| | `wf_approval_comment` | 审批意见 |
| | `wf_delegation` | 委托记录 |
| | `wf_cc_record` | 抄送记录 |
| **统计** | `sta_dashboard_data` | 驾驶舱预计算数据 |
| | `sta_task_statistics` | 任务统计快照 |
| | `sta_man_hour_ranking` | 工时排行 |

### 2.3 API 差距分析

#### 新增 API 端点 (高优先级)

| 模块 | 新端点 | 说明 |
|------|--------|------|
| **任务** | `POST /api/tasks/quick` | 快速创建任务 (解析格式: `任务名,@人#工时¥工期%类型`) |
| | `GET /api/tasks/statistics` | 任务统计卡片 (今日/本周/本月/预警/超期/按类型) |
| | `POST /api/tasks/{id}/watch` | 关注/取消关注 |
| **项目** | `GET /api/projects/{id}/phases/tree` | 阶段树 (含审批内嵌) |
| | `GET /api/projects/{id}/milestones` | 里程碑列表 |
| | `POST /api/projects/{id}/phases/{phaseId}/gate` | 提交阶段门审批 |
| | `GET /api/projects/{id}/gantt` | 甘特图数据 |
| **BOM** | `GET /api/boms/{id}/structure` | BOM 结构树 |
| | `POST /api/boms/{id}/items` | 新增 BOM 项 |
| | `POST /api/boms/{id}/submit-approval` | 提交 BOM 审批 |
| | `POST /api/boms/{id}/save-version` | 保存版本 |
| **工艺** | `GET /api/process-routes/{id}/operations` | 工序列表 |
| | `POST /api/process-routes/{id}/operations` | 添加工序 |
| | `PUT /api/process-routes/{id}/operations/reorder` | 工序排序 |
| **配置 (三库)** | `GET /api/config/modules/categories` | 模块分类树 |
| | `GET /api/config/modules/{id}/specs` | 模块规格列表 |
| | `POST /api/config/modules/specs/{id}/publish` | 发布规格 (审批) |
| | `GET /api/config/orders/categories` | 订单分类树 |
| | `GET /api/config/orders/products/{id}/bom` | 产品BOM |
| **驾驶舱** | `GET /api/dashboard` | 驾驶舱首页 |
| | `GET /api/dashboard/man-hour-ranking` | 工时排行 |
| | `GET /api/dashboard/on-time-rate-ranking` | 按期完工率排行 |

#### 重大 API 变更

| 变更 | 当前格式 | 目标格式 |
|------|---------|---------|
| 统一返回 | `{ data, message }` | `{ code, message, data, timestamp }` |
| 分页返回 | `{ data: [], total }` | `{ code, data: { records, total, size, current } }` |
| 任务类型 | `type?: string` | `type: TaskType` (9种枚举) |
| 审批操作 | `POST /approvals/:id/approve` | `POST /wf/business-objects/:id/approve` (Flowable任务ID) |
| BOM 结构 | 扁平 BomItem 列表 | 树形 `bom_bom → bom_item` 层级 |

### 2.4 前端差距分析

#### 2.4.1 技术变更

| 变更项 | 当前 | 目标 | 工作量 |
|--------|------|------|--------|
| WebSocket | Socket.IO (`socket.io-client`) | STOMP over SockJS (`@stomp/stompjs` + `sockjs-client`) | 1-2 天 |
| API 服务层 | 17 个 service 文件 | 更新端点路径和响应格式 | 2-3 天 |
| 状态管理 | 8 个 Zustand store | 更新数据模型类型 | 1-2 天 |

#### 2.4.2 页面变更

| 页面 | 变更类型 | 主要工作 |
|------|---------|---------|
| **Dashboard** | 重写 | 深蓝驾驶舱大屏 + ECharts 数据面板 (保持看板/日程子视图) |
| **Project** | 增强 | 阶段树 + 阶段门 + 里程碑 + 内嵌审批 |
| **Task/Todo** | 增强 | 8 种任务类型表单 + 快速创建解析器 + 关注者 + 活动日志 |
| **BOM** | 重写 | 树结构重构 + 审批集成版本管理 |
| **Process** | 增强 | 工序表 + 工时定额 + 材料定额 |
| **Approval** | 重构 | 多场景嵌入 (项目/BOM/任务) + Flowable 事件 (STOMP) |
| **Files** | 增强 | 新增文件夹管理树 |
| **Config** | 增强 | 新增三库配置管理 |
| **Modules** | 新建 | 模块库/工艺库/订单库完整实现 |

#### 2.4.3 新增组件

| 组件 | 说明 | 工作量 |
|------|------|--------|
| `StageGateNode` | 阶段门审批树节点 + 内嵌审批触发 | 2-3 天 |
| `TaskTypeForm` | 8 种任务类型的动态表单 | 3-4 天 |
| `QuickTaskInput` | 快速创建解析器 (`任务名,@人#工时¥工期%类型`) | 1-2 天 |
| `TaskWatcherList` | 关注者头像列表 + 活动日志时间线 | 1 天 |
| `ModuleLibraryManager` | 分类→模块→规格→参数 4级树 CRUD | 3-4 天 |
| `ProcessLibraryManager` | 工艺模板库 | 2-3 天 |
| `OrderLibraryManager` | 订单模板库 | 2 天 |
| `DrivingScreen` | 深蓝驾驶舱 (ECharts: 统计/燃尽/部门负载/风险) | 4-5 天 |
| `ApprovalEmbed` | 可复用审批组件 (项目门/BOM/任务复用) | 2-3 天 |
| `FolderTree` | 文件夹树管理 | 2 天 |
| `ProcessOperationsTable` | 工序表 (工时 + 材料) | 2-3 天 |

---

## 三、分阶段实施计划

### Phase 1: 基础设施 (第 1-2 月)

**目标**: 搭建 Spring Boot 脚手架，完成认证模块和公共组件，实现数据库迁移

#### Sprint 1.1: 项目脚手架 (第 1-2 周)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 创建 Spring Boot 3.x 多模块项目 | `com.syncflow` 根包, 11 个子模块 | P0 |
| 配置 MyBatis-Plus | 分页插件、乐观锁、自动填充 | P0 |
| 配置 PostgreSQL 连接 | 连接池 (HikariCP)、多数据源预留 | P0 |
| 配置 Redis | 缓存配置、Session 存储 | P0 |
| 配置 Swagger/OpenAPI | 接口文档自动生成 | P0 |
| 配置统一异常处理 | `@ControllerAdvice` + ErrorCode 枚举 | P0 |
| 配置统一返回格式 | `Result<T>` + `PageResult<T>` | P0 |
| Docker Compose 编排 | PostgreSQL + Redis + MinIO | P0 |

#### Sprint 1.2: 认证与用户管理 (第 3-4 周)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 数据库迁移脚本 (sys_* 表) | sys_user, sys_department, sys_role, sys_user_role, sys_permission | P0 |
| JWT 认证模块 | 登录/注册/Token 刷新/注销 (参考现有 auth 逻辑) | P0 |
| Spring Security 配置 | JWT Filter、RBAC、路径权限 | P0 |
| 用户管理 CRUD | 用户列表/详情/新增/编辑/禁用 | P0 |
| 部门管理 CRUD | 部门树/新增/编辑/删除 | P0 |
| 角色权限管理 | 角色 CRUD + 权限分配 | P0 |
| 适配前端 auth 流程 | 保持前端登录/注册/Token 刷新不变 | P0 |

**验收标准**:
- [ ] 前端可正常登录/注册/注销
- [ ] JWT Token 刷新正常工作
- [ ] 用户/部门/角色 CRUD 功能可用
- [ ] 所有 sys_* 表创建完成
- [ ] Docker Compose 一键启动

#### Sprint 1.3: 公共组件 + 文件服务 (第 5-6 周)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 公共枚举定义 | TaskType, TaskStatus, ApprovalStatus 等 | P0 |
| 通用工具类 | 日期处理、树构建、编号生成 | P0 |
| MinIO 文件服务 | 上传/下载/预览/删除 | P1 |
| 文件管理模块 (fil_*) | 文件 CRUD + 版本管理 + 文件夹管理 | P1 |
| 通知模块 | 通知 CRUD + 已读标记 | P1 |
| WebSocket 配置 | STOMP over SockJS 基础配置 | P1 |
| 前端: WebSocket 迁移 | Socket.IO → STOMP/SockJS | P1 |
| 前端: API 服务层适配 | 更新 api.ts baseURL / interceptors | P1 |

**验收标准**:
- [ ] MinIO 文件上传下载正常
- [ ] STOMP WebSocket 连接正常
- [ ] 前端 useSocket → useStomp 迁移完成

---

### Phase 2: 核心业务 (第 3-4 月)

**目标**: 完成项目管理、任务管理、审批引擎集成

#### Sprint 2.1: 项目管理 (第 7-8 周)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 数据库迁移脚本 (prj_* 表) | prj_project, prj_phase, prj_stage_gate, prj_milestone, prj_project_member | P0 |
| 项目 CRUD | 项目树 (parent_path) / 新增 / 编辑 | P0 |
| 阶段管理 | 阶段 CRUD / 排序 / 状态流转 | P0 |
| 里程碑管理 | 里程碑 CRUD / 状态更新 | P1 |
| 项目成员管理 | 成员添加/移除/角色分配 | P1 |
| 甘特图数据接口 | `GET /api/projects/{id}/gantt` | P1 |
| 前端: 项目页面增强 | 阶段树 + 阶段门 + 里程碑展示 | P1 |

#### Sprint 2.2: 任务管理 (第 9-10 周)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 数据库迁移脚本 (tsk_* 表) | tsk_task, tsk_task_participant, tsk_task_watcher, tsk_task_comment, tsk_task_activity, tsk_quick_template | P0 |
| 任务 CRUD (多类型) | 支持 9 种任务类型: TASK/MILESTONE/ISSUE/RISK/SUGGESTION/CHANGE/ACTIVITY/STAGE/APPROVAL | P0 |
| 任务统计接口 | `GET /api/tasks/statistics` (今日/本周/本月/预警/超期/按类型) | P0 |
| 快速创建任务 | `POST /api/tasks/quick` (解析 `任务名,@人#工时¥工期%类型`) | P1 |
| 任务评论/活动日志 | 评论 CRUD + 活动日志记录 | P1 |
| 任务关注 | `POST /api/tasks/{id}/watch` | P2 |
| 前端: 任务页面增强 | 8 种类型表单 + 快速创建输入框 + 统计卡片 + 关注者列表 | P1 |

#### Sprint 2.3: Flowable 审批引擎 (第 11-12 周)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| Flowable 7.x 集成 | 嵌入式引擎配置、BPMN 部署 | P0 |
| 数据库迁移脚本 (wf_* 表) | wf_business_object, wf_approval_comment, wf_approval_config, wf_delegation, wf_cc_record | P0 |
| 通用审批服务 | `WorkflowService` (启动流程/完成任务/查询任务) | P0 |
| 业务对象绑定 | 任意业务实体 ↔ Flowable 流程实例 | P0 |
| 动态审批人解析 | `ApprovalAssigneeResolver` (按项目角色/部门/用户/表达式) | P1 |
| BPMN 定义文件 | 阶段门审批 / BOM 审批 / 工艺审批 / 规格审批 / 变更审批 | P1 |
| 阶段门审批实现 | 阶段门提交 → 审批 → 状态回写 | P1 |
| 审批监听器 | 任务创建/完成事件 → 通知 + 状态更新 | P1 |
| 前端: 审批组件 | `ApprovalEmbed` 可复用审批组件 (嵌入项目/BOM/任务) | P1 |

**验收标准**:
- [ ] 阶段门审批完整流程: 提交 → 审批 → 状态更新
- [ ] 动态审批人按角色正确解析
- [ ] 审批事件通过 STOMP 推送到前端
- [ ] 前端可在项目阶段树中看到内嵌审批状态

---

### Phase 3: 领域模块 (第 5-6 月)

**目标**: 完成 BOM、工艺、配置管理三大模块

#### Sprint 3.1: BOM 管理 (第 13-14 周)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 数据库迁移脚本 (bom_* 表) | bom_bom, bom_item, bom_version | P0 |
| BOM 主表管理 | 创建/编辑/版本管理 | P0 |
| BOM 项树管理 | 树结构 CRUD / 层级序号计算 / 拖拽排序 | P0 |
| BOM 审批流程 | 提交审批 → Flowable → 发布 | P1 |
| BOM 版本管理 | 保存版本 / 复制 / 废止 | P1 |
| BOM 材料定额 | 材料汇总视图 | P2 |
| 前端: BOM 页面重写 | 树结构 + 审批集成版本管理 + 工具栏 | P1 |

#### Sprint 3.2: 工艺管理 (第 15-16 周)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 数据库迁移脚本 (prc_* 表) | prc_process_route, prc_operation, prc_man_hour, prc_operation_material, prc_template, prc_term, prc_tool | P0 |
| 工艺路线 CRUD | 创建/编辑/版本管理 | P0 |
| 工序管理 | 工序 CRUD / 排序 / 工作中心关联 | P0 |
| 工时定额 | 每工序工时定额 CRUD | P1 |
| 材料定额 | 每工序材料定额 CRUD | P1 |
| 工艺审批 | 提交审批 → Flowable → 发布 | P1 |
| 工艺库/术语库/工具库 | 参考数据管理 | P2 |
| 前端: 工艺页面增强 | 工序表 + 工时/材料定额子标签页 | P1 |

#### Sprint 3.3: 配置管理 - 三库架构 (第 17-18 周)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 数据库迁移脚本 (cfg_* 表) | 13 张配置表全部创建 | P0 |
| 模块库 | 分类树 → 模块 → 规格 → 参数 (4级 CRUD) | P0 |
| 工艺库 | 分类树 → 典型工艺 | P1 |
| 订单库 | 分类树 → 订单产品 → 产品BOM关联 | P1 |
| 规格发布审批 | 规格提交 → Flowable 审批 → 发布 | P1 |
| 前端: 三库配置管理 | `ModuleLibraryManager` / `ProcessLibraryManager` / `OrderLibraryManager` | P1 |

---

### Phase 4: 驾驶舱与优化 (第 7 月)

**目标**: 完成驾驶舱大屏、统计模块、前端全面适配

#### Sprint 4.1: 驾驶舱与统计 (第 19-20 周)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 数据库迁移脚本 (sta_* 表) | sta_dashboard_data, sta_task_statistics, sta_man_hour_ranking | P1 |
| 驾驶舱数据接口 | 完工/超期/风险/当期任务/工时排行/按期率排行 | P1 |
| 统计查询 | 按项目/部门/人员多维统计 + CSV/Excel 导出 | P2 |
| 前端: 驾驶舱大屏 | 深蓝背景数据大屏 + ECharts 面板 | P1 |
| 前端: 文件夹管理 | 文件页面新增 FolderTree | P2 |

#### Sprint 4.2: 测试与优化 (第 21-22 周)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 后端单元测试 | JUnit 5 + Spring Test (所有 Service + Controller) | P0 |
| 前端测试更新 | Vitest 测试适配新 API + 新组件测试 | P1 |
| E2E 测试更新 | Playwright 适配新接口 | P1 |
| 性能优化 | Redis 缓存热点数据 / 慢查询优化 / 分页优化 | P2 |
| 安全加固 | SQL 注入防护 / XSS / CSRF / 接口限流 | P1 |

---

### Phase 5: 数据迁移与切换 (第 8-9 月)

#### Sprint 5.1: 数据迁移 (第 23-24 周)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 迁移脚本开发 | UUID → BIGSERIAL 映射 / 邻接表 → 物化路径 | P0 |
| 数据校验 | 迁移前后数据一致性校验 | P0 |
| 回滚方案 | 迁移失败时的快速回滚策略 | P0 |

#### Sprint 5.2: 切换上线 (第 25-26 周)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 灰度发布 | 部分用户先行切换 | P0 |
| 前端适配验证 | 所有页面功能回归 | P0 |
| 监控部署 | 日志/告警/APM | P1 |
| 旧系统下线 | NestJS 服务停止 + 数据归档 | P1 |

---

## 四、风险评估与应对

| 风险 | 概率 | 影响 | 应对策略 |
|------|------|------|---------|
| **PK 类型变更 (UUID→BIGSERIAL)** | 高 | 高 | 先建映射表 `id_mapping(uuid, bigint)`，迁移时双向查询 |
| **Flowable 事务一致性** | 高 | 高 | 事件监听 + 补偿机制；审批状态异步对账 |
| **审批嵌入复杂度** | 高 | 高 | 抽象 `ApprovalEmbed` 通用组件，统一嵌入模式 |
| **数据迁移数据丢失** | 中 | 高 | 迁移前完整备份 + 分批迁移 + 数据校验脚本 |
| **前端适配工作量** | 中 | 中 | 保持前端框架不变，仅更新 API 层和数据模型 |
| **BOM 树结构迁移** | 中 | 中 | 分步: 先建 `bom_bom` → 再迁移 `bom_item` → 最后校验 |
| **Flowable 学习曲线** | 中 | 中 | 参考重构方案中的 BPMN 示例，先跑通阶段门场景 |
| **三库配置范围蔓延** | 中 | 中 | 严格按 Sprint 目标交付，配置数据预置 (seed) |

---

## 五、工作量估算

### 5.1 后端工作量

| 模块 | 人天 | 说明 |
|------|------|------|
| 项目脚手架 + 公共组件 | 10 | Spring Boot 多模块 + Docker + 通用组件 |
| 认证与用户管理 | 8 | JWT + Security + RBAC |
| 项目管理 | 10 | 阶段 + 里程碑 + 阶段门 + 成员 + 甘特图 |
| 任务管理 | 12 | 多类型任务 + 快速创建 + 统计 + 关注 + 评论 + 活动 |
| Flowable 审批引擎 | 15 | 引擎集成 + BPMN + 5个审批场景 + 动态审批人 + 监听器 |
| BOM 管理 | 10 | 主表 + 树结构 + 版本管理 + 审批 |
| 工艺管理 | 10 | 路线 + 工序 + 工时 + 材料 + 审批 |
| 配置管理 (三库) | 12 | 13 张表 + 模块库 + 工艺库 + 订单库 |
| 文件管理 (MinIO) | 5 | 上传/下载/版本/文件夹 |
| 驾驶舱与统计 | 6 | 统计接口 + 预计算 |
| 数据库迁移脚本 | 8 | DDL + DML + 数据校验 |
| 后端测试 | 15 | JUnit 5 全覆盖 |
| **后端小计** | **~121 人天** | |

### 5.2 前端工作量

| 区域 | 人天 | 说明 |
|------|------|------|
| WebSocket 迁移 (STOMP) | 2 | 替换 Socket.IO → STOMP/SockJS |
| API 服务层更新 | 3 | 17 个 service 文件适配 |
| 状态管理更新 | 2 | 8 个 Zustand store 适配 |
| 驾驶舱大屏 | 5 | 深蓝主题 + ECharts 面板 |
| 项目页面增强 | 4 | 阶段树 + 阶段门 + 里程碑 |
| 任务页面增强 | 5 | 8 种类型表单 + 快速创建 + 统计卡片 |
| BOM 页面重写 | 4 | 树重构 + 审批版本管理 |
| 工艺页面增强 | 3 | 工序表 + 工时/材料 |
| 审批组件重构 | 4 | 多场景嵌入 + STOMP 事件 |
| 三库配置页面 | 6 | 模块库 + 工艺库 + 订单库 |
| 文件夹管理 | 2 | FolderTree 组件 |
| 前端测试更新 | 8 | 130+ 测试文件适配 |
| **前端小计** | **~48 人天** | |

### 5.3 总计

| 类别 | 人天 | 等效 (3人团队) |
|------|------|----------------|
| 后端 | 121 | ~8 月 |
| 前端 | 48 | ~3.2 月 |
| **总计** | **~169 人天** | **~9 月** (含并行开发) |

---

## 六、团队配置建议

| 角色 | 人数 | 职责 |
|------|------|------|
| 后端开发 | 2 | Spring Boot + Flowable + MyBatis-Plus |
| 前端开发 | 1 | React + Ant Design Pro + STOMP |
| 全栈/架构 | 1 | 技术选型 + 数据迁移 + 审核 |

---

## 七、关键技术决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 架构风格 | 模块化单体 (非微服务) | 团队规模小、业务域耦合度高、后期可拆分 |
| ORM | MyBatis-Plus | Java 生态成熟、SQL 可控、多表关联灵活 |
| 审批引擎 | Flowable 7.x (嵌入式) | 功能完整、社区活跃、支持 BPMN 2.0 |
| WebSocket | STOMP over SockJS | Spring Boot 原生支持、与 Flowable 事件集成方便 |
| 文件存储 | MinIO | S3 兼容、私有化部署、无外部依赖 |
| 缓存 | Redis | Session 存储 + 热点缓存 + 发布订阅 |
| PK 策略 | BIGSERIAL | 工业系统惯例、索引性能好、BOM 树路径友好 |
| 多租户 | 行级隔离 (tenant_id) | 低成本实现、适合 SaaS 演进 |

---

## 八、实施原则

1. **TDD 驱动**: 先写测试再写实现，所有功能点必须测试验证通过
2. **渐进式迁移**: 保持前端不变，后端逐步切换，通过 API 网关路由新旧服务
3. **数据先行**: 先建表、迁移数据、校验，再开发业务逻辑
4. **审批为轴**: Flowable 是核心枢纽，先跑通阶段门场景再扩展
5. **前端最小改动**: 保持 React + Vite + Zustand 技术栈不变，仅更新 API 层和数据模型
6. **兼容性验证**: 每个 Sprint 结束前，前端所有页面功能必须正常可用

---

**文档结束**

*本方案基于当前代码库 (29 Prisma 模型 / 19 NestJS 模块 / 2099 测试用例) 与目标架构 (Spring Boot + Flowable / 46 表 / 三库配置) 的完整差距分析，可直接指导开发团队执行重构工作。*
