import type { Task } from '@/types';
import type { Project } from '@/types/project';
import BasicTab from '../components/BasicTab';
import ScheduleTab from '../components/ScheduleTab';
import SwimlaneTab from '../components/SwimlaneTab';
import GanttTab from '../components/GanttTab';

const DEPARTMENT_OPTIONS = [
  { value: '', label: '全部门' },
  { value: '设计部', label: '设计部' },
  { value: '产品部', label: '产品部' },
  { value: '研发部', label: '研发部' },
  { value: '测试部', label: '测试部' },
];

interface DetailTabItemsParams {
  selectedProject: Project | null;
  tasks: Task[];
  projects: Project[];
  projectTasks: Task[];
  handleTaskClick: (task: Task) => void;
  handleTaskMove: (taskId: string, newPhase: string) => Promise<void>;
  handleTaskUpdate: (taskId: string, data: Partial<Task>) => Promise<void>;
  handleCollapseAll: () => void;
  handleDeleteTask: (taskId: string) => Promise<void>;
  departmentFilter: string;
  setDepartmentFilter: (val: string) => void;
  onRefresh?: () => void;
}

export function useDetailTabItems({
  selectedProject,
  tasks,
  projects,
  projectTasks,
  handleTaskClick,
  handleTaskMove,
  handleTaskUpdate,
  handleCollapseAll,
  handleDeleteTask,
  departmentFilter,
  setDepartmentFilter,
  onRefresh,
}: DetailTabItemsParams) {
  return [
    {
      key: 'basic',
      label: '基本',
      children: selectedProject ? (
        <BasicTab project={selectedProject} tasks={projectTasks} onStatusChange={onRefresh} />
      ) : (
        <div data-testid="basic-tab-empty" style={{ padding: 48, textAlign: 'center', color: '#999' }}>
          请在左侧选择一个项目
        </div>
      ),
    },
    {
      key: 'schedule',
      label: '计划表',
      children: (
        <ScheduleTab tasks={projectTasks} onTaskClick={handleTaskClick} onDelete={handleDeleteTask} departmentFilter={departmentFilter} onDepartmentChange={setDepartmentFilter} />
      ),
    },
    {
      key: 'swimlane',
      label: '泳道图',
      children: (
        <SwimlaneTab
          tasks={projectTasks}
          projects={projects}
          onTaskClick={handleTaskClick}
          onTaskMove={handleTaskMove}
          onTaskUpdate={handleTaskUpdate}
          onRefresh={onRefresh}
        />
      ),
    },
    {
      key: 'gantt',
      label: '甘特图',
      children: (
        <GanttTab
          tasks={projectTasks}
          projects={projects}
          onTaskClick={handleTaskClick}
          onTaskUpdate={handleTaskUpdate}
          onCollapseAll={handleCollapseAll}
        />
      ),
    },
  ];
}
