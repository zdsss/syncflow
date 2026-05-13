import { Card } from 'antd';
import type { ReactNode } from 'react';

interface CardPanelProps {
  title?: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  bordered?: boolean;
  hoverable?: boolean;
}

export default function CardPanel({ title, extra, children, className, style, bordered = false, hoverable = false }: CardPanelProps) {
  return (
    <Card
      title={title}
      extra={extra}
      className={className}
      style={{
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        ...style,
      }}
      variant={bordered ? undefined : 'borderless'}
      hoverable={hoverable}
    >
      {children}
    </Card>
  );
}
