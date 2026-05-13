import { Tag } from 'antd';
import { TaskPriority } from '@/types';

interface TaskCardProps {
  code?: string;
  id: string | number;
  name: string;
  status: string | number;
  statusLabel: string;
  statusColor: string;
  priority: string | number;
  priorityLabel: string;
  priorityColor: string;
  assignee?: string | number;
  dueDate?: string;
}

export default function TaskCard({
  code,
  id,
  name,
  priority,
  statusLabel,
  statusColor,
  priorityLabel,
  priorityColor,
  assignee,
  dueDate,
}: TaskCardProps) {
  const getPriorityBarColor = (p: string | number): string => {
    if (p === TaskPriority.URGENT || p === 'urgent') return '#FF4D4F';
    if (p === TaskPriority.HIGH || p === 'high') return '#FF9C00';
    if (p === TaskPriority.LOW || p === 'low') return '#52C41A';
    return '#FAAD14';
  };

  return (
    <div
      className="task-card"
      data-testid={`task-card-${id}`}
      style={{ borderLeft: `3px solid ${getPriorityBarColor(priority)}`, paddingLeft: 12 }}
    >
      <div className="task-card-header">
        <span className="task-card-code" data-testid="task-code">{code || id}</span>
        <Tag
          color={statusColor}
          style={{
            fontSize: 12,
            padding: '2px 8px',
            borderRadius: 100,
            margin: 0,
          }}
        >
          {statusLabel}
        </Tag>
      </div>
      <div className="task-card-name">{name}</div>
      <div className="task-card-footer">
        <Tag
          style={{
            fontSize: 12,
            padding: '2px 8px',
            borderRadius: 100,
            color: priorityColor,
            borderColor: priorityColor,
            background: `${priorityColor}10`,
          }}
        >
          {priorityLabel}
        </Tag>
        {assignee && <span className="task-card-assignee">{assignee}</span>}
        {dueDate && <span className="task-card-due">{dueDate}</span>}
      </div>
    </div>
  );
}
