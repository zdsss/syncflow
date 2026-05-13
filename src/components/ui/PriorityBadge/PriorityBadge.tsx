import { TaskPriority } from '@/types';
import { TASK_PRIORITY_CONFIG } from '@/constants/enums';

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export default function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = TASK_PRIORITY_CONFIG[priority];

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: '20px',
        color: config.color,
        backgroundColor: config.bgColor,
      }}
    >
      {config.label}
    </span>
  );
}
