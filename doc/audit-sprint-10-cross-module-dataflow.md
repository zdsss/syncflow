# SyncFlow Sprint 10 — 跨模块数据流全链路审计

> 审计日期: 2026-05-12 | 范围: Project / Task / BOM + 审批引擎交互 + UI/UX 视觉审查

---

## 一、审计方法

本次审计采用三路并行 Agent Team 方式：
1. **后端数据流分析** — Java 后端 Project/Task/BOM + 审批引擎回调链路
2. **前端数据流分析** — React 前端 API 调用、状态管理、组件交互
3. **UI/UX 视觉审查** — 23 张界面截图逐一审查

---

## 二、上次审计(Sprint 9)问题修复验证

| 编号 | 问题 | 状态 | 验证说明 |
|------|------|------|---------|
| C-1 | 审批回调双路径重复执行 | ✅ 已修复 | ApprovalEventListener 添加 status 去重逻辑 |
| C-2 | BOM 字段名 materialName vs name | ✅ 已修复 | 前端已统一使用 `name` |
| C-3 | sourceType 枚举不匹配 | ✅ 已修复 | 前端已统一为 MADE/PURCHASED/SUBCONTRACT |
| C-4 | ChangeRequestModal 数据格式错误 | ✅ 已修复 | 前端发送正确的字段结构 |
| C-5 | applyAddItem 硬编码 level=1 | ✅ 已修复 | 现在从 parent 计算 level/path/levelNo |
| C-6 | 前端缺少 startMilestone | ✅ 已修复 | project.service.ts 已有 startMilestone 函数 |
| H-4 | applyChange 无事务原子性 | ✅ 已修复 | @Transactional 覆盖整个 onApproved() |
| H-5 | CR 状态重复更新 | ✅ 已修复 | ChangeApprovalService 仅在失败时设 status=3，成功由 Callback 负责 |
| H-6 | applyDeleteItem 不级联删除 | ✅ 已修复 | 递归删除子节点实现 |

---

## 三、本次发现的新问题及修复

### 已修复 (本次 Sprint)

#### F-1: Task 分页参数名错误 ✅
- **文件**: `src/pages/mytasks/index.tsx:42`
- **问题**: 使用 `page: 1` 但后端 `TaskQueryParams` 期望 `pageNum`
- **影响**: 后端忽略分页参数，返回默认第一页
- **修复**: `page` → `pageNum`

#### F-2: Task 状态枚举值不存在 ✅
- **文件**: `src/pages/mytasks/index.tsx:77`
- **问题**: `TaskStatus.PENDING_ASSIGN` 和 `TaskStatus.NOT_STARTED` 在枚举中不存在
- **影响**: "待处理"统计永远为 0
- **修复**: 统一使用 `TaskStatus.PENDING`

#### F-3: Task 搜索使用 `(t as any).name` ✅
- **文件**: `src/pages/mytasks/index.tsx:92`
- **问题**: 类型不安全的 fallback，Task 接口已有 `title` 字段
- **修复**: 移除 `(t as any).name`，直接使用 `t.title`

#### F-4: 审批按钮缺乏安全区分 ✅ (CRITICAL)
- **文件**: `src/pages/approval/components/ApprovalDetail.tsx:155-178`
- **问题**: 通过/拒绝按钮样式相同，拒绝无二次确认，易误操作
- **修复**: 
  - 通过按钮使用绿色(#52c41a) + Popconfirm 二次确认
  - 拒绝按钮增加 Popconfirm 二次确认
  - 按钮增大尺寸(size="large") + 加粗字体

#### F-5: 审批模式 Radio 可修改但不生效 ✅
- **文件**: `src/pages/approval/components/ApprovalDetail.tsx:136-147`
- **问题**: 用户可切换审批模式(单人/会签/或签)，但提交时不发送该字段
- **修复**: 移除 Radio.Group，改为只读标签展示

### 待修复 (后续 Sprint)

#### P-1: 里程碑启动功能未在 UI 中暴露
- **严重级别**: MEDIUM
- **说明**: `project.service.ts` 有 `startMilestone` 函数，但项目详情页无对应按钮
- **影响**: 里程碑创建后需要手动调 API 才能启动

#### P-2: 审批历史 approverId 语义错误
- **文件**: `src/pages/approval/components/ApprovalDetail.tsx:103`
- **说明**: `ChainStep.approverId` 实际传入的是 `approverName`（字符串名称）
- **影响**: 功能正常（用于显示），但语义不准确
- **建议**: 后端 ApprovalCommentVO 增加 `approverId` 字段

#### P-3: 加签功能未完整实现
- **文件**: `src/pages/approval/components/AddSignerModal.tsx`
- **说明**: 按钮存在但后端加签 API 未验证
- **影响**: 加签操作可能失败

---

## 四、数据流验证路径（已验证）

### 路径 1: Task 完成审批 ✅ 全链路正常

```
创建Task → POST /api/tasks
  ↓
分配/开始 → PUT /api/tasks/{id}/status {status: 2}
  ↓
完成Task → PUT /api/tasks/{id}/complete
  ↓ (如果需要审批)
启动审批 → startWorkflow("GENERIC_APPROVAL", taskId, "TASK")
  ↓
Task status → PENDING_REVIEW(3)
  ↓
审批人操作 → POST /api/wf/tasks/{taskId}/complete {approved: true}
  ↓
BPMN ServiceTask → TaskApprovalCallback.onApproved()
  ├─ 检查 status != 4 (幂等保护) ✅
  └─ 设置 status = COMPLETED(4) ✅
  ↓
ApprovalEventListener.onProcessCompleted()
  ├─ 检查 status == 3/4 (去重) ✅
  └─ 跳过重复回调 ✅
```

### 路径 2: BOM 变更审批 ✅ 全链路正常

```
创建BOM → POST /api/boms (status=EDITING)
  ↓
添加物料 → POST /api/boms/{id}/items {name, sourceType, quantity, ...}
  ↓ 字段名已对齐 ✅
提交审批 → POST /api/boms/{id}/submit-approval (status=PENDING_APPROVAL)
  ↓
审批通过 → BomApprovalCallback.onApproved() (status=PUBLISHED)
  ↓
编辑已发布BOM → ChangeApprovalInterceptor.intercept()
  ↓
创建ChangeRequest → {changeType, changeData: JSON}
  ↓
启动CHANGE_APPROVAL → 3级审批
  ↓
审批通过 → ChangeApprovalService.execute()
  → callbackRegistry.onApproved("BOM_CHANGE", crId, approverId)
  → BomChangeApprovalCallback.onApproved()
    ├─ 幂等检查 (status != 2) ✅
    ├─ applyChange(cr)
    │  ├─ ADD_ITEM: 从 parent 计算 level/path/levelNo ✅
    │  ├─ UPDATE_ITEM: 按字段增量更新 ✅
    │  └─ DELETE_ITEM: 递归删除子节点 ✅
    └─ 更新 CR status=2 ✅
  ↓
ApprovalEventListener 去重 → 跳过 ✅
```

### 路径 3: 里程碑生命周期 ⚠️ UI 缺口

```
创建Milestone → POST /api/projects/{id}/milestones (status=1) ✅
  ↓
启动Milestone → PUT /api/projects/milestones/{id}/start (status=1→2)
  ↓ ⚠️ 前端无按钮触发（service 函数存在但 UI 未调用）
完成Milestone → POST /api/projects/milestones/{id}/complete
  ├─ 无 deliverable: 直接完成 (status=3) ✅
  └─ 有 deliverable: 启动 GENERIC_APPROVAL ✅
    → MilestoneApprovalCallback.onApproved()
      ├─ 幂等检查 (status != 3) ✅
      └─ 设置 status=3 ✅
```

### 路径 4: 前端审批操作 ✅ 全链路正常

```
加载待审批列表 → GET /api/wf/tasks/pending
  ↓
选择审批项 → 显示 ApprovalDetail
  ↓
加载审批历史 → GET /api/wf/business-objects/{id}/history
  ↓
通过操作:
  用户点击"通过" → Popconfirm 二次确认 → handleApprove()
  → store.completeTask(taskId, true)
  → POST /api/wf/tasks/{taskId}/complete {approved: true}
  ↓
拒绝操作:
  用户输入原因 → 点击"拒绝" → Popconfirm 二次确认 → handleReject()
  → 验证 comment 非空 ✅
  → store.completeTask(taskId, false, comment)
  → POST /api/wf/tasks/{taskId}/complete {approved: false, comment: "..."}
```

---

## 五、UI/UX 视觉审查摘要

### CRITICAL (2)
1. **审批按钮误操作风险** — 已修复 ✅ (通过/拒绝按钮增加色彩区分+二次确认)
2. **移动端表格截断** — 表格在窄屏下直接截断，无响应式适配

### HIGH (8)
| 页面 | 问题 | 建议 |
|------|------|------|
| Dashboard | 统计卡片信息密度过高 | 增加内边距，数字字号加大 |
| 项目列表 | 表格列过多被截断 | 可折叠列 + 固定操作列 |
| 任务列表 | 状态标签颜色区分度不足 | 高对比度色彩方案 |
| BOM 表格 | 数值密集缺乏视觉引导 | 斑马纹 + 行悬停高亮 |
| 审批列表 | 状态/优先级标签样式相似 | 状态用填充色，优先级用边框色 |
| 审批流程配置 | 节点连线交叉重叠 | 正交连线算法 |
| 资源分配 | 甘特图横向滚动失去上下文 | 固定左侧人员列 |
| 项目甘特图 | 任务条与里程碑标识区分不足 | 里程碑用菱形+不同颜色 |

### 全局性 UI 问题
- 缺乏统一设计系统/组件规范
- 信息层级处理不一致（字号/颜色/间距）
- 多个页面缺少空状态处理
- 数据密集页面缺少加载骨架屏

---

## 六、审批引擎回调注册表（验证通过）

| Handler | objectType | 幂等保护 | 状态 |
|---------|-----------|---------|------|
| TaskApprovalCallback | TASK, ISSUE, RISK | status==4 跳过 | ✅ |
| MilestoneApprovalCallback | MILESTONE | status==3 跳过 | ✅ |
| BomApprovalCallback | BOM | status==3 跳过 | ✅ |
| BomChangeApprovalCallback | BOM_CHANGE | status==2 跳过 | ✅ |
| StageGateApprovalCallback | STAGE_GATE | status==3 跳过 | ✅ |
| FileApprovalCallback | FILE | status==3 跳过 | ✅ |
| ModuleSpecApprovalCallback | MODULE_SPEC | status==3 跳过 | ✅ |
| ProcessRouteApprovalCallback | PROCESS_CHANGE | status==3 跳过 | ✅ |

---

## 七、测试验证

- 前端测试: **1880 passed, 0 failed**
- TypeScript 编译: **0 errors**
- 后端 Java: 上次审计问题全部已修复（代码验证）

---

## 八、本次修复清单

| 文件 | 修改内容 |
|------|---------|
| `src/pages/mytasks/index.tsx:42` | `page` → `pageNum` |
| `src/pages/mytasks/index.tsx:77` | `PENDING_ASSIGN/NOT_STARTED` → `PENDING` |
| `src/pages/mytasks/index.tsx:92` | 移除 `(t as any).name` |
| `src/pages/approval/components/ApprovalDetail.tsx` | 通过按钮绿色+Popconfirm，拒绝按钮+Popconfirm |
| `src/pages/approval/components/ApprovalDetail.tsx` | 审批模式改为只读展示 |
| `src/pages/approval/components/ApprovalDetail.spec.tsx` | 测试适配新 UI 交互 |
| `src/pages/dashboard/components/ScheduleView.tsx` | 重构计划表甘特图 |
| `src/pages/dashboard/components/ScheduleView.module.css` | 重构计划表样式 |
| `src/pages/dashboard/components/ScheduleView.spec.tsx` | 测试适配新组件结构 |

### 计划表(ScheduleView)重构详情

**修复的 UI/UX 问题：**
1. 添加"今天"标记线（红色竖线 + 圆点）— 提供时间上下文
2. 添加导航工具栏（前移/后移3个月 + "今天"按钮）— 快速定位
3. 时间轴从24个月缩减为12个月 — 减少无效滚动
4. 项目名称列 `position: sticky` — 横向滚动时保持可见
5. 移除冗余的进度百分比（bar后面的%）— 信息去重
6. 添加空状态引导 — 无项目时显示提示
7. 容器高度约束 `calc(100vh - 120px)` — 防止页面无限扩展
8. 交替行背景色 — 提升可读性
9. 进度徽章样式优化 — 蓝色圆角标签
10. 甘特条仅在宽度>60px时显示文字 — 避免短条文字溢出
11. 自动滚动到"今天"位置 — 首次加载即可看到当前时间点
12. 右侧面板固定340px宽度 — 甘特图获得更多空间

---

## 九、后续规划

### 下一 Sprint 优先级

| 优先级 | 任务 | 预计工作量 |
|--------|------|-----------|
| P0 | 移动端响应式适配（表格→卡片） | 4h |
| P1 | 里程碑启动按钮添加到项目详情 | 1h |
| P1 | 全局状态标签色彩体系统一 | 2h |
| P1 | 表格信息密度优化（斑马纹/固定列） | 3h |
| P2 | 审批流程可视化增强（步骤条） | 3h |
| P2 | 空状态/骨架屏全局补充 | 2h |
| P2 | 后端 ApprovalCommentVO 增加 approverId | 1h |
| P3 | 加签功能完整实现 | 3h |
| P3 | 设计系统/组件规范文档 | 4h |

**总预估: ~23h**

---

## 十、架构健康度评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 审批引擎 | 9/10 | 回调注册表模式优秀，幂等保护完善，去重逻辑到位 |
| BOM 数据流 | 8/10 | 变更审批全链路已修复，树结构计算正确 |
| Task 数据流 | 8/10 | 状态机完整，审批回调正常，前端参数已修正 |
| Project 数据流 | 7/10 | 里程碑 UI 缺口，其余正常 |
| 前端类型安全 | 7/10 | 大部分对齐，少量语义错误 |
| UI/UX | 6/10 | 功能完整但缺乏统一设计系统，响应式不足 |

**整体健康度: 7.5/10** — 核心业务逻辑正确，主要短板在 UI 层面。
