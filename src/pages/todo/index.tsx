import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button, Tooltip, Select, Avatar, Input, message } from 'antd';
import {
  RobotOutlined,
  SearchOutlined,
  PlusOutlined,
  StarOutlined,
  StarFilled,
  UnorderedListOutlined,
  CalendarOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { useTaskStore } from '@/stores/useTaskStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import { TaskStatus, TaskPriority } from '@/types';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/constants/enums';
import type { Task } from '@/types';
import FilterBar from './components/FilterBar';
import TaskList from './components/TaskList';
import AiPanel from './components/AiPanel';
import ScheduleView from './components/ScheduleView';
import TaskForm from './TaskForm';
import TaskCategoryNav from '@/components/business/TaskCategoryNav';
import type { CategoryKey } from '@/components/business/TaskCategoryNav';
import QuickCreateBar from '@/components/business/QuickCreateBar';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { filterTasksBySearch } from '@/utils/searchParser';
import styles from './TodoPage.module.css';

dayjs.extend(isoWeek);

const FAVORITES_KEY = 'syncflow_favorite_tasks';

function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveFavorites(ids: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

type ViewMode = 'list' | 'schedule';
type CompletionTab = 'uncompleted' | 'completed';

function parseSearchParams(searchParams: URLSearchParams) {
  const filters: Record<string, string | undefined> = {};
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const keyword = searchParams.get('keyword');
  const dateRangeStart = searchParams.get('dateRangeStart');
  const dateRangeEnd = searchParams.get('dateRangeEnd');

  if (status) filters.status = status;
  if (priority) filters.priority = priority;
  if (keyword) filters.keyword = keyword;
  if (dateRangeStart && dateRangeEnd) {
    filters.dateRangeStart = dateRangeStart;
    filters.dateRangeEnd = dateRangeEnd;
  }

  return filters;
}

export default function TodoPage() {
  const { tasks: rawTasks, loading, filters, setTasks, setFilters, fetchTasks } = useTaskStore();
  const tasks = (rawTasks as Task[]) || [];
  const [searchParams, setSearchParams] = useSearchParams();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiPanelWide, setAiPanelWide] = useState(false);
  const [taskFormVisible, setTaskFormVisible] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [favorites, setFavorites] = useState<string[]>(getFavorites);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(filters.keyword || '');

  const breakpoint = useBreakpoint();
  const isTabletOrSmaller = breakpoint === 'xs' || breakpoint === 'sm' || breakpoint === 'md';
  const [navVisible, setNavVisible] = useState(true);

  // Auto-collapse nav on tablet
  useEffect(() => {
    setNavVisible(!isTabletOrSmaller);
  }, [isTabletOrSmaller]);

  // v3 workspace state — initialize from URL params
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>(
    () => (searchParams.get('category') as CategoryKey) || 'all'
  );
  const [completionTab, setCompletionTab] = useState<CompletionTab>(
    () => (searchParams.get('tab') as CompletionTab) || 'uncompleted'
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Read initial filter state from URL params on mount
  useEffect(() => {
    const urlFilters = parseSearchParams(searchParams);
    if (Object.keys(urlFilters).length > 0) {
      const storeFilters: Record<string, any> = {};
      if (urlFilters.status) storeFilters.status = urlFilters.status as TaskStatus;
      if (urlFilters.priority) storeFilters.priority = urlFilters.priority as TaskPriority;
      if (urlFilters.keyword) storeFilters.keyword = urlFilters.keyword;
      if (urlFilters.dateRangeStart && urlFilters.dateRangeEnd) {
        storeFilters.dateRange = [urlFilters.dateRangeStart, urlFilters.dateRangeEnd];
      }
      setFilters(storeFilters);
    }
    const view = searchParams.get('view');
    if (view === 'list' || view === 'schedule') setViewMode(view);
    setInitialized(true);
  }, []); // Only on mount

  // Sync store filters + view state to URL params when they change
  useEffect(() => {
    if (!initialized) return;

    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.keyword) params.set('keyword', filters.keyword);
    if (filters.dateRange) {
      params.set('dateRangeStart', filters.dateRange[0]);
      params.set('dateRangeEnd', filters.dateRange[1]);
    }
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (viewMode !== 'list') params.set('view', viewMode);
    if (completionTab !== 'uncompleted') params.set('tab', completionTab);

    setSearchParams(params, { replace: true });
  }, [filters, selectedCategory, viewMode, completionTab, initialized, setSearchParams]);

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks({ pageNum: 1, pageSize: 200 });
  }, [fetchTasks]);

  const handleToggleAi = useCallback(() => {
    setAiPanelOpen((prev) => !prev);
    if (aiPanelOpen) {
      setAiPanelWide(false);
    }
  }, [aiPanelOpen]);

  const handleToggleAiWidth = useCallback(() => {
    setAiPanelWide((prev) => !prev);
  }, []);

  const handleCloseAi = useCallback(() => {
    setAiPanelOpen(false);
    setAiPanelWide(false);
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      const keyword = value.trim();
      setFilters({ keyword: keyword || undefined });
    },
    [setFilters]
  );

  const handleToggleSearch = useCallback(() => {
    setSearchOpen((prev) => {
      if (prev) {
        setSearchKeyword('');
        setFilters({ keyword: undefined });
      }
      return !prev;
    });
  }, [setFilters]);

  const handleAiMetricClick = useCallback(
    (status: TaskStatus) => {
      setFilters({ statuses: [status] });
    },
    [setFilters]
  );

  const handleToggleFavorite = useCallback(
    (taskId: string) => {
      setFavorites((prev) => {
        const next = prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId];
        saveFavorites(next);
        return next;
      });
    },
    []
  );

  const handleNewTask = useCallback(() => {
    setTaskFormVisible(true);
  }, []);

  const handleTaskFormClose = useCallback(() => {
    setTaskFormVisible(false);
  }, []);

  const handleTaskFormSuccess = useCallback(() => {
    setTaskFormVisible(false);
    fetchTasks({ pageNum: 1, pageSize: 200 });
  }, [fetchTasks]);

  const handleCategoryChange = useCallback((key: CategoryKey) => {
    setSelectedCategory(key);
  }, []);

  // Filter tasks by selected category
  const categoryFilteredTasks = useMemo(() => {
    const now = dayjs();
    const todayStr = now.format('YYYY-MM-DD');
    const weekStartStr = now.startOf('isoWeek').format('YYYY-MM-DD');
    const monthStartStr = now.startOf('month').format('YYYY-MM-DD');

    switch (selectedCategory) {
      case 'today':
        return tasks.filter((t) => {
          const d = t.plannedEnd;
          return d && dayjs(d).format('YYYY-MM-DD') === todayStr;
        });
      case 'thisWeek':
        return tasks.filter((t) => {
          const d = t.plannedEnd;
          if (!d) return false;
          const ds = dayjs(d).format('YYYY-MM-DD');
          return ds >= weekStartStr && ds <= now.endOf('isoWeek').format('YYYY-MM-DD');
        });
      case 'thisMonth':
        return tasks.filter((t) => {
          const d = t.plannedEnd;
          if (!d) return false;
          const ds = dayjs(d).format('YYYY-MM-DD');
          return ds >= monthStartStr && ds <= now.endOf('month').format('YYYY-MM-DD');
        });
      case 'warning':
        return tasks.filter((t) => t.isWarning || t.status === TaskStatus.IN_PROGRESS);
      case 'overdue':
        return tasks.filter((t) => t.isOverdue || t.status === TaskStatus.CANCELLED);
      case 'stage':
        return tasks.filter((t) => t.type === 'STAGE' || t.type === 'MILESTONE');
      case 'task':
        return tasks.filter((t) => t.type === 'TASK');
      case 'issue':
        return tasks.filter((t) => t.type === 'ISSUE');
      case 'risk':
        return tasks.filter((t) => t.type === 'RISK');
      case 'suggestion':
        return tasks.filter((t) => t.type === 'SUGGESTION');
      case 'activity':
        return tasks.filter((t) => t.type === 'ACTIVITY');
      case 'change':
        return tasks.filter((t) => t.type === 'CHANGE');
      case 'myTasks':
        return tasks.filter((t) => t.assigneeId === useAuthStore.getState().currentUser?.id);
      case 'followed':
        return tasks.filter((t) => t.isWatching);
      case 'milestone':
        return tasks.filter((t) => t.type === 'MILESTONE' || t.milestoneId != null);
      case 'all':
      default:
        return tasks;
    }
  }, [tasks, selectedCategory]);

  // Apply favorites filter
  const filteredByFavorites = showFavoritesOnly
    ? categoryFilteredTasks.filter((t) => favorites.includes(String(t.id)))
    : categoryFilteredTasks;

  // Apply completion tab
  const displayTasks = useMemo(() => {
    let result = filteredByFavorites;

    // Apply keyword search with AND/OR logic
    if (filters.keyword) {
      result = filterTasksBySearch(result, filters.keyword);
    }

    if (completionTab === 'completed') {
      return result.filter((t) => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED);
    }
    return result.filter((t) => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED);
  }, [filteredByFavorites, completionTab, filters.keyword]);

  const handleTaskRowClick = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedTask(null);
  }, []);

  return (
    <div className={styles.todoPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {isTabletOrSmaller && (
            <button
              className={styles.navToggle}
              onClick={() => setNavVisible((v) => !v)}
              aria-label="切换导航"
              data-testid="nav-toggle"
            >
              <MenuOutlined />
            </button>
          )}
          <Avatar size={32} style={{ backgroundColor: '#3366FF', fontSize: 14 }} data-testid="user-avatar">
            M
          </Avatar>
          <Select
            value="quality"
            style={{ width: 90 }}
            size="small"
            variant="borderless"
            data-testid="team-selector"
            options={[{ value: 'quality', label: '品质部' }]}
          />
          <h1 className={styles.title}>工作空间</h1>
        </div>
        <div className={styles.headerActions}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginRight: 8 }}>
            {filters.dateRange && (
              <span style={{ fontSize: 13, color: '#666' }} data-testid="date-range-display">
                {filters.dateRange[0]} - {filters.dateRange[1]}
              </span>
            )}
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewTask} size="small">
            新增
          </Button>
          <Tooltip title={showFavoritesOnly ? '显示全部' : '我的关注'}>
            <Button
              icon={showFavoritesOnly ? <StarFilled style={{ color: '#FAAD14' }} /> : <StarOutlined />}
              onClick={() => setShowFavoritesOnly((v) => !v)}
              size="small"
              data-testid="favorites-filter"
              style={showFavoritesOnly ? { borderColor: '#FAAD14' } : {}}
            >
              关注
            </Button>
          </Tooltip>
          <div style={{ display: 'flex', border: '1px solid #E8E8E8', borderRadius: 8, overflow: 'hidden' }}>
            <Button
              type={viewMode === 'list' ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />}
              onClick={() => setViewMode('list')}
              size="small"
              data-testid="view-mode-list"
              style={{ borderRadius: 0 }}
            >
              列表视图
            </Button>
            <Button
              type={viewMode === 'schedule' ? 'primary' : 'default'}
              icon={<CalendarOutlined />}
              onClick={() => setViewMode('schedule')}
              size="small"
              data-testid="view-mode-schedule"
              style={{ borderRadius: 0 }}
            >
              日历视图
            </Button>
          </div>
          <Tooltip title="AI 助手">
            <Button
              className={`${styles.aiToggleButton} ${aiPanelOpen ? styles.aiToggleButtonActive : ''}`}
              icon={<RobotOutlined />}
              onClick={handleToggleAi}
            >
              AI助手
            </Button>
          </Tooltip>
          <Tooltip title="搜索">
            <div
              className={`${styles.searchButton} ${searchOpen ? styles.searchButtonActive : ''}`}
              onClick={handleToggleSearch}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggleSearch(); } }}
              role="button"
              tabIndex={0}
              data-testid="search-toggle"
            >
              <SearchOutlined />
            </div>
          </Tooltip>
        </div>
        {searchOpen && (
          <div style={{ padding: '8px 0' }} data-testid="search-bar">
            <Input.Search
              placeholder="搜索任务名称、编号..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={handleSearch}
              allowClear
              autoFocus
              style={{ maxWidth: 400 }}
              data-testid="search-input"
            />
          </div>
        )}
      </div>

      {/* Body: left nav + center content + optional detail panel */}
      <div className={selectedTask ? styles.bodyWithDetail : styles.body}>
        {/* Left: Category navigation */}
        {navVisible && (
          <TaskCategoryNav
            tasks={tasks}
            activeCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        )}

        {/* Center column */}
        <div className={styles.center}>
          {/* Completion tabs */}
          <div className={styles.tabsRow}>
            <div className={styles.tabs} role="tablist">
              <span
                className={`${styles.tab} ${completionTab === 'uncompleted' ? styles.tabActive : ''}`}
                onClick={() => setCompletionTab('uncompleted')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCompletionTab('uncompleted'); } }}
                role="tab"
                tabIndex={0}
                aria-selected={completionTab === 'uncompleted'}
                data-testid="tab-uncompleted"
              >
                未完成
              </span>
              <span
                className={`${styles.tab} ${completionTab === 'completed' ? styles.tabActive : ''}`}
                onClick={() => setCompletionTab('completed')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCompletionTab('completed'); } }}
                role="tab"
                tabIndex={0}
                aria-selected={completionTab === 'completed'}
                data-testid="tab-completed"
              >
                已完成
              </span>
            </div>
            <span className={styles.taskCount} data-testid="task-count">
              共{displayTasks.length}个任务
            </span>
          </div>

          {/* Main content area */}
          <div className={styles.mainContent}>
            <div className={styles.taskArea}>
              {/* Filter bar */}
              <FilterBar activeCategory={selectedCategory} onCategoryChange={handleCategoryChange} />

              {/* Task table or schedule view */}
              {viewMode === 'list' ? (
                <TaskList
                  tasks={displayTasks}
                  loading={loading}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onRowClick={handleTaskRowClick}
                />
              ) : (
                <ScheduleView
                  tasks={displayTasks}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}
            </div>

            {/* AI Panel */}
            {aiPanelOpen && (
              <AiPanel
                tasks={displayTasks}
                isWide={aiPanelWide}
                onToggleWidth={handleToggleAiWidth}
                onClose={handleCloseAi}
                onMetricClick={handleAiMetricClick}
              />
            )}
          </div>

          {/* Bottom: Quick-create bar */}
          <QuickCreateBar onCreateSuccess={() => fetchTasks({ pageNum: 1, pageSize: 200 })} />
        </div>
      {/* Right: Task detail panel (inline, pushes content) */}
      <div
        className={`${styles.detailPanel} ${!selectedTask ? styles.detailPanelHidden : ''}`}
        data-testid="task-detail-panel"
      >
        {selectedTask && (
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{selectedTask.title ?? selectedTask.name ?? '任务详情'}</h3>
              <button
                onClick={handleCloseDetail}
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#8c8c8c' }}
                aria-label="关闭详情"
              >
                ✕
              </button>
            </div>
            <div data-testid="task-detail-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Status & Priority */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  background: TASK_STATUS_CONFIG[selectedTask.status]?.color + '20',
                  color: TASK_STATUS_CONFIG[selectedTask.status]?.color,
                }}>
                  {TASK_STATUS_CONFIG[selectedTask.status]?.label ?? '未知'}
                </span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  background: TASK_PRIORITY_CONFIG[selectedTask.priority]?.color + '20',
                  color: TASK_PRIORITY_CONFIG[selectedTask.priority]?.color,
                }}>
                  {TASK_PRIORITY_CONFIG[selectedTask.priority]?.label ?? '未知'}
                </span>
                {selectedTask.type && (
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, background: '#f0f0f0' }}>
                    {selectedTask.type}
                  </span>
                )}
              </div>

              {/* Progress */}
              {selectedTask.progress != null && (
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>进度</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3 }}>
                      <div style={{ width: `${selectedTask.progress}%`, height: '100%', background: '#3366FF', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#595959' }}>{selectedTask.progress}%</span>
                  </div>
                </div>
              )}

              {/* Key fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>编号</div>
                  <div style={{ fontSize: 14 }}>{selectedTask.taskNo ?? '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>负责人</div>
                  <div style={{ fontSize: 14 }}>{selectedTask.assigneeName ?? '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>计划开始</div>
                  <div style={{ fontSize: 14 }}>{selectedTask.plannedStart ?? '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>计划结束</div>
                  <div style={{ fontSize: 14 }}>{selectedTask.plannedEnd ?? '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>所属项目</div>
                  <div style={{ fontSize: 14 }}>{selectedTask.projectName ?? '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>工期(天)</div>
                  <div style={{ fontSize: 14 }}>{selectedTask.plannedDays ?? '-'}</div>
                </div>
              </div>

              {/* Description */}
              {selectedTask.description && (
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>描述</div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: '#262626' }}>{selectedTask.description}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Task Form Modal */}
      <TaskForm
        visible={taskFormVisible}
        onClose={handleTaskFormClose}
        onSuccess={handleTaskFormSuccess}
      />
    </div>
  );
}
