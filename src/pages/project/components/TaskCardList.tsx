import { useState, useMemo, useCallback, useEffect } from 'react';
import { StarOutlined, StarFilled, FileOutlined, SearchOutlined, FilePdfOutlined, FileImageOutlined, FileExcelOutlined, FileWordOutlined, FileTextOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import type { Task } from '@/types';
import { TaskStatus } from '@/types';
import { TASK_STATUS_CONFIG } from '@/constants/enums';
import { getFiles } from '@/services/file.service';
import styles from './TaskCardList.module.css';

type FilterTab = 'all' | 'incomplete' | 'completed';

interface TaskCardListProps {
  tasks: Task[];
  selectedTaskId?: string | null;
  onTaskClick: (task: Task) => void;
}

interface TaskFile {
  id: string;
  name: string;
  type: string;
  url?: string;
}

interface TaskWithChildren extends Task {
  _children?: Task[];
}

function getTaskFileIcon(fileName: string): React.ReactNode {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return <FilePdfOutlined style={{ color: '#FF4D4F', fontSize: 16 }} />;
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) return <FileImageOutlined style={{ color: '#52C41A', fontSize: 16 }} />;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileExcelOutlined style={{ color: '#52C41A', fontSize: 16 }} />;
  if (['doc', 'docx'].includes(ext)) return <FileWordOutlined style={{ color: '#3366FF', fontSize: 16 }} />;
  if (['txt', 'md', 'json', 'xml'].includes(ext)) return <FileTextOutlined style={{ color: '#8C8C8C', fontSize: 16 }} />;
  return <FileOutlined style={{ color: '#8C8C8C', fontSize: 16 }} />;
}

function isImageFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext);
}

function buildTaskTree(tasks: Task[]): Task[] {
  const map = new Map<string, Task & { _children: Task[] }>();
  const roots: Task[] = [];

  for (const t of tasks) {
    map.set(t.id, { ...t, _children: [] });
  }

  for (const t of tasks) {
    const node = map.get(t.id)!;
    if (t.parentId && map.has(t.parentId)) {
      map.get(t.parentId)!._children.push(node);
    } else if (!t.parentId) {
      roots.push(node);
    }
  }

  return roots;
}

function flattenTree(tasks: TaskWithChildren[], expandedIds: Set<string>, level: number): { task: Task; level: number }[] {
  const result: { task: Task; level: number }[] = [];
  for (const task of tasks) {
    result.push({ task, level });
    const children = task._children;
    if (children && children.length > 0 && expandedIds.has(task.id)) {
      result.push(...flattenTree(children, expandedIds, level + 1));
    }
  }
  return result;
}

export default function TaskCardList({ tasks, selectedTaskId, onTaskClick }: TaskCardListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchText, setSearchText] = useState('');
  const [taskFiles, setTaskFiles] = useState<Record<string, TaskFile[]>>({});

  useEffect(() => {
    const projectIds = [...new Set(tasks.map((t) => t.projectId))];
    if (projectIds.length === 0) return;

    const loadFiles = async () => {
      const fileMap: Record<string, TaskFile[]> = {};
      for (const pid of projectIds.slice(0, 3)) {
        try {
          const res = await getFiles({ projectId: Number(pid), pageSize: 50 });
          const files = (res as { data?: Array<{ id: string; name: string; type: string; taskId?: string; entityId?: string; url?: string; path?: string }> }).data || [];
          for (const f of files) {
            const taskId = f.taskId || f.entityId;
            if (taskId) {
              if (!fileMap[taskId]) fileMap[taskId] = [];
              fileMap[taskId].push({ id: f.id, name: f.name, type: f.type, url: f.url || f.path });
            }
          }
        } catch {
          // ignore
        }
      }
      setTaskFiles(fileMap);
    };
    loadFiles();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filterTab === 'incomplete') {
      result = result.filter((t) => t.status !== TaskStatus.COMPLETED);
    } else if (filterTab === 'completed') {
      result = result.filter((t) => t.status === TaskStatus.COMPLETED);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.assigneeName && t.assigneeName.toLowerCase().includes(q))
      );
    }
    return result;
  }, [tasks, filterTab, searchText]);

  const tree = useMemo(() => buildTaskTree(filteredTasks), [filteredTasks]);

  const flatList = useMemo(() => flattenTree(tree, expandedIds, 0), [tree, expandedIds]);

  const hasChildren = useCallback((task: Task) => {
    return !!(task as TaskWithChildren)._children?.length;
  }, []);

  const toggleExpand = useCallback((e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'incomplete', label: '未完成' },
    { key: 'completed', label: '已完成' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.filterTabs}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.filterTab} ${filterTab === tab.key ? styles.filterTabActive : ''}`}
              onClick={() => setFilterTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Input
          size="small"
          placeholder="搜索任务..."
          prefix={<SearchOutlined style={{ color: '#999', fontSize: 12 }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          className={styles.searchInput}
        />
      </div>
      {flatList.length === 0 ? (
        <div className={styles.emptyState}>暂无任务</div>
      ) : (
        flatList.map(({ task, level }) => {
          const statusCfg = TASK_STATUS_CONFIG[task.status];
          const children = hasChildren(task);
          const expanded = expandedIds.has(task.id);
          const indent = level * 24;

          return (
            <div
              key={task.id}
              className={`${styles.taskRow} ${selectedTaskId === task.id ? styles.selected : ''}`}
              style={{ paddingLeft: 16 + indent }}
              onClick={() => onTaskClick(task)}
              data-testid={`task-row-${task.id}`}
            >
              {children ? (
                <span
                  className={`${styles.expandArrow} ${expanded ? styles.expanded : ''}`}
                  onClick={(e) => toggleExpand(e, task.id)}
                  data-testid={`expand-${task.id}`}
                >
                  &#9654;
                </span>
              ) : (
                level > 0 && <span style={{ width: 16 }} />
              )}
              <div
                className={styles.statusIcon}
                style={{ backgroundColor: statusCfg?.color || '#8C8C8C' }}
              >
                {task.progress >= 100 ? '✓' : ''}
              </div>
              <div className={styles.taskInfo}>
                <span className={styles.taskName}>{task.title}</span>
                {task.description && (
                  <span className={styles.taskDescription}>{task.description}</span>
                )}
                <span className={styles.taskSubInfo}>
                  {task.assigneeName || task.assigneeId || '-'}
                  {task.plannedEnd ? ` · ${task.plannedEnd.slice(0, 10)}` : ''}
                </span>
              </div>
              <div className={styles.taskRight}>
                <span className={styles.progressPercent}>{task.progress || 0}%</span>
                {task.milestone ? (
                  <StarFilled className={styles.starIcon} />
                ) : (
                  <StarOutlined className={`${styles.starIcon} ${styles.inactive}`} />
                )}
                {(() => {
                  const files = taskFiles[task.id];
                  if (files && files.length > 0) {
                    const firstFile = files[0];
                    if (isImageFile(firstFile.name)) {
                      return (
                        <div className={styles.thumbnail} data-testid={`task-thumb-${task.id}`}>
                          {firstFile.url ? (
                            <img src={firstFile.url} alt={firstFile.name} className={styles.thumbnailImg} />
                          ) : (
                            <FileImageOutlined style={{ color: '#52C41A', fontSize: 18 }} />
                          )}
                        </div>
                      );
                    }
                    return (
                      <div className={styles.thumbnail} data-testid={`task-thumb-${task.id}`}>
                        {getTaskFileIcon(firstFile.name)}
                      </div>
                    );
                  }
                  return (
                    <div className={styles.thumbnail} data-testid={`task-thumb-${task.id}`}>
                      <FileTextOutlined style={{ color: '#D9D9D9', fontSize: 16 }} />
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
