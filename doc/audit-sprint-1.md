# Sprint 1 审计报告 — 数据模型层 + TaskDependency 服务

> 日期：2026-05-09
> 审计人：QA（自审）

---

## 一、Sprint 1 目标

| 目标 | 状态 | 说明 |
|------|------|------|
| Flyway V12 迁移脚本（5 张新表） | DONE | V12__v3_feature_tables.sql |
| Entity 类 × 5 | DONE | 符合 @Data + @TableId(AUTO) 模式 |
| Mapper 接口 × 5 | DONE | 继承 BaseMapper |
| TaskDependencyService + 测试 | DONE | 含环检测算法，13 个测试全通过 |
| ErrorCode 枚举扩展 | DONE | 新增 302xx/303xx/502xx/702xx 错误码 |

---

## 二、新增文件清单

### 后端（15 个文件）

| 文件 | 模块 | 类型 |
|------|------|------|
| `V12__v3_feature_tables.sql` | syncflow-app | Flyway 迁移 |
| `TaskDependency.java` | syncflow-task | Entity |
| `TaskTemplate.java` | syncflow-task | Entity |
| `TaskTemplateItem.java` | syncflow-task | Entity |
| `DeliverableTemplate.java` | syncflow-config | Entity |
| `WorkflowTemplate.java` | syncflow-workflow | Entity |
| `TaskDependencyMapper.java` | syncflow-task | Mapper |
| `TaskTemplateMapper.java` | syncflow-task | Mapper |
| `TaskTemplateItemMapper.java` | syncflow-task | Mapper |
| `DeliverableTemplateMapper.java` | syncflow-config | Mapper |
| `WorkflowTemplateMapper.java` | syncflow-workflow | Mapper |
| `TaskDependencyService.java` | syncflow-task | Service 接口 |
| `TaskDependencyServiceImpl.java` | syncflow-task | Service 实现 |
| `TaskDependencyServiceTest.java` | syncflow-task | 单元测试 |
| `ErrorCode.java` | syncflow-common | 修改（新增错误码） |

### 数据库新增表

| 表名 | 字段数 | 约束 |
|------|--------|------|
| `tsk_task_dependency` | 7 | UNIQUE(tenant,task,depends_on), CHECK(no self) |
| `tsk_task_template` | 9 | — |
| `tsk_task_template_item` | 6 | FK→tsk_task_template |
| `cfg_deliverable_template` | 7 | JSONB items_json |
| `wf_workflow_template` | 9 | JSONB config_json |

---

## 三、测试结果

### TaskDependencyServiceTest — 13 个用例

| 测试组 | 用例 | 结果 |
|--------|------|------|
| CreateDependency | createDependency_success | PASS |
| CreateDependency | createDependency_selfDependency_throws | PASS |
| CreateDependency | createDependency_differentProjects_throws | PASS |
| CreateDependency | createDependency_duplicate_throws | PASS |
| CreateDependency | createDependency_cycleDetection_throws | PASS |
| GetDependencies | getDependenciesByTask_success | PASS |
| GetDependencies | getDependenciesByTask_empty | PASS |
| GetDependencies | getDependenciesByProject_success | PASS |
| DeleteDependency | deleteDependency_success | PASS |
| DeleteDependency | deleteDependency_notFound_throws | PASS |
| DeleteDependency | deleteDependency_notCreator_throws | PASS |
| UpdateDependencyType | updateDependencyType_success | PASS |
| UpdateDependencyType | updateDependencyType_invalidType_throws | PASS |

### 回归测试

| 模块 | 测试数 | 结果 |
|------|--------|------|
| syncflow-task（全量） | 51 | ALL PASS |
| syncflow-common | 51 | 3 pre-existing failures (AuditLogAspectTest) |

---

## 四、发现的问题与修复

| 问题 | 原因 | 修复 |
|------|------|------|
| BusinessException 参数类型不匹配 | ErrorCode 枚举不是 String | 添加 ErrorCode 枚举值，修正 Service 实现 |
| LambdaQueryWrapper 缓存未初始化 | 单元测试无 Spring 上下文 | @BeforeAll 中调用 TableInfoHelper.initTableInfo() |
| UnnecessaryStubbingException | updateDependencyType 测试中多余 stub | 移除不必要的 when() |

---

## 五、质量结论

### QA 评审：**READY** ✅

- 所有新增代码编译通过
- 13 个新测试全部通过
- 现有测试无回归
- 代码风格符合项目规范
- Flyway 迁移脚本语法正确

### 待后续 Sprint 完成

| Sprint | 内容 | 依赖 |
|--------|------|------|
| Sprint 2 | 级联调度 + 进度时间线 API | 本次 Entity/Mapper 已就绪 |
| Sprint 3 | 任务模板/交付物模板/工作流模板 Service | 本次 Entity/Mapper 已就绪 |
| Sprint 4-6 | 前端实现 | 后端 API 就绪后 |
