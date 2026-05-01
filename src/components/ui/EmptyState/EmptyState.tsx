import { Empty, Button } from 'antd';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, description, actionText, onAction }: EmptyStateProps) {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center' }}>
      <Empty
        image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#333333', marginBottom: 4 }}>{title}</div>
            {description && <div style={{ fontSize: 14, color: '#999999' }}>{description}</div>}
          </div>
        }
      >
        {actionText && onAction && (
          <Button type="primary" onClick={onAction}>{actionText}</Button>
        )}
      </Empty>
    </div>
  );
}
