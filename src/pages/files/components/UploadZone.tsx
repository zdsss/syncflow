import { useCallback, useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { message } from 'antd';
import styles from './UploadZone.module.css';

interface UploadZoneProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}

export default function UploadZone({ visible, onVisibleChange }: UploadZoneProps) {
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((c) => c + 1);
    onVisibleChange(true);
  }, [onVisibleChange]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((c) => {
      const next = c - 1;
      if (next <= 0) {
        onVisibleChange(false);
        return 0;
      }
      return next;
    });
  }, [onVisibleChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0);
    onVisibleChange(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const names = Array.from(files).map((f) => f.name).join(', ');
      message.success(`已接收文件: ${names}`);
    }
  }, [onVisibleChange]);

  if (!visible) return null;

  return (
    <div
      className={styles.overlay}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <UploadOutlined className={styles.icon} />
      <span className={styles.text}>拖拽文件至此上传</span>
    </div>
  );
}
