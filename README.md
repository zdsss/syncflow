# SyncFlow

研发协同流程管理系统 — 支持项目管理、任务看板、BOM 管理、工艺路线、审批流程、三库配置、驾驶舱等功能模块。

## 技术栈

### 前端
- **框架**: Next.js 16 + React 19 + TypeScript
- **UI**: Tailwind CSS 4 + shadcn/ui (Radix UI)
- **图表**: Recharts
- **表单**: React Hook Form + Zod
- **数据库**: Drizzle ORM + PostgreSQL
- **包管理**: pnpm 9

### 后端
- **框架**: Spring Boot 3.3 + Java 21
- **ORM**: MyBatis-Plus 3.5
- **数据库**: PostgreSQL 16
- **认证**: JWT (jjwt)
- **审批引擎**: Flowable 7.x (嵌入式)
- **缓存**: Redis 7
- **文件存储**: MinIO
- **WebSocket**: STOMP over SockJS
- **测试**: JUnit 5 + Spring Test

## 项目结构

```
SyncFlow/
├── frontend-next/              # 前端 (Next.js 16 + Tailwind + shadcn/ui)
│   ├── src/app/                # App Router 页面
│   │   ├── workspace/          # 工作空间 (任务管理)
│   │   ├── dashboard/          # 中控看板
│   │   ├── project/            # 项目管理 (多视图)
│   │   ├── files/              # 文件管理
│   │   ├── bom/                # BOM 管理
│   │   ├── config/             # 配置管理
│   │   └── api/                # Next.js API Routes
│   ├── src/components/         # 组件库
│   │   ├── shared/             # 布局组件 (Sidebar, TopBar, TaskQuickBar)
│   │   └── ui/                 # shadcn/ui 组件 (60+)
│   ├── src/db/                 # Drizzle ORM (schema, seed)
│   ├── src/lib/                # 工具函数 + Mock 数据
│   └── src/hooks/              # 自定义 Hooks
│
├── syncflow-java/              # 后端 (Spring Boot 3.3)
│   ├── syncflow-common/        # 公共组件
│   ├── syncflow-admin/         # 认证 + 系统管理
│   ├── syncflow-project/       # 项目管理
│   ├── syncflow-task/          # 任务管理
│   ├── syncflow-bom/           # BOM 管理
│   ├── syncflow-process/       # 工艺管理
│   ├── syncflow-config/        # 三库配置
│   ├── syncflow-file/          # 文件管理 (MinIO)
│   ├── syncflow-workflow/      # 审批引擎 (Flowable)
│   ├── syncflow-statistics/    # 驾驶舱统计
│   ├── syncflow-message/       # 消息通知 (WebSocket)
│   └── syncflow-app/           # 主启动模块 + 数据库迁移
│
├── doc/                        # 文档
├── scripts/                    # 部署脚本
└── .github/workflows/          # CI/CD
```

## 快速开始

### 环境要求

- Java 21+
- Maven 3.9+
- Node.js >= 20
- pnpm 9+
- Docker (可选，用于 PostgreSQL/Redis/MinIO)

### 启动后端

```bash
cd syncflow-java

# 1. 启动基础设施
docker-compose up -d

# 2. 编译并启动
mvn clean install -DskipTests
mvn spring-boot:run -pl syncflow-app

# 后端运行在 http://localhost:8088
```

### 启动前端

```bash
cd frontend-next

# 安装依赖
pnpm install

# 初始化数据库 (可选，mock 数据可独立运行)
pnpm db:push
pnpm db:seed

# 启动开发服务器
pnpm dev

# 访问 http://localhost:3000
# 登录: admin / admin123
```

## API 接口

前端 API Routes (`/api/*`) 代理到 Java 后端 (`:8088`)，后端不可用时自动 fallback 到 mock 数据。

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/register` | 注册 |

### 核心资源

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/tasks` | 任务列表/创建 |
| GET/PUT/DELETE | `/api/tasks/[id]` | 任务详情/更新/删除 |
| GET/POST | `/api/projects` | 项目列表/创建 |
| GET/PUT/DELETE | `/api/projects/[id]` | 项目详情/更新/删除 |
| GET/POST | `/api/bom` | BOM 列表/创建 |
| GET/POST | `/api/files` | 文件列表/上传 |
| GET | `/api/users` | 用户列表 |
| GET | `/api/statistics` | 统计数据 |
| GET | `/api/config` | 配置数据 |

## 数据库

### 表清单 (38 张)

| 分类 | 前缀 | 说明 |
|------|------|------|
| 系统 | `sys_` | 用户、部门、角色、权限 |
| 项目 | `prj_` | 项目、阶段、阶段门、里程碑 |
| 任务 | `tsk_` | 任务、参与者、评论、活动日志 |
| BOM | `bom_` | BOM 主表、明细、版本 |
| 工艺 | `prc_` | 工艺路线、工序、工时/材料定额 |
| 配置 | `cfg_` | 模块分类、规格、订单 |
| 文件 | `fil_` | 文件、文件夹、版本 |
| 审批 | `wf_` | 业务绑定、审批意见、配置 |
| 统计 | `sta_` | 驾驶舱、任务统计、排行 |
| 通知 | `notification` | 通知、设置 |
