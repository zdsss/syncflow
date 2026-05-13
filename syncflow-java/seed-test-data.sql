-- ============================================================================
-- SyncFlow Comprehensive Test Data Seed Script
-- Based on: 260509协同项目管理逻辑描述.docx
--
-- Covers:
-- 1. 工作空间: task types, categories, quick-create (@ # ￥ % ^ & *), search, watchers
-- 2. 项目管理: project tree, phases, tasks, dependencies (SS/SF/FS/FF), schedule, swimlane, gantt
-- 3. 中控看板: project stats, task summaries, milestones, progress
-- 4. Supporting: BOM, process routes, notifications, templates, workflow
-- ============================================================================

-- Clean existing test data (preserve schema, Flowable tables, and admin user)
TRUNCATE TABLE tsk_task_dependency CASCADE;
TRUNCATE TABLE tsk_task_watcher CASCADE;
TRUNCATE TABLE tsk_task_comment CASCADE;
TRUNCATE TABLE tsk_task_activity CASCADE;
TRUNCATE TABLE tsk_task_participant CASCADE;
TRUNCATE TABLE tsk_task CASCADE;
TRUNCATE TABLE tsk_task_template_item CASCADE;
TRUNCATE TABLE tsk_task_template CASCADE;
TRUNCATE TABLE prj_milestone CASCADE;
TRUNCATE TABLE prj_stage_gate CASCADE;
TRUNCATE TABLE prj_phase CASCADE;
TRUNCATE TABLE prj_project_member CASCADE;
TRUNCATE TABLE prj_project CASCADE;
TRUNCATE TABLE bom_item CASCADE;
TRUNCATE TABLE bom_version CASCADE;
TRUNCATE TABLE cfg_product_bom CASCADE;
TRUNCATE TABLE bom_bom CASCADE;
TRUNCATE TABLE prc_operation_material CASCADE;
TRUNCATE TABLE prc_man_hour CASCADE;
TRUNCATE TABLE prc_operation CASCADE;
TRUNCATE TABLE prc_process_route CASCADE;
TRUNCATE TABLE cfg_deliverable_template CASCADE;
TRUNCATE TABLE wf_workflow_template CASCADE;
TRUNCATE TABLE notification CASCADE;
TRUNCATE TABLE cfg_spec_param CASCADE;
TRUNCATE TABLE cfg_module_spec CASCADE;
TRUNCATE TABLE cfg_module CASCADE;
TRUNCATE TABLE cfg_module_category CASCADE;
TRUNCATE TABLE cfg_order_product CASCADE;
TRUNCATE TABLE cfg_order_category CASCADE;
TRUNCATE TABLE sta_dashboard_data CASCADE;
TRUNCATE TABLE sta_task_statistics CASCADE;
TRUNCATE TABLE sta_man_hour_ranking CASCADE;
TRUNCATE TABLE wf_business_object CASCADE;
TRUNCATE TABLE wf_approval_comment CASCADE;
TRUNCATE TABLE wf_cc_record CASCADE;
TRUNCATE TABLE wf_delegation CASCADE;
TRUNCATE TABLE wf_change_request CASCADE;
TRUNCATE TABLE sys_user_role CASCADE;
TRUNCATE TABLE sys_role CASCADE;

-- Reset sequences
SELECT setval('tsk_task_id_seq', 100);
SELECT setval('prj_project_id_seq', 100);
SELECT setval('prj_phase_id_seq', 100);
SELECT setval('prj_milestone_id_seq', 100);
SELECT setval('tsk_task_dependency_id_seq', 100);
SELECT setval('tsk_task_participant_id_seq', 100);
SELECT setval('tsk_task_watcher_id_seq', 100);
SELECT setval('tsk_task_comment_id_seq', 100);
SELECT setval('tsk_task_activity_id_seq', 100);
SELECT setval('bom_bom_id_seq', 100);
SELECT setval('bom_item_id_seq', 100);
SELECT setval('prc_process_route_id_seq', 100);
SELECT setval('prc_operation_id_seq', 100);
SELECT setval('prc_man_hour_id_seq', 100);
SELECT setval('prc_operation_material_id_seq', 100);
SELECT setval('notification_id_seq', 100);
SELECT setval('cfg_module_category_id_seq', 100);
SELECT setval('cfg_module_id_seq', 100);
SELECT setval('cfg_module_spec_id_seq', 100);
SELECT setval('cfg_spec_param_id_seq', 100);
SELECT setval('cfg_order_category_id_seq', 100);
SELECT setval('cfg_order_product_id_seq', 100);

-- ============================================================================
-- SECTION 1: ROLES & PERMISSIONS
-- ============================================================================
INSERT INTO sys_role (id, code, name, description, tenant_id) VALUES
(1, 'ADMIN', '系统管理员', '系统管理权限', 1),
(2, 'PM', '项目经理', '项目管理权限', 1),
(3, 'TECH_LEADER', '技术负责人', '技术审核权限', 1),
(4, 'MEMBER', '项目成员', '基础成员权限', 1),
(5, 'GUEST', '访客', '只读权限', 1);

SELECT setval('sys_role_id_seq', 10);

INSERT INTO sys_user_role (user_id, role_id) VALUES
(1, 1),   -- admin -> ADMIN
(2, 2),   -- 张三 -> PM
(3, 3),   -- 李四 -> TECH_LEADER
(4, 3),   -- 王五 -> TECH_LEADER
(5, 4),   -- 赵六 -> MEMBER
(6, 4),   -- 孙七 -> MEMBER
(7, 4),   -- 周八 -> MEMBER
(8, 4),   -- 吴九 -> MEMBER
(9, 4),   -- 郑十 -> MEMBER
(10, 4);  -- 测试用户 -> MEMBER

-- ============================================================================
-- SECTION 2: PROJECT FOLDER HIERARCHY (项目管理-文件夹结构树)
-- ============================================================================
-- Root folder: 新能源汽车
--   ├── 电池系统 (sub-folder)
--   │   ├── 电池Pack开发 (PROJECT, active)
--   │   └── 电池BMS开发 (PROJECT, planning)
--   └── 电驱系统 (sub-folder)
--       └── 电驱总成开发 (PROJECT, active)

-- Folders
INSERT INTO prj_project (id, name, code, description, owner_id, project_type, status, priority, progress, planned_start, planned_end, parent_id, parent_path, dept_id, tenant_id) VALUES
(1,  '新能源汽车', 'NEV',     '新能源汽车项目集合',               2, 'FOLDER',  1, 2, 0, NULL,       NULL,       NULL, '/1',    2, 1),
(2,  '电池系统',   'BATTERY', '动力电池系统项目分类',             2, 'FOLDER',  1, 2, 0, NULL,       NULL,       1,    '/1/2',  2, 1),
(3,  '电驱系统',   'EDRIVE',  '电驱动系统项目分类',               2, 'FOLDER',  1, 2, 0, NULL,       NULL,       1,    '/1/3',  2, 1);

-- Projects
INSERT INTO prj_project (id, name, code, description, owner_id, project_type, status, priority, progress, planned_start, planned_end, actual_start, parent_id, parent_path, dept_id, tenant_id) VALUES
(10, '电池Pack开发',   'BP-001', '高能量密度电池包开发项目', 2, 'PROJECT', 2, 1, 35, '2026-01-05', '2026-09-30', '2026-01-05', 2, '/1/2/10', 2, 1),
(11, '电池BMS开发',    'BB-001', '电池管理系统开发',         2, 'PROJECT', 1, 2, 0,  '2026-03-01', '2026-12-31', NULL,          2, '/1/2/11', 2, 1),
(12, '电驱总成开发',    'ED-001', '永磁同步电机总成开发',     2, 'PROJECT', 2, 1, 20, '2026-02-01', '2026-11-30', '2026-02-01', 3, '/1/3/12', 4, 1);

SELECT setval('prj_project_id_seq', 100);

-- ============================================================================
-- SECTION 3: PROJECT MEMBERS (项目参与人)
-- ============================================================================
INSERT INTO prj_project_member (project_id, user_id, project_role, dept_id) VALUES
-- 电池Pack开发 team
(10, 2, 'PROJECT_MANAGER', 2),  -- 张三 PM
(10, 3, 'TECH_LEADER', 3),     -- 李四 设计负责人
(10, 7, 'DESIGNER', 3),        -- 周八 设计工程师
(10, 4, 'PROCESS_ENGINEER', 4), -- 王五 工艺
(10, 8, 'DEVELOPER', 4),       -- 吴九 研发
(10, 9, 'DEVELOPER', 4),       -- 郑十 研发
(10, 5, 'TEST_ENGINEER', 5),   -- 赵六 测试
(10, 6, 'QUALITY_ENGINEER', 6),-- 孙七 品质
-- 电池BMS开发 team
(11, 2, 'PROJECT_MANAGER', 2),
(11, 3, 'TECH_LEADER', 3),
(11, 8, 'DEVELOPER', 4),
-- 电驱总成开发 team
(12, 2, 'PROJECT_MANAGER', 2),
(12, 4, 'TECH_LEADER', 4),
(12, 9, 'DEVELOPER', 4),
(12, 5, 'TEST_ENGINEER', 5);

-- ============================================================================
-- SECTION 4: PROJECT PHASES (项目阶段)
-- ============================================================================
-- 电池Pack开发 phases
INSERT INTO prj_phase (id, project_id, name, code, seq_no, status, progress, planned_start, planned_end, actual_start) VALUES
(1, 10, '需求分析', 'REQ',   1, 4, 100, '2026-01-05', '2026-02-15', '2026-01-05'),
(2, 10, '方案设计', 'DESIGN', 2, 2, 60,  '2026-02-16', '2026-04-30', '2026-02-16'),
(3, 10, '试制验证', 'PILOT',  3, 1, 0,   '2026-05-01', '2026-07-31', NULL),
(4, 10, '量产准备', 'MP',     4, 1, 0,   '2026-08-01', '2026-09-30', NULL);

-- 电驱总成开发 phases
INSERT INTO prj_phase (id, project_id, name, code, seq_no, status, progress, planned_start, planned_end, actual_start) VALUES
(5, 12, '概念设计', 'CONCEPT', 1, 2, 40, '2026-02-01', '2026-04-30', '2026-02-01'),
(6, 12, '详细设计', 'DETAIL',  2, 1, 0,  '2026-05-01', '2026-08-31', NULL);

SELECT setval('prj_phase_id_seq', 100);

-- ============================================================================
-- SECTION 5: TASKS WITH BUSINESS LOGIC
-- ============================================================================
-- Status: 1=PENDING, 2=IN_PROGRESS, 3=PENDING_REVIEW, 4=COMPLETED, 5=CANCELLED, 6=ON_HOLD, 7=OVERDUE
-- Type: TASK, STAGE, MILESTONE, ISSUE, RISK, SUGGESTION, CHANGE, ACTIVITY, APPROVAL

-- Phase 1: 需求分析 (completed)
INSERT INTO tsk_task (id, task_no, title, description, type, project_id, phase_id, parent_id, parent_path, status, progress, assignee_id, reporter_id, planned_start, planned_end, planned_hours, planned_days, actual_start, actual_end, actual_hours, tenant_id) VALUES
(1,  'TSK-20260105-001', '需求分析阶段',     '收集并分析电池Pack技术需求',         'STAGE',  10, 1, NULL, '/1',  4, 100, 3, 2, '2026-01-05', '2026-02-15', 120, 30, '2026-01-05', '2026-02-12', 110, 1),
(2,  'TSK-20260105-002', '客户需求调研',     '调研OEM客户对电池Pack的技术指标要求', 'TASK',  10, 1, 1,  '/1/1',  4, 100, 3, 2, '2026-01-05', '2026-01-20', 40, 12, '2026-01-05', '2026-01-18', 36, 1),
(3,  'TSK-20260105-003', '竞品分析',         '分析竞品电池Pack技术方案和成本',     'TASK',  10, 1, 1,  '/1/1',  4, 100, 7, 2, '2026-01-10', '2026-01-31', 32, 16, '2026-01-10', '2026-01-28', 28, 1),
(4,  'TSK-20260105-004', '技术指标确定',     '确定Pack能量密度、循环寿命等核心指标', 'TASK',  10, 1, 1,  '/1/1',  4, 100, 3, 2, '2026-01-25', '2026-02-10', 24, 12, '2026-01-22', '2026-02-08', 22, 1),
(5,  'TSK-20260105-005', '需求规格书评审',   '组织各方评审需求规格书',             'TASK',  10, 1, 1,  '/1/1',  4, 100, 2, 2, '2026-02-10', '2026-02-15', 8, 3, '2026-02-10', '2026-02-12', 6, 1);

-- Phase 2: 方案设计 (in progress)
INSERT INTO tsk_task (id, task_no, title, description, type, project_id, phase_id, parent_id, parent_path, status, progress, assignee_id, reporter_id, planned_start, planned_end, planned_hours, planned_days, actual_start, tenant_id) VALUES
(6,  'TSK-20260216-001', '方案设计阶段',     '完成Pack整体方案设计',               'STAGE',  10, 2, NULL, '/2',  2, 60, 3, 2, '2026-02-16', '2026-04-30', 200, 50, '2026-02-16', 1),
(7,  'TSK-20260216-002', 'Pack结构设计',     '完成电池包外壳、模组固定结构设计',     'TASK',  10, 2, 6,  '/2/6',  2, 80, 7, 2, '2026-02-16', '2026-03-20', 60, 20, '2026-02-16', 1),
(8,  'TSK-20260216-003', '电气系统设计',     '完成高压线束、连接器选型设计',         'TASK',  10, 2, 6,  '/2/6',  2, 70, 3, 2, '2026-02-20', '2026-03-31', 48, 24, '2026-02-20', 1),
(9,  'TSK-20260216-004', '热管理系统设计',   '设计液冷散热方案',                   'TASK',  10, 2, 6,  '/2/6',  2, 50, 8, 2, '2026-03-01', '2026-04-10', 56, 28, '2026-03-01', 1),
(10, 'TSK-20260216-005', 'BMS接口设计',      '定义BMS与Pack的电气和通信接口',      'TASK',  10, 2, 6,  '/2/6',  2, 40, 8, 2, '2026-03-10', '2026-04-05', 32, 18, '2026-03-10', 1),
(11, 'TSK-20260216-006', 'DFMEA分析',        '完成设计失效模式分析',               'TASK',  10, 2, 6,  '/2/6',  1, 0,  6, 2, '2026-04-01', '2026-04-20', 24, 14, NULL, 1),
(12, 'TSK-20260216-007', '方案设计评审',     '组织设计方案评审',                   'TASK',  10, 2, 6,  '/2/6',  1, 0,  2, 2, '2026-04-20', '2026-04-30', 16, 6, NULL, 1);

-- Phase 3: 试制验证 (pending)
INSERT INTO tsk_task (id, task_no, title, description, type, project_id, phase_id, parent_id, parent_path, status, progress, assignee_id, reporter_id, planned_start, planned_end, planned_hours, planned_days, tenant_id) VALUES
(13, 'TSK-20260501-001', '试制验证阶段',     '完成样品试制和验证测试',             'STAGE',  10, 3, NULL, '/3',  1, 0, 4, 2, '2026-05-01', '2026-07-31', 240, 60, 1),
(14, 'TSK-20260501-002', '样品试制',         '制作电池Pack工程样品',               'TASK',  10, 3, 13, '/3/13', 1, 0, 4, 2, '2026-05-01', '2026-06-15', 80, 30, 1),
(15, 'TSK-20260501-003', '性能测试',         '进行Pack充放电性能和循环寿命测试',    'TASK',  10, 3, 13, '/3/13', 1, 0, 5, 2, '2026-06-01', '2026-07-10', 60, 28, 1),
(16, 'TSK-20260501-004', '安全测试',         '进行过充、短路、挤压等安全测试',      'TASK',  10, 3, 13, '/3/13', 1, 0, 5, 2, '2026-06-15', '2026-07-20', 48, 24, 1),
(17, 'TSK-20260501-005', '环境测试',         '高低温、振动、盐雾等环境可靠性测试',  'TASK',  10, 3, 13, '/3/13', 1, 0, 5, 2, '2026-06-15', '2026-07-25', 40, 28, 1),
(18, 'TSK-20260501-006', '试制问题整改',     '汇总试制发现的问题并整改',           'TASK',  10, 3, 13, '/3/13', 1, 0, 4, 2, '2026-07-01', '2026-07-31', 32, 20, 1);

-- Phase 4: 量产准备 (pending)
INSERT INTO tsk_task (id, task_no, title, description, type, project_id, phase_id, parent_id, parent_path, status, progress, assignee_id, reporter_id, planned_start, planned_end, planned_hours, planned_days, tenant_id) VALUES
(19, 'TSK-20260801-001', '量产准备阶段',     '完成量产前全部准备工作',             'STAGE',  10, 4, NULL, '/4',  1, 0, 2, 2, '2026-08-01', '2026-09-30', 160, 40, 1),
(20, 'TSK-20260801-002', '工艺文件编制',     '编制SOP、检验标准等工艺文件',        'TASK',  10, 4, 19, '/4/19', 1, 0, 4, 2, '2026-08-01', '2026-08-31', 48, 20, 1),
(21, 'TSK-20260801-003', '生产线调试',       '调试Pack装配生产线',                 'TASK',  10, 4, 19, '/4/19', 1, 0, 4, 2, '2026-08-15', '2026-09-15', 40, 20, 1),
(22, 'TSK-20260801-004', '供应商量产评审',   '对关键供应商进行量产能力评审',       'TASK',  10, 4, 19, '/4/19', 1, 0, 6, 2, '2026-08-01', '2026-09-10', 32, 24, 1),
(23, 'TSK-20260801-005', 'PPAP提交',         '提交生产件批准程序资料',             'TASK',  10, 4, 19, '/4/19', 1, 0, 2, 2, '2026-09-01', '2026-09-20', 24, 12, 1),
(24, 'TSK-20260801-006', 'SOP试运行',        '按SOP进行小批量试运行',              'TASK',  10, 4, 19, '/4/19', 1, 0, 9, 2, '2026-09-10', '2026-09-30', 20, 12, 1);

-- 电驱总成开发 tasks
INSERT INTO tsk_task (id, task_no, title, description, type, project_id, phase_id, parent_id, parent_path, status, progress, assignee_id, reporter_id, planned_start, planned_end, planned_hours, planned_days, actual_start, tenant_id) VALUES
(30, 'TSK-20260201-001', '概念设计阶段',     '完成电驱总成概念方案',               'STAGE',  12, 5, NULL, '/5',  2, 40, 4, 2, '2026-02-01', '2026-04-30', 160, 40, '2026-02-01', 1),
(31, 'TSK-20260201-002', '电机选型分析',     '对比永磁同步/异步电机方案',          'TASK',  12, 5, 30, '/5/30', 4, 100, 4, 2, '2026-02-01', '2026-02-28', 40, 15, '2026-02-01', 1),
(32, 'TSK-20260201-003', '减速器方案设计',   '设计单级/两级减速器方案',            'TASK',  12, 5, 30, '/5/30', 2, 60,  9, 2, '2026-02-15', '2026-03-31', 48, 24, '2026-02-15', 1),
(33, 'TSK-20260201-004', '控制器硬件方案',   '确定MCU硬件架构和关键器件选型',      'TASK',  12, 5, 30, '/5/30', 2, 30,  9, 2, '2026-03-01', '2026-04-15', 40, 28, '2026-03-01', 1),
(34, 'TSK-20260201-005', '概念方案评审',     '评审电驱总成概念设计方案',           'TASK',  12, 5, 30, '/5/30', 1, 0,   2, 2, '2026-04-15', '2026-04-30', 16, 8, NULL, 1);

-- ============================================================================
-- SECTION 5b: TASK TYPES COVERAGE (issues, risks, suggestions, activities, changes)
-- ============================================================================

-- Issues (问题)
INSERT INTO tsk_task (id, task_no, title, description, type, project_id, phase_id, parent_id, parent_path, status, progress, assignee_id, reporter_id, planned_start, planned_end, due_date, is_overdue, is_warning, tenant_id) VALUES
(40, 'TSK-20260301-001', '电芯供应商交期风险', '某电芯供应商产能不足，可能影响交付时间', 'ISSUE', 10, 2, 6, '/2/6', 7, 0, 6, 2, '2026-03-01', '2026-03-15', '2026-03-15', true, true, 1),
(41, 'TSK-20260315-001', 'BMS通信协议兼容问题', 'BMS与VCU通信存在丢包现象',             'ISSUE', 10, 2, 6, '/2/6', 2, 50, 8, 5, '2026-03-15', '2026-04-15', '2026-04-15', false, true, 1);

-- Risks (风险)
INSERT INTO tsk_task (id, task_no, title, description, type, project_id, phase_id, parent_id, parent_path, status, progress, assignee_id, reporter_id, planned_start, planned_end, is_warning, tenant_id) VALUES
(42, 'TSK-20260305-001', '液冷散热设计风险',   '液冷板焊接工艺可能影响散热效率',       'RISK', 10, 2, 6, '/2/6', 2, 30, 9, 2, '2026-03-05', '2026-04-30', true, 1),
(43, 'TSK-20260310-001', 'Pack重量超标风险',   '当前方案Pack重量可能超出目标值5%',      'RISK', 10, 2, 6, '/2/6', 1, 0,  7, 3, '2026-03-10', '2026-04-15', true, 1);

-- Suggestions (建议)
INSERT INTO tsk_task (id, task_no, title, description, type, project_id, phase_id, parent_id, parent_path, status, progress, assignee_id, reporter_id, tenant_id) VALUES
(44, 'TSK-20260320-001', '建议增加CTP方案评估', '建议评估CTP方案以提升能量密度', 'SUGGESTION', 10, 2, 6, '/2/6', 1, 0, 3, 4, 1);

-- Changes (变更)
INSERT INTO tsk_task (id, task_no, title, description, type, project_id, phase_id, parent_id, parent_path, status, progress, assignee_id, reporter_id, tenant_id) VALUES
(45, 'TSK-20260325-001', '电芯规格变更', '因客户要求提升容量，需变更电芯规格型号', 'CHANGE', 10, 2, 6, '/2/6', 3, 0, 3, 2, 1);

-- Activities (活动)
INSERT INTO tsk_task (id, task_no, title, description, type, project_id, phase_id, parent_id, parent_path, status, progress, assignee_id, reporter_id, planned_start, planned_end, tenant_id) VALUES
(46, 'TSK-20260401-001', 'Pack方案技术交流会', '与客户进行Pack方案技术交流',     'ACTIVITY', 10, 2, 6, '/2/6', 4, 100, 2, 2, '2026-04-01', '2026-04-01', 1),
(47, 'TSK-20260410-001', '热管理方案评审会',   '邀请外部专家评审热管理方案',     'ACTIVITY', 10, 2, 6, '/2/6', 2, 50,  2, 2, '2026-04-10', '2026-04-10', 1);

-- Tasks for near-term (today/this week/this month) coverage - for 工作空间 time-based filters
INSERT INTO tsk_task (id, task_no, title, description, type, project_id, phase_id, parent_id, parent_path, status, progress, assignee_id, reporter_id, planned_start, planned_end, planned_hours, planned_days, due_date, is_warning, tenant_id) VALUES
(50, 'TSK-20260510-001', '完成DFMEA分析报告', '今日需完成DFMEA分析报告初稿',       'TASK', 10, 2, 6, '/2/6', 2, 40, 6, 2, '2026-05-10', '2026-05-10', 8, 1, '2026-05-10', false, 1),
(51, 'TSK-20260510-002', 'BMS接口文档更新',   '本周需更新BMS接口技术文档',         'TASK', 10, 2, 6, '/2/6', 2, 20, 8, 2, '2026-05-10', '2026-05-15', 16, 4, '2026-05-15', false, 1),
(52, 'TSK-20260510-003', '热管理仿真分析',    '本月完成热管理CFD仿真分析',         'TASK', 10, 2, 6, '/2/6', 1, 0,  9, 2, '2026-05-12', '2026-05-30', 24, 12, '2026-05-30', false, 1);

-- Non-project standalone tasks (工作空间 - 无项目归属任务)
INSERT INTO tsk_task (id, task_no, title, description, type, project_id, phase_id, status, progress, assignee_id, reporter_id, planned_start, planned_end, due_date, is_overdue, is_warning, tenant_id) VALUES
(60, 'TSK-20260505-001', '部门月度工作总结', '编写设计部4月工作总结报告',         'TASK', NULL, NULL, 2, 60, 3, 2, '2026-05-05', '2026-05-12', '2026-05-12', false, false, 1),
(61, 'TSK-20260503-001', '设备维护申请',     '提交CNC设备季度维护申请',           'TASK', NULL, NULL, 7, 0,  4, 4, '2026-05-03', '2026-05-08', '2026-05-08', true, true, 1),
(62, 'TSK-20260508-001', '培训计划制定',     '制定Q2新员工技术培训计划',          'TASK', NULL, NULL, 1, 0,  2, 2, '2026-05-08', '2026-05-20', '2026-05-20', false, false, 1);

SELECT setval('tsk_task_id_seq', 200);

-- ============================================================================
-- SECTION 6: TASK DEPENDENCIES (任务依赖关系 SS/SF/FS/FF)
-- ============================================================================
-- Dependency types:
-- SS (Start-to-Start): 当前任务的开始取决于特定任务的开始
-- SF (Start-to-Finish): 当前任务的开始取决于特定任务的结束 (顺序开始)
-- FS (Finish-to-Start): 当前任务的结束取决于特定任务的开始
-- FF (Finish-to-Finish): 当前任务的结束取决于特定任务的结束

INSERT INTO tsk_task_dependency (tenant_id, task_id, depends_on_task_id, dependency_type, created_by) VALUES
-- Phase 1 dependencies (需求分析内部)
(1, 3, 2, 'SS', 2),   -- 竞品分析 与 客户需求调研 同步开始
(1, 4, 2, 'FS', 2),   -- 客户需求调研 完成后 -> 技术指标确定 开始 (FS: finish-to-start, 4 starts after 2 finishes)
(1, 5, 4, 'FS', 2),   -- 技术指标确定 完成后 -> 需求规格书评审 开始

-- Phase 2 dependencies (方案设计内部)
(1, 8, 7, 'SS', 2),   -- 电气系统设计 与 Pack结构设计 同步开始
(1, 9, 7, 'FS', 2),   -- Pack结构设计 完成后 -> 热管理系统设计 开始
(1, 10, 8, 'FS', 2),  -- 电气系统设计 完成后 -> BMS接口设计 开始
(1, 11, 9, 'FS', 2),  -- 热管理系统设计 完成后 -> DFMEA分析 开始
(1, 11, 10, 'SS', 2), -- DFMEA分析 与 BMS接口设计后续同步
(1, 12, 11, 'FS', 2), -- DFMEA分析 完成后 -> 方案设计评审 开始

-- Cross-phase dependencies
(1, 14, 12, 'FS', 2), -- 方案设计评审 完成后 -> 样品试制 开始
(1, 15, 14, 'FS', 2), -- 样品试制 完成后 -> 性能测试 开始
(1, 16, 14, 'SS', 2), -- 安全测试 与 样品试制 同步开始 (SS)
(1, 17, 15, 'FS', 2), -- 性能测试 完成后 -> 环境测试 开始
(1, 18, 16, 'FF', 18), -- 试制问题整改 完成取决于 安全测试 完成 (FF)
(1, 20, 18, 'FS', 2), -- 试制问题整改 完成后 -> 工艺文件编制 开始

-- 电驱项目 dependencies
(1, 32, 31, 'FS', 2), -- 电机选型完成后 -> 减速器方案设计
(1, 33, 31, 'SS', 2), -- 控制器硬件方案 与 电机选型同步开始
(1, 34, 32, 'FS', 2), -- 减速器方案完成后 -> 概念方案评审
(1, 34, 33, 'FS', 2); -- 控制器方案完成后 -> 概念方案评审

-- ============================================================================
-- SECTION 7: TASK PARTICIPANTS (任务参与人)
-- ============================================================================
INSERT INTO tsk_task_participant (task_id, user_id, role) VALUES
-- 需求分析参与者
(1, 7, 'COLLABORATOR'),   -- 周八参与需求分析
(1, 4, 'COLLABORATOR'),   -- 王五参与需求分析
(2, 7, 'COLLABORATOR'),   -- 周八参与客户调研
(4, 6, 'REVIEWER'),       -- 孙七审核技术指标

-- 方案设计参与者
(6, 8, 'COLLABORATOR'),   -- 吴九参与方案设计
(6, 9, 'COLLABORATOR'),   -- 郑十参与方案设计
(7, 3, 'REVIEWER'),       -- 李四审核结构设计
(9, 7, 'COLLABORATOR'),   -- 周八参与热管理设计
(12, 4, 'APPROVER'),      -- 王五审批设计评审
(12, 6, 'REVIEWER'),      -- 孙七审核设计评审

-- 试制验证参与者
(15, 9, 'COLLABORATOR'),  -- 郑十参与性能测试
(16, 6, 'REVIEWER'),      -- 孙七审核安全测试

-- 问题/风险参与者
(40, 3, 'COLLABORATOR'),  -- 李四参与供应商问题
(42, 4, 'REVIEWER');      -- 王五审核热管理风险

-- ============================================================================
-- SECTION 8: TASK WATCHERS (关注任务)
-- ============================================================================
INSERT INTO tsk_task_watcher (task_id, user_id) VALUES
(6, 2),   -- 张三关注方案设计阶段
(7, 2),   -- 张三关注Pack结构设计
(10, 5),  -- 赵六关注BMS接口设计
(14, 2),  -- 张三关注样品试制
(40, 2),  -- 张三关注供应商问题
(42, 2),  -- 张三关注热管理风险
(45, 4),  -- 王五关注电芯变更
(50, 2),  -- 张三关注DFMEA
(31, 2),  -- 张三关注电机选型
(32, 2);  -- 张三关注减速器设计

-- ============================================================================
-- SECTION 9: TASK COMMENTS (任务评论)
-- ============================================================================
INSERT INTO tsk_task_comment (task_id, user_id, content, created_at) VALUES
(2, 3, '已联系3家OEM客户，下周进行现场调研', '2026-01-08 10:30:00'),
(2, 2, '注意收集客户的温度范围和振动等级要求', '2026-01-09 14:20:00'),
(7, 7, '结构设计方案初稿已完成，使用6061铝合金外壳', '2026-02-28 09:15:00'),
(7, 3, '建议外壳壁厚增加到3mm以提升强度', '2026-03-02 11:00:00'),
(40, 6, '已联系备选供应商A公司，产能可满足需求', '2026-03-10 16:00:00'),
(42, 9, '液冷板焊接样品已制作，正在进行温度测试', '2026-03-20 10:30:00'),
(45, 2, '变更申请已提交，等待客户确认新容量参数', '2026-03-26 09:00:00'),
(50, 6, 'DFMEA分析已完成60%，预计今天下班前完成初稿', '2026-05-10 14:00:00'),
(31, 4, '永磁同步电机方案确认，效率优于异步方案3-5%', '2026-02-25 15:30:00');

-- ============================================================================
-- SECTION 10: TASK ACTIVITIES (任务活动日志)
-- ============================================================================
INSERT INTO tsk_task_activity (task_id, user_id, action, field_name, old_value, new_value, created_at) VALUES
(7, 7, 'STATUS_CHANGE', 'status', '1', '2', '2026-02-16 09:00:00'),
(7, 7, 'PROGRESS_UPDATE', 'progress', '0', '30', '2026-02-28 17:00:00'),
(7, 7, 'PROGRESS_UPDATE', 'progress', '30', '60', '2026-03-15 17:00:00'),
(7, 7, 'PROGRESS_UPDATE', 'progress', '60', '80', '2026-04-01 17:00:00'),
(2, 3, 'STATUS_CHANGE', 'status', '1', '2', '2026-01-05 09:00:00'),
(2, 3, 'STATUS_CHANGE', 'status', '2', '4', '2026-01-18 17:00:00'),
(40, 6, 'STATUS_CHANGE', 'status', '2', '7', '2026-03-16 09:00:00'),
(45, 3, 'STATUS_CHANGE', 'status', '1', '3', '2026-03-25 14:00:00'),
(50, 6, 'PROGRESS_UPDATE', 'progress', '0', '40', '2026-05-10 14:00:00'),
(31, 4, 'STATUS_CHANGE', 'status', '1', '2', '2026-02-01 09:00:00'),
(31, 4, 'STATUS_CHANGE', 'status', '2', '4', '2026-02-28 17:00:00');

-- ============================================================================
-- SECTION 11: MILESTONES (里程碑)
-- ============================================================================
INSERT INTO prj_milestone (id, project_id, phase_id, name, type, status, progress, planned_date, actual_date, assignee_id, deliverable) VALUES
(1, 10, 1, '需求冻结',       'MILESTONE', 4, 100, '2026-02-15', '2026-02-12', 2, '需求规格书V1.0'),
(2, 10, 2, '设计冻结',       'MILESTONE', 1, 0,   '2026-04-30', NULL,         2, '设计方案报告'),
(3, 10, 3, '样品完成',       'MILESTONE', 1, 0,   '2026-06-15', NULL,         4, '工程样品2件'),
(4, 10, 3, '验证通过',       'MILESTONE', 1, 0,   '2026-07-31', NULL,         5, '验证测试报告'),
(5, 10, 4, '量产批准',       'MILESTONE', 1, 0,   '2026-09-30', NULL,         2, 'PPAP批准文件'),
(6, 12, 5, '概念方案批准',   'MILESTONE', 1, 0,   '2026-04-30', NULL,         2, '概念设计报告'),
(7, 12, 6, '详细设计完成',   'MILESTONE', 1, 0,   '2026-08-31', NULL,         4, '详细设计图纸');

SELECT setval('prj_milestone_id_seq', 100);

-- ============================================================================
-- SECTION 12: TASK TEMPLATES (任务模板 - ^ 快捷键)
-- ============================================================================
INSERT INTO tsk_task_template (id, tenant_id, name, description, scope, creator_id, is_default, sort_order) VALUES
(1, 1, '通用任务模板', '标准任务模板，包含设计、评审子任务', 'GLOBAL', 1, true, 1),
(2, 1, '我的设计任务', '设计类任务标准模板',               'PERSONAL', 3, false, 1),
(3, 1, '测试任务模板', '测试类任务标准模板，含用例编写和执行', 'PERSONAL', 5, false, 1),
(4, 1, '采购任务模板', '采购类任务模板，含询价、比价、下单', 'GLOBAL', 1, false, 2),
(5, 1, '评审任务模板', '各类评审通用模板',                 'GLOBAL', 1, false, 3);

SELECT setval('tsk_task_template_id_seq', 100);

INSERT INTO tsk_task_template_item (template_id, title, type, sort_order) VALUES
-- 通用任务模板
(1, '方案编写', 'TASK', 1),
(1, '内部评审', 'TASK', 2),
(1, '修改完善', 'TASK', 3),
(1, '提交审批', 'APPROVAL', 4),
-- 设计任务模板
(2, '概念设计', 'TASK', 1),
(2, '详细设计', 'TASK', 2),
(2, '设计评审', 'TASK', 3),
(2, '图纸发放', 'TASK', 4),
-- 测试任务模板
(3, '测试用例编写', 'TASK', 1),
(3, '测试环境准备', 'TASK', 2),
(3, '测试执行',     'TASK', 3),
(3, '测试报告编写', 'TASK', 4),
(3, '缺陷跟踪',    'TASK', 5),
-- 采购任务模板
(4, '询价',   'TASK', 1),
(4, '比价',   'TASK', 2),
(4, '下单',   'TASK', 3),
(4, '到货验收', 'TASK', 4),
-- 评审模板
(5, '资料准备', 'TASK', 1),
(5, '组织评审', 'ACTIVITY', 2),
(5, '问题整改', 'TASK', 3),
(5, '关闭确认', 'TASK', 4);

-- ============================================================================
-- SECTION 13: DELIVERABLE TEMPLATES (交付物模板 - * 快捷键)
-- ============================================================================
INSERT INTO cfg_deliverable_template (id, tenant_id, name, description, items_json, created_by) VALUES
(1, 1, '设计交付物', '设计阶段标准交付物清单',
    '[{"name":"设计图纸","format":"DWG/PDF","required":true},{"name":"BOM清单","format":"Excel","required":true},{"name":"设计计算书","format":"PDF","required":true},{"name":"DFMEA报告","format":"Excel","required":false}]'::jsonb,
    1),
(2, 1, '验证交付物', '试制验证阶段标准交付物清单',
    '[{"name":"测试报告","format":"PDF","required":true},{"name":"测试数据","format":"Excel","required":true},{"name":"样品照片","format":"JPG","required":true},{"name":"问题清单","format":"Excel","required":false}]'::jsonb,
    1),
(3, 1, '量产交付物', '量产准备阶段标准交付物清单',
    '[{"name":"SOP文件","format":"PDF","required":true},{"name":"检验标准","format":"PDF","required":true},{"name":"PPAP资料","format":"PDF/Excel","required":true},{"name":"控制计划","format":"Excel","required":true}]'::jsonb,
    1);

-- ============================================================================
-- SECTION 14: WORKFLOW TEMPLATES (工作流模板 - & 快捷键)
-- ============================================================================
INSERT INTO wf_workflow_template (id, tenant_id, name, description, bpmn_process_key, default_assignee_rule, config_json, is_active) VALUES
(1, 1, '标准审批流程', '适用于一般性任务审批',       'standardApproval', 'PROJECT_MANAGER',
    '{"nodes":["发起","部门审核","技术审核","项目经理批准"],"timeoutDays":[1,3,3,2]}'::jsonb, true),
(2, 1, '设计评审流程', '适用于设计方案评审',         'designReview',     'TECH_LEADER',
    '{"nodes":["发起","设计自评","同行评审","主管审核","批准"],"timeoutDays":[1,2,3,2,1]}'::jsonb, true),
(3, 1, '变更审批流程', '适用于工程变更请求',         'changeApproval',   'PROJECT_MANAGER',
    '{"nodes":["发起","影响评估","技术审核","PM批准","实施确认"],"timeoutDays":[1,3,3,2,5]}'::jsonb, true),
(4, 1, '快速审批流程', '适用于低风险事项的快速审批', 'quickApproval',    'PROJECT_MANAGER',
    '{"nodes":["发起","主管审批"],"timeoutDays":[1,1]}'::jsonb, true),
(5, 1, 'BOM审批流程', '适用于BOM清单审批发布',      'bomApproval',      'TECH_LEADER',
    '{"nodes":["发起","技术审核","工艺审核","质量审核","PM批准"],"timeoutDays":[1,3,3,2,2]}'::jsonb, true);

-- ============================================================================
-- SECTION 15: BOM DATA (BOM管理)
-- ============================================================================
INSERT INTO bom_bom (id, bom_no, name, version, project_id, product_code, product_name, status, is_latest, total_items, total_weight, tenant_id, created_by) VALUES
(1, 'BOM-2026-001', '电池Pack总成BOM', '1.0', 10, 'BP-001', '电池Pack', 2, true, 12, 45.500, 1, 3),
(2, 'BOM-2026-002', '电驱总成BOM',     '1.0', 12, 'ED-001', '电驱总成', 1, true, 8,  32.200, 1, 4);

SELECT setval('bom_bom_id_seq', 100);

INSERT INTO bom_item (id, bom_id, parent_id, level, seq_no, level_no, name, specification, material, unit, quantity, source_type, weight) VALUES
(1,  1, NULL, 1, 1, '1',     '电池Pack总成',     '高能量密度Pack',     NULL,       '套', 1,    'MAKE',   45.500),
(2,  1, 1,    2, 1, '1.1',   '电池包外壳',       '6061-T6铝合金',     '6061-T6',  '件', 1,    'MAKE',   8.200),
(3,  1, 1,    2, 2, '1.2',   '电池模组',         '方形铝壳电芯12串',   '铝合金',   '组', 4,    'BUY',    6.800),
(4,  1, 1,    2, 3, '1.3',   'BMS主控板',        'BMU-V2.0',          'FR4',      '件', 1,    'BUY',    0.350),
(5,  1, 1,    2, 4, '1.4',   '高压线束',         '25mm²橙色',         '铜/PVC',   '套', 1,    'BUY',    1.200),
(6,  1, 1,    2, 5, '1.5',   '液冷板',           '铝合金钎焊液冷板',   '6063',     '件', 1,    'BUY',    2.500),
(7,  1, 3,    3, 1, '1.2.1', '方形铝壳电芯',     '3.7V 150Ah',        '铝壳',     '只', 48,   'BUY',    0.580),
(8,  1, 3,    3, 2, '1.2.2', '电芯连接片',       '镍片0.3mm',         '镍',       '片', 48,   'BUY',    0.002),
(9,  1, 3,    3, 3, '1.2.3', '模组固定支架',     '钣金件',            'SPCC',     '件', 8,    'MAKE',   0.150),
(10, 1, 1,    2, 6, '1.6',   '密封胶条',         'EPDM发泡',          'EPDM',     '米', 3.5,  'BUY',    0.100),
(11, 1, 1,    2, 7, '1.7',   '冷却液',           '乙二醇基冷却液',    '乙二醇',   '升', 5,    'BUY',    5.500),
(12, 1, 1,    2, 8, '1.8',   'Pack上盖',         'SMC复合材料',       'SMC',      '件', 1,    'MAKE',   3.200);

-- ============================================================================
-- SECTION 16: PROCESS ROUTES (工艺路线)
-- ============================================================================
INSERT INTO prc_process_route (id, route_no, name, version, bom_id, project_id, product_code, product_name, status, is_latest, total_operations, total_man_hours, tenant_id, created_by) VALUES
(1, 'PRC-2026-001', '电池Pack装配工艺路线', '1.0', 1, 10, 'BP-001', '电池Pack', 2, true, 6, 12.50, 1, 4);

SELECT setval('prc_process_route_id_seq', 100);

INSERT INTO prc_operation (id, route_id, seq_no, operation_no, name, description, status) VALUES
(1, 1, 1, 'OP-010', '电芯分选',     '按电压内阻分选电芯',    1),
(2, 1, 2, 'OP-020', '模组装配',     '电芯堆叠、焊接连接片',  1),
(3, 1, 3, 'OP-030', 'BMS安装',      '安装BMS主控板和从板',   1),
(4, 1, 4, 'OP-040', '线束连接',     '连接高压线束和低压线束', 1),
(5, 1, 5, 'OP-050', 'Pack密封',     '安装密封胶条、灌胶',     1),
(6, 1, 6, 'OP-060', 'EOL测试',      '下线功能测试和气密测试', 1);

SELECT setval('prc_operation_id_seq', 100);

INSERT INTO prc_man_hour (operation_id, work_type, hours, worker_count, is_critical) VALUES
(1, '装配', 0.50, 1, false),
(2, '焊接', 3.00, 2, true),
(3, '装配', 1.50, 1, false),
(4, '装配', 2.00, 1, false),
(5, '密封', 1.50, 1, false),
(6, '测试', 2.00, 2, true);

INSERT INTO prc_operation_material (operation_id, material_code, material_name, specification, quantity, unit) VALUES
(2, 'MAT-001', '锡焊丝', 'Sn96.5Ag3Cu0.5 Φ0.8', 0.05, 'kg'),
(2, 'MAT-002', '助焊剂', '免清洗型',              0.02, 'L'),
(5, 'MAT-003', '密封胶', '单组分硅胶',            0.30, 'L'),
(5, 'MAT-004', '结构胶', '双组分环氧胶',          0.15, 'L'),
(6, 'MAT-005', '冷却液', '乙二醇基',              5.00, 'L');

-- ============================================================================
-- SECTION 17: CONFIGURATION DATA (配置管理)
-- ============================================================================
-- Module categories
INSERT INTO cfg_module_category (id, name, code, level, sort_order) VALUES
(1, '结构件',   'STRUCTURE', 1, 1),
(2, '电气件',   'ELECTRICAL', 1, 2),
(3, '密封件',   'SEALING',    1, 3),
(4, '紧固件',   'FASTENER',   1, 4);

SELECT setval('cfg_module_category_id_seq', 100);

INSERT INTO cfg_module (id, category_id, code, name, description, status, sort_order) VALUES
(1, 1, 'MOD-001', '电池包外壳', '电池包铝合金外壳组件', 1, 1),
(2, 1, 'MOD-002', '模组支架',   '电芯模组固定支架',    1, 2),
(3, 2, 'MOD-003', 'BMS控制器',  '电池管理控制器',      1, 1),
(4, 2, 'MOD-004', '高压连接器', '高压插接件',          1, 2);

SELECT setval('cfg_module_id_seq', 100);

INSERT INTO cfg_module_spec (id, module_id, spec_name, cross_section, material, wall_thickness, spec_code, status) VALUES
(1, 1, '标准外壳-100Ah', '矩形', '6061-T6', 3.00, 'SPEC-001', 1),
(2, 1, '标准外壳-150Ah', '矩形', '6061-T6', 3.50, 'SPEC-002', 1),
(3, 3, 'BMU-V2.0规格',   NULL,   NULL,      NULL, 'SPEC-003', 1);

SELECT setval('cfg_module_spec_id_seq', 100);

INSERT INTO cfg_spec_param (spec_id, param_name, param_type, control_type, default_value, unit, sort_order, is_required) VALUES
(1, '长度', 'DECIMAL', 'NUMBER', '600', 'mm', 1, true),
(1, '宽度', 'DECIMAL', 'NUMBER', '400', 'mm', 2, true),
(1, '高度', 'DECIMAL', 'NUMBER', '120', 'mm', 3, true),
(1, '重量', 'DECIMAL', 'NUMBER', '8.2', 'kg', 4, true),
(2, '长度', 'DECIMAL', 'NUMBER', '800', 'mm', 1, true),
(2, '宽度', 'DECIMAL', 'NUMBER', '500', 'mm', 2, true),
(2, '高度', 'DECIMAL', 'NUMBER', '150', 'mm', 3, true),
(3, '通信协议', 'STRING', 'SELECT', 'CAN', NULL, 1, true),
(3, '通道数',   'INT',    'NUMBER', '16',  NULL, 2, true);

-- Order categories & products
INSERT INTO cfg_order_category (id, name, code, level, sort_order) VALUES
(1, '新能源汽车', 'NEV', 1, 1),
(2, '乘用车',     'PV',  2, 2);

SELECT setval('cfg_order_category_id_seq', 100);

INSERT INTO cfg_order_product (id, category_id, code, name, description, status) VALUES
(1, 2, 'CAR-001', 'A级纯电动轿车', '紧凑型纯电动轿车平台', 1),
(2, 2, 'CAR-002', 'B级纯电动SUV',  '中型纯电动SUV平台',   1);

SELECT setval('cfg_order_product_id_seq', 100);

-- ============================================================================
-- SECTION 18: NOTIFICATIONS (系统通知)
-- ============================================================================
INSERT INTO notification (user_id, type, title, content, related_type, related_id, is_read, created_at) VALUES
(2, 'TASK_ASSIGNED',    '新任务分配',     '您被分配为"完成DFMEA分析报告"的负责人',   'TASK', 50, false, '2026-05-09 09:00:00'),
(2, 'TASK_OVERDUE',     '任务超期提醒',   '"电芯供应商交期风险"已超期',             'TASK', 40, false, '2026-03-16 09:00:00'),
(2, 'TASK_WARNING',     '任务预警',       '"液冷散热设计风险"即将到期，请关注',     'TASK', 42, false, '2026-04-25 09:00:00'),
(3, 'COMMENT_MENTION',  '评论提醒',       '张三在"Pack结构设计"中提到了您',        'TASK', 7,  true,  '2026-03-02 11:00:00'),
(3, 'APPROVAL_REQUEST', '审批请求',       '电芯规格变更申请等待您审批',             'TASK', 45, false, '2026-03-25 14:30:00'),
(5, 'TASK_ASSIGNED',    '新任务分配',     '您被分配为"性能测试"的负责人',           'TASK', 15, false, '2026-04-20 09:00:00'),
(6, 'TASK_WARNING',     '任务预警',       '"设备维护申请"已超期',                   'TASK', 61, false, '2026-05-09 09:00:00'),
(8, 'MILESTONE_UPCOMING','里程碑提醒',    '"设计冻结"里程碑将于2026-04-30到期',    'MILESTONE', 2, false, '2026-04-25 09:00:00'),
(4, 'TASK_ASSIGNED',    '新任务分配',     '您被分配为"样品试制"的负责人',           'TASK', 14, false, '2026-04-20 09:00:00'),
(2, 'PROJECT_PROGRESS', '项目进度更新',   '电池Pack开发项目进度已更新至35%',        'PROJECT', 10, true,  '2026-05-08 17:00:00');

-- ============================================================================
-- SECTION 19: STATISTICS DATA (统计数据 - for 中控看板)
-- ============================================================================
INSERT INTO sta_dashboard_data (project_id, data_type, "value", dimension, dimension_value, calculated_at) VALUES
(10, 'TOTAL_TASKS',     24, 'STATUS', 'ALL',         '2026-05-10 00:00:00'),
(10, 'COMPLETED_TASKS', 6,  'STATUS', 'COMPLETED',   '2026-05-10 00:00:00'),
(10, 'IN_PROGRESS',     8,  'STATUS', 'IN_PROGRESS', '2026-05-10 00:00:00'),
(10, 'OVERDUE_TASKS',   1,  'STATUS', 'OVERDUE',     '2026-05-10 00:00:00'),
(10, 'WARNING_TASKS',   3,  'STATUS', 'WARNING',     '2026-05-10 00:00:00'),
(12, 'TOTAL_TASKS',     5,  'STATUS', 'ALL',         '2026-05-10 00:00:00'),
(12, 'COMPLETED_TASKS', 1,  'STATUS', 'COMPLETED',   '2026-05-10 00:00:00'),
(12, 'IN_PROGRESS',     2,  'STATUS', 'IN_PROGRESS', '2026-05-10 00:00:00');

INSERT INTO sta_task_statistics (project_id, user_id, stat_date, total_tasks, completed_tasks, overdue_tasks, warning_tasks, total_hours, completed_hours) VALUES
(10, 2, '2026-05-10', 8,  2, 0, 1, 80,  20),
(10, 3, '2026-05-10', 6,  3, 0, 0, 120, 70),
(10, 4, '2026-05-10', 5,  0, 0, 1, 100, 0),
(10, 5, '2026-05-10', 3,  0, 0, 0, 148, 0),
(10, 6, '2026-05-10', 4,  1, 1, 1, 40,  8),
(10, 7, '2026-05-10', 4,  2, 0, 0, 80,  40),
(10, 8, '2026-05-10', 4,  0, 0, 1, 88,  0),
(10, 9, '2026-05-10', 3,  0, 0, 1, 96,  0);

INSERT INTO sta_man_hour_ranking (user_id, user_name, project_id, hours, ranking_date, ranking) VALUES
(3, '李四',   10, 120, '2026-05-10', 1),
(8, '吴九',   10, 88,  '2026-05-10', 2),
(7, '周八',   10, 80,  '2026-05-10', 3),
(9, '郑十',   10, 96,  '2026-05-10', 4),
(5, '赵六',   10, 148, '2026-05-10', 5),
(4, '王五',   10, 100, '2026-05-10', 6),
(2, '张三',   10, 80,  '2026-05-10', 7),
(6, '孙七',   10, 40,  '2026-05-10', 8);

-- ============================================================================
-- SECTION 20: STAGE GATES (阶段关口)
-- ============================================================================
INSERT INTO prj_stage_gate (phase_id, name, gate_type, status, comments) VALUES
(1, '需求分析关口', 'PHASE_GATE', 4, '需求评审通过，客户需求明确'),
(2, '方案设计关口', 'PHASE_GATE', 1, NULL),
(3, '试制验证关口', 'PHASE_GATE', 1, NULL),
(4, '量产准备关口', 'PHASE_GATE', 1, NULL);

-- ============================================================================
-- SUMMARY: Verify data counts
-- ============================================================================
-- SELECT 'sys_user' as tbl, COUNT(*) as cnt FROM sys_user
-- UNION ALL SELECT 'sys_department', COUNT(*) FROM sys_department
-- UNION ALL SELECT 'sys_role', COUNT(*) FROM sys_role
-- UNION ALL SELECT 'prj_project', COUNT(*) FROM prj_project
-- UNION ALL SELECT 'prj_phase', COUNT(*) FROM prj_phase
-- UNION ALL SELECT 'prj_milestone', COUNT(*) FROM prj_milestone
-- UNION ALL SELECT 'prj_project_member', COUNT(*) FROM prj_project_member
-- UNION ALL SELECT 'tsk_task', COUNT(*) FROM tsk_task
-- UNION ALL SELECT 'tsk_task_dependency', COUNT(*) FROM tsk_task_dependency
-- UNION ALL SELECT 'tsk_task_participant', COUNT(*) FROM tsk_task_participant
-- UNION ALL SELECT 'tsk_task_watcher', COUNT(*) FROM tsk_task_watcher
-- UNION ALL SELECT 'tsk_task_comment', COUNT(*) FROM tsk_task_comment
-- UNION ALL SELECT 'tsk_task_activity', COUNT(*) FROM tsk_task_activity
-- UNION ALL SELECT 'tsk_task_template', COUNT(*) FROM tsk_task_template
-- UNION ALL SELECT 'cfg_deliverable_template', COUNT(*) FROM cfg_deliverable_template
-- UNION ALL SELECT 'wf_workflow_template', COUNT(*) FROM wf_workflow_template
-- UNION ALL SELECT 'bom_bom', COUNT(*) FROM bom_bom
-- UNION ALL SELECT 'bom_item', COUNT(*) FROM bom_item
-- UNION ALL SELECT 'prc_process_route', COUNT(*) FROM prc_process_route
-- UNION ALL SELECT 'prc_operation', COUNT(*) FROM prc_operation
-- UNION ALL SELECT 'notification', COUNT(*) FROM notification
-- UNION ALL SELECT 'sta_dashboard_data', COUNT(*) FROM sta_dashboard_data
-- ORDER BY tbl;

-- ============================================================================
-- SUPPLEMENT: 补充测试数据（2026-05-10 添加）
-- 覆盖：BMS项目完整结构、工作空间分类、今日/本周/本月/超期/预警任务
-- ============================================================================

-- BMS项目阶段
INSERT INTO prj_phase (id, project_id, name, code, seq_no, status, progress, planned_start, planned_end) VALUES
(11, 11, '需求分析', 'BMS-P1', 1, 4, 100, '2026-01-10', '2026-02-28'),
(12, 11, '软件设计', 'BMS-P2', 2, 2, 60,  '2026-03-01', '2026-05-31'),
(13, 11, '集成测试', 'BMS-P3', 3, 1, 0,   '2026-06-01', '2026-08-31')
ON CONFLICT DO NOTHING;

-- BMS项目任务（11条）
INSERT INTO tsk_task (id, task_no, title, description, type, project_id, phase_id, status, progress,
  assignee_id, reporter_id, planned_start, planned_end, planned_hours, planned_days,
  actual_start, is_overdue, is_warning, tenant_id) VALUES
(70,'TSK-BMS-001','BMS需求分析阶段','BMS软件需求分析','STAGE',11,11,4,100,4,2,'2026-01-10','2026-02-28',80,35,'2026-01-10',false,false,1),
(71,'TSK-BMS-002','BMS功能需求调研','调研整车厂BMS功能需求','TASK',11,11,4,100,4,2,'2026-01-10','2026-01-31',40,15,'2026-01-10',false,false,1),
(72,'TSK-BMS-003','BMS通信协议分析','分析CAN/LIN通信协议需求','TASK',11,11,4,100,8,2,'2026-02-01','2026-02-15',24,10,'2026-02-01',false,false,1),
(73,'TSK-BMS-004','BMS需求规格书编写','编写BMS软件需求规格书','TASK',11,11,4,100,4,2,'2026-02-16','2026-02-28',16,8,'2026-02-16',false,false,1),
(74,'TSK-BMS-005','BMS软件设计阶段','BMS软件架构和详细设计','STAGE',11,12,2,60,4,2,'2026-03-01','2026-05-31',160,65,'2026-03-01',false,false,1),
(75,'TSK-BMS-006','BMS软件架构设计','设计BMS软件整体架构','TASK',11,12,4,100,8,4,'2026-03-01','2026-03-20',40,14,'2026-03-01',false,false,1),
(76,'TSK-BMS-007','SOC估算算法设计','设计电池SOC估算算法','TASK',11,12,2,70,8,4,'2026-03-21','2026-04-20',48,22,'2026-03-21',false,false,1),
(77,'TSK-BMS-008','均衡控制策略设计','设计电池均衡控制策略','TASK',11,12,2,50,9,4,'2026-04-01','2026-05-15',40,30,'2026-04-01',false,true,1),
(78,'TSK-BMS-009','热管理控制逻辑','设计热管理控制逻辑','TASK',11,12,1,0,9,4,'2026-05-16','2026-05-31',32,12,NULL,false,false,1),
(79,'TSK-BMS-010','BMS软件设计评审','组织BMS软件设计评审会','TASK',11,12,1,0,2,2,'2026-05-28','2026-05-31',8,2,NULL,false,false,1),
(80,'TSK-BMS-011','BMS集成测试阶段','BMS软硬件集成测试','STAGE',11,13,1,0,5,2,'2026-06-01','2026-08-31',120,65,NULL,false,false,1)
ON CONFLICT DO NOTHING;

-- BMS里程碑
INSERT INTO prj_milestone (id, project_id, phase_id, name, type, status, progress, planned_date, assignee_id, deliverable) VALUES
(8,11,11,'BMS需求冻结','MILESTONE',4,100,'2026-02-28',2,'BMS软件需求规格书'),
(9,11,12,'BMS软件设计冻结','MILESTONE',1,0,'2026-05-31',4,'BMS软件设计文档'),
(10,11,13,'BMS集成测试通过','MILESTONE',1,0,'2026-08-31',5,'BMS集成测试报告')
ON CONFLICT DO NOTHING;

-- BMS任务依赖 + SF类型补充
INSERT INTO tsk_task_dependency (tenant_id, task_id, depends_on_task_id, dependency_type, created_by) VALUES
(1,72,71,'FS',2),(1,73,72,'FS',2),(1,75,73,'FS',2),(1,76,75,'FS',2),
(1,77,76,'SS',2),(1,78,77,'FS',2),(1,79,78,'FS',2),(1,79,77,'FF',2),
(1,80,79,'SF',2)
ON CONFLICT DO NOTHING;

-- 今日/本周/本月/超期/预警任务
INSERT INTO tsk_task (id,task_no,title,type,status,progress,assignee_id,reporter_id,planned_start,planned_end,due_date,planned_hours,planned_days,is_overdue,is_warning,tenant_id) VALUES
(85,'TSK-TODAY-001','提交本周工作周报','TASK',2,80,2,2,'2026-05-10','2026-05-10','2026-05-10',2,1,false,false,1),
(86,'TSK-TODAY-002','确认供应商报价单','TASK',2,50,3,2,'2026-05-09','2026-05-10','2026-05-10',4,2,false,true,1),
(87,'TSK-TODAY-003','完成热仿真模型验证','TASK',1,0,9,3,'2026-05-10','2026-05-10','2026-05-10',8,1,false,false,1),
(88,'TSK-WEEK-001','更新项目进度报告','TASK',2,60,2,2,'2026-05-06','2026-05-09','2026-05-09',4,2,false,false,1),
(89,'TSK-WEEK-002','完成Pack结构CAD图纸','TASK',2,90,7,3,'2026-05-05','2026-05-09','2026-05-09',16,3,false,false,1),
(90,'TSK-WEEK-003','电气原理图审核','TASK',4,100,3,2,'2026-05-04','2026-05-07','2026-05-07',8,2,false,false,1),
(91,'TSK-MONTH-001','完成FMEA分析报告','TASK',2,40,6,3,'2026-05-12','2026-05-20','2026-05-20',24,7,false,false,1),
(92,'TSK-MONTH-002','供应商现场审核','ACTIVITY',1,0,2,2,'2026-05-15','2026-05-16','2026-05-16',16,2,false,false,1),
(93,'TSK-MONTH-003','月度技术评审会','ACTIVITY',1,0,2,2,'2026-05-22','2026-05-22','2026-05-22',4,1,false,false,1),
(94,'TSK-MONTH-004','电芯性能测试报告','TASK',2,30,5,3,'2026-05-08','2026-05-25','2026-05-25',32,12,false,false,1),
(95,'TSK-MONTH-005','工艺路线优化建议','SUGGESTION',1,0,6,4,'2026-05-18','2026-05-28','2026-05-28',8,8,false,false,1),
(96,'TSK-OVD-001','完成电池包密封测试','TASK',2,60,5,3,'2026-04-20','2026-04-30','2026-04-30',24,8,true,true,1),
(97,'TSK-OVD-002','提交PPAP文件','TASK',2,30,6,2,'2026-04-15','2026-04-25','2026-04-25',16,8,true,true,1),
(98,'TSK-OVD-003','完成供应商质量审核','TASK',2,70,4,2,'2026-04-01','2026-04-20','2026-04-20',40,14,true,true,1),
(99,'TSK-WARN-001','完成BMS通信测试','TASK',2,50,8,4,'2026-05-05','2026-05-12','2026-05-12',16,6,false,true,1),
(100,'TSK-WARN-002','提交设计变更申请','CHANGE',2,40,3,2,'2026-05-08','2026-05-13','2026-05-13',8,4,false,true,1),
(101,'TSK-RISK-001','电芯一致性风险','RISK',2,0,9,3,'2026-05-10','2026-05-20','2026-05-20',8,8,false,false,1),
(102,'TSK-ISS-001','充电接口兼容性问题','ISSUE',2,0,8,3,'2026-05-10','2026-05-18','2026-05-18',12,6,false,false,1),
(103,'TSK-SUG-001','建议引入自动化测试','SUGGESTION',1,0,5,3,'2026-05-15','2026-05-30','2026-05-30',4,12,false,false,1),
(104,'TSK-ACT-001','团队技术分享会','ACTIVITY',1,0,2,2,'2026-05-20','2026-05-20','2026-05-20',2,1,false,false,1),
(105,'TSK-CHG-001','电池包外形尺寸变更','CHANGE',3,0,3,2,'2026-05-12','2026-05-19','2026-05-19',16,6,false,false,1)
ON CONFLICT DO NOTHING;

-- 关注、参与人、评论、统计数据（略，已在数据库中）
