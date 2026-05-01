import { useEffect, useState, useCallback } from 'react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { getProjects } from '@/services/project.service';
import { getTasks, updateTask } from '@/services/task.service';
import { getDashboardSummary } from '@/services/dashboard.service';
import type { Project } from '@/types';
import ViewSwitcher from './components/ViewSwitcher';
import FilterToolbar from './components/FilterToolbar';
import ScheduleView from './components/ScheduleView';
import KanbanView from './components/KanbanView';
import styles from './DashboardPage.module.css';

interface DashboardSummary {
  totalTasks: number;
  completed: number;
  inProgress: number;
  overdue: number;
  notStarted: number;
  pendingAssign: number;
  urgent: number;
  warnings: number;
  risks: number;
  suggestions: number;
}

export default function DashboardPage() {
  const { viewMode, setViewMode, companyFilter, setCompanyFilter, progressFilter, setProgressFilter, dateRange, setDateRange } = useDashboardStore();
  const { tasks, setTasks, setLoading: setTaskLoading } = useTaskStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalTasks: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0,
    notStarted: 0,
    pendingAssign: 0,
    urgent: 0,
    warnings: 3,
    risks: 2,
    suggestions: 4,
  });
  const [todayTasks, setTodayTasks] = useState(0);

  const fetchData = useCallback(async () => {
    setTaskLoading(true);
    try {
      const [projRes, taskRes, summaryRes] = await Promise.all([
        getProjects(),
        getTasks({ page: 1, pageSize: 100 }),
        getDashboardSummary(),
      ]);

      if (projRes?.data) {
        setProjects(projRes.data as Project[]);
      }
      if (taskRes?.data) {
        setTasks(taskRes.data);
      }
      if (summaryRes?.data) {
        const s = summaryRes.data as DashboardSummary;
        setSummary(s);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setTaskLoading(false);
    }
  }, [setTasks, setTaskLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTaskStatusChange = useCallback(
    async (taskId: string, newStatus: string) => {
      try {
        await updateTask(taskId, { status: newStatus as any });
        setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus as any } : t)));
      } catch (err) {
        console.error('Failed to update task status:', err);
      }
    },
    [tasks, setTasks]
  );

  const completionRate = summary.totalTasks > 0 ? Math.round((summary.completed / summary.totalTasks) * 100) : 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>中控看板</h1>
        <ViewSwitcher value={viewMode} onChange={setViewMode} />
      </div>

      <FilterToolbar
        companyFilter={companyFilter}
        progressFilter={progressFilter}
        onCompanyChange={setCompanyFilter}
        onProgressChange={setProgressFilter}
      />

      {viewMode === 'schedule' ? (
        <ScheduleView
          projects={projects}
          tasks={tasks}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          summary={{
            ...summary,
            todayTasks,
          }}
        />
      ) : (
        <KanbanView
          tasks={tasks}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          completionRate={completionRate}
          onTaskStatusChange={handleTaskStatusChange}
        />
      )}
    </div>
  );
}
