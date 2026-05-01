import { useState, useCallback, useRef } from 'react';
import { Button, Input, message } from 'antd';
import { UploadOutlined, SearchOutlined } from '@ant-design/icons';
import StorageStatsBar from './components/StorageStatsBar';
import FileTypeTabs from './components/FileTypeTabs';
import FileListTable from './components/FileListTable';
import UploadZone from './components/UploadZone';
import styles from './files.module.css';

export default function FilesPage() {
  const [uploadVisible, setUploadVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleUpload = () => {
    message.info('上传功能开发中...');
  };

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    // Search is handled client-side or can be extended to pass to API
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setUploadVisible(true);
    }
  }, []);

  return (
    <div
      className={styles.page}
      onDragEnter={handleDragEnter}
      ref={containerRef}
    >
      <div className={styles.header}>
        <h1 className={styles.title}>项目文件</h1>
        <div className={styles.headerActions}>
          <Input
            placeholder="搜索文件..."
            prefix={<SearchOutlined />}
            className={styles.searchInput}
            value={searchKeyword}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
          />
          <Button type="primary" icon={<UploadOutlined />} onClick={handleUpload}>
            上传文件
          </Button>
        </div>
      </div>

      <StorageStatsBar />

      <div className={styles.body}>
        <FileTypeTabs />
        <FileListTable />
      </div>

      <div className={styles.dropOverlay}>
        <UploadZone visible={uploadVisible} onVisibleChange={setUploadVisible} />
      </div>
    </div>
  );
}
