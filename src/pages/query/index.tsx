import { useState, useCallback } from 'react';
import { Tabs } from 'antd';
import { BarChartOutlined, SearchOutlined } from '@ant-design/icons';
import CategorySidebar from './CategorySidebar';
import TaskList from './TaskList';
import TaskDetailPanel from './TaskDetailPanel';
import TaskStatsChart from './components/TaskStatsChart';
import ProjectStatsChart from './components/ProjectStatsChart';
import DepartmentStatsChart from './components/DepartmentStatsChart';
import CompletionRateGauge from './components/CompletionRateGauge';
import WorkloadChart from './components/WorkloadChart';
import { getDashboardSummary } from '@/services/dashboard.service';
import { useAsyncData } from '@/hooks/useAsyncData';
import type { TaskItem } from './TaskList';
import styles from './QueryPage.module.css';

interface DashboardSummary {
  taskStats?: { status: string; _count: { id: number } }[];
  projectStats?: { status: string; _count: { id: number } }[];
  departmentStats?: { id: string; name: string; taskCount: number; byStatus?: Record<string, number> }[];
  completionRate?: number;
  workload?: { total: number; byStatus: Record<string, number> };
}

export default function QueryPage() {
  const [activeCategory, setActiveCategory] = useState('in_progress');
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [activeTab, setActiveTab] = useState('tasks');

  const fetchSummary = useCallback(async () => {
    const res = await getDashboardSummary();
    return (res as { data?: DashboardSummary }).data ?? {};
  }, []);

  const { data: summary } = useAsyncData<DashboardSummary>(fetchSummary, '加载统计数据失败');

  const taskStats = summary?.taskStats ?? [];
  const projectStats = summary?.projectStats ?? [];
  const departmentStats = summary?.departmentStats ?? [];
  const completionRate = summary?.completionRate ?? 0;
  const workload = summary?.workload ?? { total: 0, byStatus: {} };

  return (
    <div className={styles.pageWrapper} data-testid="query-layout">
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>查询统计</h1>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'charts', label: '统计分析', icon: <BarChartOutlined /> },
            { key: 'tasks', label: '任务查询', icon: <SearchOutlined /> },
          ]}
          className={styles.headerTabs}
        />
      </div>

      {activeTab === 'charts' && (
        <div className={styles.chartsGrid} data-testid="charts-view">
          <div className={styles.chartCard}>
            <CompletionRateGauge rate={completionRate} />
          </div>
          <div className={styles.chartCard}>
            <TaskStatsChart data={taskStats} />
          </div>
          <div className={styles.chartCard}>
            <ProjectStatsChart data={projectStats} />
          </div>
          <div className={styles.chartCard}>
            <WorkloadChart data={workload} />
          </div>
          <div className={styles.chartCardWide}>
            <DepartmentStatsChart data={departmentStats} />
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className={styles.layout}>
          <CategorySidebar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
          <TaskList
            onTaskSelect={setSelectedTask}
            selectedTaskId={selectedTask?.id}
          />
          <TaskDetailPanel selectedTask={selectedTask} />
        </div>
      )}
    </div>
  );
}
