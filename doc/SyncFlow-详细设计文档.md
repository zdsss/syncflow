# SyncFlow 详细设计文档

> **编写日期**：2026-05-09
> **文档状态**：最终版
> **技术栈**：Spring Boot 3.3 + Java 21 + MyBatis-Plus 3.5 + Flowable 7.x + PostgreSQL 16
> **适用范围**：后端开发、前端开发、架构设计、数据库设计、API 对接、UI/UX 实现
> **需求来源**：`260509协同项目管理逻辑描述.docx`（最终版产品需求）

---

## 文档信息

| 属性 | 值 |
|------|-----|
| 产品名称 | SyncFlow 超简协同项目管理系统 |
| 文档版本 | v3.0（最终版） |
| 创建日期 | 2026-05-09 |
| 前版基础 | v2.0（2026-05-07） |
| 后端框架 | Spring Boot 3.3 + Java 21 |
| ORM 框架 | MyBatis-Plus 3.5 |
| 审批引擎 | Flowable 7.x（嵌入式） |
| 数据库 | PostgreSQL 16 |
| 缓存 | Redis 7 |
| 文件存储 | MinIO |
| 前端框架 | Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui |

---

## 目录

- [第1章：产品概述](#第1章产品概述)
- [第2章：系统架构](#第2章系统架构)
- [第3章：数据库设计](#第3章数据库设计)
- [第4章：认证与系统管理模块 syncflow-admin](#第4章认证与系统管理模块-syncflow-admin)
- [第5章：项目管理模块 syncflow-project](#第5章项目管理模块-syncflow-project)
- [第6章：任务管理模块 syncflow-task](#第6章任务管理模块-syncflow-task)
- [第7章：BOM管理模块 syncflow-bom](#第7章bom管理模块-syncflow-bom)
- [第8章：工艺管理模块 syncflow-process](#第8章工艺管理模块-syncflow-process)
- [第9章：三库配置模块 syncflow-config](#第9章三库配置模块-syncflow-config)
- [第10章：审批引擎模块 syncflow-workflow](#第10章审批引擎模块-syncflow-workflow--统一审批架构)
- [第11章：文件管理模块 syncflow-file](#第11章文件管理模块-syncflow-file)
- [第12章：驾驶舱与统计模块 syncflow-statistics](#第12章驾驶舱与统计模块-syncflow-statistics)
- [第13章：消息通知模块 syncflow-message](#第13章消息通知模块syncflow-message)
- [第14章：错误处理与异常设计](#第14章错误处理与异常设计)
- [第15章：安全设计](#第15章安全设计)
- [第16章：实时通信设计](#第16章实时通信设计)
- [第17章：前端交互设计](#第17章前端交互设计)
- [第18章：实施计划](#第18章实施计划)

---
# 第1章：产品概述

## 1.1 产品定位

SyncFlow 是面向**工业制造领域**的协同项目管理平台，专为制造业、新能源、汽车行业（尤其是电动汽车/电池领域）的复杂工程项目管理而设计。与 Jira、Trello、飞书项目等通用工具不同，SyncFlow 深度契合工业级项目的特殊需求。

| 维度 | 通用项目管理工具 | SyncFlow |
|------|----------------|----------|
| 项目层级 | 扁平或简单二级结构 | 多层级项目树（可嵌套 7 层以上） |
| 项目阶段 | 自定义标签 | 预置工业标准阶段模型（调查/概念/计划/开发/测试/量产） |
| 协同对象 | 以软件开发团队为主 | 跨部门协同（设计/产品/研发/测试/工艺/管理层） |
| 专业模块 | 无 | 内置 BOM 管理、工艺管理、三库配置等工业专用模块 |
| 审批引擎 | 简单审批或无 | Flowable 7.x BPMN 2.0 嵌入式引擎，支持多级审批链 |

## 1.2 目标用户

| 角色 | 所属部门 | 核心诉求 | 使用频率 |
|------|---------|---------|---------|
| 项目经理 | 项目管理部 | 全局掌控项目进度、资源调配、风险管控 | 每日高频 |
| 产品工程师 | 产品部 | 需求管理、BOM 维护、产品配置 | 每日高频 |
| 设计工程师 | 设计部 | 设计任务管理、文件协同、版本追踪 | 每日高频 |
| 研发工程师 | 研发部 | 开发任务领取、工时反馈、测试进度 | 每日高频 |
| 测试工程师 | 测试部 | 测试计划管理、缺陷追踪、测试报告 | 按项目阶段 |
| 工艺工程师 | 工艺部 | 工艺流程管理、工艺文件维护、材料定额 | 按项目阶段 |
| 部门主管 | 各部门 | 部门任务分配、团队负荷监控 | 每日中频 |
| 高管/管理层 | 总经办 | 项目总览、战略决策、跨项目管控 | 每周/关键节点 |

## 1.3 核心价值

| 价值点 | 说明 |
|--------|------|
| **任务协同** | 打破部门壁垒，实现跨部门、跨团队的任务流转与协同，支持任务的创建、分配、转派、依赖关联 |
| **进度可视化** | 甘特图、看板、泳道图等多种视图直观展示项目进度，中控看板一屏总览全局 |
| **多层级项目管控** | 支持多层级项目树结构，从整车到零部件层层细分，每层独立管控又可汇总统计 |
| **审批工作流** | 基于 Flowable BPMN 2.0 的 7 种审批场景（BOM/阶段门/工艺/规格/文件/变更/通用），支持动态审批人、多级审批链、委托/抄送 |

## 1.4 v1 到 v2 演进

| 维度 | v1（NestJS + Prisma，已归档） | v2（Spring Boot + MyBatis-Plus，现行） |
|------|-------------------------------|---------------------------------------|
| 后端框架 | NestJS 11 + Node.js 20 | Spring Boot 3.3 + Java 21 |
| ORM | Prisma 5 | MyBatis-Plus 3.5 |
| 数据库模型 | 29 模型（UUID 主键） | 38+ 张表（BIGSERIAL 主键） |
| 审批引擎 | 自建 Approval + Chain 模型 | Flowable 7.x（BPMN 2.0） |
| 文件存储 | 本地磁盘 | MinIO（S3 兼容） |
| 缓存 | 无 | Redis 7 |
| WebSocket | Socket.IO | STOMP over SockJS |
| 多租户 | 无 | tenant_id 行级隔离 |
| 主键策略 | UUID | BIGSERIAL + 物化路径 |
| 代码结构 | 单体 NestJS 模块 | 11 个 Maven 子模块的模块化单体 |
| 数据库迁移 | Prisma Migrate | Flyway（V1-V6 SQL 脚本） |
| BPMN 流程定义 | 无 | 6 个 BPMN 文件，启动时自动部署 |

---

# 第2章：系统架构

## 2.1 整体架构图

SyncFlow v2 采用前后端分离的模块化单体架构，分层设计如下：

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            前端层 Frontend                                   │
│    Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui          │
│    Recharts (图表) + STOMP over SockJS (WebSocket)                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                          HTTP / WebSocket                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                           后端层 Backend                                      │
│                      Spring Boot 3.3 模块化单体                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ admin   │ │ project │ │  task   │ │  bom    │ │ process │              │
│  │ 认证+管理│ │ 项目管理 │ │ 任务管理 │ │ BOM管理 │ │ 工艺管理 │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ config  │ │  file   │ │workflow │ │statistics│ │ message │              │
│  │ 三库配置 │ │ 文件管理 │ │ 审批引擎 │ │ 统计驾驶舱│ │ 消息通知 │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                          ┌─────────┐                                         │
│                          │ common  │                                         │
│                          │ 公共组件 │                                         │
│                          └─────────┘                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                        工作流引擎 Workflow                                    │
│                 Flowable 7.x 嵌入式引擎 + 6 个 BPMN 定义                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                         数据层 Data & Storage                                 │
│   PostgreSQL 16 (主数据库) + Redis 7 (缓存/会话) + MinIO (文件存储)           │
│   Flyway (数据库迁移 V1-V6)                                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**请求处理流程**：

1. 前端 Next.js 应用（端口 3000）通过 API Routes 代理请求到后端（端口 8088）
2. 后端 Spring Boot 处理 HTTP 请求，经过 JWT 认证过滤器验证身份
3. 请求路由到对应业务模块的 Controller → Service → MyBatis-Plus Mapper
4. 审批相关操作通过 syncflow-workflow 模块调用 Flowable 引擎
5. 文件操作通过 syncflow-file 模块与 MinIO 交互
6. 实时消息通过 STOMP over SockJS 推送到前端

## 2.2 模块划分

后端采用 Maven 多模块结构，共 12 个子模块：

| 模块 | 包路径 | 职责 | 核心实体 |
|------|--------|------|---------|
| syncflow-common | com.syncflow.common | 公共组件：Result 统一响应、ErrorCode、全局异常处理、工具类、BaseEntity | BaseEntity |
| syncflow-admin | com.syncflow.admin | 认证 + 系统管理：JWT 认证、用户/部门/角色/RBAC 权限管理 | User, Department, Role, UserRole, Permission |
| syncflow-project | com.syncflow.project | 项目管理：项目树（物化路径）、阶段、阶段门审批、里程碑、甘特图 | Project, ProjectPhase, StageGate, Milestone, ProjectMember |
| syncflow-task | com.syncflow.task | 任务管理：9 种任务类型、快速创建解析、统计、评论、关注、活动日志 | Task, TaskParticipant, TaskWatcher, TaskComment, TaskActivity |
| syncflow-bom | com.syncflow.bom | BOM 管理：BOM 树结构、版本管理、审批发布 | Bom, BomItem, BomVersion |
| syncflow-process | com.syncflow.process | 工艺管理：工艺路线、工序管理、工时定额、材料定额 | ProcessRoute, Operation, ManHour, OperationMaterial |
| syncflow-config | com.syncflow.config | 三库配置：模块库（分类/模块/规格/参数）、订单库（分类/产品）、工艺库 | ModuleCategory, Module, ModuleSpec, SpecParam, OrderCategory, OrderProduct, ProductBom |
| syncflow-file | com.syncflow.file | 文件管理：MinIO 上传下载、文件夹管理、版本控制、SHA-256 校验 | FileEntity, Folder, FileVersion |
| syncflow-workflow | com.syncflow.workflow | 审批引擎：Flowable BPMN 集成、动态审批人解析、委托/抄送、6 种审批场景 | BusinessObject, ApprovalComment, ApprovalConfig, Delegation, CcRecord |
| syncflow-statistics | com.syncflow.statistics | 驾驶舱：统计汇总、工时排行、按期完工率排行 | DashboardData, TaskStatistics, ManHourRanking |
| syncflow-message | com.syncflow.message | 消息通知：WebSocket（STOMP）实时推送、通知设置 | Notification, NotificationSetting |
| syncflow-app | com.syncflow.app | 主启动模块：Spring Boot Application、Flyway 迁移脚本（V1-V6）、数据库初始化 | — |

**模块间依赖关系**：

```
syncflow-app
  ├── syncflow-admin
  ├── syncflow-project
  ├── syncflow-task
  ├── syncflow-bom
  ├── syncflow-process
  ├── syncflow-config
  ├── syncflow-file
  ├── syncflow-workflow
  ├── syncflow-statistics
  ├── syncflow-message
  └── syncflow-common（所有模块均依赖）
```

## 2.3 前端架构

| 维度 | 技术选型 | 说明 |
|------|---------|------|
| 框架 | Next.js 16 + React 19 + TypeScript | App Router + Server Components |
| 样式 | Tailwind CSS 4 | 工具类优先，CSS 变量主题系统 |
| UI 组件库 | shadcn/ui (Radix UI) | 无头组件，完全可控，60+ 组件 |
| 状态管理 | React useState + Server State | 页面级状态，无全局 Store |
| 路由 | Next.js App Router | 文件系统路由，自动代码分割 |
| 图表 | Recharts | 统计图表、驾驶舱可视化 |
| 表单 | React Hook Form + Zod | 类型安全的表单验证 |
| 实时通信 | STOMP over SockJS | WebSocket 双向通信，任务状态变更、审批通知实时推送 |
| 测试 | Vitest + @testing-library/react | 单元测试 |

**前端代码结构**：

| 目录 | 说明 | 文件数 |
|------|------|--------|
| src/app/ | 6 个页面（workspace/dashboard/project/files/bom/config） + API Routes | 20+ |
| src/components/ui/ | shadcn/ui 组件库 | 60+ |
| src/components/shared/ | 布局组件（Sidebar, TopBar, TaskQuickBar） | 3 |
| src/lib/ | 工具函数 + Mock 数据 | 3 |
| src/hooks/ | 自定义 Hooks | 1 |
| src/db/ | Drizzle ORM（schema, seed, types） | 4 |

## 2.4 基础设施

### 2.4.1 Docker Compose 部署

```yaml
# docker-compose.yml（位于 syncflow-java/ 目录）
services:
  postgres:
    image: postgres:16
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: syncflow
      POSTGRES_USER: syncflow
      POSTGRES_PASSWORD: syncflow123

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  minio:
    image: minio/minio
    ports: ["9000:9000", "9001:9001"]
    command: server /data --console-address ":9001"
```

### 2.4.2 认证安全

- **JWT 认证**：基于 jjwt 库实现，Access Token 有效期 15 分钟，Refresh Token 有效期 7 天
- **密码加密**：BCrypt 哈希算法
- **权限模型**：RBAC（Role-Based Access Control），用户 → 角色 → 权限，支持 GLOBAL/DEPT/PROJECT 三种作用域
- **多租户**：所有核心表包含 tenant_id 字段，行级数据隔离

### 2.4.3 Flowable 工作流引擎

- **引擎类型**：嵌入式 Flowable 7.x，与 Spring Boot 应用运行在同一 JVM
- **流程定义**：6 个 BPMN 文件（位于 syncflow-workflow/src/main/resources/processes/），应用启动时自动部署
  - `bom_approval.bpmn` — BOM 审批（技术审核 → 工艺审核 → 质量审核 → 项目经理批准）
  - `stage_gate_approval.bpmn` — 阶段门审批（启动审批 → 批准）
  - `process_approval.bpmn` — 工艺路线审批（技术审核 → 工艺审核）
  - `module_spec_approval.bpmn` — 模块规格审批（部门审核 → 技术审核）
  - `change_approval.bpmn` — 变更审批（影响评估 → 技术审核 → 项目经理批准）
  - `file_approval.bpmn` — 文件审批（文件审核）
- **审批人解析**：通过 wf_approval_config 表配置动态审批人规则，支持 PROJECT_ROLE/USER/DEPARTMENT/DYNAMIC 四种规则类型

### 2.4.4 数据库迁移

采用 Flyway 管理数据库版本，共 6 个迁移脚本：

| 版本 | 文件 | 内容 |
|------|------|------|
| V1 | V1__init_schema.sql | 系统表（5张）+ 项目表（5张）+ 任务表（5张）+ 业务编码表（1张），共 16 张表 |
| V2 | V2__bom_process_config_tables.sql | BOM表（3张）+ 工艺表（5张，含 prc_operation_material）+ 配置表（8张），共 14 张表 |
| V3 | V3__statistics_tables.sql | 统计表（3张）：sta_dashboard_data, sta_task_statistics, sta_man_hour_ranking |
| V4 | V4__notification_tables.sql | 通知表（2张）：notification, notification_setting |
| V5 | V5__file_tables.sql | 文件表（3张）：fil_file, fil_folder, fil_file_version |
| V6 | V6__approval_config_seed.sql | 审批配置表（1张）wf_approval_config + 审批路由种子数据（6种场景） |

---

# 第3章：数据库设计

## 3.1 表清单总览

系统共 **42 张业务表**，按模块组织如下：

### 系统表（sys_*）— 5 张

| 表名 | 说明 | 关键特征 |
|------|------|---------|
| sys_user | 用户 | BIGSERIAL PK, BCrypt 密码, tenant_id 行级隔离, 软删除 |
| sys_department | 部门 | 自关联树形结构, parent_id + sort_order |
| sys_role | 角色 | RBAC 角色定义, code 唯一标识 (ADMIN/PM/ENGINEER 等) |
| sys_user_role | 用户角色关联 | 多对多, 支持 scope_type (GLOBAL/DEPT/PROJECT) + scope_id |
| sys_permission | 权限 | 菜单/按钮/API 三种类型, 树形结构, 支持 path 和 icon |

### 项目表（prj_*）— 5 张

| 表名 | 说明 | 关键特征 |
|------|------|---------|
| prj_project | 项目 | 物化路径 parent_path, 支持 7 级嵌套, owner_id, progress, tenant_id |
| prj_phase | 项目阶段 | 6 阶段: 调查/概念/计划/开发/测试/量产, seq_no 排序 |
| prj_stage_gate | 阶段门审批 | flow_instance_id + task_id 关联 Flowable 流程 |
| prj_milestone | 里程碑 | 类型: MILESTONE/DELIVERABLE/REVIEW, 支持内嵌审批流程 |
| prj_project_member | 项目成员 | 多对多, project_role (PM/ENGINEER/TESTER/OBSERVER) |

### 任务表（tsk_*）— 5 张

| 表名 | 说明 | 关键特征 |
|------|------|---------|
| tsk_task | 任务 | 9 种类型, parent_path 物化路径, 冗余计数字段, tenant_id |
| tsk_task_participant | 任务参与者 | 角色: COLLABORATOR/REVIEWER/APPROVER |
| tsk_task_watcher | 任务关注者 | 关注任务变更通知 |
| tsk_task_comment | 任务评论 | mentioned_users 支持 @提及 |
| tsk_task_activity | 任务活动日志 | 审计追踪, 字段级 diff (old_value → new_value) |

### BOM 表（bom_*）— 3 张

| 表名 | 说明 | 关键特征 |
|------|------|---------|
| bom_bom | BOM 主表 | 版本管理, is_latest 标识, flow_instance_id 审批关联 |
| bom_item | BOM 明细 | 树形结构 (parent_id + path), 物料属性, source_type |
| bom_version | BOM 版本历史 | bom_id + version 联合唯一约束 |

### 工艺表（prc_*）— 5 张

| 表名 | 说明 | 关键特征 |
|------|------|---------|
| prc_process_route | 工艺路线 | 关联 BOM 和项目, 版本管理, 冗余汇总字段 |
| prc_operation | 工序 | 按 seq_no 排序, 物料信息, 工作中心 |
| prc_man_hour | 工时定额 | 关联工序, 工种/工时/人数/is_critical |
| prc_operation_material | 材料定额 | 关联工序, 物料编码/规格/用量/损耗率 |

### 配置表（cfg_*）— 8 张

| 表名 | 说明 | 关键特征 |
|------|------|---------|
| cfg_module_category | 模块分类 | 树形结构, path 物化路径 |
| cfg_module | 模块 | 关联分类, code 唯一 |
| cfg_module_spec | 模块规格 | 截面/材质/壁厚/连接类型, 审批流程关联 |
| cfg_spec_param | 规格参数 | 参数类型/控件类型/默认值/选项/范围 |
| cfg_order_category | 订单分类 | 树形结构 |
| cfg_order_product | 订单产品 | 关联分类 |
| cfg_product_bom | 产品 BOM 关联 | 多对多, is_default 标识 |

### 文件表（fil_*）— 3 张

| 表名 | 说明 | 关键特征 |
|------|------|---------|
| fil_file | 文件 | MinIO 存储, SHA-256 校验, biz_type/biz_id 业务关联, 锁定机制 |
| fil_folder | 文件夹 | 树形结构, project_id 关联 |
| fil_file_version | 文件版本 | 版本号自增, change_summary |

### 审批表（wf_*）— 3 张 + Flowable 系统表

| 表名 | 说明 | 关键特征 |
|------|------|---------|
| wf_business_object | 审批业务绑定 | 关联业务实体与 Flowable 流程实例 |
| wf_approval_comment | 审批意见 | 审批人的评审意见记录 |
| wf_approval_config | 审批配置 | 动态审批人路由规则, 支持 SpEL 表达式 |

> Flowable 引擎自动创建的系统表（ACT_*）不在此列出，由 Flowable 引擎自行管理。

### 统计表（sta_*）— 3 张

| 表名 | 说明 | 关键特征 |
|------|------|---------|
| sta_dashboard_data | 驾驶舱数据 | data_type + dimension 多维度统计 |
| sta_task_statistics | 任务统计 | project_id + user_id + stat_date 联合唯一 |
| sta_man_hour_ranking | 工时排行 | 按排名日期快照 |

### 通知表 — 2 张

| 表名 | 说明 | 关键特征 |
|------|------|---------|
| notification | 通知 | 类型: TASK/APPROVAL/SYSTEM/COMMENT/MENTION, is_read + read_at |
| notification_setting | 通知设置 | 每用户一条, 任务提醒/邮件/应用内/短信开关, 提醒天数 |

### 业务编码表 — 1 张

| 表名 | 说明 | 关键特征 |
|------|------|---------|
| biz_code_sequence | 业务编码序列 | code_prefix + biz_date 联合唯一, 原子递增生成业务编号 |

## 3.2 核心表设计

### 3.2.1 sys_user

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL PK | 主键 |
| username | VARCHAR(50) UNIQUE | 登录用户名 |
| password | VARCHAR(255) | BCrypt 哈希密码 |
| real_name | VARCHAR(100) | 显示姓名 |
| phone | VARCHAR(20) | 手机号 |
| email | VARCHAR(100) | 邮箱 |
| avatar | VARCHAR(500) | 头像 URL |
| status | SMALLINT | 1=启用, 0=停用, -1=锁定 |
| tenant_id | BIGINT | 租户标识（多租户） |
| dept_id | BIGINT FK | 所属部门 |
| last_login_at | TIMESTAMP | 最后登录时间 |
| created_at / updated_at / deleted_at | TIMESTAMP | 审计字段 + 软删除 |

### 3.2.2 prj_project

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL PK | 主键 |
| name | VARCHAR(200) | 项目名称 |
| code | VARCHAR(50) UNIQUE | 项目编码 |
| description | TEXT | 项目描述 |
| owner_id | BIGINT FK | 项目负责人 |
| project_type | VARCHAR(50) | 项目分类: R&D/PRODUCTION/MAINTENANCE |
| status | SMALLINT | 1=未开始, 2=进行中, 3=已完成, 4=已延期, 0=已取消 |
| priority | SMALLINT | 1=紧急, 2=高, 3=中, 4=低 |
| progress | INT | 完成百分比 0-100 |
| planned_start / planned_end | DATE | 计划日期 |
| actual_start / actual_end | DATE | 实际日期 |
| parent_id | BIGINT FK | 父项目（树形） |
| parent_path | VARCHAR(500) | 物化路径（如 "/1/5/12/"） |
| dept_id | BIGINT FK | 所属部门 |
| tenant_id | BIGINT | 租户标识 |
| created_at / updated_at / deleted_at | TIMESTAMP | 审计字段 + 软删除 |

### 3.2.3 tsk_task

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL PK | 主键 |
| task_no | VARCHAR(50) UNIQUE | 自动生成编号（如 TSK-20260506-0001） |
| title | VARCHAR(200) | 任务标题 |
| description | TEXT | 详细描述（富文本） |
| type | VARCHAR(30) | 任务类型（9 种，见 6.2 节） |
| project_id | BIGINT FK | 所属项目 |
| phase_id | BIGINT FK | 所属阶段 |
| milestone_id | BIGINT FK | 关联里程碑 |
| parent_id / parent_path | BIGINT / VARCHAR(500) | 父任务树形 + 物化路径 |
| status | SMALLINT | 1=未开始, 2=进行中, 3=暂停, 4=已完成, 5=已延期, 6=已取消 |
| progress | INT | 进度 0-100 |
| assignee_id | BIGINT FK | 负责人 |
| reporter_id | BIGINT FK | 创建人 |
| planned_start / planned_end | DATE | 计划日期 |
| planned_hours / planned_days | DECIMAL / INT | 计划工时/工期 |
| actual_start / actual_end | DATE | 实际日期 |
| actual_hours | DECIMAL | 实际工时 |
| due_date | DATE | 硬截止日期 |
| is_overdue / is_warning | BOOLEAN | 冗余标记：超期/预警 |
| tags | VARCHAR(500) | 逗号分隔标签 |
| flow_instance_id / task_id_in_flow | VARCHAR(100) | Flowable 审批关联 |
| comment_count / attachment_count / watcher_count | INT | 冗余计数 |
| tenant_id | BIGINT | 租户标识 |
| created_at / updated_at / deleted_at | TIMESTAMP | 审计字段 + 软删除 |

### 3.2.4 bom_bom

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL PK | 主键 |
| bom_no | VARCHAR(50) UNIQUE | 自动生成编号（如 BOM-20260506-0001） |
| name | VARCHAR(200) | BOM 名称 |
| version | VARCHAR(20) | 版本号（默认 "1.0"） |
| project_id | BIGINT FK | 关联项目 |
| product_code / product_name | VARCHAR | 产品编码/名称 |
| status | SMALLINT | 1=编辑中, 2=待审批, 3=已发布, 4=已锁定, 5=已取消 |
| flow_instance_id | VARCHAR(100) | 审批流程实例 |
| is_latest | BOOLEAN | 是否最新版本 |
| parent_bom_id | BIGINT FK | 父 BOM（派生 BOM） |
| total_items / total_weight | INT / DECIMAL | 冗余汇总 |
| created_by / approved_by | BIGINT FK | 创建人/审批人 |
| tenant_id | BIGINT | 租户标识 |
| created_at / updated_at / deleted_at | TIMESTAMP | 审计字段 + 软删除 |

### 3.2.5 prc_process_route

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL PK | 主键 |
| route_no | VARCHAR(50) UNIQUE | 自动生成编号 |
| name | VARCHAR(200) | 路线名称 |
| version | VARCHAR(20) | 版本号 |
| bom_id | BIGINT FK | 关联 BOM |
| project_id | BIGINT FK | 关联项目 |
| product_code / product_name | VARCHAR | 产品编码/名称 |
| status | SMALLINT | 1=编辑中, 2=待审批, 3=已发布, 4=已锁定, 5=已取消 |
| flow_instance_id | VARCHAR(100) | 审批流程实例 |
| is_latest | BOOLEAN | 是否最新版本 |
| total_operations / total_man_hours / total_material_cost | INT / DECIMAL / DECIMAL | 冗余汇总 |
| created_by | BIGINT FK | 创建人 |
| tenant_id | BIGINT | 租户标识 |
| created_at / updated_at / deleted_at | TIMESTAMP | 审计字段 + 软删除 |

### 3.2.6 cfg_module_spec

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL PK | 主键 |
| module_id | BIGINT FK | 所属模块 |
| spec_name | VARCHAR(100) | 规格名称 |
| cross_section | VARCHAR(100) | 截面类型 |
| material | VARCHAR(100) | 材质 |
| wall_thickness | DECIMAL | 壁厚 |
| connection_type | VARCHAR(100) | 连接方式 |
| spec_code | VARCHAR(50) | 规格编码 |
| status | SMALLINT | 1=草稿, 2=已发布 |
| flow_instance_id | VARCHAR(100) | 审批流程实例 |
| created_by | BIGINT FK | 创建人 |
| created_at / updated_at | TIMESTAMP | 审计字段 |

### 3.2.7 fil_file

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL PK | 主键 |
| file_no | VARCHAR(50) UNIQUE | 文件编号 |
| name | VARCHAR(255) | 文件名 |
| original_name | VARCHAR(255) | 原始文件名 |
| extension / mime_type | VARCHAR | 扩展名/MIME 类型 |
| size | BIGINT | 文件大小（字节） |
| storage_path | VARCHAR(500) | MinIO 存储路径 |
| bucket | VARCHAR(100) | MinIO 桶名 |
| check_sum | VARCHAR(64) | SHA-256 校验和 |
| project_id | BIGINT FK | 关联项目 |
| biz_type / biz_id | VARCHAR / BIGINT | 业务关联（TASK/BOM/PROCESS 等） |
| version / is_latest | INT / BOOLEAN | 版本管理 |
| status | SMALLINT | 1=正常, 0=已删除 |
| flow_instance_id | VARCHAR(100) | 审批流程 |
| locked_by / locked_at | BIGINT / TIMESTAMP | 文件锁定 |
| uploader_id | BIGINT FK | 上传人 |
| tenant_id | BIGINT | 租户标识 |
| created_at / updated_at / deleted_at | TIMESTAMP | 审计字段 + 软删除 |

### 3.2.8 wf_business_object

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL PK | 主键 |
| object_type | VARCHAR(50) | 业务类型: BOM/STAGE_GATE/PROCESS_ROUTE/MODULE_SPEC/FILE/CHANGE |
| object_id | BIGINT | 业务实体 ID |
| flow_instance_id | VARCHAR(100) | Flowable 流程实例 ID |
| process_key | VARCHAR(100) | 流程定义 key |
| status | SMALLINT | 审批状态 |
| created_by | BIGINT FK | 发起人 |
| created_at / updated_at | TIMESTAMP | 审计字段 |

## 3.3 索引策略

### 3.3.1 系统表索引

| 索引名 | 表 | 字段 | 用途 |
|--------|-----|------|------|
| idx_sys_dept_parent | sys_department | parent_id | 部门树查询 |
| idx_sys_user_tenant | sys_user | tenant_id | 租户隔离查询 |
| idx_sys_user_dept | sys_user | dept_id | 部门下用户查询 |
| idx_sys_user_status | sys_user | status | 启用/停用筛选 |
| idx_sys_user_email | sys_user | email | 邮箱登录查询 |
| idx_sys_role_tenant | sys_role | tenant_id | 租户隔离查询 |
| idx_sys_user_role_user | sys_user_role | user_id | 用户角色查询 |
| idx_sys_user_role_role | sys_user_role | role_id | 角色成员查询 |
| idx_sys_perm_parent | sys_permission | parent_id | 权限树查询 |

### 3.3.2 项目表索引

| 索引名 | 表 | 字段 | 用途 |
|--------|-----|------|------|
| idx_prj_project_owner | prj_project | owner_id | 负责人项目查询 |
| idx_prj_project_parent | prj_project | parent_id | 项目树查询 |
| idx_prj_project_dept | prj_project | dept_id | 部门项目查询 |
| idx_prj_project_tenant | prj_project | tenant_id | 租户隔离查询 |
| idx_prj_project_status | prj_project | status | 按状态筛选项目 |
| idx_prj_project_type | prj_project | project_type | 按类型筛选项目 |
| idx_prj_phase_project | prj_phase | project_id | 项目阶段查询 |
| idx_prj_stage_gate_phase | prj_stage_gate | phase_id | 阶段门查询 |
| idx_prj_milestone_project | prj_milestone | project_id | 项目里程碑查询 |
| idx_prj_milestone_phase | prj_milestone | phase_id | 阶段里程碑查询 |
| idx_prj_member_user | prj_project_member | user_id | 用户项目成员查询 |

### 3.3.3 任务表索引

| 索引名 | 表 | 字段 | 用途 |
|--------|-----|------|------|
| idx_tsk_task_project | tsk_task | project_id | 项目任务查询（最高频） |
| idx_tsk_task_assignee | tsk_task | assignee_id | 我的任务查询 |
| idx_tsk_task_status | tsk_task | status | 按状态筛选（驾驶舱统计） |
| idx_tsk_task_type | tsk_task | type | 按类型筛选 |
| idx_tsk_task_due_date | tsk_task | due_date | 截止日期排序/超期检测 |
| idx_tsk_task_overdue | tsk_task | is_overdue | 超期任务快速查询 |
| idx_tsk_task_reporter | tsk_task | reporter_id | 创建人查询 |
| idx_tsk_task_parent | tsk_task | parent_id | 任务树查询 |
| idx_tsk_task_phase | tsk_task | phase_id | 阶段任务查询 |
| idx_tsk_task_milestone | tsk_task | milestone_id | 里程碑任务查询 |
| idx_tsk_task_tenant | tsk_task | tenant_id | 租户隔离查询 |
| idx_tsk_comment_task | tsk_task_comment | task_id | 任务评论查询 |
| idx_tsk_activity_task | tsk_task_activity | task_id | 任务活动日志查询 |

### 3.3.4 BOM/工艺/配置表索引

| 索引名 | 表 | 字段 | 用途 |
|--------|-----|------|------|
| idx_bom_bom_project | bom_bom | project_id | 项目 BOM 查询 |
| idx_bom_bom_tenant | bom_bom | tenant_id | 租户隔离查询 |
| idx_bom_bom_latest | bom_bom | is_latest | 最新版本查询 |
| idx_bom_item_bom_id | bom_item | bom_id | BOM 明细查询 |
| idx_bom_item_parent_id | bom_item | parent_id | BOM 树查询 |
| idx_prc_route_bom | prc_process_route | bom_id | BOM 工艺路线查询 |
| idx_prc_route_project | prc_process_route | project_id | 项目工艺查询 |
| idx_prc_operation_route | prc_operation | route_id | 路线工序查询 |
| idx_cfg_mod_spec_module | cfg_module_spec | module_id | 模块规格查询 |
| idx_cfg_ord_prod_category | cfg_order_product | category_id | 分类产品查询 |

### 3.3.5 文件/通知表索引

| 索引名 | 表 | 字段 | 用途 |
|--------|-----|------|------|
| idx_fil_file_project | fil_file | project_id | 项目文件查询 |
| idx_fil_file_biz | fil_file | biz_type, biz_id | 业务关联文件查询 |
| idx_fil_folder_project | fil_folder | project_id | 项目文件夹查询 |
| idx_notification_user | notification | user_id, is_read | 用户未读通知查询 |
| idx_notification_created | notification | created_at | 通知时间排序 |
| idx_wf_approval_config_type_key | wf_approval_config | object_type, process_key | 审批配置路由查询 |

---

# 第4章：认证与系统管理模块 syncflow-admin

## 4.1 模块概述

syncflow-admin 模块负责系统认证和组织管理，是整个系统的安全基石。

| 功能域 | 说明 |
|--------|------|
| JWT 认证 | 登录认证、Token 生成与刷新、登出注销 |
| 用户管理 | 用户 CRUD、状态管理（启用/停用/锁定） |
| 部门管理 | 部门树 CRUD、树形结构查询 |
| 角色管理 | 角色 CRUD、权限标识定义 |
| RBAC 权限 | 用户-角色映射、三级作用域（GLOBAL/DEPT/PROJECT） |

## 4.2 API 接口

### 4.2.1 认证接口

| 方法 | 路径 | 说明 | 请求体/参数 | 响应 |
|------|------|------|-----------|------|
| POST | /api/auth/login | 用户登录 | { username, password } | { accessToken, refreshToken, user } |
| POST | /api/auth/refresh | 刷新 Token | { refreshToken } | { accessToken, refreshToken } |
| POST | /api/auth/logout | 注销登录 | — | { success } |
| GET | /api/auth/me | 获取当前用户信息 | — | { user, roles, permissions } |

### 4.2.2 用户管理接口

| 方法 | 路径 | 说明 | 请求体/参数 |
|------|------|------|-----------|
| GET | /api/sys/users | 用户列表（分页） | ?page=&size=&keyword=&status=&deptId= |
| GET | /api/sys/users/{id} | 用户详情 | — |
| POST | /api/sys/users | 创建用户 | { username, password, realName, phone, email, deptId, status } |
| PUT | /api/sys/users/{id} | 更新用户 | { realName, phone, email, deptId, status, avatar } |
| DELETE | /api/sys/users/{id} | 删除用户（软删除） | — |
| PUT | /api/sys/users/{id}/password | 修改密码 | { oldPassword, newPassword } |
| PUT | /api/sys/users/{id}/status | 修改状态 | { status } |

### 4.2.3 部门管理接口

| 方法 | 路径 | 说明 | 请求体/参数 |
|------|------|------|-----------|
| GET | /api/sys/departments | 部门列表 | — |
| GET | /api/sys/departments/tree | 部门树形结构 | — |
| GET | /api/sys/departments/{id} | 部门详情 | — |
| POST | /api/sys/departments | 创建部门 | { name, code, parentId, sortOrder } |
| PUT | /api/sys/departments/{id} | 更新部门 | { name, code, parentId, sortOrder } |
| DELETE | /api/sys/departments/{id} | 删除部门 | — |

### 4.2.4 角色管理接口

| 方法 | 路径 | 说明 | 请求体/参数 |
|------|------|------|-----------|
| GET | /api/sys/roles | 角色列表 | ?page=&size=&keyword= |
| GET | /api/sys/roles/{id} | 角色详情 | — |
| POST | /api/sys/roles | 创建角色 | { code, name, description } |
| PUT | /api/sys/roles/{id} | 更新角色 | { name, description } |
| DELETE | /api/sys/roles/{id} | 删除角色 | — |
| GET | /api/sys/roles/{id}/permissions | 获取角色权限列表 | — |
| PUT | /api/sys/roles/{id}/permissions | 设置角色权限 | { permissionIds[] } |

## 4.3 认证流程

### 4.3.1 登录流程

```
用户输入用户名/密码
    │
    ▼
POST /api/auth/login
    │
    ▼
AuthController.login()
    │
    ▼
AuthService.authenticate()
    ├── 查找 sys_user (username)
    ├── BCrypt.matches(plainPassword, hashedPassword)
    ├── 校验用户状态 (status=1)
    ├── 更新 last_login_at
    ├── 生成 accessToken (JWT, 15min)
    └── 生成 refreshToken (JWT, 7d)
    │
    ▼
返回 { accessToken, refreshToken, user: { id, username, realName, avatar, deptId } }
```

### 4.3.2 请求认证流程

```
前端请求 API
    │
    ▼
Authorization: Bearer <accessToken>
    │
    ▼
JwtAuthenticationFilter (OncePerRequestFilter)
    ├── 从 Header 提取 Bearer Token
    ├── JwtUtils.validateToken(token) 解析 JWT
    ├── 检查 Token 是否在 Redis 黑名单中（logout 场景）
    ├── 从 JWT 中提取 userId, username, tenantId
    ├── 加载用户权限列表
    └── 设置 SecurityContextHolder (ThreadLocal)
    │
    ▼
Controller 处理请求
    │
    ▼
SecurityUtils.getCurrentUserId() 获取当前用户
```

### 4.3.3 Token 刷新流程

```
API 返回 401 (accessToken 过期)
    │
    ▼
前端自动调用 POST /api/auth/refresh
    │
    ▼
携带 refreshToken (httpOnly Cookie 或 localStorage)
    │
    ▼
AuthService.refreshToken()
    ├── 验证 refreshToken 有效性
    ├── 生成新的 accessToken + refreshToken
    └── 返回新 Token
    │
    ▼
前端用新 accessToken 重试原请求
    │
    ▼
若 refreshToken 也过期 → 跳转登录页
```

### 4.3.4 注销流程

```
POST /api/auth/logout
    │
    ▼
AuthService.logout()
    ├── 将 accessToken 加入 Redis 黑名单 (TTL = 剩余有效期)
    └── 清除 SecurityContext
    │
    ▼
前端清除本地 Token → 跳转登录页
```

## 4.4 数据模型

### 4.4.1 User（用户）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| username | String | 登录名 |
| password | String | BCrypt 哈希 |
| realName | String | 显示姓名 |
| phone | String | 手机号 |
| email | String | 邮箱 |
| avatar | String | 头像 URL |
| status | Integer | 1=启用, 0=停用, -1=锁定 |
| tenantId | Long | 租户 ID |
| deptId | Long | 部门 ID |
| lastLoginAt | LocalDateTime | 最后登录时间 |

### 4.4.2 Department（部门）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| name | String | 部门名称 |
| code | String | 部门编码（唯一） |
| parentId | Long | 上级部门 |
| sortOrder | Integer | 排序序号 |

### 4.4.3 Role（角色）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| code | String | 角色编码（唯一，如 ADMIN/PM/ENGINEER） |
| name | String | 角色名称 |
| description | String | 角色描述 |
| tenantId | Long | 租户 ID |

### 4.4.4 UserRole（用户角色关联）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| userId | Long | 用户 ID |
| roleId | Long | 角色 ID |
| scopeType | String | 作用域类型: GLOBAL/DEPT/PROJECT |
| scopeId | Long | 作用域目标 ID（DEPT 或 PROJECT） |

### 4.4.5 Permission（权限）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| code | String | 权限编码（唯一，如 project:create） |
| name | String | 显示名称 |
| type | String | 类型: MENU/BUTTON/API |
| parentId | Long | 父权限（树形） |
| path | String | 前端路由或 API 路径 |
| icon | String | 图标标识 |
| sortOrder | Integer | 排序序号 |

---

# 第5章：项目管理模块 syncflow-project

## 5.1 模块概述

syncflow-project 是 SyncFlow 的核心数据引擎，提供多层级项目树管理、阶段生命周期管理、阶段门审批、里程碑追踪和甘特图数据接口。

| 功能域 | 说明 |
|--------|------|
| 项目树 | 物化路径（parent_path）支持 7 级嵌套，高效树形查询 |
| 阶段管理 | 6 个工业标准阶段（调查→概念→计划→开发→测试→量产） |
| 阶段门审批 | 嵌入在阶段间的审批关卡，关联 Flowable 流程引擎 |
| 里程碑管理 | 里程碑/交付物/评审点三种类型，支持内嵌审批流程 |
| 甘特图数据 | 为前端甘特图组件提供结构化数据 |

## 5.2 API 接口

| 方法 | 路径 | 说明 | 请求体/参数 |
|------|------|------|-----------|
| GET | /api/projects | 项目树（树形结构） | ?parentId=&keyword=&status= |
| GET | /api/projects/{id} | 项目详情 | — |
| POST | /api/projects | 创建项目 | { name, code, description, ownerId, projectType, priority, parentId, plannedStart, plannedEnd, deptId } |
| PUT | /api/projects/{id} | 更新项目 | { name, description, ownerId, projectType, status, priority, progress, plannedStart, plannedEnd } |
| DELETE | /api/projects/{id} | 删除项目（软删除） | — |
| GET | /api/projects/{id}/phases/tree | 项目阶段树（含阶段门和里程碑） | — |
| POST | /api/projects/{id}/phases | 创建阶段 | { name, code, seqNo, plannedStart, plannedEnd } |
| PUT | /api/projects/phases/{phaseId} | 更新阶段 | { name, status, progress, plannedStart, plannedEnd } |
| GET | /api/projects/{id}/milestones | 里程碑列表 | ?phaseId=&type= |
| POST | /api/projects/{id}/milestones | 创建里程碑 | { name, type, phaseId, plannedDate, assigneeId, deliverable } |
| PUT | /api/projects/milestones/{milestoneId} | 更新里程碑 | { name, status, progress, actualDate, deliverable } |
| GET | /api/projects/{id}/gantt | 甘特图数据 | — |
| GET | /api/projects/{id}/members | 项目成员列表 | — |
| POST | /api/projects/{id}/members | 添加项目成员 | { userId, projectRole, deptId } |
| DELETE | /api/projects/{id}/members/{userId} | 移除项目成员 | — |

## 5.3 项目树设计

### 5.3.1 物化路径方案

项目树采用 **parent_path（物化路径）** 策略实现高效的层级查询：

```
prj_project 表中 parent_path 字段存储从根到当前节点的完整路径：

汽车 (id=1, parent_path="/")
  └── 新能源 (id=5, parent_path="/1/")
        └── 电池 (id=12, parent_path="/1/5/")
              └── 电池Pack (id=23, parent_path="/1/5/12/")
                    └── 电池模组 (id=31, parent_path="/1/5/12/23/")
```

**优势**：

| 操作 | SQL 策略 | 复杂度 |
|------|---------|--------|
| 查询某节点所有子孙 | WHERE parent_path LIKE '/1/5/%' | O(1) 索引扫描 |
| 查询某节点所有祖先 | 解析 parent_path 字符串 | O(k) k=深度 |
| 查询某节点直接子节点 | WHERE parent_id = {id} | O(1) 索引查询 |
| 移动节点 | 更新 parent_id + parent_path（自身+所有子孙） | O(n) n=子孙数 |
| 计算节点层级 | LENGTH(parent_path) - LENGTH(REPLACE(parent_path,'/','')) | O(1) |

### 5.3.2 7 级嵌套示例

| 层级 | 示例 | 说明 |
|------|------|------|
| L1 | 汽车 | 行业大类 |
| L2 | 新能源 | 领域 |
| L3 | 电池 | 产品线 |
| L4 | 电池Pack | 子系统 |
| L5 | 电池模组 | 模组 |
| L6 | 电池包 | 组件 |
| L7 | 电池冷却液 | 零件（最细粒度） |

### 5.3.3 性能约束

| 约束项 | 限制值 | 说明 |
|--------|--------|------|
| 最大嵌套层级 | 7 级 | 超出时提示"已达到最大层级" |
| 单节点最大子节点数 | 500 | 超出时使用分页加载 |
| 首次加载节点数 | 3 级 | 默认展开至第 3 级，更深层级按需加载 |
| 搜索范围 | 全层级 | 关键词搜索时遍历所有层级匹配 |

## 5.4 阶段管理

### 5.4.1 工业标准 6 阶段模型

每个项目自动创建 6 个阶段，通过 seq_no 排序：

| 阶段 | 编码 | seq_no | 颜色 | 说明 |
|------|------|--------|------|------|
| 调查 | INVESTIGATION | 1 | 灰色 #8C8C8C | 需求调研与可行性分析 |
| 概念 | CONCEPT | 2 | 蓝色 #3366FF | 概念设计与方案确定 |
| 计划 | PLANNING | 3 | 黄色 #FAAD14 | 详细计划制定与资源分配 |
| 开发 | DEVELOPMENT | 4 | 橙色 #FF9C00 | 产品开发与实现 |
| 测试 | TESTING | 5 | 蓝色 #3366FF | 测试验证与问题修复 |
| 量产 | MASS_PRODUCTION | 6 | 绿色 #52C41A | 批量生产准备与上线 |

### 5.4.2 阶段数据模型

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| projectId | Long | 所属项目 |
| name | String | 阶段名称 |
| code | String | 阶段编码 |
| seqNo | Integer | 排序序号 |
| status | Integer | 1=未开始, 2=进行中, 3=已完成 |
| progress | Integer | 完成百分比 0-100 |
| plannedStart / plannedEnd | LocalDate | 计划日期 |
| actualStart / actualEnd | LocalDate | 实际日期 |

## 5.5 阶段门审批

### 5.5.1 阶段门设计

阶段门（Stage Gate）嵌入在阶段之间，是进入下一阶段前的审批关卡。

```
调查阶段 ──→ [概念评审门] ──→ 概念阶段 ──→ [计划评审门] ──→ 计划阶段 ──→ ...
```

### 5.5.2 阶段门数据模型

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| phaseId | Long | 所属阶段 |
| name | String | 阶段门名称（如"概念评审"） |
| gateType | String | 类型: DQR/TR/QG（设计质量评审/技术评审/质量门） |
| status | Integer | 1=待审批, 2=已通过, 3=已拒绝 |
| flowInstanceId | String | Flowable 流程实例 ID |
| taskId | String | Flowable 任务 ID |
| approverId | Long | 审批人 |
| approvedAt | LocalDateTime | 审批时间 |
| comments | String | 审批意见 |

### 5.5.3 阶段门审批流程

```
阶段门审批触发
    │
    ▼
WorkflowService.startProcess("STAGE_GATE_APPROVAL", businessObject)
    │
    ▼
Flowable 引擎启动流程
    ├── 读取 wf_approval_config (object_type='STAGE_GATE')
    ├── 解析审批人规则 (PROJECT_ROLE → PROJECT_MANAGER)
    ├── 创建用户任务 (UserTask)
    └── 更新 prj_stage_gate.flow_instance_id
    │
    ▼
审批人收到通知 (WebSocket + 系统通知)
    │
    ▼
POST /api/wf/tasks/{taskId}/complete { approved: true/false, comment: "..." }
    │
    ▼
Flowable 引擎推进流程
    ├── 通过 → 更新 stage_gate.status = 2 → 解锁下一阶段
    └── 拒绝 → 更新 stage_gate.status = 3 → 阶段回退
```

## 5.6 里程碑管理

### 5.6.1 里程碑类型

| 类型 | 编码 | 说明 | 特殊行为 |
|------|------|------|---------|
| 里程碑 | MILESTONE | 项目关键节点标记 | 到期提醒 |
| 交付物 | DELIVERABLE | 需要交付物的检查点 | 关联文件管理 |
| 评审 | REVIEW | 评审会议/节点 | 内嵌审批流程 |

### 5.6.2 里程碑数据模型

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| projectId | Long | 所属项目 |
| phaseId | Long | 所属阶段（可选，跨阶段为空） |
| name | String | 里程碑名称 |
| type | String | MILESTONE/DELIVERABLE/REVIEW |
| status | Integer | 1=未开始, 2=进行中, 3=已完成, 4=已延期 |
| progress | Integer | 进度 0-100 |
| plannedDate / actualDate | LocalDate | 计划/实际完成日期 |
| assigneeId | Long | 负责人 |
| deliverable | String | 交付物描述或验收标准 |
| parentMilestoneId | Long | 父里程碑（支持层级） |
| flowInstanceId | String | Flowable 流程实例 ID（评审类型使用） |
| taskId | String | Flowable 任务 ID |

## 5.7 甘特图数据

### 5.7.1 甘特图数据接口

`GET /api/projects/{id}/gantt` 返回结构化的甘特图数据：

```
GanttChartVO {
    project: {
        id, name, plannedStart, plannedEnd, progress, status
    }
    phases: [
        {
            id, name, code, seqNo,
            status, progress,
            plannedStart, plannedEnd,
            actualStart, actualEnd,
            milestones: [
                { id, name, type, status, plannedDate, actualDate }
            ],
            stageGate: {
                id, name, gateType, status
            }
        }
    ]
    tasks: [
        {
            id, title, type, status, progress,
            plannedStart, plannedEnd,
            assignee: { id, realName, avatar },
            phaseId, milestoneId,
            parentId, parentPath
        }
    ]
}
```

### 5.7.2 前端甘特图渲染

| 数据字段 | 渲染组件 | 说明 |
|---------|---------|------|
| phases[].plannedStart/plannedEnd | 阶段甘特条 | 按阶段分组，颜色编码状态 |
| tasks[].plannedStart/plannedEnd | 任务甘特条 | 嵌套在阶段下，可拖拽调整 |
| milestones[].plannedDate | 里程碑菱形标记 | 菱形图标标注在时间轴上 |
| stageGate.status | 阶段门审批状态 | 在阶段交界处显示审批状态 |

---

## 5.8 任务依赖设计

### 5.8.1 四种依赖类型

任务依赖描述两个任务之间的时间约束关系，共有 4 种类型：

| 依赖类型 | 缩写 | 含义 | 示例 |
|---------|------|------|------|
| 开始-开始 | SS | 当前任务的开始取决于特定任务的开始 | 设计和评审可以同步开始 |
| 开始-结束 | SF | 当前任务的开始取决于特定任务的结束 | 测试开始取决于开发结束 |
| 结束-开始 | FS | 当前任务的结束取决于特定任务的开始 | 采购结束才能开始组装（最常见） |
| 结束-结束 | FF | 当前任务的结束取决于特定任务的结束 | 文档和代码同步完成 |

**默认依赖类型**：FS（结束-开始），即顺序执行。

### 5.8.2 数据模型

**tsk_task_dependency 表**

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| tenant_id | BIGINT | NOT NULL | 租户ID |
| task_id | BIGINT | NOT NULL, FK→tsk_task | 当前任务（依赖方） |
| depends_on_task_id | BIGINT | NOT NULL, FK→tsk_task | 被依赖任务 |
| dependency_type | VARCHAR(2) | NOT NULL, CHECK IN ('SS','SF','FS','FF') | 依赖类型 |
| created_by | BIGINT | NOT NULL | 创建人 |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | 创建时间 |

**唯一约束**：UNIQUE(tenant_id, task_id, depends_on_task_id)

**索引**：
- `idx_task_dep_task` ON (task_id)
- `idx_task_dep_depends` ON (depends_on_task_id)

### 5.8.3 依赖约束与环检测

**约束规则**：

1. **自依赖禁止**：task_id ≠ depends_on_task_id
2. **同项目约束**：依赖的两个任务必须属于同一项目（通过 parent_path 校验）
3. **环检测**：新增依赖前必须检测是否形成环路

**环检测算法**（DFS）：

```java
public boolean hasCycle(Long taskId, Long newDependsOnId) {
    Set<Long> visited = new HashSet<>();
    Deque<Long> stack = new ArrayDeque<>();
    stack.push(newDependsOnId);
    
    while (!stack.isEmpty()) {
        Long current = stack.pop();
        if (current.equals(taskId)) return true; // 成环
        if (!visited.add(current)) continue;
        
        // 查找 current 依赖的所有任务
        List<Long> dependencies = dependencyMapper.selectDependencies(current);
        stack.addAll(dependencies);
    }
    return false;
}
```

### 5.8.4 API 接口

| 方法 | 路径 | 说明 | 请求体/参数 |
|------|------|------|-----------|
| GET | /api/tasks/{id}/dependencies | 获取任务的所有依赖 | — |
| POST | /api/tasks/{id}/dependencies | 创建依赖关系 | { dependsOnTaskId, dependencyType } |
| DELETE | /api/tasks/{id}/dependencies/{depId} | 删除依赖关系 | — |
| PUT | /api/tasks/{id}/dependencies/{depId} | 修改依赖类型 | { dependencyType } |
| GET | /api/projects/{projectId}/dependencies | 获取项目所有依赖关系（甘特图用） | — |

## 5.9 级联调度设计

### 5.9.1 触发条件

当**计划表页签**中启用"按工期自动顺延"开关后，修改一个任务的计划开始/结束时间时触发级联调度。

**触发场景**：
- 用户在计划表中内联编辑任务的 `plannedStart` 或 `plannedEnd`
- 通过 API 更新任务日期且 `cascade=true` 参数

**不触发场景**：
- "按工期自动顺延"开关关闭
- 修改的是实际开始/结束时间（非计划时间）
- 任务状态为"已完成"（只允许修改计划结束时间）

### 5.9.2 级联算法

```java
/**
 * 级联调度：修改任务日期后，自动顺延后续依赖任务
 * 
 * @param taskId 被修改的任务ID
 * @param newStart 新的计划开始时间（可为null表示未修改）
 * @param newEnd 新的计划结束时间（可为null表示未修改）
 */
public void cascadeSchedule(Long taskId, LocalDate newStart, LocalDate newEnd) {
    Task task = taskMapper.selectById(taskId);
    long duration = ChronoUnit.DAYS.between(task.getPlannedStart(), task.getPlannedEnd());
    
    // 1. 更新当前任务日期
    if (newStart != null) {
        task.setPlannedStart(newStart);
        task.setPlannedEnd(newStart.plusDays(duration));
    } else if (newEnd != null) {
        task.setPlannedEnd(newEnd);
    }
    taskMapper.updateById(task);
    
    // 2. 查找所有直接依赖当前任务的后续任务
    List<TaskDependency> dependents = dependencyMapper.selectByDependsOn(taskId);
    
    // 3. 按依赖类型计算后续任务的新日期
    for (TaskDependency dep : dependents) {
        Task dependent = taskMapper.selectById(dep.getTaskId());
        
        // 跳过已完成的任务
        if (dependent.getStatus() == 3) continue;
        
        long depDuration = ChronoUnit.DAYS.between(
            dependent.getPlannedStart(), dependent.getPlannedEnd());
        
        switch (dep.getDependencyType()) {
            case "FS": // 结束→开始
                dependent.setPlannedStart(task.getPlannedEnd().plusDays(1));
                dependent.setPlannedEnd(dependent.getPlannedStart().plusDays(depDuration));
                break;
            case "SS": // 开始→开始
                dependent.setPlannedStart(task.getPlannedStart());
                dependent.setPlannedEnd(dependent.getPlannedStart().plusDays(depDuration));
                break;
            case "SF": // 开始→结束
                dependent.setPlannedEnd(task.getPlannedStart().minusDays(1));
                dependent.setPlannedStart(dependent.getPlannedEnd().minusDays(depDuration));
                break;
            case "FF": // 结束→结束
                dependent.setPlannedEnd(task.getPlannedEnd());
                dependent.setPlannedStart(dependent.getPlannedEnd().minusDays(depDuration));
                break;
        }
        
        taskMapper.updateById(dependent);
        
        // 4. 递归级联
        cascadeSchedule(dependent.getId(), dependent.getPlannedStart(), null);
    }
}
```

### 5.9.3 对已开始任务的保护

| 任务状态 | 允许修改 | 限制 |
|---------|---------|------|
| 未开始 | 计划开始、计划结束 | 无限制 |
| 进行中 | 仅计划结束 | 不允许修改计划开始时间 |
| 已完成 | 不允许级联 | 跳过，不参与级联 |

### 5.9.4 API 接口

| 方法 | 路径 | 说明 | 请求体/参数 |
|------|------|------|-----------|
| PUT | /api/tasks/{id}/schedule | 更新任务日期（带级联选项） | { plannedStart, plannedEnd, cascade } |
| POST | /api/projects/{id}/cascade-preview | 预览级联影响（不实际修改） | { taskId, newStart, newEnd } |

## 5.10 进度时间线数据

### 5.10.1 数据聚合逻辑

项目/阶段/任务对象的顶部进度时间线，展示从开始到计划结束时间跨度内的完成情况：

| 颜色 | 含义 | 计算逻辑 |
|------|------|---------|
| 黄色 #FAAD14 | 已完成 | 子任务中 status=3（已完成）的时间占比 |
| 蓝色 #3366FF | 进行中 | 子任务中 status=2（进行中）的时间占比 |
| 灰色 #8C8C8C | 未开始 | 子任务中 status=1（未开始）的时间占比 |

### 5.10.2 API 接口

`GET /api/projects/{id}/timeline` 或 `GET /api/tasks/{id}/timeline`

返回：
```
TimelineVO {
    objectId: Long
    objectType: String  // PROJECT / PHASE / TASK
    plannedStart: LocalDate
    plannedEnd: LocalDate
    segments: [
        { start: LocalDate, end: LocalDate, status: "completed", color: "#FAAD14" },
        { start: LocalDate, end: LocalDate, status: "in_progress", color: "#3366FF" },
        { start: LocalDate, end: LocalDate, status: "not_started", color: "#8C8C8C" }
    ]
    overallProgress: Integer  // 0-100
}
```
# 第6章：任务管理模块 syncflow-task

## 6.1 模块概述

syncflow-task 是用户日常工作交互最频繁的模块，提供 9 种任务类型的创建、快速创建解析、多维统计、评论讨论、关注通知和活动日志等功能。

| 功能域 | 说明 |
|--------|------|
| 任务 CRUD | 创建、查询、更新、删除（软删除），支持子任务树 |
| 9 种任务类型 | TASK/MILESTONE/ISSUE/RISK/SUGGESTION/CHANGE/ACTIVITY/STAGE/APPROVAL |
| 快速创建 | 一行文本解析为任务（"任务名,@人#工时¥工期%类型"） |
| 任务统计 | 今日/本周/本月/总任务/预警/超期 + 按类型统计 |
| 评论讨论 | 任务评论 + @提及通知 |
| 关注机制 | 关注/取消关注，任务变更时通知关注人 |
| 活动日志 | 任务全生命周期审计追踪 |

## 6.2 任务类型定义

| 类型编码 | 中文名 | 说明 | 颜色标识 |
|---------|--------|------|---------|
| TASK | 普通任务 | 常规工作任务 | 蓝色 #3366FF |
| MILESTONE | 里程碑 | 项目关键节点 | 紫色 #722ED1 |
| ISSUE | 问题 | 需要解决的问题 | 红色 #FF4D4F |
| RISK | 风险 | 项目风险项 | 橙色 #FF9C00 |
| SUGGESTION | 建议 | 优化建议 | 绿色 #52C41A |
| CHANGE | 变更 | 变更请求 | 青色 #13C2C2 |
| ACTIVITY | 活动 | 会议/评审等活动 | 黄色 #FAAD14 |
| STAGE | 阶段任务 | 阶段性工作 | 灰色 #8C8C8C |
| APPROVAL | 审批 | 需要审批的事项 | 粉色 #EB2F96 |

## 6.3 API 接口

| 方法 | 路径 | 说明 | 请求体/参数 |
|------|------|------|-----------|
| GET | /api/tasks | 任务列表（分页+多条件筛选） | ?page=&size=&keyword=&projectId=&status=&priority=&type=&assigneeId=&phaseId=&isOverdue=&tag=&dateFrom=&dateTo= |
| GET | /api/tasks/{id} | 任务详情 | — |
| POST | /api/tasks | 创建任务 | { title, description, type, projectId, phaseId, milestoneId, assigneeId, priority, plannedStart, plannedEnd, plannedHours, plannedDays, dueDate, tags, parentId } |
| PUT | /api/tasks/{id} | 更新任务 | { title, description, status, progress, assigneeId, priority, plannedStart, plannedEnd, dueDate, tags } |
| DELETE | /api/tasks/{id} | 删除任务（软删除） | — |
| PUT | /api/tasks/{id}/complete | 完成任务 | { actualHours } |
| PUT | /api/tasks/{id}/status | 变更任务状态 | { status } |
| POST | /api/tasks/quick | 快速创建任务 | { text: "任务名,@人#工时¥工期%类型" } |
| GET | /api/tasks/statistics | 任务统计卡片 | ?userId=&projectId= |
| POST | /api/tasks/{id}/comments | 添加评论 | { content } |
| GET | /api/tasks/{id}/comments | 获取评论列表 | ?page=&size= |
| POST | /api/tasks/{id}/watch | 关注任务 | — |
| DELETE | /api/tasks/{id}/watch | 取消关注 | — |
| GET | /api/tasks/{id}/activities | 活动日志 | ?page=&size= |


## 6.4 快速创建解析

### 6.4.1 输入格式说明

快速创建接口 `POST /api/tasks/quick` 接受底部输入栏的一行文本，支持 7 种特殊字符触发弹窗选择：

| 特殊字符 | 触发弹窗 | 说明 | 默认行为 |
|---------|---------|------|---------|
| @ | 常用联系人选择器 | 选择负责人和参与人 | 默认本部门全部联系人 |
| ￥ / $ | 工时工期输入框 | 输入计划工时和计划工期 | 无 |
| % | 任务类型选择框 | 选择任务类型 | 系统设置中的默认类型（默认"任务"） |
| ^ / …… | 任务模板选择框 | 选择"我的任务模板" | 无（未设置时提示未定义） |
| # | 所属项目选择框 | 选择所属项目（支持拼音搜索） | 无 |
| * | 交付物模板选择框 | 选择交付物模板 | 无 |
| & | 工作流模板选择框 | 选择工作流模板 | 无 |

### 6.4.2 解析规则与正则

**完整输入格式**：
```
任务名 [@负责人] [#工时] [￥工期] [%类型] [^模板] [*交付物] [&工作流]

示例:
  电池pack外观设计,@张三#8￥2%TASK^设计模板*交付物清单
  概念评审准备,@李四#4%REVIEW&审批流
  普通任务名称（无附加信息）
```

**正则表达式**：
```
^(.+?)(?:@([^\s#￥%^*&]+))?(?:#(\d+(?:\.\d+)?))?(?:[￥$](\d+))?(?:%([A-Z]+))?(?:\^([^\s#￥%^*&]+))?(?:\*([^\s#￥%^*&]+))?(?:&([^\s#￥%^*&]+))?$
```

**解析顺序**：先提取任务名（到第一个特殊字符前），再按各特殊字符分别解析后续字段。

### 6.4.3 联系人选择器（@）

**交互流程**：

1. 用户在输入栏输入 `@` → 弹出常用联系人选择框
2. 默认显示**本部门全部联系人**（可在系统设置中自定义常用联系人范围）
3. 用户可通过**姓名首字母**或**上下方向键**快捷定位
4. 定位后高亮显示用户名，**鼠标点击**或**回车**确认选择
5. 鼠标点击时可**连续点击**选择多个参与人
6. **第一个选定**的联系人自动标记为**负责人**（用户名前显示 `@` 标识）
7. 回车确认时自动退出选择框
8. 重新输入 `@` 可继续指定参与人
9. 若后指定的联系人已是参与人或负责人，自动取消该设置
10. 也可点击输入栏右侧**人像按钮**弹出负责人和参与人选择面板

**数据模型变更**：无新增表，使用已有的 `tsk_task_participant` 表。

### 6.4.4 工时工期输入（￥/$）

**交互流程**：

1. 输入 `￥` 或 `$` → 弹出工时/工期输入框
2. 可输入**计划工时**（小时）和**计划工期**（天）
3. 也可点击输入栏右侧的**工时/工期按钮**打开输入框

**映射字段**：
- 计划工时 → `tsk_task.planned_hours`
- 计划工期 → `tsk_task.planned_days`

### 6.4.5 任务类型选择（%）

**交互流程**：

1. 输入 `%` → 弹出任务类型选择框（9 种类型）
2. 用户选择后回车关闭
3. 不输入 `%` 时，使用系统设置中"新建任务时没有设置任务类型时的默认任务类型"（默认值为 `TASK`）

### 6.4.6 任务模板选择（^/……）

**交互流程**：

1. 输入 `^` 或 `……` → 弹出"我的任务模板"选择框
2. 模板可带**下一级任务**（即选择模板后自动创建子任务）
3. 也可点击输入栏右侧的"我的任务模板"按钮打开选择框

**模板来源优先级**：
1. 当前用户设置的"我的任务模板"（仅显示当前用户的模板）
2. 系统管理员设置的"通用任务模板"（全局默认）
3. 均未设置时 → 弹出"尚未设置我的任务模板"提示弹窗

### 6.4.7 所属项目选择（#）

**交互流程**：

1. 输入 `#` → 弹出所属项目选择框
2. 支持**项目名称拼音首字母**快速定位
3. 定位行蓝色底纹，回车直接选中并关闭弹窗
4. 默认仅显示项目名称，点击项目后的**下拉按钮**可展开所属分类树

### 6.4.8 交付物模板选择（*）

**交互流程**：

1. 输入 `*` → 弹出交付物模板选择框
2. 交付物模板由有权限的用户在**系统设置**中配置

### 6.4.9 工作流模板选择（&）

**交互流程**：

1. 输入 `&` → 弹出工作流模板选择框
2. 工作流模板在左侧导航栏的**流程定义页签**中定义

### 6.4.10 AND/OR 搜索逻辑

综合查询栏针对任务的多条件搜索：

| 分隔符 | 逻辑关系 | 示例 | 语义 |
|--------|---------|------|------|
| 空格 | AND | `张三 电池` | 负责人=张三 AND 标题含"电池" |
| 英文逗号 `,` | OR | `ISSUE,RISK` | 类型=ISSUE OR 类型=RISK |

**搜索条件类型**：任务名称、负责人、项目名、任务类型、标签、日期范围

## 6.5 任务模板系统设计

### 6.5.1 数据模型

**tsk_task_template 表**

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| tenant_id | BIGINT | NOT NULL | 租户ID |
| name | VARCHAR(100) | NOT NULL | 模板名称 |
| description | TEXT | | 模板说明 |
| scope | VARCHAR(20) | NOT NULL, DEFAULT 'PERSONAL' | 适用范围：PERSONAL(个人)/GLOBAL(全局) |
| creator_id | BIGINT | NOT NULL | 创建人（scope=PERSONAL时为用户本人，scope=GLOBAL时为管理员） |
| is_default | BOOLEAN | DEFAULT FALSE | 是否为默认模板 |
| sort_order | INTEGER | DEFAULT 0 | 排序 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

**tsk_task_template_item 表**（模板子任务）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| template_id | BIGINT | NOT NULL, FK→tsk_task_template | 所属模板 |
| title | VARCHAR(200) | NOT NULL | 子任务名称 |
| type | VARCHAR(20) | DEFAULT 'TASK' | 任务类型 |
| sort_order | INTEGER | DEFAULT 0 | 排序 |
| parent_item_id | BIGINT | | 父模板项（支持模板内嵌套） |

### 6.5.2 API 接口

| 方法 | 路径 | 说明 | 请求体/参数 |
|------|------|------|-----------|
| GET | /api/task-templates | 获取模板列表（个人+全局） | ?scope= |
| GET | /api/task-templates/{id} | 获取模板详情（含子任务） | — |
| POST | /api/task-templates | 创建模板 | { name, description, scope, items: [{title, type, sortOrder}] } |
| PUT | /api/task-templates/{id} | 更新模板 | { name, description, items } |
| DELETE | /api/task-templates/{id} | 删除模板 | — |

### 6.5.3 前端组件

| 组件 | 位置 | 说明 |
|------|------|------|
| TaskTemplatePicker | 底部快速创建栏 | 输入 `^` 或点击按钮时弹出的模板选择弹窗 |
| TaskTemplateManager | 系统设置页 | 个人/全局模板的 CRUD 管理界面 |

## 6.6 交付物模板系统设计

### 6.6.1 数据模型

**cfg_deliverable_template 表**

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| tenant_id | BIGINT | NOT NULL | 租户ID |
| name | VARCHAR(100) | NOT NULL | 模板名称 |
| description | TEXT | | 模板说明 |
| items_json | JSONB | | 交付物清单项（JSON数组） |
| created_by | BIGINT | NOT NULL | 创建人 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |

**items_json 示例**：
```json
[
  {"name": "设计图纸", "required": true, "fileType": "DWG/PDF"},
  {"name": "BOM清单", "required": true, "fileType": "XLSX"},
  {"name": "测试报告", "required": false, "fileType": "PDF"}
]
```

### 6.6.2 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/config/deliverable-templates | 获取交付物模板列表 |
| POST | /api/config/deliverable-templates | 创建模板 |
| PUT | /api/config/deliverable-templates/{id} | 更新模板 |
| DELETE | /api/config/deliverable-templates/{id} | 删除模板 |

## 6.7 工作流模板系统设计

### 6.7.1 数据模型

**wf_workflow_template 表**

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| tenant_id | BIGINT | NOT NULL | 租户ID |
| name | VARCHAR(100) | NOT NULL | 模板名称 |
| description | TEXT | | 模板说明 |
| bpmn_process_key | VARCHAR(100) | NOT NULL | 关联的 Flowable BPMN Process Key |
| default_assignee_rule | VARCHAR(50) | | 默认审批人规则类型 |
| config_json | JSONB | | 模板配置（审批链、抄送人等） |
| is_active | BOOLEAN | DEFAULT TRUE | 是否启用 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |

### 6.7.2 与 Flowable 集成

工作流模板关联已有的 Flowable BPMN 流程定义，通过 `bpmn_process_key` 字段绑定。在快速创建时选择工作流模板，任务创建后自动调用 `WorkflowService.startProcess()` 启动审批流程。

### 6.7.3 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/workflow/templates | 获取工作流模板列表 |
| GET | /api/workflow/templates/{id} | 获取模板详情 |
| POST | /api/workflow/templates | 创建模板 |
| PUT | /api/workflow/templates/{id} | 更新模板 |
| DELETE | /api/workflow/templates/{id} | 删除模板 |

## 6.8 任务统计

### 6.8.1 统计卡片接口

`GET /api/tasks/statistics` 返回多维度任务统计：

```
TaskStatisticsVO {
    // 时间维度统计
    today: 5,           // 今日需处理的任务数
    thisWeek: 12,       // 本周内的任务数
    thisMonth: 28,      // 本月内的任务数
    total: 156,         // 全部任务总数

    // 状态维度统计
    warning: 3,         // 预警任务数（即将到期）
    overdue: 2,         // 超期任务数

    // 类型维度统计
    byType: {
        TASK: 80, MILESTONE: 15, ISSUE: 10, RISK: 8,
        SUGGESTION: 12, CHANGE: 5, ACTIVITY: 8, STAGE: 10, APPROVAL: 8
    }

    // 状态维度统计
    byStatus: {
        NOT_STARTED: 22, IN_PROGRESS: 45, ON_HOLD: 5,
        COMPLETED: 78, OVERDUE: 2, CANCELLED: 4
    }
}
```

### 6.8.2 统计计算规则

| 指标 | 计算规则 | SQL 策略 |
|------|---------|---------|
| today | due_date = 当前日期 且 status != COMPLETED/CANCELLED | WHERE due_date = CURRENT_DATE |
| thisWeek | due_date 在本周范围内 且 status != COMPLETED/CANCELLED | WHERE due_date BETWEEN week_start AND week_end |
| thisMonth | due_date 在本月范围内 且 status != COMPLETED/CANCELLED | WHERE due_date BETWEEN month_start AND month_end |
| total | 当前用户的所有任务 | WHERE assignee_id = {userId} |
| warning | is_warning = TRUE | WHERE is_warning = TRUE |
| overdue | is_overdue = TRUE 或 (due_date < 当前日期 且 status NOT IN (COMPLETED, CANCELLED)) | 动态计算 + 冗余字段 |
| byType | GROUP BY type | GROUP BY type COUNT(*) |
| byStatus | GROUP BY status | GROUP BY status COUNT(*) |

## 6.9 任务关注与评论

### 6.9.1 关注机制

**数据模型**：tsk_task_watcher 表存储关注关系（task_id + user_id 联合唯一）

**关注/取消关注**：

| 操作 | API | 行为 |
|------|-----|------|
| 关注 | POST /api/tasks/{id}/watch | 插入 tsk_task_watcher 记录, task.watcher_count + 1 |
| 取消关注 | DELETE /api/tasks/{id}/watch | 删除 tsk_task_watcher 记录, task.watcher_count - 1 |

**通知触发**：当任务发生以下变更时，通知所有关注人（除操作人外）：

| 变更类型 | 通知内容 |
|---------|---------|
| 状态变更 | "您关注的任务 [任务名] 状态已变更为 [新状态]" |
| 进度更新 | "您关注的任务 [任务名] 进度更新为 [X]%" |
| 新评论 | "[评论人] 在任务 [任务名] 中发表了评论" |
| 负责人变更 | "任务 [任务名] 负责人已变更为 [新负责人]" |
| 完成 | "您关注的任务 [任务名] 已完成" |

### 6.9.2 评论系统

**数据模型**：tsk_task_comment 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| taskId | Long | 关联任务 |
| userId | Long | 评论人 |
| content | String | 评论内容（支持 Markdown） |
| mentionedUsers | String | @提及的用户 ID 列表（逗号分隔） |
| createdAt / updatedAt | Timestamp | 时间戳 |

**@提及机制**：

1. 用户在评论中输入 `@` 触发人员选择器
2. 前端将提及的用户 ID 数组提交到后端
3. 后端存储 mentionedUsers 字段
4. 为每个被 @提及的用户创建一条 MENTION 类型通知
5. WebSocket 实时推送通知

### 6.9.3 活动日志

**数据模型**：tsk_task_activity 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| taskId | Long | 关联任务 |
| userId | Long | 操作人 |
| action | String | 操作类型: CREATED/UPDATED/STATUS_CHANGED/ASSIGNED/COMMENTED/COMPLETED |
| fieldName | String | 变更字段名（null 表示非字段变更操作） |
| oldValue | String | 变更前值 |
| newValue | String | 变更后值 |
| createdAt | Timestamp | 操作时间 |

**自动记录场景**：

| 业务操作 | action | fieldName | 记录内容 |
|---------|--------|-----------|---------|
| 创建任务 | CREATED | — | "创建了任务" |
| 修改状态 | STATUS_CHANGED | status | oldStatus → newStatus |
| 修改进度 | UPDATED | progress | oldProgress → newProgress |
| 分配负责人 | ASSIGNED | assigneeId | oldAssignee → newAssignee |
| 添加评论 | COMMENTED | — | "发表了评论" |
| 完成任务 | COMPLETED | — | "完成了任务" |
| 修改优先级 | UPDATED | priority | oldPriority → newPriority |
| 修改截止日期 | UPDATED | dueDate | oldDate → newDate |
# 第7章: BOM管理模块 (syncflow-bom)

## 7.1 模块概述

BOM（物料清单）管理模块负责产品物料清单的全生命周期管理，包括 BOM 树结构维护、版本管理和审批发布。

| 能力维度 | 说明 |
|---------|------|
| BOM 树结构 | 多层级父子件关系，支持展开/折叠、拖拽排序 |
| 版本管理 | 版本创建、版本对比、版本回溯、版本发布锁定 |
| 审批集成 | BOM 发布需经 4 级审批链 (技术→工艺→质量→PM) |
| 来源分类 | 自制件(MADE)/采购件(PURCHASED)/外协件(SUBCONTRACT) |

## 7.2 数据模型

### bom_bom (BOM 主表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL PK | 主键 |
| bom_no | VARCHAR(50) UNIQUE | BOM 编号 (BOM-YYYYMMDD-NNN) |
| name | VARCHAR(200) | BOM 名称 |
| version | VARCHAR(20) DEFAULT '1.0' | 版本号 |
| project_id | BIGINT | 所属项目 |
| order_product_id | BIGINT | 关联订单产品 |
| product_code | VARCHAR(100) | 产品编码 |
| product_name | VARCHAR(200) | 产品名称 |
| status | SMALLINT | 1:编辑中 2:待审批 3:已发布 4:已锁定 5:已废止 |
| flow_instance_id | VARCHAR(100) | Flowable 流程实例 ID |
| is_latest | BOOLEAN DEFAULT TRUE | 是否最新版本 |
| parent_bom_id | BIGINT | 基于某版本创建 |
| total_items | INT DEFAULT 0 | 总物料项数 |
| total_weight | DECIMAL(15,3) | 总重量 |
| created_by | BIGINT NOT NULL | 创建人 |
| approved_by | BIGINT | 审批人 |
| approved_at | TIMESTAMP | 审批时间 |
| released_at | TIMESTAMP | 发布时间 |

### bom_item (BOM 明细项 - 树结构)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL PK | 主键 |
| bom_id | BIGINT NOT NULL | 所属 BOM |
| parent_id | BIGINT | 父项 ID |
| level | INT DEFAULT 1 | 层级深度 |
| path | VARCHAR(500) | 层级路径 /1/3/5/ |
| seq_no | INT DEFAULT 0 | 同级序号 |
| level_no | VARCHAR(50) | 层次显示序号 (①缩次②缩次) |
| material_code | VARCHAR(100) | 物料编码 |
| drawing_no | VARCHAR(100) | 图号 |
| name | VARCHAR(200) NOT NULL | 物料名称 |
| specification | VARCHAR(500) | 规格型号 |
| material | VARCHAR(100) | 材质 |
| unit | VARCHAR(20) | 单位 |
| unit_price | DECIMAL(15,4) | 单价 |
| weight | DECIMAL(10,3) | 单件重量(kg) |
| quantity | DECIMAL(15,4) DEFAULT 1 | 单层数量 |
| source_type | VARCHAR(30) NOT NULL | MADE/PURCHASED/SUBCONTRACT |
| is_virtual | BOOLEAN DEFAULT FALSE | 是否虚拟件 |

## 7.3 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/boms | BOM 列表 (可选 projectId 过滤) |
| GET | /api/boms/{id} | BOM 详情 |
| GET | /api/boms/{id}/structure | BOM 结构树 (递归构建) |
| POST | /api/boms | 创建 BOM |
| POST | /api/boms/{id}/items | 新增 BOM 项 |
| PUT | /api/boms/items/{itemId} | 编辑 BOM 项 |
| DELETE | /api/boms/items/{itemId} | 删除 BOM 项 (含子项) |
| POST | /api/boms/{id}/submit-approval | 提交审批 |
| POST | /api/boms/{id}/save-version | 保存版本 |
| GET | /api/boms/{id}/versions | 版本历史 |

## 7.4 BOM 树结构设计

BOM 采用 `parent_id` + `path` (物化路径) 双重设计:
- **parent_id**: 用于直接父子查询
- **path**: 用于高效子树查询 (`WHERE path LIKE '/1/3/%'`)
- **level_no**: 层次序号显示 (①缩次②缩次③缩次)

树构建算法: 查询所有 bom_item → 按 parentId 分组 → 递归构建 → 计算 level_no

## 7.5 版本管理

| 操作 | 说明 |
|------|------|
| 版本创建 | 基于当前版本 deep copy 所有 BomItem，版本号自增 (1.0→1.1) |
| 版本链接 | `parent_bom_id` 指向源版本 |
| 版本标记 | 旧版本 `is_latest=false`，新版本 `is_latest=true` |
| 版本废止 | 状态设为 5 (已废止)，不能废止最新版本 |

## 7.6 BOM 审批流程

BPMN: `BOM_APPROVAL` (4 级条件审批链)

```
提交BOM → 技术负责人审核 → [有工艺路线?]
                              ├─ 是 → 工艺审核 → 质量审核 → 项目经理批准 → 发布BOM
                              └─ 否 → 质量审核 → 项目经理批准 → 发布BOM
任意节点驳回 → 处理驳回 → BOM 回退至编辑状态
```

审批人动态解析: 从 `wf_approval_config` 表查询，按项目角色解析

---

# 第8章: 工艺管理模块 (syncflow-process)

## 8.1 模块概述

工艺路线管理模块定义产品的制造工艺流程，包括工艺路线、工序、工时定额和材料定额。

## 8.2 数据模型

### prc_process_route (工艺路线)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL PK | 主键 |
| route_no | VARCHAR(50) UNIQUE | 工艺路线编号 (PRC-YYYYMMDD-NNN) |
| name | VARCHAR(200) | 路线名称 |
| bom_id | BIGINT | 关联 BOM |
| status | SMALLINT | 1:编辑中 2:待审批 3:已发布 |
| total_operations | INT DEFAULT 0 | 工序数 |
| total_man_hours | DECIMAL(10,2) | 总工时 |

### prc_operation (工序)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL PK | 主键 |
| route_id | BIGINT NOT NULL | 所属路线 |
| seq_no | INT NOT NULL | 顺序号 |
| operation_no | VARCHAR(20) | 工序号 (0010/0020/0030...) |
| name | VARCHAR(100) | 工序名称 |
| material_code | VARCHAR(100) | 物料编码 (关联 BOM) |
| work_center_code | VARCHAR(50) | 工作中心编码 |

### prc_man_hour (工时定额)

| 字段 | 说明 |
|------|------|
| operation_id | 所属工序 |
| work_type | 工种 |
| hours | 工时 (小时) |
| worker_count | 人数 |
| is_critical | 是否关键工序 |

### prc_operation_material (材料定额)

| 字段 | 说明 |
|------|------|
| operation_id | 所属工序 |
| material_code/name | 材料编码/名称 |
| quantity | 用量 |
| loss_rate | 损耗率 (%) |

## 8.3 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/process-routes | 工艺路线列表 |
| GET | /api/process-routes/{id} | 路线详情 (含工序) |
| POST | /api/process-routes | 创建路线 |
| POST | /api/process-routes/{id}/operations | 添加工序 |
| PUT | /api/process-routes/operations/{id} | 编辑工序 |
| DELETE | /api/process-routes/operations/{id} | 删除工序 |
| PUT | /api/process-routes/{id}/operations/reorder | 工序排序 |
| POST | /api/process-routes/{id}/submit-approval | 提交审批 |

## 8.4 工序管理设计

工序自动编号规则: `seq_no` 从 0 开始递增，`operation_no` = `(seq_no + 1) * 10`，格式化为 4 位 (0010, 0020, 0030...)

添加工序时自动计算路线汇总: `total_operations` (工序数) + `total_man_hours` (总工时)

## 8.5 工艺审批流程

BPMN: `PROCESS_APPROVAL` (2 级审批)

```
提交工艺路线 → 技术负责人审核 → 工艺审核 → 发布
驳回 → 回退至编辑状态
```

---

# 第9章: 三库配置模块 (syncflow-config)

## 9.1 模块概述

三库配置是 SyncFlow 的核心数据基础，包含模块库、工艺库和订单库，为 BOM 和工艺路线提供标准化数据源。

## 9.2 模块库设计

### 4 级层次结构

```
模块分类 (cfg_module_category)
  └── 模块 (cfg_module)
       └── 模块规格 (cfg_module_spec)
            └── 规格参数 (cfg_spec_param)
```

### cfg_module_spec (模块规格)

| 字段 | 说明 |
|------|------|
| spec_name | 规格名称 |
| cross_section | 截面形式: 椭圆/圆形/方形 |
| material | 材质: 铝合金/碳钢/不锈钢 |
| wall_thickness | 壁厚 |
| connection_type | 连接方式: 螺纹口/焊接 |
| spec_code | 模块编码 (DSW000001) |
| status | 0:编辑中 1:已发布 |
| flow_instance_id | 审批流程实例 ID |

### cfg_spec_param (规格约束性参数)

| 字段 | 说明 |
|------|------|
| param_name | 参数名称 |
| param_type | TEXT/NUMBER/ENUM/DATE |
| control_type | 控件类型: 文本框/下拉框/日期选择 |
| default_value | 默认值 |
| options | 下拉选项 (JSON) |
| min_value / max_value | 数值范围 |
| unit | 单位 |
| is_required | 是否必填 |

## 9.3 工艺库设计

- `cfg_process_category`: 工艺分类树
- `cfg_typical_process`: 典型工艺定义 (名称/描述/内容)

## 9.4 订单库设计

```
订单大类 (cfg_order_category, level=1)
  └── 订单小类 (level=2)
       └── 系列分类 (level=3)
            └── 订单产品 (cfg_order_product)
                 └── 产品-BOM关联 (cfg_product_bom)
```

## 9.5 API 接口

### 模块库 (ModuleLibraryController)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/config/modules/categories | 分类树 |
| POST | /api/config/modules/categories | 创建分类 |
| GET | /api/config/modules | 模块列表 (按分类) |
| POST | /api/config/modules | 创建模块 |
| GET | /api/config/modules/{id}/specs | 规格列表 |
| POST | /api/config/modules/{id}/specs | 创建规格 |
| GET | /api/config/modules/specs/{id}/params | 参数列表 |
| POST | /api/config/modules/specs/{id}/params | 创建参数 |
| POST | /api/config/modules/specs/{id}/publish | 发布规格 |

### 订单库 (OrderLibraryController)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/config/orders/categories | 订单分类树 |
| POST | /api/config/orders/categories | 创建分类 |
| GET | /api/config/orders/products | 产品列表 |
| POST | /api/config/orders/products | 创建产品 |
| GET | /api/config/orders/products/{id}/bom | 产品 BOM |

## 9.6 规格发布审批

BPMN: `MODULE_SPEC_APPROVAL` (2 级审批)

```
提交规格 → 部门审核 (部门负责人) → 技术审核 (技术负责人) → 发布
驳回 → 回退至编辑状态
```

---

# 第10章: 审批引擎模块 (syncflow-workflow) — 统一审批架构

> **本章是系统架构的核心枢纽。** 所有修改操作的审批都通过此模块统一处理。

## 10.1 统一审批框架架构

### 核心设计理念

SyncFlow 的审批不是每个模块各自硬编码，而是采用 **"声明式审批策略 + 统一引擎执行"** 的架构:

```
┌─────────────────────────────────────────────────────────────┐
│                    审批策略层 (Declarative)                    │
│  审批配置表 (wf_approval_config) 定义:                        │
│  - 哪些实体类型的哪些操作需要审批                              │
│  - 每个审批节点由谁审批 (动态解析规则)                          │
│  - 审批流程模板 (BPMN)                                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    审批执行层 (Flowable 7.x)                   │
│  WorkflowService:                                             │
│  - startProcess() → RuntimeService.startProcessByKey()        │
│  - completeTask() → TaskService.complete(taskId, vars)        │
│  - getPendingTasks() → TaskService.createTaskQuery()          │
│  - withdrawApproval() → RuntimeService.deleteProcess()        │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    审批事件层 (Event-Driven)                    │
│  ApprovalEventListener:                                       │
│  - TASK_CREATED → 动态解析审批人 + 更新业务对象 + 推送通知      │
│  - TASK_COMPLETED → 记录审批意见 + 推送结果                    │
│  - PROCESS_COMPLETED → 更新业务状态 + 推送完成                 │
│  - PROCESS_CANCELLED → 处理撤回                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    业务回调层 (Service Tasks)                   │
│  BomApprovalService.publishBom()                              │
│  StageGateService.updateStatus()                              │
│  ProcessApprovalService.publishProcess()                      │
│  SpecApprovalService.publishSpec()                            │
│  FileApprovalService.publishFile()                            │
│  ChangeApprovalService.approveChange()                        │
└─────────────────────────────────────────────────────────────┘
```

### 通用审批绑定模型

任意业务实体通过 `wf_business_object` 表绑定到 Flowable 流程实例:

```
业务实体 (BOM/工艺/规格/文件/阶段门...)
    ↓ 创建 wf_business_object 记录
    ↓ WorkflowService.startProcess(processKey, objectId, objectType, ...)
    ↓ Flowable 创建流程实例
    ↓ ApprovalEventListener.TASK_CREATED → 动态解析审批人
    ↓ 审批人操作 → completeTask()
    ↓ BPMN serviceTask → 业务回调 (publishBom/updateStatus/...)
    ↓ ApprovalEventListener.PROCESS_COMPLETED → 清理状态
```

## 10.2 52 个写操作的审批分类

系统共有 **52 个写操作端点**，按审批需求分为三类:

### 直接写入 (18 个) — 无需审批

| 模块 | 操作 | 理由 |
|------|------|------|
| 认证 | 登录/刷新/注销 | 会话管理，非业务数据 |
| 项目 | 创建阶段/编辑阶段/排序阶段 | 结构性脚手架，低风险 |
| 任务 | 创建/编辑/评论/关注 | 工作空间日常操作 |
| BOM | 创建 BOM (草稿) | 安全的草稿创建 |
| 工艺 | 创建路线/排序工序 | 初始创建 |
| 文件 | 上传/删除/创建文件夹 | 文件级操作 |
| 通知 | 标记已读/更新设置 | 个人偏好 |

### 状态流转 (14 个) — 条件审批

| 模块 | 操作 | 审批条件 |
|------|------|---------|
| 任务 | 完成任务 | 里程碑关联的任务需审批 |
| 任务 | 更新进度 | 进度≥80%时需确认 |
| BOM | 添加/编辑/删除 BOM 项 | BOM 已发布/锁定时需审批 |
| BOM | 保存版本 | 需创建新版本 + 审批 |
| 工艺 | 添加/编辑/删除工序 | 路线已发布时需审批 |
| 配置 | 发布规格 | 必须审批 (MODULE_SPEC_APPROVAL) |

### 受控修改 (18 个) — 必须审批

| 模块 | 操作 | 审批流程 |
|------|------|---------|
| 系统 | 部门/角色 CRUD (9个) | 管理员审批 |
| 项目 | 创建/编辑/删除项目 | 部门负责人审批 |
| 项目 | 删除阶段 | PM 审批 |
| 任务 | 删除任务 | PM 审批 |
| 配置 | 创建分类/模块/规格/参数 (6个) | 技术负责人审批 |

## 10.3 BPMN 流程定义总览

| 流程 | Process Key | 审批节点数 | 条件路由 | Service Task |
|------|-------------|-----------|---------|-------------|
| 阶段门审批 | STAGE_GATE_APPROVAL | 2 (并行) | 并行网关 | stageGateService.updateStatus |
| BOM 发布审批 | BOM_APPROVAL | 4 | 排他网关 (有无工艺路线) | bomApprovalService.publishBom |
| 工艺路线审批 | PROCESS_APPROVAL | 2 | 无 | processApprovalService.publishProcess |
| 模块规格审批 | MODULE_SPEC_APPROVAL | 2 | 无 | specApprovalService.publishSpec |
| 变更审批 | CHANGE_APPROVAL | 3 | 无 | changeApprovalService.approveChange |
| 文件发布审批 | FILE_APPROVAL | 1 | 无 | fileApprovalService.publishFile |
| 通用审批 | GENERIC_APPROVAL | 1 | 无 | (无 service task) |

## 10.4 动态审批人解析

4 种解析规则:

| 规则类型 | 解析逻辑 | 示例 |
|---------|---------|------|
| PROJECT_ROLE | 查询 `prj_project_member` WHERE project_id AND project_role | TECH_LEADER → 项目技术负责人 |
| DEPARTMENT | 查询申请人所在部门的负责人 | 申请人 dept_id → 部门负责人 |
| USER | 直接指定用户 ID | "1,2,3" |
| DYNAMIC | SpEL 表达式求值 | 自定义逻辑 |

审批人解析时机: `ApprovalEventListener.TASK_CREATED` 事件触发时，从 `wf_approval_config` 查询配置，调用 `ApprovalAssigneeResolver` 解析，通过 `TaskService.setAssignee()` 设置。

## 10.5 审批场景覆盖矩阵

| # | 场景 | 优先级 | BPMN | 状态 |
|---|------|--------|------|------|
| 1 | 阶段门审批 | P0 | STAGE_GATE_APPROVAL | ✅ 已实现 |
| 2 | 阶段结束审批 | P0 | STAGE_GATE_APPROVAL | ✅ 已实现 |
| 3 | BOM 发布审批 | P0 | BOM_APPROVAL | ✅ 已实现 |
| 4 | 工艺路线审批 | P0 | PROCESS_APPROVAL | ✅ 已实现 |
| 5 | 模块规格审批 | P0 | MODULE_SPEC_APPROVAL | ✅ 已实现 |
| 6 | 文件发布审批 | P0 | FILE_APPROVAL | ✅ 已实现 |
| 7 | 工程变更审批 | P0 | CHANGE_APPROVAL | ✅ 已实现 |
| 8 | 通用审批 | P0 | GENERIC_APPROVAL | ✅ 已实现 |
| 9 | 里程碑审批 | P0 | GENERIC_APPROVAL | ⚠️ 部分实现 |
| 10 | 任务完成审批 | P0 | GENERIC_APPROVAL | ⚠️ 部分实现 |
| 11 | BOM 变更审批 | P0 | CHANGE_APPROVAL | ⚠️ 部分实现 |
| 12 | 审批委托/转办 | P1 | N/A | ⚠️ 表已有 |
| 13 | 审批抄送 | P1 | N/A | ⚠️ 表已有 |
| 14 | 工艺路线变更 | P1 | CHANGE_APPROVAL | ⚠️ 部分实现 |
| 15 | 文件版本发布 | P1 | FILE_APPROVAL | ⚠️ 部分实现 |
| 16 | 项目创建审批 | P1 | 需新建 | ❌ 未实现 |
| 17 | 问题/风险审批 | P1 | 需新建 | ❌ 未实现 |
| 18 | 模块规格变更 | P1 | MODULE_SPEC_APPROVAL | ❌ 未实现 |
| 19 | 任务分配审批 | P2 | 需新建 | ❌ 未实现 |
| 20 | BOM 废止审批 | P2 | GENERIC_APPROVAL | ❌ 未实现 |
| 21 | 典型工艺审批 | P2 | 需新建 | ❌ 未实现 |
| 22 | 订单产品配置 | P2 | 需新建 | ❌ 未实现 |
| 23 | 资源借用审批 | P2 | 需新建 | ❌ 未实现 |
| 24 | 知识文章发布 | P2 | 需新建 | ❌ 未实现 |
| 25 | 模板发布审批 | P2 | 需新建 | ❌ 未实现 |

## 10.6 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/wf/start | 发起审批 |
| POST | /api/wf/tasks/{taskId}/complete | 完成审批 (通过/驳回) |
| GET | /api/wf/tasks/pending | 待审批列表 |
| GET | /api/wf/business-objects/{id} | 审批详情 |
| GET | /api/wf/business-objects/{id}/history | 审批历史 |
| POST | /api/wf/business-objects/{id}/withdraw | 撤回审批 |

---

# 第11章: 文件管理模块 (syncflow-file)

## 11.1 模块概述

基于 MinIO 的文件存储管理，支持文件夹管理、版本控制、SHA-256 校验和多态业务关联。

## 11.2 数据模型

### fil_file (文件主表)

| 字段 | 类型 | 说明 |
|------|------|------|
| file_no | VARCHAR(50) UNIQUE | 文件编号 (FILE-YYYYMMDD-NNNN) |
| name | VARCHAR(255) | 文件名 |
| extension | VARCHAR(20) | 扩展名 |
| size | BIGINT | 文件大小 (字节) |
| storage_path | VARCHAR(500) | MinIO 存储路径 |
| bucket | VARCHAR(100) | MinIO 桶名 |
| check_sum | VARCHAR(64) | SHA-256 校验和 |
| biz_type | VARCHAR(50) | 关联业务类型 (BOM/PROCESS/DOCUMENT) |
| biz_id | BIGINT | 关联业务 ID |
| version | INT DEFAULT 1 | 版本号 |
| status | SMALLINT | 1:编辑中 2:已发布 3:已锁定 |

### fil_folder (文件夹)

| 字段 | 说明 |
|------|------|
| name | 文件夹名称 |
| parent_id | 父文件夹 (树结构) |
| path | 物化路径 |
| project_id | 所属项目 |

## 11.3 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/files/upload | 文件上传 (multipart) |
| GET | /api/files/{id}/download | 文件下载 |
| GET | /api/files/{id} | 文件详情 |
| GET | /api/files/ | 文件列表 (按 bizType/bizId 过滤) |
| DELETE | /api/files/{id} | 删除文件 |
| POST | /api/files/folders | 创建文件夹 |
| GET | /api/files/folders/tree | 文件夹树 |
| GET | /api/files/{id}/versions | 版本历史 |

---

# 第12章: 驾驶舱与统计模块 (syncflow-statistics)

## 12.1 模块概述

驾驶舱提供项目全局数据总览，包括任务统计、工时排行、按期完工率和风险监控。

## 12.2 数据模型

- `sta_dashboard_data`: 驾驶舱预计算数据 (项目/维度/值)
- `sta_task_statistics`: 任务统计快照 (按日/项目/人员)
- `sta_man_hour_ranking`: 工时排行

## 12.3 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/dashboard | 驾驶舱首页 (聚合所有数据) |
| GET | /api/dashboard/completed-tasks | 完工任务 (近30天) |
| GET | /api/dashboard/overdue-tasks | 超期任务 |
| GET | /api/dashboard/risks | 风险任务 |
| GET | /api/dashboard/current-tasks | 当期任务 (本周) |
| GET | /api/dashboard/next-tasks | 下期任务 (下周) |
| GET | /api/dashboard/man-hour-ranking | 工时排行 (Top 10 + 饼图) |
| GET | /api/dashboard/on-time-rate-ranking | 按期完工率排行 |
| GET | /api/dashboard/in-progress-activities | 在途活动 |

## 12.4 统计计算逻辑

| 指标 | 计算公式 |
|------|---------|
| 完工任务 | `WHERE actual_end >= (today - 30 days) AND status = COMPLETED` |
| 超期任务 | `WHERE is_overdue = TRUE` |
| 当期任务 | `WHERE due_date BETWEEN this_week_start AND this_week_end` |
| 工时排行 | `SUM(actual_hours) GROUP BY assignee_id ORDER BY hours DESC LIMIT 10` |
| 按期率 | `COUNT(CASE WHEN actual_end <= planned_end THEN 1 END) / COUNT(*) * 100` |



> **适用范围**：后端开发、前端开发、架构设计
> **技术基线**：Spring Boot 3.x + Java 21 / Next.js 16 + React 19 + TypeScript

---

# 第13章：消息通知模块（syncflow-message）

## 13.1 模块概述

消息通知模块负责系统内所有通知的创建、存储、推送和用户偏好管理。该模块是连接各业务模块与用户之间的桥梁，承担以下核心职责：

| 职责 | 说明 |
|------|------|
| 通知持久化 | 所有通知先写入数据库，确保离线用户上线后可拉取历史通知 |
| 实时推送 | 通过 STOMP over SockJS 向在线用户即时推送通知 |
| 通知偏好 | 支持用户自定义通知接收方式（站内/邮件/App/短信）和提醒天数 |
| 已读管理 | 支持单条标记已读、全部标记已读、未读数量查询 |

**通知类型枚举（NotificationType）**：

| 类型值 | 说明 | 触发场景 |
|--------|------|---------|
| `TASK_ASSIGNED` | 任务分配通知 | 任务创建/转派时通知被分配人 |
| `TASK_STATUS_CHANGED` | 任务状态变更 | 任务状态流转时通知参与人和关注人 |
| `APPROVAL_UPDATED` | 审批状态更新 | 审批通过/驳回时通知发起人 |
| `APPROVAL_PENDING` | 待审批通知 | 新审批到达时通知审批人 |
| `FILE_UPLOADED` | 文件上传通知 | 文件上传/更新时通知项目成员 |
| `MILESTONE_REACHED` | 里程碑达成 | 里程碑完成时通知项目成员 |
| `COMMENT_ADDED` | 评论通知 | 新评论/回复时通知任务参与人 |
| `SYSTEM` | 系统公告 | 管理员发布公告时通知全体用户 |

**模块依赖关系**：

```
syncflow-task ──┐
syncflow-workflow ──┤──→ syncflow-message ──→ STOMP WebSocket
syncflow-file ──┤
syncflow-project ──┘
```

## 13.2 数据模型

### 13.2.1 notification 表

存储系统中所有通知记录。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGSERIAL | PK | 主键 |
| `user_id` | BIGINT | NOT NULL, FK → sys_user.id, INDEX | 接收人 |
| `type` | VARCHAR(50) | NOT NULL | 通知类型（NotificationType 枚举值） |
| `title` | VARCHAR(200) | NOT NULL | 通知标题 |
| `content` | TEXT | NOT NULL | 通知内容（支持模板渲染） |
| `related_type` | VARCHAR(50) | NULLABLE | 关联实体类型（task/project/file/approval 等） |
| `related_id` | BIGINT | NULLABLE | 关联实体ID |
| `is_read` | BOOLEAN | NOT NULL DEFAULT false | 是否已读 |
| `created_at` | TIMESTAMP | NOT NULL DEFAULT now() | 创建时间 |
| `read_at` | TIMESTAMP | NULLABLE | 阅读时间 |
| `tenant_id` | BIGINT | NULLABLE, INDEX | 租户ID（多租户隔离） |

**索引策略**：

```sql
CREATE INDEX idx_notification_user_read ON notification(user_id, is_read);
CREATE INDEX idx_notification_created ON notification(created_at DESC);
CREATE INDEX idx_notification_user_created ON notification(user_id, created_at DESC);
CREATE INDEX idx_notification_tenant ON notification(tenant_id);
```

### 13.2.2 notification_setting 表

存储用户个人的通知偏好设置。每个用户一条记录。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGSERIAL | PK | 主键 |
| `user_id` | BIGINT | NOT NULL UNIQUE, FK → sys_user.id | 用户ID |
| `task_reminder` | BOOLEAN | NOT NULL DEFAULT true | 是否接收任务提醒 |
| `email_notify` | BOOLEAN | NOT NULL DEFAULT false | 是否启用邮件通知 |
| `app_notify` | BOOLEAN | NOT NULL DEFAULT true | 是否启用站内通知 |
| `sms_notify` | BOOLEAN | NOT NULL DEFAULT false | 是否启用短信通知 |
| `reminder_days` | SMALLINT | NOT NULL DEFAULT 3 | 任务到期前提醒天数 |
| `created_at` | TIMESTAMP | NOT NULL DEFAULT now() | 创建时间 |
| `updated_at` | TIMESTAMP | NOT NULL DEFAULT now() | 更新时间 |

### 13.2.3 DDL 语句

```sql
CREATE TABLE notification (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT       NOT NULL REFERENCES sys_user(id),
    type          VARCHAR(50)  NOT NULL,
    title         VARCHAR(200) NOT NULL,
    content       TEXT         NOT NULL,
    related_type  VARCHAR(50),
    related_id    BIGINT,
    is_read       BOOLEAN      NOT NULL DEFAULT false,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    read_at       TIMESTAMP,
    tenant_id     BIGINT
);

CREATE TABLE notification_setting (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT      NOT NULL UNIQUE REFERENCES sys_user(id),
    task_reminder  BOOLEAN     NOT NULL DEFAULT true,
    email_notify   BOOLEAN     NOT NULL DEFAULT false,
    app_notify     BOOLEAN     NOT NULL DEFAULT true,
    sms_notify     BOOLEAN     NOT NULL DEFAULT false,
    reminder_days  SMALLINT    NOT NULL DEFAULT 3,
    created_at     TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP   NOT NULL DEFAULT now()
);
```

## 13.3 WebSocket 架构

### 13.3.1 STOMP over SockJS 配置

系统使用 STOMP 协议在 SockJS 之上实现 WebSocket 通信，由 Spring Boot 原生支持。

**WebSocketConfig 配置类**：

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:5173")
                .withSockJS();
    }
}
```

**Destination 规划**：

| Destination 模式 | 类型 | 说明 |
|------------------|------|------|
| `/topic/approval` | 广播 | 审批事件广播（所有监听者收到） |
| `/topic/task/{projectId}` | 广播 | 项目内任务状态变更 |
| `/topic/system` | 广播 | 系统公告 |
| `/user/queue/notifications` | 点对点 | 个人通知推送（通过 SimpMessagingTemplate 路由到具体用户） |

### 13.3.2 NotificationPushService

核心推送服务，封装 STOMP 消息发送逻辑，供各业务模块调用。

```java
@Service
@RequiredArgsConstructor
public class NotificationPushService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;
    private final NotificationSettingRepository settingRepository;

    /**
     * 向指定用户推送通知（同时持久化）
     */
    public void sendToUser(Long userId, Notification notification) {
        // 1. 持久化通知
        notification.setUserId(userId);
        notificationRepository.save(notification);

        // 2. 检查用户通知偏好
        NotificationSetting setting = settingRepository.findByUserId(userId)
            .orElse(NotificationSetting.defaultSetting());

        // 3. STOMP 实时推送（站内通知）
        if (setting.isAppNotify()) {
            NotificationVO vo = toVO(notification);
            messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/notifications",
                vo
            );
        }

        // 4. 邮件通知（异步）
        if (setting.isEmailNotify()) {
            // 发送邮件通知（异步线程池处理）
        }
    }

    /**
     * 向指定 Topic 广播消息
     */
    public void sendToTopic(String destination, Object message) {
        messagingTemplate.convertAndSend(destination, message);
    }

    /**
     * 批量推送通知给多个用户
     */
    public void sendToUsers(List<Long> userIds, Function<Long, Notification> notificationFactory) {
        for (Long userId : userIds) {
            sendToUser(userId, notificationFactory.apply(userId));
        }
    }

    /**
     * 推送审批事件到审批 Topic
     */
    public void pushApprovalEvent(ApprovalEventVO event) {
        messagingTemplate.convertAndSend("/topic/approval", event);
    }
}
```

### 13.3.3 前端 STOMP 集成

前端从 Socket.IO 迁移到 STOMP over SockJS：

```typescript
// hooks/useStomp.ts
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function useStomp() {
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    const stompClient = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        // 订阅个人通知队列
        stompClient.subscribe('/user/queue/notifications', (message) => {
          const notification = JSON.parse(message.body);
          useNotificationStore.getState().addNotification(notification);
        });
        // 订阅审批事件
        stompClient.subscribe('/topic/approval', (message) => {
          const event = JSON.parse(message.body);
          useNotificationStore.getState().handleApprovalEvent(event);
        });
      },
    });
    stompClient.activate();
    setClient(stompClient);

    return () => { stompClient.deactivate(); };
  }, []);

  return client;
}
```

## 13.4 API 接口

所有接口前缀：`/api/notifications`

### 13.4.1 接口列表

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/api/notifications` | 获取通知列表（分页+筛选） | 登录用户 |
| `GET` | `/api/notifications/unread-count` | 获取未读通知数量 | 登录用户 |
| `PATCH` | `/api/notifications/{id}/read` | 标记单条通知已读 | 登录用户（本人通知） |
| `PATCH` | `/api/notifications/read-all` | 全部标记已读 | 登录用户 |
| `GET` | `/api/notifications/settings` | 获取通知偏好设置 | 登录用户 |
| `PUT` | `/api/notifications/settings` | 更新通知偏好设置 | 登录用户 |

### 13.4.2 接口详情

**GET /api/notifications**

获取当前用户的分页通知列表。

请求参数：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | int | 否 | 页码，默认 1 |
| `size` | int | 否 | 每页条数，默认 20 |
| `isRead` | boolean | 否 | 筛选已读/未读 |
| `type` | string | 否 | 按通知类型筛选 |

响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [
      {
        "id": 1,
        "type": "TASK_ASSIGNED",
        "title": "任务分配通知",
        "content": "您被分配了任务「首页UI设计」",
        "relatedType": "task",
        "relatedId": 42,
        "isRead": false,
        "createdAt": "2026-05-06T10:30:00Z",
        "readAt": null
      }
    ],
    "total": 35,
    "size": 20,
    "current": 1
  },
  "timestamp": 1746529800000
}
```

**GET /api/notifications/unread-count**

响应：

```json
{
  "code": 200,
  "message": "success",
  "data": 5,
  "timestamp": 1746529800000
}
```

**PATCH /api/notifications/{id}/read**

响应：

```json
{
  "code": 200,
  "message": "标记已读成功",
  "data": null,
  "timestamp": 1746529800000
}
```

**PATCH /api/notifications/read-all**

响应：

```json
{
  "code": 200,
  "message": "全部标记已读成功",
  "data": { "affectedCount": 12 },
  "timestamp": 1746529800000
}
```

**GET /api/notifications/settings**

响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "taskReminder": true,
    "emailNotify": false,
    "appNotify": true,
    "smsNotify": false,
    "reminderDays": 3
  },
  "timestamp": 1746529800000
}
```

**PUT /api/notifications/settings**

请求体：

```json
{
  "taskReminder": true,
  "emailNotify": true,
  "appNotify": true,
  "smsNotify": false,
  "reminderDays": 5
}
```

### 13.4.3 服务层类设计

| 类名 | 职责 |
|------|------|
| `NotificationController` | REST 接口层，处理通知 CRUD 和设置管理 |
| `NotificationService` | 业务逻辑层，通知查询/创建/标记已读 |
| `NotificationPushService` | 推送服务层，STOMP 推送 + 持久化 + 偏好检查 |
| `NotificationRepository` | 数据访问层，基于 MyBatis-Plus 的 CRUD |
| `NotificationSettingRepository` | 数据访问层，通知设置 CRUD |

---

# 第14章：错误处理与异常设计

## 14.1 统一返回格式

### 14.1.1 Result\<T\> 通用响应

所有 API 接口统一返回 `Result<T>` 格式，确保前后端交互规范一致。

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Result<T> {
    private int code;
    private String message;
    private T data;
    private long timestamp;

    public static <T> Result<T> success(T data) {
        return Result.<T>builder()
            .code(200)
            .message("success")
            .data(data)
            .timestamp(System.currentTimeMillis())
            .build();
    }

    public static <T> Result<T> success(String message, T data) {
        return Result.<T>builder()
            .code(200)
            .message(message)
            .data(data)
            .timestamp(System.currentTimeMillis())
            .build();
    }

    public static <T> Result<T> error(int code, String message) {
        return Result.<T>builder()
            .code(code)
            .message(message)
            .data(null)
            .timestamp(System.currentTimeMillis())
            .build();
    }
}
```

**JSON 响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "timestamp": 1746529800000
}
```

### 14.1.2 PageResult\<T\> 分页响应

分页查询统一使用 `PageResult<T>` 封装。

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResult<T> {
    private List<T> records;
    private long total;
    private int size;
    private int current;

    public static <T> PageResult<T> of(IPage<T> page) {
        return PageResult.<T>builder()
            .records(page.getRecords())
            .total(page.getTotal())
            .size((int) page.getSize())
            .current((int) page.getCurrent())
            .build();
    }
}
```

**JSON 响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [ ... ],
    "total": 150,
    "size": 20,
    "current": 1
  },
  "timestamp": 1746529800000
}
```

## 14.2 错误码体系

### 14.2.1 错误码规范

错误码采用 5 位数字编码，格式为 `XYYZZ`：

- `X`：模块标识（1=认证，2=项目，3=任务，4=BOM，5=审批，6=文件，7=配置，8=通知）
- `YY`：功能域标识
- `ZZ`：具体错误序号

### 14.2.2 ErrorCode 枚举

```java
@Getter
@AllArgsConstructor
public enum ErrorCode {

    // ========== 通用错误 (00xxx) ==========
    SUCCESS(200, "操作成功"),
    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未认证或认证已过期"),
    FORBIDDEN(403, "权限不足"),
    NOT_FOUND(404, "资源不存在"),
    INTERNAL_ERROR(500, "系统内部错误"),

    // ========== 认证模块 (1xxxx) ==========
    AUTH_LOGIN_FAILED(10001, "用户名或密码错误"),
    AUTH_TOKEN_EXPIRED(10002, "Token已过期，请重新登录"),
    AUTH_TOKEN_INVALID(10003, "Token无效"),
    AUTH_REFRESH_FAILED(10004, "RefreshToken已过期，请重新登录"),
    AUTH_USER_LOCKED(10005, "账号已被锁定，请联系管理员"),
    AUTH_USER_DISABLED(10006, "账号已被禁用"),
    AUTH_USERNAME_EXISTS(10007, "用户名已存在"),
    AUTH_PASSWORD_MISMATCH(10008, "两次输入的密码不一致"),

    // ========== 项目模块 (2xxxx) ==========
    PROJECT_NOT_FOUND(20001, "项目不存在"),
    PROJECT_NAME_DUPLICATE(20002, "项目名称已存在"),
    PROJECT_HAS_CHILDREN(20003, "该项目下存在子项目，无法删除"),
    PROJECT_MEMBER_EXISTS(20004, "该用户已是项目成员"),
    PROJECT_PHASE_NOT_FOUND(20005, "项目阶段不存在"),
    PROJECT_MILESTONE_NOT_FOUND(20006, "里程碑不存在"),

    // ========== 任务模块 (3xxxx) ==========
    TASK_NOT_FOUND(30001, "任务不存在"),
    TASK_ALREADY_COMPLETED(30002, "任务已完成，无法修改"),
    TASK_DEPENDENCY_CYCLE(30003, "任务依赖关系存在循环"),
    TASK_TYPE_INVALID(30004, "不支持的任务类型"),
    TASK_QUICK_PARSE_FAILED(30005, "快速创建格式解析失败"),

    // ========== BOM 模块 (4xxxx) ==========
    BOM_NOT_FOUND(40001, "BOM不存在"),
    BOM_ITEM_NOT_FOUND(40002, "BOM项不存在"),
    BOM_HAS_CHILDREN(40003, "该BOM项下存在子项，无法删除"),
    BOM_VERSION_CONFLICT(40004, "BOM版本冲突，请刷新后重试"),
    BOM_ALREADY_SUBMITTED(40005, "BOM已提交审批，无法修改"),

    // ========== 审批模块 (5xxxx) ==========
    APPROVAL_NOT_FOUND(50001, "审批记录不存在"),
    APPROVAL_ALREADY_PROCESSED(50002, "该审批已处理"),
    APPROVAL_NO_PERMISSION(50003, "您不是该审批的审批人"),
    APPROVAL_FLOWABLE_ERROR(50004, "流程引擎异常"),
    APPROVAL_CONFIG_NOT_FOUND(50005, "审批配置不存在"),

    // ========== 文件模块 (6xxxx) ==========
    FILE_NOT_FOUND(60001, "文件不存在"),
    FILE_UPLOAD_FAILED(60002, "文件上传失败"),
    FILE_SIZE_EXCEEDED(60003, "文件大小超出限制"),
    FILE_TYPE_NOT_ALLOWED(60004, "不支持的文件类型"),
    FILE_VERSION_CONFLICT(60005, "文件版本冲突"),

    // ========== 配置模块 (7xxxx) ==========
    CONFIG_MODULE_NOT_FOUND(70001, "模块不存在"),
    CONFIG_SPEC_NOT_FOUND(70002, "规格不存在"),
    CONFIG_CATEGORY_HAS_CHILDREN(70003, "该分类下存在子项，无法删除"),
    CONFIG_DUPLICATE_CODE(70004, "编码已存在"),

    // ========== 通知模块 (8xxxx) ==========
    NOTIFICATION_NOT_FOUND(80001, "通知不存在"),
    NOTIFICATION_SETTING_FAILED(80002, "通知设置更新失败");

    private final int code;
    private final String message;
}
```

### 14.2.3 业务异常类

```java
@Getter
public class BusinessException extends RuntimeException {
    private final int code;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.code = errorCode.getCode();
    }

    public BusinessException(ErrorCode errorCode, String detail) {
        super(detail);
        this.code = errorCode.getCode();
    }

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }
}
```

## 14.3 全局异常处理

### 14.3.1 GlobalExceptionHandler

通过 `@RestControllerAdvice` 统一拦截所有异常，转换为标准 `Result<T>` 格式返回。

```java
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 业务异常 -- 最常见的可控异常
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Result<Void>> handleBusiness(BusinessException e) {
        log.warn("业务异常: code={}, message={}", e.getCode(), e.getMessage());
        return ResponseEntity.status(e.getCode() >= 500 ? 500 : e.getCode())
            .body(Result.error(e.getCode(), e.getMessage()));
    }

    /**
     * DTO 字段校验失败 -- @Valid + @NotBlank/@NotNull/@Size 等
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Result<Map<String, String>>> handleValidation(
            MethodArgumentNotValidException e) {
        Map<String, String> errors = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(err ->
            errors.put(err.getField(), err.getDefaultMessage())
        );
        log.warn("参数校验失败: {}", errors);
        return ResponseEntity.badRequest()
            .body(Result.<Map<String, String>>builder()
                .code(400)
                .message("参数校验失败")
                .data(errors)
                .timestamp(System.currentTimeMillis())
                .build());
    }

    /**
     * 表单绑定异常 -- @ModelAttribute 绑定失败
     */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<Result<Map<String, String>>> handleBind(BindException e) {
        Map<String, String> errors = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(err ->
            errors.put(err.getField(), err.getDefaultMessage())
        );
        return ResponseEntity.badRequest()
            .body(Result.<Map<String, String>>builder()
                .code(400)
                .message("参数绑定失败")
                .data(errors)
                .timestamp(System.currentTimeMillis())
                .build());
    }

    /**
     * 请求方法不支持
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Result<Void>> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException e) {
        return ResponseEntity.status(405)
            .body(Result.error(405, "请求方法不支持: " + e.getMethod()));
    }

    /**
     * 兜底异常 -- 未预料的系统错误
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Result<Void>> handleException(Exception e) {
        log.error("系统异常", e);
        return ResponseEntity.status(500)
            .body(Result.error(500, "系统内部错误，请稍后重试"));
    }
}
```

### 14.3.2 异常处理优先级

```
请求进入 Controller
    │
    ├─ 参数校验失败 → MethodArgumentNotValidException → 400 + 字段级错误
    │
    ├─ 业务逻辑异常 → BusinessException → 对应错误码 + 错误消息
    │
    ├─ 运行时异常（空指针等）→ Exception → 500 + 通用提示
    │
    └─ 正常返回 → Result.success(data)
```

## 14.4 边界情况处理

### 14.4.1 空状态设计规范

前端对所有列表页和详情页的空状态提供统一处理：

| 场景 | 展示内容 | 操作引导 |
|------|---------|---------|
| 列表无数据 | 空状态插图 + "暂无数据" 主文案 | 显示"新建"按钮引导 |
| 搜索无结果 | 搜索图标 + "未找到匹配结果" | "请尝试其他关键词" |
| 筛选无结果 | 筛选图标 + "当前条件下无数据" | "清除筛选" 按钮 |
| 详情页加载失败 | 警告图标 + "加载失败" | "重试" 按钮 |
| 404 页面 | 404 插图 + "页面不存在" | "返回首页" 按钮 |
| 500 页面 | 错误图标 + "系统异常" | "重试" + "返回首页" |

### 14.4.2 加载状态规范

| 状态 | 前端表现 | 说明 |
|------|---------|------|
| 首次加载 | 骨架屏（Skeleton） | 使用 shadcn/ui Skeleton 组件 |
| 局部刷新 | Spinner + 半透明遮罩 | 目标区域显示加载动画 |
| 按钮提交 | 按钮置灰 + "提交中..." + Loading 图标 | 防止重复提交 |
| 长任务 | Progress 进度条 + 预计时间 | 文件上传、数据导入等 |
| 网络断开 | 顶部全局 Banner "网络连接已断开，正在重连..." | STOMP 断线自动检测 |

### 14.4.3 并发冲突处理

| 场景 | 冲突检测 | 处理策略 |
|------|---------|---------|
| 任务编辑冲突 | 乐观锁（version 字段） | 后保存者收到 409，提示"数据已被他人修改，请刷新" |
| 文件版本冲突 | 文件版本号比对 | 提示"文件已有新版本，是否创建新版本？" |
| BOM 修改冲突 | 乐观锁 + 审批状态检查 | 已提交审批的 BOM 禁止修改 |
| 甘特图拖拽 | WebSocket 实时推送 | 其他用户实时看到排期变更，锁定正在编辑的甘特条 |

**乐观锁实现**：

```java
@Data
public class BaseEntity {
    @Version
    private Integer version;
}

// MyBatis-Plus 自动处理 @Version 字段
// UPDATE ... SET ..., version = version + 1 WHERE id = ? AND version = ?
```

---

# 第15章：安全设计

## 15.1 认证架构

### 15.1.1 JWT 认证流程

系统采用 JWT（JSON Web Token）作为无状态认证方案，结合 Spring Security 实现完整的认证与授权体系。

**认证流程**：

```
客户端                        服务端
  │                              │
  │── POST /api/auth/login ────→│
  │   { username, password }     │
  │                              │── 校验用户名密码
  │                              │── 生成 AccessToken + RefreshToken
  │←── { accessToken,           │
  │      refreshToken, user } ──│
  │                              │
  │── GET /api/xxx ────────────→│
  │   Authorization: Bearer xxx  │
  │                              │── JwtAuthenticationFilter 拦截
  │                              │── 解析并校验 Token
  │                              │── 设置 SecurityContext
  │←── { data } ───────────────│
  │                              │
  │   (Token 过期)               │
  │←── 401 Unauthorized ───────│
  │                              │
  │── POST /api/auth/refresh ──→│
  │   { refreshToken }           │
  │                              │── 校验 RefreshToken
  │←── { accessToken } ────────│
  │                              │
  │── 重试原请求 ──────────────→│
```

### 15.1.2 Token 配置

| Token 类型 | 有效载荷 | 有效期 | 存储位置 |
|-----------|---------|--------|---------|
| Access Token | userId, username, roles, permissions | 15 分钟 | 前端内存 / localStorage |
| Refresh Token | userId, tokenVersion | 7 天 | httpOnly Cookie |

**Token 生成服务**：

```java
@Service
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expiration:900000}")  // 15 min
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration:604800000}")  // 7 days
    private long refreshTokenExpiration;

    public String generateAccessToken(UserDetails user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", user.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority).toList());
        return Jwts.builder()
            .setClaims(claims)
            .setSubject(user.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
            .signWith(Keys.hmacShaKeyFor(secret.getBytes()), SignatureAlgorithm.HS256)
            .compact();
    }

    public String generateRefreshToken(Long userId, int tokenVersion) {
        return Jwts.builder()
            .setSubject(userId.toString())
            .claim("version", tokenVersion)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + refreshTokenExpiration))
            .signWith(Keys.hmacShaKeyFor(secret.getBytes()), SignatureAlgorithm.HS256)
            .compact();
    }
}
```

### 15.1.3 密码安全

| 安全措施 | 实现 |
|---------|------|
| 哈希算法 | BCrypt（Spring Security 默认，cost factor = 10） |
| 密码策略 | 最少 8 位，至少包含大小写字母和数字 |
| 密码存储 | 仅存储 BCrypt 哈希值，不可逆 |
| 登录失败锁定 | 连续 5 次失败锁定 30 分钟 |

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(10);
}
```

## 15.2 权限模型

### 15.2.1 RBAC 数据模型

```
sys_user ──── sys_user_role ──── sys_role
                   │
                   ├── scope_type (GLOBAL / PROJECT / DEPT)
                   └── scope_id   (关联项目ID或部门ID)

sys_role ──── sys_permission
              ├── module   (project / task / bom / ...)
              ├── action   (create / read / update / delete / approve)
              └── code     (project:create, task:read, ...)
```

**UserRole 关联表**（支持范围限定）：

| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | BIGINT | 用户ID |
| role_id | BIGINT | 角色ID |
| scope_type | VARCHAR(20) | 权限范围类型：GLOBAL / PROJECT / DEPT |
| scope_id | BIGINT | 范围关联ID（scope_type 为 GLOBAL 时为 NULL） |

**数据权限隔离级别**：

| 级别 | scope_type | 说明 | 查询条件 |
|------|-----------|------|---------|
| 全局 | GLOBAL | 管理员，可见所有数据 | 无过滤 |
| 项目 | PROJECT | 项目成员，可见项目内数据 | WHERE project_id IN user.projectIds |
| 部门 | DEPT | 部门主管，可见部门内数据 | WHERE dept_id = user.deptId |
| 个人 | (默认) | 普通用户，仅见自己数据 | WHERE assignee_id = user.id |

### 15.2.2 Spring Security 配置

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 公开端点（无需认证）
                .requestMatchers("/api/auth/login").permitAll()
                .requestMatchers("/api/auth/register").permitAll()
                .requestMatchers("/api/auth/refresh").permitAll()
                .requestMatchers("/ws/**").permitAll()
                // Swagger / OpenAPI
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                // 健康检查
                .requestMatchers("/actuator/health").permitAll()
                // 其他端点需要认证
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

### 15.2.3 JwtAuthenticationFilter

```java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = authHeader.substring(7);

        try {
            String username = tokenProvider.extractUsername(jwt);

            if (username != null &&
                SecurityContextHolder.getContext().getAuthentication() == null) {

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (tokenProvider.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (ExpiredJwtException e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"code\":10002,\"message\":\"Token已过期\"}");
            return;
        } catch (JwtException e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"code\":10003,\"message\":\"Token无效\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
```

## 15.3 输入验证

### 15.3.1 DTO 验证体系

所有 Controller 入参均使用 `@Valid` + JSR-303 注解进行自动校验。

**注解使用规范**：

| 注解 | 适用场景 | 示例 |
|------|---------|------|
| `@NotBlank` | 字符串必填 | `@NotBlank(message = "项目名称不能为空")` |
| `@NotNull` | 非字符串必填 | `@NotNull(message = "负责人不能为空")` |
| `@Size` | 字符串长度限制 | `@Size(max = 200, message = "名称不超过200字符")` |
| `@Min` / `@Max` | 数值范围 | `@Min(0) @Max(100)` |
| `@Email` | 邮箱格式 | `@Email(message = "邮箱格式不正确")` |
| `@Pattern` | 正则匹配 | `@Pattern(regexp = "^[a-zA-Z0-9_]+$")` |
| `@Valid` | 嵌套对象校验 | Controller 方法参数标注 |
| `@Positive` | 正数 | 金额、数量等 |

**典型 DTO 示例**：

```java
@Data
public class CreateProjectDTO {
    @NotBlank(message = "项目名称不能为空")
    @Size(max = 200, message = "项目名称不超过200个字符")
    private String name;

    @Size(max = 2000, message = "项目描述不超过2000个字符")
    private String description;

    @NotNull(message = "项目负责人不能为空")
    private Long leaderId;

    private Long parentId;

    @Size(max = 50)
    private String projectType;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate planStart;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate planEnd;
}
```

### 15.3.2 Controller 使用方式

```java
@PostMapping
public ResponseEntity<Result<ProjectVO>> create(
        @Valid @RequestBody CreateProjectDTO dto) {
    ProjectVO project = projectService.create(dto);
    return ResponseEntity.ok(Result.success(project));
}
```

### 15.3.3 校验失败响应格式

```json
{
  "code": 400,
  "message": "参数校验失败",
  "data": {
    "name": "项目名称不能为空",
    "leaderId": "负责人不能为空"
  },
  "timestamp": 1746529800000
}
```

## 15.4 安全配置

### 15.4.1 CORS 跨域配置

前端开发服务器运行在 `http://localhost:5173`，后端运行在 `http://localhost:8080`，需要 CORS 配置。

| 配置项 | 值 | 说明 |
|--------|------|------|
| AllowedOrigins | `http://localhost:5173` | 开发环境前端地址（生产环境替换为实际域名） |
| AllowedMethods | GET, POST, PUT, PATCH, DELETE, OPTIONS | 允许的 HTTP 方法 |
| AllowedHeaders | `*` | 允许所有请求头 |
| AllowCredentials | `true` | 允许携带 Cookie（Refresh Token） |
| MaxAge | `3600` | 预检请求缓存 1 小时 |

### 15.4.2 CSRF 防护

系统采用无状态 JWT 认证方案，**禁用 CSRF 防护**。理由：

- JWT Token 存储在 Authorization Header 中，天然免疫 CSRF 攻击
- 无状态 API 不依赖 Cookie 做身份验证（Refresh Token 的 httpOnly Cookie 仅用于刷新）
- Spring Security 默认在 `STATELESS` Session 策略下已禁用 CSRF

### 15.4.3 会话管理

```java
.sessionManagement(session ->
    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
```

- 不使用服务端 Session
- 每次请求通过 JWT Token 无状态认证
- SecurityContext 不跨请求持久化

### 15.4.4 速率限制

| 端点 | 限制 | 理由 |
|------|------|------|
| `POST /api/auth/login` | 5 次/分钟 | 防暴力破解 |
| `POST /api/auth/register` | 3 次/分钟 | 防批量注册 |
| `POST /api/auth/refresh` | 10 次/分钟 | 防 Token 洪泛 |
| `POST /api/files/upload` | 10 次/分钟 | 防滥用存储 |
| 其他端点 | 100 次/分钟 | 通用防护 |

实现方式：基于 Redis 的滑动窗口限流，使用 Spring 拦截器或 Bucket4j 库。

---

# 第16章：实时通信设计

## 16.1 STOMP 架构

### 16.1.1 架构概览

```
┌─────────────────────────────────────────────────────┐
│                    前端 (Next.js)                     │
│  @stomp/stompjs + sockjs-client                      │
│  subscribe /topic/approval                           │
│  subscribe /user/queue/notifications                 │
└──────────────────────┬──────────────────────────────┘
                       │ STOMP over SockJS (/ws)
                       ▼
┌─────────────────────────────────────────────────────┐
│              Spring Boot 服务端                       │
│  @EnableWebSocketMessageBroker                       │
│  SimpleBroker: /topic + /queue                       │
│  ApplicationDestinationPrefix: /app                  │
│  SockJS Endpoint: /ws                                │
├─────────────────────────────────────────────────────┤
│  NotificationPushService                             │
│  ├── SimpMessagingTemplate                           │
│  ├── 持久化 → notification 表                        │
│  └── 偏好检查 → notification_setting 表              │
├─────────────────────────────────────────────────────┤
│  业务层触发点:                                        │
│  ├── TaskService      → 任务状态变更/分配             │
│  ├── WorkflowService   → 审批创建/完成                │
│  ├── FileService       → 文件上传                     │
│  └── ProjectService    → 里程碑达成                   │
└─────────────────────────────────────────────────────┘
```

### 16.1.2 消息格式规范

所有 STOMP 消息体采用统一的 JSON 格式：

```json
{
  "eventType": "TASK_STATUS_CHANGED",
  "timestamp": "2026-05-06T10:30:00Z",
  "payload": {
    "taskId": 42,
    "taskName": "首页UI设计",
    "oldStatus": "IN_PROGRESS",
    "newStatus": "COMPLETED",
    "operatorId": 5,
    "operatorName": "张三",
    "projectId": 10
  }
}
```

**事件类型枚举（EventType）**：

| 事件类型 | 触发条件 | 推送目标 |
|---------|---------|---------|
| `TASK_STATUS_CHANGED` | 任务状态变更 | `/topic/task/{projectId}` |
| `TASK_ASSIGNED` | 任务分配 | `/user/queue/notifications`（被分配人） |
| `APPROVAL_CREATED` | 新审批创建 | `/topic/approval` + `/user/queue/notifications`（审批人） |
| `APPROVAL_COMPLETED` | 审批完成/驳回 | `/topic/approval` + `/user/queue/notifications`（发起人） |
| `FILE_UPLOADED` | 文件上传 | `/topic/task/{projectId}` |
| `MILESTONE_REACHED` | 里程碑达成 | `/topic/task/{projectId}` |
| `COMMENT_ADDED` | 新评论 | `/user/queue/notifications`（参与人） |
| `SYSTEM_ANNOUNCEMENT` | 系统公告 | `/topic/system` |

### 16.1.3 连接生命周期管理

```java
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final SimpUserRegistry userRegistry;

    @EventListener
    public void handleSessionConnect(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = MessageHeaderAccessor
            .getAccessor(event.getMessage(), StompHeaderAccessor.class);
        String username = accessor.getUser().getName();
        log.info("WebSocket 连接: user={}", username);
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = MessageHeaderAccessor
            .getAccessor(event.getMessage(), StompHeaderAccessor.class);
        String username = accessor.getUser().getName();
        log.info("WebSocket 断开: user={}", username);
    }
}
```

### 16.1.4 认证集成

WebSocket 连接建立时需要验证 JWT Token：

```java
@Configuration
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider tokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor
            .getAccessor(message, StompHeaderAccessor.class);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                if (tokenProvider.isTokenValid(token)) {
                    String username = tokenProvider.extractUsername(token);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    accessor.setUser(auth);
                }
            }
        }
        return message;
    }
}
```

## 16.2 推送场景

### 16.2.1 任务状态变更推送

当任务状态发生变更时，通知该项目下的所有相关成员。

**触发点**：`TaskService.updateTaskStatus()`

**推送逻辑**：

```java
// TaskService.java
public void updateTaskStatus(Long taskId, TaskStatus newStatus) {
    Task task = taskRepository.findById(taskId)
        .orElseThrow(() -> new BusinessException(ErrorCode.TASK_NOT_FOUND));
    TaskStatus oldStatus = task.getStatus();
    task.setStatus(newStatus);
    taskRepository.updateById(task);

    // 1. 推送到项目 Topic
    TaskStatusChangedVO event = TaskStatusChangedVO.builder()
        .taskId(taskId)
        .taskName(task.getName())
        .oldStatus(oldStatus)
        .newStatus(newStatus)
        .operatorId(getCurrentUserId())
        .operatorName(getCurrentUserName())
        .projectId(task.getProjectId())
        .build();
    pushService.sendToTopic("/topic/task/" + task.getProjectId(), event);

    // 2. 通知任务关注人
    List<Long> watchers = taskWatcherRepository.findUserIdsByTaskId(taskId);
    for (Long userId : watchers) {
        pushService.sendToUser(userId, Notification.builder()
            .type(NotificationType.TASK_STATUS_CHANGED)
            .title("任务状态变更")
            .content(String.format("任务「%s」状态已变更为 %s", task.getName(), newStatus))
            .relatedType("task")
            .relatedId(taskId)
            .build());
    }
}
```

### 16.2.2 审批通知推送

审批事件是系统中最关键的推送场景，涉及审批人通知和状态回写。

**触发点**：`WorkflowService`（Flowable 事件监听器）

**推送逻辑**：

| Flowable 事件 | 推送动作 |
|--------------|---------|
| `TASK_CREATED` | 通知审批人有新的待审批任务 |
| `TASK_COMPLETED` | 通知发起人审批已处理 |
| `PROCESS_COMPLETED` | 通知发起人流程已完成，回写业务状态 |

```java
// WorkflowEventListener.java
@Component
@RequiredArgsConstructor
public class WorkflowEventListener {

    private final NotificationPushService pushService;

    @EventListener
    public void onApprovalTaskCreated(FlowableApprovalTaskEvent event) {
        // 推送审批事件到全局 Topic
        pushService.pushApprovalEvent(ApprovalEventVO.builder()
            .eventType("APPROVAL_CREATED")
            .businessType(event.getBusinessType())
            .businessId(event.getBusinessId())
            .assigneeId(event.getAssigneeId())
            .build());

        // 通知具体审批人
        pushService.sendToUser(event.getAssigneeId(), Notification.builder()
            .type(NotificationType.APPROVAL_PENDING)
            .title("您有新的待审批任务")
            .content(event.getTaskDescription())
            .relatedType("approval")
            .relatedId(event.getBusinessId())
            .build());
    }
}
```

### 16.2.3 实时推送场景总览

| 场景 | 触发服务 | 推送目标 | 消息类型 |
|------|---------|---------|---------|
| 任务状态变更 | TaskService | 项目 Topic + 关注人 | TASK_STATUS_CHANGED |
| 任务分配/转派 | TaskService | 被分配人 | TASK_ASSIGNED |
| 审批任务到达 | WorkflowService | 审批人 | APPROVAL_PENDING |
| 审批完成 | WorkflowService | 发起人 + 项目 Topic | APPROVAL_COMPLETED |
| 文件上传 | FileService | 项目 Topic | FILE_UPLOADED |
| 里程碑达成 | ProjectService | 项目成员 | MILESTONE_REACHED |
| 新评论 | TaskService | 任务参与人 | COMMENT_ADDED |
| 系统公告 | AdminService | 全体在线用户 (/topic/system) | SYSTEM_ANNOUNCEMENT |

### 16.2.4 降级策略

系统采用三级降级策略，确保在任何网络环境下都能获取通知：

| 优先级 | 方案 | 触发条件 | 实现方式 |
|--------|------|---------|---------|
| 1（首选） | STOMP over SockJS | 默认方案 | @stomp/stompjs + sockjs-client |
| 2（降级） | SSE (Server-Sent Events) | WebSocket 连接失败 3 次 | EventSource API |
| 3（兜底） | HTTP Polling | SSE 也不可用 | 30 秒间隔轮询 GET /api/notifications |

**前端降级实现**：

```typescript
// hooks/useRealTimeNotifications.ts
export function useRealTimeNotifications() {
  const [strategy, setStrategy] = useState<'stomp' | 'sse' | 'polling'>('stomp');
  const [failureCount, setFailureCount] = useState(0);

  // 策略 1: STOMP
  useEffect(() => {
    if (strategy === 'stomp') {
      const client = createStompClient();
      client.onDisconnect = () => {
        setFailureCount(c => {
          if (c + 1 >= 3) setStrategy('sse');
          return c + 1;
        });
      };
    }
  }, [strategy]);

  // 策略 2: SSE
  useEffect(() => {
    if (strategy === 'sse') {
      const eventSource = new EventSource('/api/notifications/stream');
      eventSource.onerror = () => setStrategy('polling');
    }
  }, [strategy]);

  // 策略 3: Polling
  useEffect(() => {
    if (strategy === 'polling') {
      const interval = setInterval(() => {
        // 轮询未读通知
        api.get('/api/notifications/unread-count');
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [strategy]);
}
```

## 16.3 前端集成

### 16.3.1 依赖安装

```bash
npm install @stomp/stompjs sockjs-client
npm install -D @types/sockjs-client
```

### 16.3.2 STOMP 客户端封装

```typescript
// services/websocket.service.ts
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '@/stores/authStore';

type MessageHandler = (payload: any) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, { unsubscribe: () => void }> = new Map();

  connect(): void {
    const token = useAuthStore.getState().accessToken;

    this.client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('[WS] Connected');
      },
      onDisconnect: () => {
        console.log('[WS] Disconnected');
      },
      onStompError: (frame) => {
        console.error('[WS] STOMP Error:', frame.headers['message']);
      },
    });

    this.client.activate();
  }

  disconnect(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();
    this.client?.deactivate();
  }

  subscribe(destination: string, handler: MessageHandler): void {
    if (!this.client?.connected) return;

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      handler(JSON.parse(message.body));
    });

    this.subscriptions.set(destination, subscription);
  }

  unsubscribe(destination: string): void {
    this.subscriptions.get(destination)?.unsubscribe();
    this.subscriptions.delete(destination);
  }
}

export const wsService = new WebSocketService();
```

### 16.3.3 页面级订阅示例

```typescript
// pages/ApprovalPage.tsx
export function ApprovalPage() {
  useEffect(() => {
    wsService.subscribe('/topic/approval', (event) => {
      if (event.eventType === 'APPROVAL_CREATED') {
        // 刷新待审批列表
        useApprovalStore.getState().fetchPendingApprovals();
        // 显示通知气泡
        notification.info({
          message: '新的审批任务',
          description: event.payload.description,
        });
      }
    });

    return () => {
      wsService.unsubscribe('/topic/approval');
    };
  }, []);
}
```

---


# 第17章：前端交互设计

> 本章基于最终版产品需求文档（260509协同项目管理逻辑描述.docx），定义工作空间、项目管理、中控看板三大核心页面的交互规范。

## 17.1 工作空间布局规范

### 17.1.1 整体布局（两栏 → 三栏过渡）

工作空间是用户登录后的首页，采用**自适应多栏布局**：

**默认两栏模式**：
```
┌──────────────────────────────────────────────────────┐
│                    综合查询栏                          │
├────────────┬─────────────────────────────────────────┤
│            │                                         │
│  左侧导航   │         任务列表（中间）                  │
│  任务分类   │                                         │
│            │                                         │
│            │                                         │
│            ├─────────────────────────────────────────┤
│            │           底部快速创建输入栏               │
└────────────┴─────────────────────────────────────────┘
```

**选中任务后三栏模式**：
```
┌──────────────────────────────────────────────────────┐
│                    综合查询栏                          │
├────────┬──────────────────┬──────────────────────────┤
│        │                  │                          │
│ 左侧导航│    任务列表（变窄） │    任务详情侧边栏         │
│ 任务分类 │                  │    （从右侧滑入）          │
│        │                  │                          │
│        ├──────────────────┤                          │
│        │  底部快速创建输入栏 │                          │
└────────┴──────────────────┴──────────────────────────┘
```

**过渡动画**：选中任务时，中间列表宽度收缩（动画约 300ms），右侧详情栏从右侧边缘滑入。

### 17.1.2 左侧任务分类导航树

| 分类 | 子项 | 图标 | 筛选逻辑 |
|------|------|------|---------|
| 全部任务 | — | 列表图标 | 当前用户所有任务 |
| **时间范围** | | | |
| 今日 | — | 日历图标 | due_date = 今天 |
| 本周 | — | 周历图标 | due_date 在本周范围内 |
| 本月 | — | 月历图标 | due_date 在本月范围内 |
| **系统提醒** | | | |
| 预警 | — | 警告图标 | is_warning = true |
| 超期 | — | 红色警告图标 | is_overdue = true |
| **任务类型** | | | |
| 阶段 | — | 灰色标签 | type = STAGE |
| 任务 | — | 蓝色标签 | type = TASK |
| 问题 | — | 红色标签 | type = ISSUE |
| 风险 | — | 橙色标签 | type = RISK |
| 建议 | — | 绿色标签 | type = SUGGESTION |
| 活动 | — | 黄色标签 | type = ACTIVITY |
| 变更 | — | 青色标签 | type = CHANGE |
| **用户标记** | | | |
| 关注 | — | 星标图标 | tsk_task_watcher 中当前用户的任务 |
| 里程碑 | — | 旗帜图标 | type = MILESTONE |

**交互行为**：点击左侧任意分类行 → 中间任务列表即时刷新为该分类下的任务。当前选中行高亮显示。

### 17.1.3 中间任务列表区

| 元素 | 说明 |
|------|------|
| 页签切换 | "未完成" / "已完成" 两个页签 |
| 任务卡片 | 显示：任务名称、类型标签、负责人头像、截止日期、优先级 |
| 选中状态 | 选中任务行高亮，触发三栏过渡 |
| 排序 | 默认按截止日期升序，可切换排序方式 |

### 17.1.4 右侧任务详情侧边栏

选中任务后从右侧滑入，展示：

| 区域 | 内容 |
|------|------|
| 头部 | 任务名称、类型标签、状态徽章 |
| 基本信息 | 负责人、参与人、所属项目、所属阶段 |
| 时间信息 | 计划开始/结束、实际开始/结束、截止日期 |
| 工时信息 | 计划工时、已完成工时 |
| 进度 | 进度条（0-100%） |
| 描述 | 任务描述（Markdown 渲染） |
| 依赖 | 依赖关系列表 |
| 附件 | 关联文件列表 |
| 评论区 | 评论列表 + 输入框 |
| 活动日志 | 最近操作记录 |

### 17.1.5 底部快速创建输入栏

**布局**：固定在任务列表底部

| 元素 | 位置 | 说明 |
|------|------|------|
| 文本输入框 | 左侧（主体） | 输入任务名称 + 特殊字符触发弹窗 |
| 人像按钮 | 右侧第1个 | 点击弹出负责人/参与人选择面板 |
| 工时/工期按钮 | 右侧第2个 | 点击弹出工时/工期输入框 |
| 任务模板按钮 | 右侧第3个 | 点击弹出"我的任务模板"选择框 |
| 提交按钮 | 最右侧 | 回车或点击提交创建任务 |

**特殊字符触发弹窗**：详见第6章 6.4 节。

### 17.1.6 未完成/已完成页签切换

| 页签 | 显示内容 | 排序 |
|------|---------|------|
| 未完成 | status ≠ COMPLETED, CANCELLED 的任务 | 截止日期升序 |
| 已完成 | status = COMPLETED 的任务 | 完成时间降序 |

## 17.2 搜索逻辑设计

### 17.2.1 AND 搜索（空格分隔）

多个条件用**空格**分隔，表示**同时满足**（AND 逻辑）：

```
输入: "张三 电池"
语义: 负责人含"张三" AND 任务名含"电池"
```

### 17.2.2 OR 搜索（英文逗号分隔）

多个条件用**英文逗号 `,`** 分隔，表示**满足任一**（OR 逻辑）：

```
输入: "ISSUE,RISK"
语义: 类型=ISSUE OR 类型=RISK
```

### 17.2.3 搜索条件类型

| 条件类型 | 识别方式 | 示例 |
|---------|---------|------|
| 任务名称 | 默认（无前缀关键词） | "电池设计" |
| 负责人 | `@` 前缀 | "@张三" |
| 项目名 | `#` 前缀 | "#新能源" |
| 任务类型 | `%` 前缀 + 类型编码 | "%TASK" |
| 日期范围 | 日期格式识别 | "2026-05" |

### 17.2.4 前端实现方案

```typescript
// 搜索解析器
function parseSearchQuery(input: string): SearchCondition[] {
  // 1. 按逗号分割为 OR 组
  const orGroups = input.split(',');
  
  return orGroups.flatMap(group => {
    // 2. 每个 OR 组内按空格分割为 AND 条件
    const andConditions = group.trim().split(/\s+/);
    return andConditions.map(parseCondition);
  });
}

function parseCondition(token: string): SearchCondition {
  if (token.startsWith('@')) return { type: 'assignee', value: token.slice(1) };
  if (token.startsWith('#')) return { type: 'project', value: token.slice(1) };
  if (token.startsWith('%')) return { type: 'taskType', value: token.slice(1) };
  return { type: 'keyword', value: token };
}
```

## 17.3 项目管理页面交互规范

### 17.3.1 项目树视图

**布局**：左侧项目结构树 + 右侧属性/视图区

**树节点层级**：
```
根节点（root）
  └── 文件夹（folder）← 项目分类
        ├── 文件夹（folder）← 子分类（可嵌套）
        └── 项目（project）← 具体项目
              └── 阶段/任务（task）← 项目下的任务
                    └── 子任务（task）← 可嵌套
```

**节点显示信息**：图标 + 名称 + 状态标签 + 进度百分比

**选中节点后右侧区域**：
- 文件夹节点 → 文件夹属性 + 子文件夹/项目统计图表
- 项目节点 → 项目基本属性 + 页签切换（计划表/泳道图/甘特图）
- 任务节点 → 任务基本属性 + 页签切换

### 17.3.2 悬浮上下文菜单

鼠标悬停在树节点上 **约 1 秒** 后弹出上下文菜单：

**根节点菜单**：
| 菜单项 | 说明 |
|--------|------|
| 新建文件夹 | 创建项目分类文件夹 |
| 新建项目 | 创建新项目 |

**文件夹节点菜单**：
| 菜单项 | 说明 |
|--------|------|
| 新建文件夹 | 创建子文件夹 |
| 新建项目 | 在此文件夹下创建项目 |
| 通过项目模板创建项目 | 从模板创建项目 |
| 编辑文件夹 | 修改文件夹名称和属性 |
| 删除文件夹 | 删除文件夹（需确认） |
| 加载工作流 | 为文件夹关联工作流模板 |

**项目节点菜单**：
| 菜单项 | 说明 |
|--------|------|
| 新建任务 | 创建阶段（项目下一级默认类型为 STAGE） |
| 编辑项目 | 修改项目属性 |
| 删除项目 | 删除项目（需确认） |
| 设置项目参与人 | 管理项目成员 |
| 设置工时 | 设置计划工时 |
| 设置工期 | 设置计划工期 |
| 设置项目模板 | 保存为项目模板 |
| 设置提醒策略 | 配置提醒规则 |
| 加载工作流程 | 关联工作流模板 |

**任务/阶段节点菜单**：
| 菜单项 | 说明 |
|--------|------|
| 新建任务 | 创建子任务 |
| 编辑任务 | 修改任务属性 |
| 删除任务 | 删除任务（需确认） |
| 设置负责人/参与人 | 管理任务人员 |
| 设置工时 | 设置计划工时 |
| 设置工期 | 设置计划工期 |
| 设置任务类型 | 修改任务类型 |
| 设置提醒策略 | 配置提醒规则 |
| 加载工作流程 | 关联工作流模板 |

### 17.3.3 视图切换

项目/阶段/任务属性页面支持 3 种视图页签切换：

| 视图 | 说明 | 数据接口 |
|------|------|---------|
| 计划表 | 表格形式展示所有子任务属性，支持内联编辑 | `GET /api/projects/{id}/plan-table` |
| 泳道图 | 部门×时间泳道矩阵，展示交付物/里程碑分布 | `GET /api/projects/{id}/swimlane` |
| 甘特图 | 甘特图展示计划与实际执行情况 | `GET /api/projects/{id}/gantt` |

### 17.3.4 计划表内联编辑

| 交互 | 行为 |
|------|------|
| 进入编辑 | 通过悬浮菜单的"编辑"按钮激活 |
| 编辑模式 | 表格行变为可编辑状态 |
| 保存方式 | 焦点离开时自动保存 |
| 按工期自动顺延 | 开关启用后，修改日期自动级联后续任务（详见5.9节） |
| 已开始任务限制 | 只允许修改计划结束时间 |
| 筛选开关 | "仅显示阶段任务"、"仅显示里程碑任务" |

### 17.3.5 甘特图悬浮属性卡片

鼠标悬停在甘特图任务条上时弹出属性卡片：

| 字段 | 说明 |
|------|------|
| 负责人 | 头像 + 姓名 |
| 参与人 | 头像列表 |
| 计划工时 | 小时数 |
| 已完成工时 | 小时数 |

### 17.3.6 顶部操作栏

选中项目/阶段/任务后，右侧页面顶部显示操作栏：

| 元素 | 说明 |
|------|------|
| 对象名称 | 当前选中对象的名称（如"XX项目"或"XX任务"） |
| 完成百分比 | 进度数字显示 |
| 开始按钮 | 启动对象（status → 进行中） |
| 暂停按钮 | 暂停对象 |
| 停止按钮 | 终止对象 |
| 重新开始按钮 | 重启已暂停/停止的对象 |
| 关注按钮 | 关注当前对象 |
| 取消关注按钮 | 取消关注 |
| 编辑按钮 | 进入编辑模式 |

## 17.4 中控看板设计

### 17.4.1 普通视图

中控看板以卡片形式展示全局项目状态概览，包括：

| 卡片区域 | 内容 |
|---------|------|
| 项目总览 | 项目总数、进行中、已完成、延期项目数 |
| 任务统计 | 今日任务、本周任务、预警、超期 |
| 工时统计 | 本周/本月工时汇总 |
| 项目进度 | 各在建项目进度条列表 |
| 近期里程碑 | 即将到来的里程碑列表 |
| 审批待办 | 待审批事项列表 |

### 17.4.2 全屏视图

全屏模式去除导航栏和侧边栏，最大化看板展示面积。适合投屏/大屏展示场景。

**切换方式**：看板右上角全屏切换按钮。

### 17.4.3 数据接口

| 接口 | 说明 |
|------|------|
| `GET /api/dashboard/overview` | 看板总览数据 |
| `GET /api/dashboard/project-progress` | 项目进度列表 |
| `GET /api/dashboard/upcoming-milestones` | 近期里程碑 |
| `GET /api/dashboard/pending-approvals` | 待审批列表 |

## 17.5 泳道图交互规范

### 17.5.1 泳道行定义（部门维度）

| 行 | 来源 | 说明 |
|----|------|------|
| 行标签 | 项目组织结构中的部门 | 由项目全部任务的负责人/参与人所属部门决定 |

部门在系统设置的"项目组织结构"中定义。具体项目显示哪些部门取决于该项目全部任务负责人、参与人在项目组织架构中所需的部门情况。

### 17.5.2 时间列定义

| 列 | 说明 |
|----|------|
| 时间跨度 | 项目的计划开始到计划结束时间范围 |
| 当前时间线 | 竖向红线标记当前日期位置 |

### 17.5.3 颜色编码

| 颜色 | 含义 | 十六进制 |
|------|------|---------|
| 黄色 | 已完成 | #FAAD14 |
| 蓝色 | 已开始未完成 | #3366FF |
| 灰色 | 未开始 | #8C8C8C |

### 17.5.4 交付物/里程碑展示

泳道图中每个单元格（部门×时间段）展示该部门在该时间段内的交付物和里程碑标记。

## 17.6 响应式设计与适配规范

| 断点 | 布局调整 |
|------|---------|
| ≥ 1440px | 完整三栏布局 |
| 1024-1439px | 左侧导航可折叠，两栏/三栏切换 |
| 768-1023px | 仅显示任务列表 + 详情弹窗（非侧边栏） |
| < 768px | 移动端适配（待规划） |

## 17.7 顶部导航栏（Header）用户信息显示规范

### 17.7.1 布局结构

Header 采用左右两端对齐布局：

```
┌─────────────────────────────────────────────────────────────────┐
│  [头像] 用户名  |  团队名 团队人数    [用户名 手机号]  🔔 中/EN 🔍 ⚙  │
└─────────────────────────────────────────────────────────────────┘
```

### 17.7.2 右侧用户信息区

在右侧图标组（通知铃、语言切换、搜索、设置）左侧，新增用户身份信息展示：

| 元素 | 内容 | 样式 |
|------|------|------|
| 用户名 | `currentUser.realName` | 14px, #333333, font-weight 500 |
| 手机号（脱敏） | 格式：`180***880`（保留前3位和后3位，中间替换为 `***`） | 12px, #999999 |

**脱敏规则**：手机号长度 ≥ 7 位时，保留前3位和后3位，中间替换为 `***`；否则全部显示。

**布局**：用户名和手机号垂直堆叠，整体右对齐，与图标组之间间距 16px。

### 17.7.3 组件实现要点

- 仅在 `currentUser` 存在且有 `phone` 字段时显示手机号
- 无手机号时仅显示用户名
- 点击该区域跳转至 `/settings`

---

## 17.8 设置页面（/settings）交互规范

### 17.8.1 整体布局

设置页面采用**左侧导航 + 右侧内容区**两栏布局：

```
┌──────────────────────────────────────────────────────────────┐
│  顶部 Header（含用户名+手机号）                                  │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│  左侧导航菜单  │           右侧内容区                           │
│  （固定宽度   │                                               │
│   200px）    │                                               │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

### 17.8.2 左侧导航菜单项

| 菜单项 | 路由/锚点 | 说明 |
|--------|---------|------|
| 个人资料 | profile | 用户信息卡片 + 编辑资料 + 修改密码 |
| 任务策略 | task-strategy | 各类任务时间跨度和预警配置 |
| 登录记录 | login-records | 历史登录记录 |
| API密钥 | api-keys | API密钥管理 |

默认选中"个人资料"。

### 17.8.3 个人资料区

顶部展示用户信息卡片：

| 元素 | 内容 |
|------|------|
| 头像 | 蓝色圆形，显示姓名首字 |
| 用户名 | `realName` |
| 手机号 | 脱敏显示（同 17.7.2 规则） |

### 17.8.4 任务策略配置区

标题"任务策略"，下方为表格式配置，每行一个策略项：

| 策略项 | 选项 | 说明 |
|--------|------|------|
| 全部的时间跨度 | 全部 / 三个月 / 六个月 / 一年 / 自定义（月） | 默认：六个月 |
| 问题的时间跨度 | 全部 / 三个月 / 六个月 / 一年 / 自定义（周） | 默认：三个月 |
| 风险的时间跨度 | 全部 / 三个月 / 六个月 / 一年 / 自定义（周） | 默认：三个月 |
| 建议的时间跨度 | 全部 / 三个月 / 六个月 / 一年 / 自定义（周） | 默认：三个月 |
| 变更的时间跨度 | 全部 / 三个月 / 六个月 / 一年 / 自定义（周） | 默认：三个月 |
| 关注的时间跨度 | 全部 / 三个月 / 六个月 / 一年 / 自定义（周） | 默认：三个月 |
| 预警最发时间点 | 提前1h / 提前4h / 提前8h / 自定义（h） | 默认：提前1h |
| 任务逾期向上报警的级数 | 1级 / 2级 / 3级 / 无限级 | 默认：2级 |
| 里程碑逾期向上报警的级数 | 1级 / 2级 / 3级 / 无限级 | 默认：2级 |

**交互规则**：
- 每行使用 Radio.Group 单选
- 选中"自定义"时，右侧出现数字输入框（最小值1）
- 配置变更后显示"保存"按钮，点击调用 `PUT /api/user/task-strategy`
- 保存成功后 Toast 提示"任务策略已保存"

### 17.8.5 数据模型

```typescript
interface TaskStrategy {
  allTimeSpan: 'all' | '3m' | '6m' | '1y' | 'custom';
  allTimeSpanCustom?: number; // 月
  issueTimeSpan: 'all' | '3m' | '6m' | '1y' | 'custom';
  issueTimeSpanCustom?: number; // 周
  riskTimeSpan: 'all' | '3m' | '6m' | '1y' | 'custom';
  riskTimeSpanCustom?: number;
  suggestionTimeSpan: 'all' | '3m' | '6m' | '1y' | 'custom';
  suggestionTimeSpanCustom?: number;
  changeTimeSpan: 'all' | '3m' | '6m' | '1y' | 'custom';
  changeTimeSpanCustom?: number;
  watchTimeSpan: 'all' | '3m' | '6m' | '1y' | 'custom';
  watchTimeSpanCustom?: number;
  warningAdvanceTime: '1h' | '4h' | '8h' | 'custom';
  warningAdvanceTimeCustom?: number; // 小时
  taskOverdueEscalationLevel: 1 | 2 | 3 | 'unlimited';
  milestoneOverdueEscalationLevel: 1 | 2 | 3 | 'unlimited';
}
```

### 17.8.6 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/user/task-strategy | 获取当前用户任务策略配置 |
| PUT | /api/user/task-strategy | 保存任务策略配置 |

# 第18章：实施计划

## 18.1 分阶段计划

### Phase 1: 基础设施（已完成）

**时间跨度**：第 1-2 月
**目标**：搭建 Spring Boot 脚手架，完成认证模块和公共组件，实现数据库迁移

| 交付物 | 状态 | 说明 |
|--------|------|------|
| Spring Boot 3.x 多模块项目 | 已完成 | `com.syncflow` 根包，11 个子模块 |
| MyBatis-Plus 配置 | 已完成 | 分页插件、乐观锁、自动填充 |
| PostgreSQL 连接 + HikariCP | 已完成 | 连接池配置 |
| Redis 缓存配置 | 已完成 | Session 存储 + Token 黑名单 |
| 统一返回格式 Result\<T\> + PageResult\<T\> | 已完成 | 全局响应封装 |
| 统一异常处理 GlobalExceptionHandler | 已完成 | BusinessException + 30+ ErrorCode |
| JWT 认证模块 | 已完成 | 登录/注册/Token刷新/注销 |
| Spring Security 配置 | 已完成 | JWT Filter + RBAC + 路径权限 |
| 用户/部门/角色 CRUD | 已完成 | sys_* 表 + 管理接口 |
| Docker Compose 编排 | 已完成 | PostgreSQL + Redis + MinIO |
| sys_* 表 DDL | 已完成 | sys_user, sys_department, sys_role, sys_user_role, sys_permission |

### Phase 2: 核心业务（已完成）

**时间跨度**：第 3-4 月
**目标**：完成项目管理、任务管理、审批引擎集成

| 交付物 | 状态 | 说明 |
|--------|------|------|
| prj_* 表 DDL | 已完成 | prj_project, prj_phase, prj_stage_gate, prj_milestone, prj_project_member |
| 项目 CRUD + 树结构 | 已完成 | parent_path 物化路径 |
| 阶段管理 + 里程碑 | 已完成 | 阶段 CRUD / 排序 / 状态流转 |
| tsk_* 表 DDL | 已完成 | tsk_task, tsk_task_participant, tsk_task_watcher, tsk_task_comment, tsk_task_activity |
| 任务 CRUD（多类型） | 已完成 | 9 种任务类型支持 |
| 任务统计接口 | 已完成 | GET /api/tasks/statistics |
| Flowable 7.x 集成 | 已完成 | 嵌入式引擎配置 |
| wf_* 表 DDL | 已完成 | wf_business_object, wf_approval_comment, wf_approval_config |
| BPMN 流程定义 | 已完成 | 7 个 BPMN 文件自动部署 |
| 通用审批服务 WorkflowService | 已完成 | 启动流程/完成任务/查询任务 |
| 动态审批人解析 | 已完成 | 按项目角色/部门/用户/表达式 |

### Phase 3: 领域模块（已完成）

**时间跨度**：第 5-6 月
**目标**：完成 BOM、工艺、配置管理三大模块

| 交付物 | 状态 | 说明 |
|--------|------|------|
| bom_* 表 DDL | 已完成 | bom_bom, bom_item, bom_version |
| BOM 主表 + 树管理 | 已完成 | 树结构 CRUD / 层级序号 |
| BOM 版本管理 | 已完成 | 保存版本 / 复制 / 废止 |
| prc_* 表 DDL | 已完成 | prc_process_route, prc_operation, prc_man_hour, prc_operation_material |
| 工艺路线 + 工序管理 | 已完成 | 工序 CRUD / 排序 / 工作中心 |
| 工时定额 + 材料定额 | 已完成 | 每工序定额 CRUD |
| cfg_* 表 DDL | 已完成 | 13 张配置表 |
| 三库配置管理 | 已完成 | 模块库 + 工艺库 + 订单库 |

### Phase 4: 驾驶舱 + 文件管理 + 消息通知（已完成）

**时间跨度**：第 7 月
**目标**：完成驾驶舱大屏、文件管理、通知模块

| 交付物 | 状态 | 说明 |
|--------|------|------|
| sta_* 表 DDL | 已完成 | sta_dashboard_data, sta_task_statistics, sta_man_hour_ranking |
| 驾驶舱数据接口 | 已完成 | 完工/超期/风险/工时排行 |
| fil_* 表 DDL | 已完成 | fil_file, fil_file_version, fil_folder |
| 文件管理模块 | 已完成 | 上传/下载/版本/文件夹 |
| notification 表 DDL | 已完成 | notification, notification_setting |
| 通知 CRUD + 已读管理 | 已完成 | 6 个 API 端点 |
| STOMP WebSocket 配置 | 已完成 | SockJS 端点 + 认证集成 |

### Phase 5: 前端重构 + 联调（已完成）

**时间跨度**：2026-05
**目标**：前端从 React+Vite+AntDesign 迁移至 Next.js+Tailwind+shadcn/ui，API 层对齐

| 任务 | 优先级 | 状态 |
|------|--------|------|
| 前端重构为 Next.js 16 + Tailwind CSS 4 + shadcn/ui | P0 | 已完成 |
| API Routes 代理层对接 Spring Boot 后端 | P0 | 已完成 |
| Mock 数据 fallback 确保前端独立可运行 | P1 | 已完成 |
| NestJS 旧后端下线归档 | P1 | 已完成 |

## 18.2 工作量统计

### 18.2.1 后端代码

| 维度 | 数量 |
|------|------|
| Java 源文件总数 | 201 |
| 代码总行数 | 13,303 |
| Controller 文件 | 17 |
| Service 文件 | 17 |
| Entity/DTO 文件 | 45+ |
| Repository 文件 | 17+ |
| 配置类文件 | 12 |
| 测试文件 | 20+ |

### 18.2.2 数据库

| 维度 | 数量 |
|------|------|
| 迁移文件 | 5 |
| 数据表总数 | 38 |
| DDL 总行数 | ~1,400 |
| 索引数量 | 60+ |
| 枚举类型 | 8+ |

### 18.2.3 工作流引擎

| 维度 | 数量 |
|------|------|
| BPMN 流程定义文件 | 7 |
| 审批场景 | 19（8 部分实现 + 11 待实现） |
| 事件监听器 | 2 |
| 审批人解析器 | 1 |

### 18.2.4 前端代码

| 维度 | 数量 |
|------|------|
| 页面 | 6 (workspace/dashboard/project/files/bom/config) |
| API Routes | 16 (8 资源 × GET/POST + [id] CRUD) |
| shadcn/ui 组件 | 60+ |
| 布局组件 | 3 (Sidebar, TopBar, TaskQuickBar) |
| Hooks | 1 (use-mobile) |
| DB Schema 表 | 12 (Drizzle ORM) |

### 18.2.5 API 端点统计

| 模块 | 端点数 |
|------|--------|
| 认证（auth） | 4 |
| 用户管理 | 6 |
| 部门管理 | 5 |
| 角色管理 | 5 |
| 项目管理 | 12 |
| 任务管理 | 10 |
| BOM 管理 | 9 |
| 工艺管理 | 11 |
| 配置管理（三库） | 15 |
| 文件管理 | 8 |
| 审批管理 | 7 |
| 驾驶舱/统计 | 4 |
| 通知管理 | 6 |
| **合计** | **102** |

## 18.3 当前完成状态

### 18.3.1 已验证通过

| 验证项 | 状态 | 说明 |
|--------|------|------|
| 全部 12 个后端模块编译运行 | 通过 | 无编译错误 |
| 全部 102 个 API 端点返回 200 | 通过 | 端到端测试通过 |
| JWT 认证全链路 | 通过 | 登录 → Token → 刷新 → 注销 |
| Flowable BPMN 自动部署 | 通过 | 7 个流程定义文件启动时自动部署 |
| 审批流程推进 | 通过 | 发起 → 审批 → 完成，状态正确回写 |
| 前端通过 Next.js API Routes 登录 | 通过 | /api/auth/login 代理到 localhost:8088 |
| 数据库迁移脚本 | 通过 | 5 个迁移文件，38 张表全部创建 |

### 18.3.2 后端测试覆盖

| 测试类别 | 套件数 | 用例数 | 说明 |
|---------|--------|--------|------|
| 单元测试 | 17 | 206 | 所有 Service 层测试 |
| 集成测试 | 12 | 50+ | Controller + Service 联动 |
| **合计** | **29** | **256+** | |

## 18.4 待完成工作

### 18.4.1 P1 优先级（核心功能补全）

| 任务 | 说明 | 预估工作量 |
|------|------|-----------|
| 8 个部分实现的审批场景 | 里程碑审批、任务完成审批、BOM 变更审批、委托、抄送等 | 5-8 天 |
| 前端 WebSocket 集成 | STOMP/SockJS 客户端接入实时通知 | 2 天 |
| BOM items GET 端点 | 后端补充 BOM items 列表查询接口 | 0.5 天 |

### 18.4.2 P2 优先级（功能扩展）

| 任务 | 说明 | 预估工作量 |
|------|------|-----------|
| 11 个未实现的审批场景 | 项目创建审批、任务分配审批、资源借用审批等 | 10-15 天 |
| 后端模块完整单元测试 | 全部 Service + Controller 测试覆盖 | 8-10 天 |
| E2E 测试更新 | Playwright 测试适配新接口 | 3-5 天 |
| 性能优化 | Redis 缓存热点数据 / 慢查询优化 | 3-5 天 |

### 18.4.3 P3 优先级（完善优化）

| 任务 | 说明 | 预估工作量 |
|------|------|-----------|
| 安全加固 | 接口限流、SQL注入防护、XSS防护 | 2-3 天 |
| 日志审计完善 | 操作日志记录、审计范围扩展 | 2 天 |
| 数据导入导出 | Excel 导入/导出功能 | 3-5 天 |
| 帮助中心 | 用户自助帮助系统 | 2-3 天 |

### 18.4.4 待完成工作优先级矩阵

```
紧急且重要（立即处理）          重要但不紧急（计划处理）
┌──────────────────────────┐  ┌──────────────────────────┐
│ P1: 8个部分实现审批场景    │  │ P2: 11个未实现审批场景    │
│ P1: 前端WebSocket迁移     │  │ P2: 后端完整测试覆盖      │
│ P1: 前端API适配           │  │ P2: E2E测试更新           │
│ P0: 数据迁移+校验         │  │ P3: 安全加固              │
└──────────────────────────┘  └──────────────────────────┘

紧急但不重要（快速处理）          不紧急不重要（可选处理）
┌──────────────────────────┐  ┌──────────────────────────┐
│ 前端Store类型更新         │  │ P3: 数据导入导出          │
│ 前端测试适配              │  │ P3: 帮助中心             │
└──────────────────────────┘  └──────────────────────────┘
```

---

>
> **本部分说明**：Part 3 涵盖横切关注点和系统支撑设计（第 13-18 章），包括消息通知、错误处理、安全设计、实时通信、前端设计概要和实施计划。与 Part 1（业务模块设计）、Part 2（数据模型与 API 设计）共同构成 SyncFlow v2 完整详细设计文档。
