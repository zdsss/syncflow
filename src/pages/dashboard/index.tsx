import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { message, Button, Space, Segmented, Modal, Form, Input, Spin, DatePicker } from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  SettingOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { getProjects, createProject } from '@/services/project.service';
import { getTasks, changeStatus } from '@/services/task.service';
import { completeTask as completeApprovalTask } from '@/services/workflow.service';
import {
  getDashboardSummary,
  getDashboardProjectProgress,
  getDashboardUpcomingMilestones,
  getDashboardPendingApprovals,
} from '@/services/dashboard.service';
import { getErrorMessage } from '@/services/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useSocket } from '@/hooks/useSocket';
import type { Project } from '@/types';
import { TaskStatus, ProjectStatus } from '@/types';
import { useDashboardConfig } from './hooks/useDashboardConfig';
import { useCsvImport } from './hooks/useCsvImport';
import ScheduleView from './components/ScheduleView';
import KanbanView from './components/KanbanView';
import DepartmentGanttView from './components/DepartmentGanttView';
import ImportModal from './components/ImportModal';
import ConfigDrawer from './components/ConfigDrawer';
import OverviewCards from './components/OverviewCards';
import type { ProjectOverviewData } from './components/OverviewCards';
import TaskSummaryCards from './components/TaskSummaryCards';
import ProjectProgressList from './components/ProjectProgressList';
import type { ProjectProgressItem } from './components/ProjectProgressList';
import UpcomingMilestones from './components/UpcomingMilestones';
import type { MilestoneItem } from './components/UpcomingMilestones';
import PendingApprovals from './components/PendingApprovals';
import type { ApprovalItem } from './components/PendingApprovals';
import { useAuthStore } from '@/stores/useAuthStore';
import styles from './DashboardPage.module.css';

const DEPARTMENTS = [
  { id: 'd1', name: '公司管理层' }, { id: 'd2', name: '设计部' },
  { id: 'd3', name: '产品部' }, { id: 'd4', name: '研发部' },
  { id: 'd5', name: '测试部' }, { id: 'd6', name: '品质部' },
  { id: 'd7', name: '工程部' },
];

interface DashboardSummary {
  totalTasks: number; completed: number; inProgress: number; overdue: number;
  notStarted: number; pendingReview: number; urgent: number;
  warnings: number; risks: number; suggestions: number;
  todayTasks?: number; weekTasks?: number;
}

const EMPTY_SUMMARY: DashboardSummary = {
  totalTasks: 0, completed: 0, inProgress: 0, overdue: 0,
  notStarted: 0, pendingReview: 0, urgent: 0,
  warnings: 0, risks: 0, suggestions: 0,
  todayTasks: 0, weekTasks: 0,
};

function buildOverviewData(projects: Project[]): ProjectOverviewData {
  return {
    totalProjects: projects.length,
    inProgress: projects.filter((p) => p.status === ProjectStatus.IN_PROGRESS).length,
    completed: projects.filter((p) => p.status === ProjectStatus.COMPLETED).length,
    delayed: projects.filter((p) => p.status === ProjectStatus.DELAYED).length,
  };
}

function buildTaskSummary(summary: DashboardSummary) {
  return {
    todayTasks: summary.todayTasks ?? 0,
    weekTasks: summary.weekTasks ?? 0,
    warningTasks: summary.warnings || 0,
    overdueTasks: summary.overdue || 0,
  };
}

type ViewMode = 'overview' | 'schedule' | 'kanban' | 'department';

export default function DashboardPage() {
  const { viewMode, setViewMode, dateRange, setDateRange } = useDashboardStore();
  const { currentUser } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlView = searchParams.get('view') as ViewMode | null;
  const [localViewMode, setLocalViewMode] = useState<ViewMode>(urlView || viewMode || 'overview');

  const [tasks, setLocalTasks] = useState<any[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [form] = Form.useForm();

  const { config, saveConfig, resetConfig, reloadConfig } = useDashboardConfig();
  const { importData, importLoading, handleCSVUpload, handleImportConfirm, clearImportData } = useCsvImport();

  const { connected, subscribe } = useSocket();

  const fetcher = useCallback(async () => {
    const [projRes, summaryRes] = await Promise.all([
      getProjects(),
      getDashboardSummary(),
    ]);
    return {
      projects: (projRes?.data as Project[]) || [],
      summary: (summaryRes?.data as DashboardSummary) || EMPTY_SUMMARY,
    };
  }, []);

  const { data: dashData, loading, refresh: fetchData } = useAsyncData(fetcher, '加载仪表盘数据失败');

  // Lazy-load tasks only when needed by kanban/schedule/department views
  const fetchTasksIfNeeded = useCallback(async () => {
    if (tasksLoaded) return;
    const taskRes = await getTasks({ pageNum: 1, pageSize: 200 });
    if (taskRes?.data) {
      setLocalTasks(taskRes.data.records);
      setTasksLoaded(true);
    }
  }, [tasksLoaded]);

  useEffect(() => {
    if (localViewMode !== 'overview') {
      fetchTasksIfNeeded();
    }
  }, [localViewMode, fetchTasksIfNeeded]);

  const enhancedFetcher = useCallback(async () => {
    const [progressRes, milestonesRes, approvalsRes] = await Promise.all([
      getDashboardProjectProgress().catch(() => null),
      getDashboardUpcomingMilestones().catch(() => null),
      getDashboardPendingApprovals().catch(() => null),
    ]);
    const rawApprovals = (approvalsRes?.data as any[]) || [];
    const approvals: ApprovalItem[] = rawApprovals.map((a) => ({
      id: a.businessObjectId ?? a.id,
      title: a.objectName ?? a.title,
      type: a.objectType ?? a.type,
      applicantName: a.applicantName ?? '',
      createdAt: a.createdAt ?? '',
      status: a.status ?? 'pending',
      projectName: a.projectName,
      currentTaskId: a.taskId ?? a.currentTaskId,
    }));
    return {
      projectProgress: (progressRes?.data as ProjectProgressItem[]) || [],
      milestones: (milestonesRes?.data as MilestoneItem[]) || [],
      approvals,
    };
  }, []);

  const { data: enhancedData, loading: enhancedLoading, refresh: fetchEnhanced } = useAsyncData(enhancedFetcher, '');

  // WebSocket: refresh dashboard data when approval events fire
  useEffect(() => {
    if (!connected) return;
    const unsub = subscribe('/topic/approvals', () => {
      fetchData();
      fetchEnhanced();
    });
    return unsub;
  }, [connected, subscribe, fetchData, fetchEnhanced]);

  const handleApproveApproval = useCallback(async (taskId: string) => {
    try {
      await completeApprovalTask(taskId, { approved: true });
      message.success('审批通过');
      fetchEnhanced();
      fetchData();
      import('@/stores/useTaskStore').then(({ useTaskStore }) => {
        useTaskStore.getState().fetchTasks();
      }).catch(() => {});
    } catch { message.error('审批失败'); }
  }, [fetchEnhanced, fetchData]);

  const handleRejectApproval = useCallback(async (taskId: string) => {
    try {
      await completeApprovalTask(taskId, { approved: false, comment: '驳回' });
      message.success('已驳回');
      fetchEnhanced();
      fetchData();
      import('@/stores/useTaskStore').then(({ useTaskStore }) => {
        useTaskStore.getState().fetchTasks();
      }).catch(() => {});
    } catch { message.error('操作失败'); }
  }, [fetchEnhanced, fetchData]);

  const projects = dashData?.projects || [];
  const summary = dashData?.summary || EMPTY_SUMMARY;

  useEffect(() => {
    fetchData();
    fetchEnhanced();
  }, [fetchData, fetchEnhanced]);

  const toggleFullscreen = useCallback(() => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, [fullscreen]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setFullscreen(isFs);
      if (isFs) {
        document.body.classList.add('dashboard-fullscreen');
      } else {
        document.body.classList.remove('dashboard-fullscreen');
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.body.classList.remove('dashboard-fullscreen');
    };
  }, []);

  const handleTaskStatusChange = useCallback(
    async (taskId: number, newStatus: TaskStatus) => {
      try {
        await changeStatus(taskId, newStatus);
        setLocalTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
        // Sync task store so Todo page reflects the change
        import('@/stores/useTaskStore').then(({ useTaskStore }) => {
          useTaskStore.getState().fetchTasks();
        }).catch(() => {});
        // Refresh project data since backend recalculates progress on terminal states
        fetchData();
      } catch (err) {
        message.error(getErrorMessage(err));
      }
    },
    [tasks, fetchData]
  );

  const handleCreateProject = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const [start, end] = values.dateRange || [];
      await createProject({
        code: values.code || `PRJ-${Date.now()}`,
        name: values.name,
        description: values.description || '',
        ownerId: values.ownerId ? Number(values.ownerId) : undefined,
        plannedStart: start ? start.format('YYYY-MM-DD') : '',
        plannedEnd: end ? end.format('YYYY-MM-DD') : '',
      });
      message.success('项目创建成功');
      setCreateModalOpen(false);
      form.resetFields();
      fetchData();
    } catch {
      message.error('创建项目失败');
    }
  }, [form, fetchData]);

  const safeDateRange: [string, string] = dateRange || ['', ''];

  const overviewData = buildOverviewData(projects);
  const taskSummary = buildTaskSummary(summary);
  const projectProgressItems: ProjectProgressItem[] =
    enhancedData?.projectProgress?.length
      ? enhancedData.projectProgress
      : projects.map((p) => ({
          id: p.id,
          name: p.name,
          progress: p.progress,
          status: ProjectStatus[p.status]?.toLowerCase() || 'not_started',
          dueDate: p.plannedEnd,
        }));
  const milestoneItems = enhancedData?.milestones || [];
  const approvalItems = enhancedData?.approvals || [];

  const handleViewModeChange = (v: string) => {
    const mode = v as ViewMode;
    setLocalViewMode(mode);
    setSearchParams(mode === 'overview' ? {} : { view: mode }, { replace: true });
    if (mode !== 'overview') {
      setViewMode(mode as 'schedule' | 'kanban' | 'department');
    }
  };

  return (
    <div className={styles.page}>
      {loading && (
        <div className={styles.loadingOverlay} data-testid="loading-overlay">
          <Spin size="large" />
        </div>
      )}

      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <span className={styles.userName}>中控看板</span>
        </div>

        <Segmented
          value={localViewMode}
          onChange={handleViewModeChange}
          options={[
            { label: '概览', value: 'overview', icon: <DashboardOutlined /> },
            { label: '计划表', value: 'schedule' },
            { label: '看板', value: 'kanban' },
            { label: '部门甘特', value: 'department' },
          ]}
          size="small"
          data-testid="view-mode-switcher"
          aria-label="视图切换"
        />

        <Space size={8} className={styles.topRight}>
          <Button size="small" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>新增项目</Button>
          <Button size="small" icon={<ImportOutlined />} onClick={() => setImportModalOpen(true)} data-testid="import-button">导入</Button>
          <Button size="small" icon={<SettingOutlined />} onClick={() => { reloadConfig(); setConfigDrawerOpen(true); }}>配置</Button>
          <Button
            type="text"
            size="small"
            icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
            data-testid="fullscreen-toggle"
          />
        </Space>
      </div>

      {/* Main content area - fills remaining space */}
      <div className={styles.mainArea}>
        {localViewMode === 'overview' ? (
          <div className={styles.overviewGrid} data-testid="enhanced-dashboard" role="region" aria-label="项目概览">
            <div className={styles.overviewRow}>
              <div className={styles.overviewCol}>
                <OverviewCards data={overviewData} loading={loading} />
              </div>
              <div className={styles.overviewCol}>
                <TaskSummaryCards data={taskSummary} loading={loading} />
              </div>
            </div>
            <div className={styles.overviewRow}>
              <div className={styles.overviewCol}>
                <ProjectProgressList projects={projectProgressItems} loading={enhancedLoading} />
              </div>
              <div className={styles.overviewCol}>
                <UpcomingMilestones milestones={milestoneItems} loading={enhancedLoading} />
              </div>
            </div>
            <div className={styles.overviewRow}>
              <div className={styles.overviewCol}>
                <PendingApprovals
                  items={approvalItems}
                  loading={enhancedLoading}
                  onApprove={handleApproveApproval}
                  onReject={handleRejectApproval}
                />
              </div>
            </div>
          </div>
        ) : localViewMode === 'schedule' ? (
          <ScheduleView
            projects={projects}
            tasks={tasks}
            dateRange={safeDateRange}
            onDateRangeChange={setDateRange}
          />
        ) : localViewMode === 'department' ? (
          <DepartmentGanttView
            departments={DEPARTMENTS}
            projects={projects}
            dateRange={safeDateRange}
            onDateRangeChange={setDateRange}
          />
        ) : (
          <KanbanView
            tasks={tasks}
            dateRange={safeDateRange}
            onDateRangeChange={setDateRange}
            onTaskStatusChange={handleTaskStatusChange}
          />
        )}
      </div>

      <Modal
        title="新建项目"
        open={createModalOpen}
        onOk={handleCreateProject}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
        okText="创建"
        cancelText="取消"
        data-testid="create-project-modal"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="项目编号" rules={[{ required: true, message: '请输入项目编号' }]}>
            <Input placeholder="如 PRJ-2026-001" />
          </Form.Item>
          <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <Input.TextArea rows={3} placeholder="请输入项目描述" />
          </Form.Item>
          <Form.Item name="ownerId" label="负责人ID">
            <Input placeholder="请输入负责人用户ID" type="number" />
          </Form.Item>
          <Form.Item name="dateRange" label="计划起止日期">
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <ImportModal
        open={importModalOpen}
        importData={importData}
        importLoading={importLoading}
        onOk={handleImportConfirm}
        onCancel={() => { setImportModalOpen(false); clearImportData(); }}
        onUpload={handleCSVUpload}
      />

      <ConfigDrawer
        open={configDrawerOpen}
        config={config}
        onClose={() => setConfigDrawerOpen(false)}
        onReset={resetConfig}
        onSave={saveConfig}
      />
    </div>
  );
}
