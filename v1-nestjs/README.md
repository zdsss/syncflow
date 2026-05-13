# SyncFlow v1 (NestJS + Prisma) - 归档版本

此目录包含 SyncFlow 第一版代码，基于:
- **后端**: NestJS 11 + Prisma 5 + PostgreSQL
- **前端**: React 19 + Vite 8 + Ant Design 6 (位于上级目录 `src/`)
- **测试**: 1614 前端测试 + 485 后端测试

## 启动方式

```bash
# 安装依赖
cd server && npm install

# 启动数据库
docker-compose up -d

# 启动后端
npm run start:dev

# 前端在上级目录启动
cd .. && npm run dev
```

## 已迁移至 v2

此版本的功能已全部迁移至 `syncflow-java/` (Spring Boot 3.x + MyBatis-Plus + Flowable 7.x)。
