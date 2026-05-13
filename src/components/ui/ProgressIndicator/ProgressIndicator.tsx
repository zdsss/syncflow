import { Progress } from 'antd';

interface ProgressIndicatorProps {
  percent: number;
  size?: 'small' | 'default';
  showText?: boolean;
  className?: string;
  status?: 'normal' | 'success' | 'warning' | 'danger';
}

const STATUS_COLORS: Record<string, string> = {
  normal: '#3366FF',
  success: '#52C41A',
  warning: '#FAAD14',
  danger: '#FF4D4F',
};

export default function ProgressIndicator({
  percent,
  size = 'default',
  showText = true,
  className,
  status = 'normal',
}: ProgressIndicatorProps) {
  const height = size === 'small' ? 4 : 8;

  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Progress
        percent={clamped}
        showInfo={false}
        strokeColor={STATUS_COLORS[status] || STATUS_COLORS.normal}
        railColor="#F0F0F0"
        style={{ flex: 1, height }}
        size="medium"
      />
      {showText && (
        <span style={{ fontSize: 14, color: '#333333', minWidth: 40 }}>{clamped}%</span>
      )}
    </div>
  );
}
