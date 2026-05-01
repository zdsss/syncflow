import { TaskStatus } from '@/types';
import { TASK_STATUS_CONFIG } from '@/constants/enums';

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = TASK_STATUS_CONFIG[status];

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
