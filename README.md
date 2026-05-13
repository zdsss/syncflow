# SyncFlow

研发协同流程管理系统 — 支持项目管理、任务看板、BOM 管理、工艺路线、审批流程、三库配置、驾驶舱等功能模块。

## 技术栈

### 前端
- **框架**: React 19 + TypeScript + Vite 8
- **UI**: Ant Design 6
- **状态管理**: Zustand 5
- **路由**: React Router 6
- **图表**: ECharts 6
- **拖拽**: @dnd-kit
- **测试**: Vitest + @testing-library/react + Playwright

### 后端 (v2)
- **框架**: Spring Boot 3.3 + Java 21
- **ORM**: MyBatis-Plus 3.5
- **数据库**: PostgreSQL 16
- **认证**: JWT (jjwt)
- **审批引擎**: Flowable 7.x (嵌入式)
- **缓存**: Redis 7
- **文件存储**: MinIO
- **WebSocket**: STOMP over SockJS
- **测试**: JUnit 5 + Spring Test

### 后端 (v1 归档)
- NestJS 11 + Prisma 5 — 代码位于 `v1-nestjs/`

## 项目结构

```
SyncFlow/
├── syncflow-java/              # 后端 v2 (Spring Boot 3.x)
│   ├── syncflow-common/        # 公共组件 (Result/ErrorCode/异常/配置/工具)
│   ├── syncflow-admin/         # 认证 + 系统管理 (JWT/用户/部门/角色/RBAC)
│   ├── syncflow-project/       # 项目管理 (项目树/阶段/里程碑/阶段门/甘特图)
│   ├── syncflow-task/          # 任务管理 (9种类型/快速创建/统计/评论/关注)
│   ├── syncflow-bom/           # BOM管理 (树结构/版本管理/审批发布)
│   ├── syncflow-process/       # 工艺管理 (路线/工序/工时定额/材料定额)
│   ├── syncflow-config/        # 三库配置 (模块库/工艺库/订单库)
│   ├── syncflow-file/          # 文件管理 (MinIO上传下载/文件夹/版本)
│   ├── syncflow-workflow/      # 审批引擎 (Flowable BPMN/动态审批人/委托)
│   ├── syncflow-statistics/    # 驾驶舱 (统计/排行/风险/工时)
│   ├── syncflow-message/       # 消息通知 (WebSocket实时推送)
│   ├── syncflow-app/           # 主启动模块 + 数据库迁移
│   │   └── resources/db/migration/  # V1-V5 SQL迁移 (38张表)
│   ├── docker-compose.yml      # PostgreSQL 16 + Redis 7 + MinIO
│   └── pom.xml                 # Maven 父POM
│
├── src/                        # 前端 (React 19 + Vite)
│   ├── app/                    # App 入口 & 路由
│   ├── components/             # 公共组件 (Layout, Header, Sidebar, GlobalSearch)
│   ├── hooks/                  # 自定义 Hooks (useSocket, useMediaQuery)
│   ├── pages/                  # 24 个页面模块
│   ├── services/               # API 服务层 (17 个)
│   ├── stores/                 # Zustand 状态管理 (9 个)
│   ├── types/                  # TypeScript 类型定义
│   ├── constants/              # 枚举常量
│   └── i18n/                   # 国际化 (中/英)
│
├── e2e/                        # Playwright E2E 测试 (11 个)
├── doc/                        # 文档
│   ├── SyncFlow-产品设计概要.md
│   ├── SyncFlow-详细设计文档.md
│   ├── SyncFlow-数据库设计文档.md
│   ├── SyncFlow-功能完成清单.md
│   ├── SyncFlow重构方案.md         # 目标架构设计
│   ├── SyncFlow重构实施方案.md     # 分阶段实施计划
│   └── gap-analysis-nestjs-vs-springboot.md  # 差距分析
│
├── v1-nestjs/                  # v1 归档 (NestJS + Prisma)
│   ├── server/
│   ├── docker-compose.yml
│   └── Dockerfile
│
├── vite.config.ts              # Vite 配置 (代理 → :8088)
├── package.json                # 前端依赖
└── vitest.config.ts            # Vitest 配置
```

## 快速开始

### 环境要求

- Java 21+
- Maven 3.9+
- Node.js >= 20
- Docker (可选，用于 PostgreSQL/Redis/MinIO)

### 启动后端 (Spring Boot)

```bash
cd syncflow-java

# 1. 启动基础设施 (PostgreSQL + Redis + MinIO)
docker-compose up -d

# 2. 执行数据库迁移
# 迁移脚本位于 syncflow-app/src/main/resources/db/migration/
# V1: 系统/项目/任务表 (16张)
# V2: BOM/工艺/配置表 (14张)
# V3: 统计表 (3张)
# V4: 通知表 (2张)
# V5: 文件表 (3张)

# 3. 编译并启动
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home
mvn install -DskipTests
mvn spring-boot:run -pl syncflow-app

# 后端运行在 http://localhost:8088
# Swagger: http://localhost:8088/doc.html
```

### 启动前端

```bash
# 安装依赖
npm install

# 启动开发服务器 (代理 → localhost:8088)
npm run dev

# 访问 http://localhost:5173
# 登录: admin / admin123
```

### 测试账号

| 用户名 | 密码 | 姓名 | 角色 |
|--------|------|------|------|
| admin | admin123 | 系统管理员 | ADMIN |

## API 接口

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录 (返回 JWT Token) |
| POST | `/api/auth/refresh` | 刷新 Token |
| POST | `/api/auth/logout` | 注销 |
| GET | `/api/auth/me` | 当前用户信息 |

### 系统管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/sys/users` | 用户列表 (分页) |
| POST | `/api/sys/users` | 创建用户 |
| GET | `/api/sys/departments/tree` | 部门树 |
| GET | `/api/sys/roles` | 角色列表 |

### 项目管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects` | 项目树 |
| GET | `/api/projects/{id}` | 项目详情 |
| POST | `/api/projects` | 创建项目 |
| GET | `/api/projects/{id}/phases/tree` | 阶段树 (含阶段门/里程碑) |
| GET | `/api/projects/{id}/milestones` | 里程碑列表 |
| GET | `/api/projects/{id}/gantt` | 甘特图数据 |

### 任务管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tasks` | 任务列表 (分页/多条件筛选) |
| GET | `/api/tasks/statistics` | 任务统计卡片 |
| POST | `/api/tasks` | 创建任务 |
| POST | `/api/tasks/quick` | 快速创建 (格式: `任务名,@人#工时¥工期%类型`) |
| PUT | `/api/tasks/{id}/complete` | 完成任务 |
| POST | `/api/tasks/{id}/comments` | 添加评论 |
| POST | `/api/tasks/{id}/watch` | 关注任务 |

### BOM 管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/boms` | BOM 列表 |
| GET | `/api/boms/{id}/structure` | BOM 结构树 |
| POST | `/api/boms/{id}/items` | 新增 BOM 项 |
| POST | `/api/boms/{id}/submit-approval` | 提交审批 |
| POST | `/api/boms/{id}/save-version` | 保存版本 |

### 工艺管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/process-routes` | 工艺路线列表 |
| GET | `/api/process-routes/{id}` | 路线详情 (含工序) |
| POST | `/api/process-routes/{id}/operations` | 添加工序 |
| PUT | `/api/process-routes/{id}/operations/reorder` | 工序排序 |

### 三库配置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/config/modules/categories` | 模块分类树 |
| GET | `/api/config/modules/{id}/specs` | 模块规格列表 |
| POST | `/api/config/modules/specs/{id}/publish` | 发布规格 (审批) |
| GET | `/api/config/orders/categories` | 订单分类树 |
| GET | `/api/config/orders/products/{id}/bom` | 产品 BOM |

### 审批引擎

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/wf/start` | 发起审批 |
| POST | `/api/wf/tasks/{taskId}/complete` | 完成审批 |
| GET | `/api/wf/tasks/pending` | 待审批列表 |
| GET | `/api/wf/business-objects/{id}/history` | 审批历史 |

### 驾驶舱

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard` | 驾驶舱首页 |
| GET | `/api/dashboard/man-hour-ranking` | 工时排行 |
| GET | `/api/dashboard/on-time-rate-ranking` | 按期完工率排行 |

### 其他

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/notifications` | 通知列表 (分页) |
| GET | `/api/notifications/unread-count` | 未读通知数 |
| POST | `/api/files/upload` | 文件上传 |
| GET | `/api/files/{id}/download` | 文件下载 |

## 数据库设计

### 表清单 (38 张)

| 分类 | 表名 | 说明 |
|------|------|------|
| **系统** | sys_user | 用户 |
| | sys_department | 部门 |
| | sys_role | 角色 |
| | sys_user_role | 用户角色关联 |
| | sys_permission | 权限 |
| **项目** | prj_project | 项目 |
| | prj_phase | 项目阶段 |
| | prj_stage_gate | 阶段门审批 |
| | prj_milestone | 里程碑 |
| | prj_project_member | 项目成员 |
| **任务** | tsk_task | 任务 (9种类型) |
| | tsk_task_participant | 任务参与者 |
| | tsk_task_watcher | 任务关注者 |
| | tsk_task_comment | 任务评论 |
| | tsk_task_activity | 任务活动日志 |
| **BOM** | bom_bom | BOM 主表 |
| | bom_item | BOM 明细 (树结构) |
| | bom_version | BOM 版本历史 |
| **工艺** | prc_process_route | 工艺路线 |
| | prc_operation | 工序 |
| | prc_man_hour | 工时定额 |
| | prc_operation_material | 材料定额 |
| **配置** | cfg_module_category | 模块分类 |
| | cfg_module | 模块 |
| | cfg_module_spec | 模块规格 |
| | cfg_spec_param | 规格参数 |
| | cfg_order_category | 订单分类 |
| | cfg_order_product | 订单产品 |
| | cfg_product_bom | 产品BOM关联 |
| **文件** | fil_file | 文件 |
| | fil_folder | 文件夹 |
| | fil_file_version | 文件版本 |
| **审批** | wf_business_object | 审批业务绑定 |
| | wf_approval_comment | 审批意见 |
| | wf_approval_config | 审批配置 |
| **统计** | sta_dashboard_data | 驾驶舱数据 |
| | sta_task_statistics | 任务统计 |
| | sta_man_hour_ranking | 工时排行 |
| **通知** | notification | 通知 |
| | notification_setting | 通知设置 |

## 测试

```bash
# 前端单元测试
npm test

# 前端测试 + 覆盖率
npm run test:coverage

# E2E 测试
npm run test:e2e
```

### 前端测试覆盖率

| 指标 | 覆盖率 |
|------|--------|
| Statements | 91%+ |
| Branches | 75%+ |
| Functions | 90%+ |
| Lines | 93%+ |

- **133** 个测试文件
- **1614** 个测试用例，全部通过

## 核心功能模块

| 模块 | 前端页面 | 后端模块 | 功能 |
|------|----------|----------|------|
| 中控看板 | dashboard | syncflow-statistics | 排期视图、看板视图、部门甘特图、驾驶舱大屏 |
| 项目管理 | project | syncflow-project | 项目树(物化路径)、阶段门审批、里程碑、甘特图 |
| 工作空间 | todo | syncflow-task | 9种任务类型、快速创建解析器、12项筛选、AI助手 |
| 我的任务 | mytasks | syncflow-task | 个人任务仪表盘、统计卡片、关注/评论 |
| 审批流程 | approval | syncflow-workflow | Flowable BPMN、7种审批场景、动态审批人、委托/抄送 |
| BOM 管理 | bom | syncflow-bom | BOM树结构、版本管理、审批发布、材料定额 |
| 工艺路线 | process | syncflow-process | 工艺路线、工序管理、工时/材料定额、审批 |
| 三库配置 | modules | syncflow-config | 模块库(分类→模块→规格→参数)、订单库、工艺库 |
| 文件管理 | files | syncflow-file | MinIO存储、文件夹管理、版本控制、SHA-256校验 |
| 统计查询 | query | syncflow-statistics | 完工/超期/风险统计、工时排行、按期率排行 |
| 系统配置 | config | syncflow-admin | 部门/角色/用户管理、RBAC权限 |
| 消息通知 | — | syncflow-message | WebSocket(STOMP)实时推送、通知设置 |
| 认证安全 | login | syncflow-admin | JWT认证、Token刷新、BCrypt加密 |

## 架构演进

| 维度 | v1 (归档) | v2 (现行) |
|------|-----------|-----------|
| 后端框架 | NestJS 11 | Spring Boot 3.3 |
| ORM | Prisma 5 | MyBatis-Plus 3.5 |
| 数据库模型 | 29 模型 (UUID PK) | 38 张表 (BIGSERIAL PK) |
| 审批引擎 | 自建 Approval+Chain | Flowable 7.x (BPMN 2.0) |
| 文件存储 | 本地磁盘 | MinIO |
| 缓存 | 无 | Redis 7 |
| WebSocket | Socket.IO | STOMP over SockJS |
| 多租户 | 无 | tenant_id 行级隔离 |
| 主键策略 | UUID | BIGSERIAL + 物化路径 |

详见 `doc/SyncFlow重构实施方案.md`。
