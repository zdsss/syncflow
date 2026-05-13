import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getProjects } from '@/services/project.service';
import { getTasks } from '@/services/task.service';
import type { Task, Project } from '@/types';
import NotesList from './NotesList';
import PersonalOverview from './PersonalOverview';
import MyTasksView from './MyTasksView';
import KnowledgeView from './KnowledgeView';
import styles from './PersonalPage.module.css';

type SidebarKey = 'overview' | 'tasks' | 'notes' | 'knowledge';

const SIDEBAR_ITEMS: { key: SidebarKey; label: string }[] = [
  { key: 'overview', label: '个人概览' },
  { key: 'tasks', label: '我的任务' },
  { key: 'notes', label: '笔记本' },
  { key: 'knowledge', label: '知识库' },
];

export default function PersonalPage() {
  const [activeSection, setActiveSection] = useState<SidebarKey>('overview');
  const currentUser = useAuthStore((s) => s.currentUser);
  const userId = currentUser?.id || '';

  const fetchProjectsAndTasks = useCallback(async () => {
    const [projRes, taskRes] = await Promise.all([
      getProjects(),
      getTasks({ page: 1, pageSize: 200 }),
    ]);
    const projects = (projRes?.data as Project[]) ?? [];
    const taskData = taskRes?.data as { records?: Task[] } | Task[] | undefined;
    const tasks = taskData
      ? (Array.isArray(taskData) ? taskData : taskData.records ?? [])
      : [];
    return { projects, tasks };
  }, []);

  const { data, loading, refresh } = useAsyncData(fetchProjectsAndTasks, '加载失败');

  useEffect(() => {
    refresh();
  }, [refresh]);

  const projects = data?.projects ?? [];
  const tasks = data?.tasks ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>个人空间</h1>
      </div>

      <div className={styles.body}>
        <div className={styles.sidebar}>
          {SIDEBAR_ITEMS.map((item) => (
            <div
              key={item.key}
              className={`${styles.sidebarItem} ${activeSection === item.key ? styles.sidebarItemActive : ''}`}
              onClick={() => setActiveSection(item.key)}
              data-testid={`sidebar-${item.key}`}
            >
              {item.label}
            </div>
          ))}
        </div>

        <div className={styles.content}>
          {activeSection === 'overview' && (
            <PersonalOverview projects={projects} tasks={tasks} />
          )}
          {activeSection === 'tasks' && (
            <MyTasksView tasks={tasks} />
          )}
          {activeSection === 'notes' && <NotesList />}
          {activeSection === 'knowledge' && <KnowledgeView />}
        </div>
      </div>
    </div>
  );
}
