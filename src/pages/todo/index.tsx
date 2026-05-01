import { useEffect, useState, useCallback } from 'react';
import { Button, Tooltip } from 'antd';
import { RobotOutlined, SearchOutlined } from '@ant-design/icons';
import { useTaskStore } from '@/stores/useTaskStore';
import { getTasks } from '@/services/task.service';
import { TaskStatus } from '@/types';
import FilterBar from './components/FilterBar';
import TaskList from './components/TaskList';
import AiPanel from './components/AiPanel';
import styles from './TodoPage.module.css';

export default function TodoPage() {
  const { tasks, loading, setTasks, setLoading, setTotal, setPagination, page, pageSize, setFilters } = useTaskStore();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiPanelWide, setAiPanelWide] = useState(false);

  // Fetch tasks on mount
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await getTasks({ page: 1, pageSize: 200 });
        const data = res as unknown as { data: typeof tasks; total: number };
        setTasks(data.data);
        setTotal(data.total);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [setTasks, setTotal, setLoading]);

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

  const handleAiMetricClick = useCallback(
    (status: TaskStatus) => {
      setFilters({ status });
    },
    [setFilters]
  );

  return (
    <div className={styles.todoPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>工作空间</h1>
        </div>
        <div className={styles.headerActions}>
          <Tooltip title="AI 助手">
            <Button
              className={`${styles.aiToggleButton} ${aiPanelOpen ? styles.aiToggleButtonActive : ''}`}
              icon={<RobotOutlined />}
              onClick={handleToggleAi}
            >
              AI 助手
            </Button>
          </Tooltip>
          <Tooltip title="搜索">
            <div className={styles.searchButton}>
              <SearchOutlined />
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Main content area */}
      <div className={styles.mainContent}>
        <div className={styles.taskArea}>
          {/* Filter bar */}
          <FilterBar tasks={tasks} />

          {/* Task table */}
          <TaskList tasks={tasks} loading={loading} />
        </div>

        {/* AI Panel */}
        {aiPanelOpen && (
          <AiPanel
            tasks={tasks}
            isWide={aiPanelWide}
            onToggleWidth={handleToggleAiWidth}
            onClose={handleCloseAi}
            onMetricClick={handleAiMetricClick}
          />
        )}
      </div>
    </div>
  );
}
