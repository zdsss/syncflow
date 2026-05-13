import { useState } from 'react';
import { Segmented } from 'antd';
import TaskGanttTab from './TaskGanttTab';
import ProjectGanttTab from './ProjectGanttTab';
import type { Task, Project } from '@/types';
import styles from './GanttTab.module.css';

interface GanttTabProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick?: (task: Task) => void;
  onTaskUpdate?: (taskId: string, data: Partial<Task>) => void;
  onCollapseAll?: () => void;
}

export default function GanttTab({ tasks, projects, onTaskClick, onTaskUpdate, onCollapseAll }: GanttTabProps) {
  const [mode, setMode] = useState<'task' | 'project'>('task');

  return (
    <div className={styles.container}>
      <div className={styles.toggle}>
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as 'task' | 'project')}
          options={[
            { label: '任务甘特图', value: 'task' },
            { label: '项目甘特图', value: 'project' },
          ]}
        />
      </div>
      <div className={styles.content}>
        {mode === 'task' ? (
          <TaskGanttTab tasks={tasks} onTaskClick={onTaskClick} onTaskUpdate={onTaskUpdate} />
        ) : (
          <ProjectGanttTab projects={projects} onCollapseAll={onCollapseAll} />
        )}
      </div>
    </div>
  );
}
