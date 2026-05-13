-- ============================================================
-- SyncFlow 业务测试数据（基于实际表结构）
-- ============================================================

-- 1. 部门
INSERT INTO sys_department (id, name, code, parent_id, sort_order) VALUES
(1, '总经办',     'GM',    NULL, 1),
(2, '项目管理部', 'PM',    NULL, 2),
(3, '设计部',     'DESIGN',NULL, 3),
(4, '研发部',     'DEV',   NULL, 4),
(5, '测试部',     'QA',    NULL, 5),
(6, '工艺部',     'PE',    NULL, 6),
(7, '品质部',     'QC',    NULL, 7)
ON CONFLICT DO NOTHING;

-- 2. 用户（密码: admin123）
INSERT INTO sys_user (id, username, password, real_name, email, dept_id, status, tenant_id) VALUES
(1,  'admin',   '$2a$10$wdklgattXcUb0xKtAR4XLOCFkJUJj.GFnoY78wXebKKY34rGNWv/.', '系统管理员', 'admin@syncflow.com',   1, 1, 1),
(2,  'zhangsan','$2a$10$wdklgattXcUb0xKtAR4XLOCFkJUJj.GFnoY78wXebKKY34rGNWv/.', '张三',       'zhangsan@syncflow.com', 2, 1, 1),
(3,  'lisi',    '$2a$10$wdklgattXcUb0xKtAR4XLOCFkJUJj.GFnoY78wXebKKY34rGNWv/.', '李四',       'lisi@syncflow.com',     3, 1, 1),
(4,  'wangwu',  '$2a$10$wdklgattXcUb0xKtAR4XLOCFkJUJj.GFnoY78wXebKKY34rGNWv/.', '王五',       'wangwu@syncflow.com',   4, 1, 1),
(5,  'zhaoliu', '$2a$10$wdklgattXcUb0xKtAR4XLOCFkJUJj.GFnoY78wXebKKY34rGNWv/.', '赵六',       'zhaoliu@syncflow.com',  5, 1, 1),
(6,  'sunqi',   '$2a$10$wdklgattXcUb0xKtAR4XLOCFkJUJj.GFnoY78wXebKKY34rGNWv/.', '孙七',       'sunqi@syncflow.com',    6, 1, 1),
(7,  'zhouba',  '$2a$10$wdklgattXcUb0xKtAR4XLOCFkJUJj.GFnoY78wXebKKY34rGNWv/.', '周八',       'zhouba@syncflow.com',   3, 1, 1),
(8,  'wujiu',   '$2a$10$wdklgattXcUb0xKtAR4XLOCFkJUJj.GFnoY78wXebKKY34rGNWv/.', '吴九',       'wujiu@syncflow.com',    4, 1, 1),
(9,  'zhengshi','$2a$10$wdklgattXcUb0xKtAR4XLOCFkJUJj.GFnoY78wXebKKY34rGNWv/.', '郑十',       'zhengshi@syncflow.com', 4, 1, 1),
(10, 'testuser','$2a$10$wdklgattXcUb0xKtAR4XLOCFkJUJj.GFnoY78wXebKKY34rGNWv/.', '测试用户',   'test@syncflow.com',     5, 1, 1)
ON CONFLICT DO NOTHING;

-- 3. 角色
INSERT INTO sys_role (id, code, name, description, tenant_id) VALUES
(1, 'ADMIN',      '系统管理员', '系统管理员角色', 1),
(2, 'PM',         '项目经理',   '项目经理角色',   1),
(3, 'DESIGNER',   '设计工程师', '设计工程师角色', 1),
(4, 'DEVELOPER',  '研发工程师', '研发工程师角色', 1),
(5, 'TESTER',     '测试工程师', '测试工程师角色', 1)
ON CONFLICT DO NOTHING;

INSERT INTO sys_user_role (user_id, role_id) VALUES
(1,1),(2,2),(3,3),(4,4),(5,5),(6,4),(7,3),(8,3),(9,4),(10,5)
ON CONFLICT DO NOTHING;

-- 4. 项目结构（priority: 1=LOW, 2=MEDIUM, 3=HIGH）
-- 文件夹
INSERT INTO prj_project (id, name, code, description, owner_id, project_type, status, priority, parent_id, parent_path, dept_id, tenant_id) VALUES
(1, '新能源汽车', 'NEV',     '新能源汽车项目分类', 2, 'FOLDER',  1, 3, NULL, '/',   2, 1),
(2, '电池系统',   'BATTERY', '电池系统项目分类',   2, 'FOLDER',  1, 3, 1,    '/1/', 2, 1),
(3, '电驱系统',   'EDRIVE',  '电驱系统项目分类',   2, 'FOLDER',  1, 2, 1,    '/1/', 2, 1)
ON CONFLICT DO NOTHING;

-- 具体项目
INSERT INTO prj_project (id, name, code, description, owner_id, project_type, status, priority, parent_id, parent_path, planned_start, planned_end, dept_id, tenant_id) VALUES
(10, '电池Pack开发', 'BP-001', '2026年度电池Pack开发',     2, 'PROJECT', 2, 3, 2, '/1/2/', '2026-03-01','2026-12-31', 2, 1),
(11, '电池BMS开发',  'BB-001', '电池管理系统开发',         2, 'PROJECT', 2, 3, 2, '/1/2/', '2026-04-01','2026-11-30', 2, 1),
(12, '电机控制器',    'MC-001', '永磁同步电机控制器',       2, 'PROJECT', 1, 2, 3, '/1/3/', '2026-06-01','2027-03-31', 2, 1)
ON CONFLICT DO NOTHING;

-- 5. 项目阶段
INSERT INTO prj_phase (id, project_id, name, code, seq_no, status, progress, planned_start, planned_end, actual_start, actual_end) VALUES
(100, 10, '调查', 'INVESTIGATION',   1, 3, 100, '2026-03-01','2026-03-31','2026-03-01','2026-03-28'),
(101, 10, '概念', 'CONCEPT',         2, 3, 100, '2026-04-01','2026-04-30','2026-04-01','2026-04-25'),
(102, 10, '计划', 'PLANNING',        3, 2, 60,  '2026-05-01','2026-05-31','2026-05-01', NULL),
(103, 10, '开发', 'DEVELOPMENT',     4, 1, 0,   '2026-06-01','2026-08-31', NULL,        NULL),
(104, 10, '测试', 'TESTING',         5, 1, 0,   '2026-09-01','2026-10-31', NULL,        NULL),
(105, 10, '量产', 'MASS_PRODUCTION', 6, 1, 0,   '2026-11-01','2026-12-31', NULL,        NULL),
(200, 11, '调查', 'INVESTIGATION',   1, 3, 100, '2026-04-01','2026-04-30', NULL,        NULL),
(201, 11, '概念', 'CONCEPT',         2, 2, 80,  '2026-05-01','2026-05-31', NULL,        NULL),
(202, 11, '计划', 'PLANNING',        3, 1, 0,   '2026-06-01','2026-06-30', NULL,        NULL)
ON CONFLICT DO NOTHING;

-- 6. 阶段门审批
INSERT INTO prj_stage_gate (id, phase_id, name, gate_type, status) VALUES
(1, 100, '调查评审门', 'DQR', 2),
(2, 101, '概念评审门', 'TR',  2),
(3, 102, '计划评审门', 'QG',  1)
ON CONFLICT DO NOTHING;

-- 7. 里程碑
INSERT INTO prj_milestone (id, project_id, phase_id, name, type, status, progress, planned_date, actual_date, assignee_id, deliverable) VALUES
(1,  10, 100, '需求调研完成',    'MILESTONE',   3, 100, '2026-03-15','2026-03-14', 2, '需求调研报告'),
(2,  10, 100, '可行性分析报告',  'DELIVERABLE', 3, 100, '2026-03-25','2026-03-24', 3, '可行性分析报告.pdf'),
(3,  10, 101, '概念设计评审',    'REVIEW',      3, 100, '2026-04-20','2026-04-20', 2, '概念设计评审报告'),
(4,  10, 102, '详细计划确认',    'MILESTONE',   2, 50,  '2026-05-20', NULL,        2, NULL),
(5,  10, 102, '资源分配方案',    'DELIVERABLE', 1, 0,   '2026-05-25', NULL,        2, NULL),
(6,  10, 103, '原型机完成',      'MILESTONE',   1, 0,   '2026-07-31', NULL,        4, NULL),
(7,  10, 104, '测试报告提交',    'DELIVERABLE', 1, 0,   '2026-10-15', NULL,        5, NULL),
(8,  10, 105, '量产批准',        'REVIEW',      1, 0,   '2026-11-15', NULL,        2, NULL),
(9,  11, 200, 'BMS需求确认',     'MILESTONE',   3, 100, '2026-04-15','2026-04-14', 2, 'BMS需求文档'),
(10, 11, 201, 'BMS架构设计评审', 'REVIEW',      2, 80,  '2026-05-20', NULL,        4, NULL)
ON CONFLICT DO NOTHING;

-- 8. 项目成员
INSERT INTO prj_project_member (id, project_id, user_id, project_role, dept_id) VALUES
(1,  10, 2, '项目经理',   2),
(2,  10, 3, '设计负责人', 3),
(3,  10, 4, '研发负责人', 4),
(4,  10, 5, '测试负责人', 5),
(5,  10, 6, '工艺负责人', 6),
(6,  10, 7, '设计工程师', 3),
(7,  10, 8, '设计工程师', 3),
(8,  10, 9, '研发工程师', 4),
(9,  11, 2, '项目经理',   2),
(10, 11, 4, '研发负责人', 4),
(11, 11, 9, '研发工程师', 4)
ON CONFLICT DO NOTHING;

-- 9. 任务（覆盖全部9种类型+多种状态）
INSERT INTO tsk_task (id, task_no, title, description, type, project_id, phase_id, milestone_id, parent_id, parent_path, status, progress, assignee_id, reporter_id, planned_start, planned_end, planned_hours, planned_days, actual_start, actual_hours, due_date, is_overdue, is_warning, tags, tenant_id) VALUES
(1,  'TSK-001', '制定详细开发计划',    '制定Pack详细开发计划含WBS',            'TASK',      10,102,4, NULL,'/',   2, 60, 2, 2, '2026-05-01','2026-05-15',40.0,10,'2026-05-01',24.0,'2026-05-15',false,false,'计划',1),
(2,  'TSK-002', '物料清单初稿',        '整理Pack所需物料清单',                  'TASK',      10,102,NULL,1,'/1/',2, 80, 3, 2, '2026-05-01','2026-05-10',24.0,6, '2026-05-01',20.0,'2026-05-10',false,true, 'BOM',1),
(3,  'TSK-003', '供应商初步筛选',      '筛选Pack关键物料供应商',                'TASK',      10,102,NULL,1,'/1/',2, 40, 6, 2, '2026-05-03','2026-05-12',16.0,4, '2026-05-03',6.0, '2026-05-12',false,false,'采购',1),
(4,  'TSK-004', '设计方案评审准备',    '准备概念阶段设计方案评审材料',          'TASK',      10,102,NULL,NULL,'/', 3,100, 3, 3, '2026-05-01','2026-05-08',16.0,4, '2026-05-01',14.0,'2026-05-08',false,false,'评审',1),
(5,  'TSK-005', 'Pack结构设计',        '电池Pack外壳结构3D建模',               'TASK',      10,103,NULL,NULL,'/', 1, 0,  3, 2, '2026-06-01','2026-06-30',80.0,20, NULL,    NULL,'2026-06-30',false,false,'设计',1),
(6,  'TSK-006', '热管理方案设计',      'Pack散热方案设计与仿真',               'TASK',      10,103,NULL,NULL,'/', 1, 0,  7, 2, '2026-06-01','2026-07-15',60.0,15, NULL,    NULL,'2026-07-15',false,false,'热管理',1),
(7,  'TSK-007', '电气原理图设计',      '高低压电气原理图绘制',                 'TASK',      10,103,NULL,NULL,'/', 1, 0,  8, 2, '2026-06-15','2026-07-15',48.0,12, NULL,    NULL,'2026-07-15',false,false,'电气',1),
(8,  'TSK-008', 'BMS接口定义',         '定义BMS与Pack通信接口协议',            'TASK',      10,103,NULL,NULL,'/', 1, 0,  4, 2, '2026-06-01','2026-06-20',24.0,6,  NULL,    NULL,'2026-06-20',false,false,'BMS',1),
(9,  'TSK-009', '供应商交期风险',      '电芯供应商交期可能延迟2周',            'RISK',      10,102,NULL,NULL,'/', 2, 30, 6, 2, '2026-05-05','2026-05-20',8.0,2,  '2026-05-05',2.0,'2026-05-20',false,true, '风险',1),
(10, 'TSK-010', '散热方案争议',        '液冷vs风冷方案存在分歧',               'ISSUE',     10,102,NULL,NULL,'/', 2, 50, 7, 3, '2026-05-03','2026-05-10',4.0,1,  '2026-05-03',2.0,'2026-05-10',false,true, '散热',1),
(11, 'TSK-011', '引入DFMEA分析工具',   '建议在设计阶段引入DFMEA',              'SUGGESTION',10,102,NULL,NULL,'/', 1, 0,  NULL,7,NULL,NULL,    NULL, NULL, NULL,    NULL,NULL,         false,false,'质量',1),
(12, 'TSK-012', 'Pack方案技术评审会',  '电池Pack整体方案技术评审',             'ACTIVITY',  10,102,3,  NULL,'/', 3,100, 2, 2, '2026-05-08','2026-05-08',4.0,1,  '2026-05-08',3.5,'2026-05-08',false,false,'评审',1),
(13, 'TSK-013', '电芯规格变更申请',    '申请将电芯容量从60Ah提升至75Ah',      'CHANGE',    10,102,NULL,NULL,'/', 2, 0,  4, 4, '2026-05-06','2026-05-20',8.0,2,  '2026-05-06',NULL,'2026-05-20',false,false,'变更',1),
(14, 'TSK-014', '计划阶段',            '电池Pack项目计划阶段',                 'STAGE',     10,102,NULL,NULL,'/', 2, 60, 2, 2, '2026-05-01','2026-05-31',NULL,NULL,'2026-05-01',NULL,'2026-05-31',false,false,NULL,1),
(15, 'TSK-015', '开发阶段',            '电池Pack项目开发阶段',                 'STAGE',     10,103,NULL,NULL,'/', 1, 0,  2, 2, '2026-06-01','2026-08-31',NULL,NULL, NULL,   NULL,'2026-08-31',false,false,NULL,1),
(16, 'TSK-016', '制定测试计划',        '制定Pack测试验证计划',                 'TASK',      10,104,NULL,NULL,'/', 1, 0,  5, 2, '2026-09-01','2026-09-15',24.0,6,  NULL,    NULL,'2026-09-15',false,false,'测试',1),
(17, 'TSK-017', '环境可靠性测试',      '高低温循环振动盐雾测试',               'TASK',      10,104,NULL,NULL,'/', 1, 0,  10,5, '2026-09-15','2026-10-15',80.0,20, NULL,    NULL,'2026-10-15',false,false,'测试',1),
(18, 'TSK-018', '安全性能测试',        '过充过放短路挤压安全测试',             'TASK',      10,104,NULL,NULL,'/', 1, 0,  10,5, '2026-09-15','2026-10-31',60.0,15, NULL,    NULL,'2026-10-31',false,false,'测试',1),
(19, 'TSK-019', '产线工艺验证',        'Pack产线工艺验证与优化',               'TASK',      10,105,NULL,NULL,'/', 1, 0,  6, 2, '2026-11-01','2026-11-30',40.0,10, NULL,    NULL,'2026-11-30',false,false,'工艺',1),
(20, 'TSK-020', '首批产品检验',        '首批量产Pack产品全检',                 'TASK',      10,105,7,  NULL,'/', 1, 0,  5, 2, '2026-12-01','2026-12-15',40.0,10, NULL,    NULL,'2026-12-15',false,false,'检验',1),
(30, 'TSK-030', 'BMS需求分析',         '分析BMS功能需求和性能指标',            'TASK',      11,200,NULL,NULL,'/', 3,100, 4, 2, '2026-04-01','2026-04-15',24.0,6,  '2026-04-01',22.0,'2026-04-15',false,false,NULL,1),
(31, 'TSK-031', 'BMS架构设计',         'BMS软硬件架构设计',                    'TASK',      11,201,NULL,NULL,'/', 2, 80, 4, 2, '2026-05-01','2026-05-20',40.0,10, '2026-05-01',32.0,'2026-05-20',false,false,NULL,1),
(32, 'TSK-032', 'SOC估算算法开发',     '开发电池SOC状态估算算法',              'TASK',      11,201,NULL,31,'/31/',2,60,9, 4, '2026-05-05','2026-05-25',32.0,8,  '2026-05-05',20.0,'2026-05-25',false,false,'算法',1),
(33, 'TSK-033', 'CAN通信协议设计',     'BMS与整车VCU的CAN通信协议',            'TASK',      11,201,NULL,31,'/31/',1,0, 9, 4, '2026-05-15','2026-05-31',24.0,6,  NULL,    NULL,'2026-05-31',false,false,'通信',1)
ON CONFLICT DO NOTHING;

-- 10. 任务依赖（SS/SF/FS/FF）
INSERT INTO tsk_task_dependency (id, tenant_id, task_id, depends_on_task_id, dependency_type, created_by) VALUES
(1,  1, 5,  1,  'FS', 2),
(2,  1, 6,  1,  'FS', 2),
(3,  1, 7,  5,  'SS', 2),
(4,  1, 8,  1,  'FS', 2),
(5,  1, 16, 14, 'FS', 2),
(6,  1, 17, 16, 'FS', 5),
(7,  1, 18, 16, 'SS', 5),
(8,  1, 19, 15, 'FS', 2),
(9,  1, 20, 17, 'FF', 2),
(10, 1, 20, 18, 'FF', 2),
(11, 1, 31, 30, 'FS', 2),
(12, 1, 32, 31, 'FS', 4),
(13, 1, 33, 31, 'SS', 4)
ON CONFLICT DO NOTHING;

-- 11. 任务模板
INSERT INTO tsk_task_template (id, tenant_id, name, description, scope, creator_id, is_default, sort_order) VALUES
(1, 1, '新项目启动模板', '新项目启动标准任务模板',     'GLOBAL',   1, true,  1),
(2, 1, '设计评审模板',   '设计评审标准流程',           'GLOBAL',   1, false, 2),
(3, 1, '问题处理模板',   '问题标准处理流程',           'GLOBAL',   1, false, 3),
(4, 1, '我的日常模板',   '张三的日常工作模板',         'PERSONAL', 2, false, 1),
(5, 1, '我的设计模板',   '李四的设计工作模板',         'PERSONAL', 3, true,  1)
ON CONFLICT DO NOTHING;

INSERT INTO tsk_task_template_item (id, template_id, title, type, sort_order, parent_item_id) VALUES
(1,  1, '项目立项审批',  'TASK',     1, NULL),
(2,  1, '组建项目团队',  'TASK',     2, NULL),
(3,  1, '制定项目章程',  'TASK',     3, NULL),
(4,  1, 'Kick-off会议', 'ACTIVITY', 4, NULL),
(5,  1, '需求调研',      'TASK',     5, NULL),
(6,  1, '可行性分析',    'TASK',     6, 5),
(7,  2, '准备评审材料',  'TASK',     1, NULL),
(8,  2, '发送评审通知',  'TASK',     2, NULL),
(9,  2, '召开评审会议',  'ACTIVITY', 3, NULL),
(10, 2, '整理评审意见',  'TASK',     4, NULL),
(11, 2, '跟踪整改闭环',  'TASK',     5, NULL),
(12, 3, '问题登记',      'ISSUE',    1, NULL),
(13, 3, '根因分析',      'TASK',     2, NULL),
(14, 3, '制定纠正措施',  'TASK',     3, NULL),
(15, 3, '措施验证',      'TASK',     4, NULL),
(16, 3, '问题关闭',      'TASK',     5, NULL),
(17, 4, '查看邮件消息',  'TASK',     1, NULL),
(18, 4, '更新任务进度',  'TASK',     2, NULL),
(19, 4, '参加站会',      'ACTIVITY', 3, NULL),
(20, 5, '需求分析',      'TASK',     1, NULL),
(21, 5, '概念方案设计',  'TASK',     2, NULL),
(22, 5, '详细设计',      'TASK',     3, 21),
(23, 5, '设计评审',      'REVIEW',   4, NULL),
(24, 5, '设计变更跟踪',  'CHANGE',   5, NULL)
ON CONFLICT DO NOTHING;

-- 12. 交付物模板
INSERT INTO cfg_deliverable_template (id, tenant_id, name, description, items_json, created_by) VALUES
(1, 1, '设计交付物模板', '设计阶段标准交付物',
 '[{"name":"设计图纸","required":true,"fileType":"DWG/PDF"},{"name":"BOM清单","required":true,"fileType":"XLSX"},{"name":"设计计算书","required":true,"fileType":"PDF"},{"name":"DFMEA报告","required":false,"fileType":"XLSX"},{"name":"3D模型","required":true,"fileType":"STEP"}]',
 1),
(2, 1, '测试交付物模板', '测试阶段标准交付物',
 '[{"name":"测试计划","required":true,"fileType":"PDF"},{"name":"测试报告","required":true,"fileType":"PDF"},{"name":"测试数据","required":true,"fileType":"XLSX"},{"name":"问题清单","required":true,"fileType":"XLSX"}]',
 1),
(3, 1, '评审交付物模板', '评审会议标准交付物',
 '[{"name":"评审材料","required":true,"fileType":"PPT/PDF"},{"name":"评审记录","required":true,"fileType":"DOCX"},{"name":"评审意见跟踪表","required":true,"fileType":"XLSX"}]',
 1)
ON CONFLICT DO NOTHING;

-- 13. 工作流模板
INSERT INTO wf_workflow_template (id, tenant_id, name, description, bpmn_process_key, default_assignee_rule, config_json, is_active) VALUES
(1, 1, 'BOM发布审批',     'BOM首次发布审批',     'BOM_APPROVAL',      'PROJECT_ROLE', '{"roles":["PM"]}', true),
(2, 1, '设计变更审批',     '设计变更请求审批',     'CHANGE_APPROVAL',   'PROJECT_ROLE', '{"roles":["PM"],"level":3}', true),
(3, 1, '里程碑完成审批',   '里程碑完成确认',       'STAGE_GATE_APPROVAL','PROJECT_ROLE','{"roles":["PM"]}', true),
(4, 1, '文件发布审批',     '文件版本发布审批',     'FILE_APPROVAL',     'DEPARTMENT',   '{"roles":["PM"]}', true),
(5, 1, '通用审批',         '单节点通用审批',       'GENERIC_APPROVAL',  'USER',         '{}', true)
ON CONFLICT DO NOTHING;

-- 14. 任务参与人
INSERT INTO tsk_task_participant (id, task_id, user_id, role) VALUES
(1,1,3,'参与人'),(2,1,6,'参与人'),(3,5,7,'参与人'),(4,5,8,'参与人'),
(5,6,9,'参与人'),(6,12,3,'参与人'),(7,12,4,'参与人'),(8,12,5,'参与人'),
(9,12,6,'参与人'),(10,12,7,'参与人'),(11,31,9,'参与人')
ON CONFLICT DO NOTHING;

-- 15. 任务关注
INSERT INTO tsk_task_watcher (id, task_id, user_id) VALUES
(1,1,2),(2,1,3),(3,5,2),(4,5,3),(5,9,2),(6,9,6),(7,10,3),(8,13,2),(9,13,4),(10,31,2)
ON CONFLICT DO NOTHING;
UPDATE tsk_task SET watcher_count = (SELECT COUNT(*) FROM tsk_task_watcher WHERE tsk_task_watcher.task_id = tsk_task.id);

-- 16. 任务评论
INSERT INTO tsk_task_comment (id, task_id, user_id, content, mentioned_users) VALUES
(1,1,2,'计划需5月10日前完成WBS分解，@李四 请协助提供设计工作量估算','3'),
(2,1,3,'收到，设计部分预计20人天，明天更新详细估算',NULL),
(3,9,6,'已联系供应商确认，电芯交期可能延迟至6月中旬，建议启动备选供应商评估',NULL),
(4,9,2,'同意，@孙七 请本周内完成备选供应商初步评估','6'),
(5,10,3,'液冷散热效率高但成本增加15%；风冷成本低但散热能力有限',NULL),
(6,10,7,'品质角度建议液冷方案，安全裕度更高',NULL),
(7,13,4,'75Ah电芯已通过初步验证，性能满足要求，建议尽快审批变更','2'),
(8,12,2,'评审结论：方案可行，需补充热管理仿真数据后进入下一阶段',NULL)
ON CONFLICT DO NOTHING;
UPDATE tsk_task SET comment_count = (SELECT COUNT(*) FROM tsk_task_comment WHERE tsk_task_comment.task_id = tsk_task.id);

-- 17. BOM 数据
INSERT INTO bom_bom (id, bom_no, name, version, project_id, status, tenant_id) VALUES
(1, 'BP-BOM-001', '电池Pack BOM', 'V1.0', 10, 2, 1),
(2, 'BB-BOM-001', 'BMS BOM',      'V0.1', 11, 1, 1)
ON CONFLICT DO NOTHING;

INSERT INTO bom_item (id, bom_id, level, seq_no, material_code, name, specification, unit) VALUES
(1,1,1,1,'CELL-75AH','电芯','75Ah方形铝壳3.7V','个'),
(2,1,1,2,'CASE-AL',  '外壳','铝合金外壳600x400x150','套'),
(3,1,1,3,'BMS-MCU',  'BMS主控板','BMS主控板组件','块'),
(4,1,1,4,'COOL-LC',  '液冷板','铝合金液冷板组件','套'),
(5,1,1,5,'WIRE-HV',  '高压线束','高压线束组件','套')
ON CONFLICT DO NOTHING;

-- 18. 工艺路线
INSERT INTO prc_process_route (id, route_no, name, project_id, status, tenant_id) VALUES
(1, 'PRC-BP-001', '电池Pack装配工艺', 10, 1, 1)
ON CONFLICT DO NOTHING;

INSERT INTO prc_operation (id, route_id, seq_no, operation_no, name, description, work_center_name) VALUES
(1,1,10,'OP-010','电芯分选配组','电芯容量内阻分选与配组','分选区'),
(2,1,20,'OP-020','电芯堆叠',    '电芯按配组方案堆叠成型','堆叠工位'),
(3,1,30,'OP-030','极耳焊接',    '电芯极耳激光焊接',      '焊接工位'),
(4,1,40,'OP-040','BMS安装',     'BMS主控板安装与接线',   '装配线A'),
(5,1,50,'OP-050','液冷系统安装','液冷板安装与管路连接',   '装配线A'),
(6,1,60,'OP-060','外壳密封',    '外壳装配与密封胶涂覆',   '密封工位'),
(7,1,70,'OP-070','EOL测试',    '下线功能测试与数据上传', '测试区'),
(8,1,80,'OP-080','外观检查包装','外观检查与包装入库',     '包装区')
ON CONFLICT DO NOTHING;

-- 验证
DO $$
BEGIN
    RAISE NOTICE '=== 测试数据统计 ===';
    RAISE NOTICE '用户: %, 项目: %, 阶段: %, 任务: %',
        (SELECT COUNT(*) FROM sys_user),
        (SELECT COUNT(*) FROM prj_project),
        (SELECT COUNT(*) FROM prj_phase),
        (SELECT COUNT(*) FROM tsk_task);
    RAISE NOTICE '依赖: %, 模板: %, 交付物模板: %, 工作流模板: %',
        (SELECT COUNT(*) FROM tsk_task_dependency),
        (SELECT COUNT(*) FROM tsk_task_template),
        (SELECT COUNT(*) FROM cfg_deliverable_template),
        (SELECT COUNT(*) FROM wf_workflow_template);
    RAISE NOTICE '里程碑: %, 评论: %, BOM项: %, 工序: %',
        (SELECT COUNT(*) FROM prj_milestone),
        (SELECT COUNT(*) FROM tsk_task_comment),
        (SELECT COUNT(*) FROM bom_item),
        (SELECT COUNT(*) FROM prc_operation);
    RAISE NOTICE '=== 完成 ===';
END $$;
