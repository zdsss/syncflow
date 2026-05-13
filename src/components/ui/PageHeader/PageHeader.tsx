import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
  onBack?: () => void;
  className?: string;
}

export default function PageHeader({ title, subtitle, extra, onBack, className }: PageHeaderProps) {
  return (
    <div className={className} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onBack && (
          <span
            onClick={onBack}
            style={{ cursor: 'pointer', fontSize: 16, color: '#3366FF' }}
            role="button"
            aria-label="返回"
          >
            &larr;
          </span>
        )}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: '#1A1A1A', margin: 0, lineHeight: '36px' }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 14, color: '#666666', margin: '4px 0 0' }}>{subtitle}</p>}
        </div>
      </div>
      {extra && <div>{extra}</div>}
    </div>
  );
}
