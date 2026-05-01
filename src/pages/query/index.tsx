import { useEffect, useState } from 'react';
import { getTaskStats, getProjectStats, getOverdueTasks } from '@/services/query.service';
import TaskStatsChart from './components/TaskStatsChart';
import ProjectStatsChart from './components/ProjectStatsChart';
import styles from './QueryPage.module.css';

interface TaskStat {
  status: string;
  _count: { id: number };
}

interface ProjectStat {
  status: string;
  _count: { id: number };
}

interface OverdueTask {
  id: string;
  name: string;
  planEnd: string;
  project: { id: string; name: string };
}

export default function QueryPage() {
  const [taskStats, setTaskStats] = useState<TaskStat[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStat[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [taskRes, projectRes, overdueRes] = await Promise.all([
          getTaskStats(),
          getProjectStats(),
          getOverdueTasks(),
        ]);

        if (taskRes?.data) setTaskStats(taskRes.data);
        if (projectRes?.data) setProjectStats(projectRes.data);
        if (overdueRes?.data) setOverdueTasks(overdueRes.data);
      } catch (err) {
        console.error('Failed to load query data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className={styles.page}>加载中...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>查询统计</h1>
      </div>

      <div className={styles.chartsContainer}>
        <div className={styles.chartCard}>
          <TaskStatsChart data={taskStats} />
        </div>
        <div className={styles.chartCard}>
          <ProjectStatsChart data={projectStats} />
        </div>
      </div>

      {overdueTasks.length > 0 && (
        <div className={styles.overdueSection}>
          <h2 className={styles.overdueTitle}>逾期任务</h2>
          <div className={styles.overdueList}>
            {overdueTasks.map((task) => (
              <div key={task.id} className={styles.overdueItem}>
                <div>
                  <div className={styles.taskName}>{task.name}</div>
                  <div className={styles.projectName}>{task.project.name}</div>
                </div>
                <div className={styles.dueDate}>
                  截止日期: {new Date(task.planEnd).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
