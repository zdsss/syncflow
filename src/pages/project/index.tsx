import { useEffect, useState, useCallback } from 'react';
import { Tabs } from 'antd';
import { useProjectStore } from '@/stores/useProjectStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { getProjects } from '@/services/project.service';
import { getTasks } from '@/services/task.service';
import type { Task } from '@/types';
import ProjectTree from './components/ProjectTree';
import ScheduleTab from './components/ScheduleTab';
import TaskGanttTab from './components/TaskGanttTab';
import ProjectGanttTab from './components/ProjectGanttTab';
import TaskDetailDrawer from './components/TaskDetailDrawer';
import styles from './ProjectPage.module.css';

export default function ProjectPage() {
  const {
    projects,
    setProjects,
    selectedProjectId,
    selectProject,
    expandedKeys,
    setExpandedKeys,
    setLoading: setProjectLoading,
  } = useProjectStore();

  const { tasks, setTasks, setLoading: setTaskLoading } = useTaskStore();

  const [activeTab, setActiveTab] = useState('schedule');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchData = useCallback(async () => {
    setProjectLoading(true);
    setTaskLoading(true);
    try {
      const [projRes, taskRes] = await Promise.all([
        getProjects(),
        getTasks({ page: 1, pageSize: 100 }),
      ]);
      if (projRes?.data) {
        setProjects(projRes.data as any);
        // Auto-expand first 3 levels
        const p = projRes.data as any[];
        const level1 = p.filter((x: any) => !x.parentId).map((x: any) => x.id);
        const level2 = p.filter((x: any) => level1.includes(x.parentId)).map((x: any) => x.id);
        setExpandedKeys([...level1, ...level2]);
      }
      if (taskRes?.data) {
        setTasks(taskRes.data);
      }
    } catch (err) {
      console.error('Failed to load project data:', err);
    } finally {
      setProjectLoading(false);
      setTaskLoading(false);
    }
  }, [setProjects, setTasks, setProjectLoading, setTaskLoading, setExpandedKeys]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  }, []);

  const tabItems = [
    {
      key: 'schedule',
      label: '计划表',
      children: <ScheduleTab tasks={tasks} onTaskClick={handleTaskClick} />,
    },
    {
      key: 'taskGantt',
      label: '任务甘特图',
      children: <TaskGanttTab tasks={tasks} onTaskClick={handleTaskClick} />,
    },
    {
      key: 'projectGantt',
      label: '项目甘特图',
      children: <ProjectGanttTab projects={projects} />,
    },
  ];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>项目管理</h1>
      <div className={styles.content}>
        <ProjectTree
          projects={projects}
          selectedProjectId={selectedProjectId}
          expandedKeys={expandedKeys}
          onSelect={selectProject}
          onExpand={setExpandedKeys}
        />
        <div className={styles.mainArea}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            className={styles.tabs}
          />
        </div>
      </div>
      <TaskDetailDrawer
        task={selectedTask}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTask(null);
        }}
      />
    </div>
  );
}
