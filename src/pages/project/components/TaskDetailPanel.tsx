import { useState, useEffect, useCallback, useMemo } from 'react';
import { Progress, Button, Select, Modal, message, Input, Upload, Tooltip, Space } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SwapOutlined,
  AimOutlined,
  PaperClipOutlined,
  UploadOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FileOutlined,
  UserOutlined,
  CaretRightOutlined,
  PauseOutlined,
  StopOutlined,
  SyncOutlined,
  StarOutlined,
  StarFilled,
} from '@ant-design/icons';
import type { Task } from '@/types';
import { TaskStatus, TaskPriority } from '@/types';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/constants/enums';
import { getComments, createComment } from '@/services/comment.service';
import { getFiles } from '@/services/file.service';
import dayjs from 'dayjs';
import styles from './TaskDetailPanel.module.css';

interface TaskDetailPanelProps {
  task: Task | null;
  onSave?: (task: Partial<Task> & { id: string }) => void;
  onAssign?: (taskId: string, userId: string) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
  onDelete?: (taskId: string) => void;
  assigneeOptions?: { value: string; label: string }[];
}

interface CommentItem {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
}

interface AttachmentItem {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
}

const ROLE_OPTIONS = [
  { key: 'designer', label: '设计人员' },
  { key: 'implementer', label: '施工人员' },
  { key: 'reviewer', label: '审核人' },
  { key: 'participant', label: '参与人' },
] as const;

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return <FilePdfOutlined style={{ color: '#FF4D4F', fontSize: 20 }} />;
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) return <FileImageOutlined style={{ color: '#52C41A', fontSize: 20 }} />;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileExcelOutlined style={{ color: '#52C41A', fontSize: 20 }} />;
  if (['doc', 'docx'].includes(ext)) return <FileWordOutlined style={{ color: '#3366FF', fontSize: 20 }} />;
  return <FileOutlined style={{ color: '#8C8C8C', fontSize: 20 }} />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function TaskDetailPanel({ task, onSave, onAssign, onStatusChange, onDelete, assigneeOptions }: TaskDetailPanelProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [assignVisible, setAssignVisible] = useState(false);
  const [statusVisible, setStatusVisible] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [roleAssignments, setRoleAssignments] = useState<Record<string, string>>({});

  useEffect(() => {
    if (task) {
      setEditName(task.title ?? task.name ?? '');
      setEditing(false);
      setAssignVisible(false);
      setStatusVisible(false);
      setRoleAssignments({});
      loadComments(task.id);
      loadAttachments(task.projectId);
    }
  }, [task?.id]);

  const loadComments = async (taskId: string) => {
    try {
      const res = await getComments(taskId);
      setComments((res as { data?: CommentItem[] }).data || []);
    } catch {
      setComments([]);
    }
  };

  const loadAttachments = async (projectId: string) => {
    setAttachmentsLoading(true);
    try {
      const res = await getFiles({ projectId: Number(projectId), pageSize: 50 });
      const files = (res as { data?: Array<{ id: string; name: string; type: string; size?: number; createdAt?: string }> }).data || [];
      setAttachments(files.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size || 0,
        createdAt: f.createdAt,
      })));
    } catch {
      setAttachments([]);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const handleRoleChange = useCallback((roleKey: string, userId: string) => {
    setRoleAssignments((prev) => ({ ...prev, [roleKey]: userId }));
    if (task && onAssign) {
      onAssign(task.id, userId);
    }
  }, [task, onAssign]);

  const handleAddComment = useCallback(async () => {
    if (!commentText.trim() || !task) return;
    setCommentLoading(true);
    try {
      await createComment(task.id, {
        content: commentText.trim(),
      });
      setCommentText('');
      await loadComments(task.id);
    } catch {
      message.error('评论失败');
    } finally {
      setCommentLoading(false);
    }
  }, [commentText, task]);

  if (!task) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>请选择任务</div>
      </div>
    );
  }

  const statusCfg = TASK_STATUS_CONFIG[task.status];
  const priorityCfg = TASK_PRIORITY_CONFIG[task.priority];

  const handleNameSave = () => {
    if (!editName.trim()) {
      message.warning('任务名称不能为空');
      return;
    }
    onSave?.({ id: task.id, name: editName });
    setEditing(false);
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除任务"${task.title ?? task.name}"吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => onDelete?.(task.id),
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          {editing ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onPressEnter={handleNameSave}
                className={styles.taskNameInput}
                data-testid="panel-edit-name"
              />
              <Button size="small" type="primary" onClick={handleNameSave}>保存</Button>
              <Button size="small" onClick={() => { setEditing(false); setEditName(task.title ?? task.name ?? ''); }}>取消</Button>
            </div>
          ) : (
            <div className={styles.taskName} onClick={() => setEditing(true)} data-testid="panel-task-name">
              {task.title ?? task.name}
            </div>
          )}
          <span
            className={styles.statusBadge}
            style={{
              color: statusCfg?.color || '#8C8C8C',
              backgroundColor: statusCfg?.bgColor || '#F5F5F5',
            }}
          >
            {statusCfg?.label || task.status}
          </span>
        </div>

        {/* Operation bar: completion % + action buttons */}
        <div className={styles.operationBar} data-testid="operation-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <Progress
              percent={task.progress}
              size="small"
              style={{ flex: 1, minWidth: 80 }}
              data-testid="operation-progress"
            />
            <span style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>{task.progress}%</span>
          </div>
          <Space size={4} wrap>
            {task.status === TaskStatus.PENDING && (
              <Tooltip title="开始">
                <Button size="small" icon={<CaretRightOutlined />} type="primary" data-testid="op-start"
                  onClick={() => onStatusChange?.(String(task.id), String(TaskStatus.IN_PROGRESS))} />
              </Tooltip>
            )}
            {task.status === TaskStatus.IN_PROGRESS && (
              <Tooltip title="暂停">
                <Button size="small" icon={<PauseOutlined />} data-testid="op-pause"
                  onClick={() => onStatusChange?.(String(task.id), String(TaskStatus.ON_HOLD))} />
              </Tooltip>
            )}
            {task.status === TaskStatus.ON_HOLD && (
              <Tooltip title="恢复">
                <Button size="small" icon={<CaretRightOutlined />} type="primary" data-testid="op-resume"
                  onClick={() => onStatusChange?.(String(task.id), String(TaskStatus.IN_PROGRESS))} />
              </Tooltip>
            )}
            {(task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.PENDING_REVIEW || task.status === TaskStatus.ON_HOLD) && (
              <Tooltip title="停止">
                <Button size="small" icon={<StopOutlined />} danger data-testid="op-stop"
                  onClick={() => onStatusChange?.(String(task.id), String(TaskStatus.CANCELLED))} />
              </Tooltip>
            )}
            <Tooltip title={task.isWatching ? '取消关注' : '关注'}>
              <Button
                size="small"
                icon={task.isWatching ? <StarFilled style={{ color: '#FAAD14' }} /> : <StarOutlined />}
                data-testid="op-watch"
              />
            </Tooltip>
            <Tooltip title="编辑">
              <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(true)} data-testid="op-edit" />
            </Tooltip>
          </Space>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>业务类型</span>
              <span className={styles.infoValue}>{task.type || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>负责人</span>
              <span className={styles.infoValue}>{task.assigneeId || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>状态</span>
              <span className={styles.infoValue}>{statusCfg?.label || task.status}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>优先级</span>
              <span className={styles.infoValue} style={{ color: priorityCfg?.color }}>
                {priorityCfg?.label || task.priority}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>创建时间</span>
              <span className={styles.infoValue}>{task.createdAt ? dayjs(task.createdAt).format('YYYY-MM-DD') : '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>参与者</span>
              <span className={styles.infoValue}>{task.participants?.length || 0}人</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>日期</div>
          <div className={styles.dateGrid}>
            <div className={styles.dateItem}>
              <span className={styles.dateLabel}>计划开始</span>
              <span className={styles.dateValue}>{task.plannedStart ? dayjs(task.plannedStart).format('YYYY-MM-DD') : '-'}</span>
            </div>
            <div className={styles.dateItem}>
              <span className={styles.dateLabel}>计划结束</span>
              <span className={styles.dateValue}>{task.plannedEnd ? dayjs(task.plannedEnd).format('YYYY-MM-DD') : '-'}</span>
            </div>
            <div className={styles.dateItem}>
              <span className={styles.dateLabel}>实际开始</span>
              <span className={styles.dateValue}>{task.actualStart ? dayjs(task.actualStart).format('YYYY-MM-DD') : '-'}</span>
            </div>
            <div className={styles.dateItem}>
              <span className={styles.dateLabel}>实际结束</span>
              <span className={styles.dateValue}>{task.actualEnd ? dayjs(task.actualEnd).format('YYYY-MM-DD') : '-'}</span>
            </div>
          </div>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.sectionTitle}>进度</div>
          <Progress
            percent={task.progress || 0}
            strokeColor={task.progress >= 100 ? '#52C41A' : '#3366FF'}
            railColor="#F0F0F0"
          />
        </div>

        <div className={styles.attachmentsSection}>
          <div className={styles.sectionTitle}>
            <PaperClipOutlined style={{ marginRight: 4 }} />
            附件记录
            <span className={styles.attachmentCount}>{attachments.length}</span>
          </div>
          <div className={styles.attachmentsList}>
            {attachmentsLoading && <span style={{ color: '#BFBFBF', fontSize: 12 }}>加载中...</span>}
            {!attachmentsLoading && attachments.length === 0 && (
              <span style={{ color: '#BFBFBF', fontSize: 12 }}>暂无附件</span>
            )}
            {attachments.map((file) => (
              <div key={file.id} className={styles.attachmentItem} data-testid={`attachment-${file.id}`}>
                <span className={styles.attachmentIcon}>{getFileIcon(file.name)}</span>
                <div className={styles.attachmentInfo}>
                  <span className={styles.attachmentName}>{file.name}</span>
                  <span className={styles.attachmentMeta}>
                    {formatFileSize(file.size)} · {dayjs(file.createdAt).format('YYYY-MM-DD')}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Button size="small" type="link" icon={<UploadOutlined />} className={styles.uploadBtn} data-testid="upload-attachment-btn">
            上传附件
          </Button>
        </div>

        <div className={styles.commentsSection}>
          <div className={styles.sectionTitle}>评论</div>
          <div className={styles.commentsList}>
            {comments.length === 0 && (
              <span style={{ color: '#BFBFBF', fontSize: 12 }}>暂无评论</span>
            )}
            {comments.map((c) => (
              <div key={c.id} className={styles.commentItem}>
                <span className={styles.commentAuthor}>{c.authorId}</span>
                <span className={styles.commentTime}>{dayjs(c.createdAt).format('MM-DD HH:mm')}</span>
                <div className={styles.commentContent}>{c.content}</div>
              </div>
            ))}
          </div>
          <div className={styles.commentInput}>
            <Input
              size="small"
              placeholder="添加评论..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onPressEnter={handleAddComment}
              disabled={commentLoading}
            />
            <Button size="small" type="primary" onClick={handleAddComment} loading={commentLoading}>
              发送
            </Button>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>参与者</div>
          <div className={styles.roleGrid}>
            {ROLE_OPTIONS.map((role) => (
              <div key={role.key} className={styles.roleItem} data-testid={`role-${role.key}`}>
                <span className={styles.roleLabel}>{role.label}</span>
                <Select
                  size="small"
                  placeholder={`选择${role.label}`}
                  style={{ width: '100%' }}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={assigneeOptions}
                  value={roleAssignments[role.key] || undefined}
                  onChange={(val) => handleRoleChange(role.key, val)}
                  suffixIcon={<UserOutlined style={{ color: '#8C8C8C' }} />}
                />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => setEditing(true)}
            data-testid="panel-btn-edit"
          >
            编辑
          </Button>
          {assignVisible ? (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <Select
                placeholder="选择负责人"
                style={{ minWidth: 100 }}
                size="small"
                options={assigneeOptions}
                value={selectedAssignee || undefined}
                onChange={(val) => setSelectedAssignee(val)}
              />
              <Button size="small" type="primary" onClick={() => {
                if (!selectedAssignee) { message.warning('请选择负责人'); return; }
                onAssign?.(task.id, selectedAssignee);
                setAssignVisible(false);
                setSelectedAssignee('');
              }}>确认</Button>
              <Button size="small" onClick={() => { setAssignVisible(false); setSelectedAssignee(''); }}>取消</Button>
            </div>
          ) : null}
          {statusVisible ? (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <Select
                placeholder="选择状态"
                style={{ minWidth: 100 }}
                size="small"
                options={Object.entries(TaskStatus).map(([, val]) => ({
                  value: val,
                  label: TASK_STATUS_CONFIG[val]?.label || val,
                }))}
                value={selectedStatus || undefined}
                onChange={(val) => setSelectedStatus(val)}
              />
              <Button size="small" type="primary" onClick={() => {
                if (!selectedStatus) { message.warning('请选择状态'); return; }
                onStatusChange?.(task.id, selectedStatus);
                setStatusVisible(false);
                setSelectedStatus('');
              }}>确认</Button>
              <Button size="small" onClick={() => { setStatusVisible(false); setSelectedStatus(''); }}>取消</Button>
            </div>
          ) : (
            <Button icon={<SwapOutlined />} size="small" onClick={() => setStatusVisible(true)} data-testid="panel-btn-status">
              状态变更
            </Button>
          )}
          <Button danger icon={<DeleteOutlined />} size="small" onClick={handleDelete} data-testid="panel-btn-delete">
            删除
          </Button>
        </div>
      </div>
    </div>
  );
}
