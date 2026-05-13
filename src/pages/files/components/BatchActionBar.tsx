import { useState } from 'react';
import { Button, Popconfirm, message } from 'antd';
import { DeleteOutlined, DownloadOutlined, CloseOutlined } from '@ant-design/icons';
import styles from './BatchActionBar.module.css';

interface BatchActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onDownload: () => void;
  onCancel: () => void;
}

export default function BatchActionBar({ selectedCount, onDelete, onDownload, onCancel }: BatchActionBarProps) {
  const [downloading, setDownloading] = useState(false);

  if (selectedCount === 0) return null;

  const handleDownload = async () => {
    setDownloading(true);
    message.loading('正在打包下载...', 0);
    onDownload();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    message.destroy();
    message.success('下载已开始');
    setDownloading(false);
  };

  return (
    <div className={styles.batchBar} data-testid="batch-action-bar">
      <span className={styles.selectionInfo}>已选择 {selectedCount} 个文件</span>
      <span className={styles.divider} />
      <Popconfirm
        title={`确定要删除选中的 ${selectedCount} 个文件吗？`}
        onConfirm={onDelete}
        okText="确定"
        cancelText="取消"
      >
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          size="small"
          className={styles.actionBtn}
          data-testid="batch-delete-btn"
        >
          批量删除
        </Button>
      </Popconfirm>
      <Button
        type="text"
        icon={<DownloadOutlined />}
        size="small"
        className={styles.actionBtn}
        onClick={handleDownload}
        loading={downloading}
        data-testid="batch-download-btn"
      >
        批量下载
      </Button>
      <span className={styles.divider} />
      <Button
        type="text"
        icon={<CloseOutlined />}
        size="small"
        className={styles.cancelBtn}
        onClick={onCancel}
        data-testid="batch-cancel-btn"
      >
        取消选择
      </Button>
    </div>
  );
}
