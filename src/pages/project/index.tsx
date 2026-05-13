import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Tabs, Button, Form, Table, Badge, Space, Progress, Statistic, Row, Col, Card, Breadcrumb } from 'antd';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import {
  PlusOutlined,
  StarOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  HighlightOutlined,
  BlockOutlined,
  ToolOutlined,
  ShoppingOutlined,
  FolderOutlined,
  ExclamationCircleOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useProjectStore } from '@/stores/useProjectStore';
import { useTaskStore } from '@/stores/useTaskStore';
import type { Task } from '@/types';
import type { Project } from '@/types/project';
import { ProjectStatus } from '@/types';
import ProjectTree from './components/ProjectTree';
import TaskDetailPanel from './components/TaskDetailPanel';
import ProjectFormModal from './components/ProjectFormModal';
import { getProjectColumns } from './columns/projectColumns';
import { useProjectActions } from './hooks/useProjectActions';
import { useDetailTabItems } from './hooks/useDetailTabItems';
import QuickCreateBar from '@/components/business/QuickCreateBar';
import styles from './ProjectPage.module.css';

type PageTab = 'my' | 'all' | 'sets';
type CategoryKey = 'projects' | 'units' | 'design' | 'bom' | 'process' | 'procurement' | 'files' | 'issues';

interface CategoryItem {
  key: CategoryKey;
  label: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryItem[] = [
  { key: 'projects', label: '项目', icon: <ProjectOutlined /> },
  { key: 'units', label: '单体', icon: <AppstoreOutlined /> },
  { key: 'design', label: '设计', icon: <HighlightOutlined /> },
  { key: 'bom', label: 'BOM', icon: <BlockOutlined /> },
  { key: 'process', label: '工艺', icon: <ToolOutlined /> },
  { key: 'procurement', label: '采购', icon: <ShoppingOutlined /> },
  { key: 'files', label: '文件', icon: <FolderOutlined /> },
  { key: 'issues', label: '问题', icon: <ExclamationCircleOutlined /> },
];

export default function ProjectPage() {
  const {
    projects,
    setProjects,
    selectedProject,
    setSelectedProject,
    expandedKeys,
    setExpandedKeys,
    loading: projectLoading,
  } = useProjectStore();

  const { tasks: rawTasks, setTasks } = useTaskStore();
  const tasks = rawTasks || [];

  const [pageTab, setPageTab] = useState<PageTab>('my');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('projects');
  const [activeTab, setActiveTab] = useState(() => {
    const validTabs = ['basic', 'schedule', 'swimlane', 'gantt'];
    try {
      const saved = localStorage.getItem('projectActiveTab');
      return saved && validTabs.includes(saved) ? saved : 'basic';
    } catch {
      return 'basic';
    }
  });
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [assigneeOptions, setAssigneeOptions] = useState<{ value: string; label: string }[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [createParentId, setCreateParentId] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const createParentIdRef = useRef(createParentId);
  createParentIdRef.current = createParentId;

  const {
    fetchData,
    handleCreateProject: doCreateProject,
    handleTaskUpdate,
    handleCollapseAll,
    handleAddChild,
    handleEditProject: doEditProject,
    handleDeleteProject,
    handleTaskMove,
    handleSaveTask,
    handleAssignTask,
    handleStatusChange,
    handleDeleteTask,
    handleUpdateProject: doUpdateProject,
  } = useProjectActions({
    form,
    editForm,
    setProjects,
    setTasks,
    setExpandedKeys,
    setCreateModalOpen,
    setEditModalOpen,
    setEditingProject,
    setCreateParentId,
    setSelectedTask,
    setAssigneeOptions,
  });

  const handleCreateProject = useCallback(async () => {
    return doCreateProject(createParentIdRef.current);
  }, [doCreateProject]);

  const handleEditProject = useCallback((id: string) => {
    return doEditProject(id, projects);
  }, [doEditProject, projects]);

  const handleUpdateProject = useCallback(async () => {
    return doUpdateProject(editingProject);
  }, [doUpdateProject, editingProject]);

  const handleSelectProject = useCallback((id: number) => {
    const findInTree = (nodes: Project[], targetId: number): Project | undefined => {
      for (const node of nodes) {
        if (node.id === targetId) return node;
        if (node.children?.length) {
          const found = findInTree(node.children, targetId);
          if (found) return found;
        }
      }
      return undefined;
    };
    setSelectedProject(findInTree(projects, id) ?? null);
  }, [projects, setSelectedProject]);

  const getAssigneeName = useCallback((leaderId: string) => {
    const opt = assigneeOptions.find((o) => o.value === leaderId);
    return opt?.label || leaderId || '-';
  }, [assigneeOptions]);

  useEffect(() => {
    try {
      localStorage.setItem('projectActiveTab', activeTab);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask((prev) => prev?.id === task.id ? null : task);
  }, []);

  const selectedProjectId = selectedProject ? String(selectedProject.id) : null;

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId != null && String(t.projectId) === selectedProjectId),
    [tasks, selectedProjectId],
  );

  const projectTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const task of tasks) {
      counts[task.projectId] = (counts[task.projectId] || 0) + 1;
    }
    return counts;
  }, [tasks]);

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryKey, number> = {
      projects: projects.length,
      units: projects.filter((p) => p.parentId != null).length,
      design: tasks.filter((t) => t.type === 'TASK' || t.type === 'STAGE').length,
      bom: tasks.filter((t) => t.type === 'CHANGE' || t.taskCategory === 'BOM').length,
      process: tasks.filter((t) => t.type === 'ACTIVITY').length,
      procurement: tasks.filter((t) => t.type === 'SUGGESTION' || t.taskCategory === 'PROCUREMENT').length,
      files: tasks.filter((t) => t.taskCategory === 'FILE' || (t.attachmentCount ?? 0) > 0).length,
      issues: tasks.filter((t) => t.type === 'ISSUE' || t.type === 'RISK').length,
    };
    return counts;
  }, [projects, tasks]);

  const projectColumns = useMemo(
    () => getProjectColumns(handleSelectProject, getAssigneeName, projectTaskCounts),
    [handleSelectProject, getAssigneeName, projectTaskCounts],
  );

  const displayedProjects = useMemo(() => {
    let result = projects;

    if (pageTab === 'sets') {
      result = result.filter((p) => p.parentId === null || p.parentId === undefined);
    }

    if (activeCategory === 'projects') return result;
    if (activeCategory === 'units') return result.filter((p) => p.parentId != null);

    if (activeCategory === 'files') {
      const projectIdsWithFiles = new Set(
        tasks.filter((t) => t.taskCategory === 'FILE' || (t.attachmentCount ?? 0) > 0).map((t) => t.projectId)
      );
      return result.filter((p) => projectIdsWithFiles.has(p.id));
    }

    const typeFilter: Record<string, string[]> = {
      design: ['TASK', 'STAGE'],
      bom: ['CHANGE'],
      process: ['ACTIVITY'],
      procurement: ['SUGGESTION'],
      issues: ['ISSUE', 'RISK'],
    };
    const types = typeFilter[activeCategory];
    if (!types) return result;

    const projectIdsWithType = new Set(
      tasks.filter((t) => types.includes(t.type)).map((t) => t.projectId)
    );
    return result.filter((p) => projectIdsWithType.has(p.id));
  }, [projects, pageTab, activeCategory, tasks]);

  const detailTabItems = useDetailTabItems({
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
    onRefresh: fetchData,
  });

  const pageTabItems = [
    { key: 'my', label: '我的项目' },
    { key: 'all', label: '全部项目' },
    { key: 'sets', label: '项目集' },
  ];

  const handleCancelCreate = useCallback(() => {
    setCreateModalOpen(false);
    setCreateParentId(undefined);
    form.resetFields();
  }, [form]);

  const handleCancelEdit = useCallback(() => {
    setEditModalOpen(false);
    editForm.resetFields();
    setEditingProject(null);
  }, [editForm]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Breadcrumb
            items={[
              { title: <><HomeOutlined /> 项目管理</>, onClick: () => { setSelectedProject(null); setSelectedTask(null); } },
              ...(selectedProject ? [{ title: selectedProject.name, onClick: () => setSelectedTask(null) }] : []),
              ...(selectedTask ? [{ title: selectedTask.title }] : []),
            ]}
            style={{ marginBottom: 4, cursor: 'pointer' }}
          />
          <h1 className={styles.title}>项目管理</h1>
        </div>
        <Space>
          <Button type="link" icon={<StarOutlined />}>查看关注项目</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
            data-testid="create-project-btn"
          >
            新建项目
          </Button>
        </Space>
      </div>
      <div className={`${styles.content} ${selectedTask ? styles.contentWithDetail : ''}`}>
        <div className={styles.leftPanel}>
          <div className={styles.categoryNav} data-testid="category-nav" role="listbox" aria-label="项目分类">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.key}
                role="option"
                aria-selected={activeCategory === cat.key}
                tabIndex={0}
                className={`${styles.categoryItem} ${activeCategory === cat.key ? styles.categoryItemActive : ''}`}
                onClick={() => setActiveCategory(cat.key)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveCategory(cat.key); } }}
                data-testid={`category-${cat.key}`}
              >
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <span className={styles.categoryLabel}>{cat.label}</span>
                <Badge
                  count={categoryCounts[cat.key]}
                  size="small"
                  className={styles.categoryBadge}
                  style={{ backgroundColor: activeCategory === cat.key ? '#3366FF' : '#E8E8E8' }}
                />
              </div>
            ))}
          </div>
          {projectLoading && projects.length === 0 ? (
            <LoadingSkeleton rows={6} />
          ) : (
            <ProjectTree
              projects={projects}
              selectedProjectId={selectedProjectId}
              expandedKeys={expandedKeys}
              onSelect={(id) => {
                handleSelectProject(Number(id));
                setSelectedTask(null);
              }}
              onExpand={setExpandedKeys}
              onAddChild={handleAddChild}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onDuplicate={() => { /* duplicate not supported */ }}
            />
          )}
        </div>
        <div className={styles.centerPanel}>
          {selectedProjectId ? (
            <div className={styles.centerTabs}>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={detailTabItems}
                className={styles.detailTabs}
              />
            </div>
          ) : (
            <div className={styles.mainArea}>
              <Tabs
                activeKey={pageTab}
                onChange={(key) => setPageTab(key as PageTab)}
                items={pageTabItems}
                style={{ marginBottom: 12, padding: '0 12px' }}
              />
              <div className={styles.projectTableView} data-testid="project-table-view">
                <Table
                  columns={projectColumns}
                  dataSource={displayedProjects}
                  rowKey="id"
                  size="middle"
                  pagination={{ pageSize: 15 }}
                  scroll={{ x: 'max-content' }}
                />
                {/* Folder stats charts */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid #e8e8e8' }} data-testid="folder-stats">
                  <Row gutter={16}>
                    <Col xs={12} sm={12} md={6}>
                      <Card size="small" variant="borderless">
                        <Statistic title="项目总数" value={displayedProjects.length} />
                      </Card>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                      <Card size="small" variant="borderless">
                        <Statistic
                          title="在建项目"
                          value={displayedProjects.filter((p) => p.status === ProjectStatus.IN_PROGRESS).length}
                          styles={{ content: { color: '#1890ff' } }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                      <Card size="small" variant="borderless">
                        <Statistic
                          title="完工项目"
                          value={displayedProjects.filter((p) => p.status === ProjectStatus.COMPLETED).length}
                          styles={{ content: { color: '#52c41a' } }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                      <Card size="small" variant="borderless">
                        <Statistic
                          title="延期项目"
                          value={displayedProjects.filter((p) => p.status === ProjectStatus.DELAYED).length}
                          styles={{ content: { color: '#ff4d4f' } }}
                        />
                      </Card>
                    </Col>
                  </Row>
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: 12, color: '#666', marginRight: 8 }}>整体完成度:</span>
                    <Progress
                      percent={
                        displayedProjects.length > 0
                          ? Math.round(displayedProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / displayedProjects.length)
                          : 0
                      }
                      size="small"
                      style={{ width: 200, display: 'inline-block' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className={`${styles.rightPanel} ${!selectedTask ? styles.rightPanelHidden : ''}`}>
          <div className={styles.rightPanelHeader}>
            <span className={styles.rightPanelTitle}>任务详情</span>
            <button
              className={styles.rightPanelClose}
              onClick={() => setSelectedTask(null)}
              title="关闭"
            >
              ×
            </button>
          </div>
          <TaskDetailPanel
            task={selectedTask}
            onSave={handleSaveTask}
            onAssign={handleAssignTask}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTask}
            assigneeOptions={assigneeOptions}
          />
        </div>
      </div>
      {selectedProjectId && (
        <QuickCreateBar
          projectId={Number(selectedProjectId)}
          onCreateSuccess={() => fetchData()}
        />
      )}
      <ProjectFormModal
        mode="create"
        open={createModalOpen}
        form={form}
        onOk={handleCreateProject}
        onCancel={handleCancelCreate}
      />
      <ProjectFormModal
        mode="edit"
        open={editModalOpen}
        form={editForm}
        onOk={handleUpdateProject}
        onCancel={handleCancelEdit}
      />
    </div>
  );
}
