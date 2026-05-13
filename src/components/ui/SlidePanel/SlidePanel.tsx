import { Drawer } from 'antd';
import type { ReactNode } from 'react';

interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: number;
  placement?: 'left' | 'right';
  className?: string;
}

export default function SlidePanel({
  open,
  onClose,
  title,
  children,
  width = 400,
  placement = 'right',
  className,
}: SlidePanelProps) {
  return (
    <Drawer
      className={className}
      open={open}
      onClose={onClose}
      title={title}
      placement={placement}
      styles={{ body: { padding: 16 }, wrapper: { width } }}
    >
      {children}
    </Drawer>
  );
}
