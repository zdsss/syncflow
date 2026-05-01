import { useEffect, useState, useCallback } from 'react';
import { Table, Checkbox, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FileTextOutlined,
  FileImageOutlined,
  CodeOutlined,
  FolderOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useFileStore } from '@/stores/useFileStore';
import { getFiles } from '@/services/file.service';
import type { FileRecord } from '@/types';
import FileVersionModal from './FileVersionModal';
import styles from './FileListTable.module.css';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  if (kb >= 1) return `${kb.toFixed(1)} KB`;
  return `${bytes} B`;
}

function getFileIcon(type: FileRecord['type']) {
  switch (type) {
    case 'document':
      return <FileTextOutlined style={{ color: '#3366FF' }} />;
    case 'image':
      return <FileImageOutlined style={{ color: '#52C41A' }} />;
    case 'code':
      return <CodeOutlined style={{ color: '#722ED1' }} />;
    case 'folder':
      return <FolderOutlined style={{ color: '#FAAD14' }} />;
    case 'spreadsheet':
      return <FileExcelOutlined style={{ color: '#52C41A' }} />;
    default:
      return <FileTextOutlined style={{ color: '#666666' }} />;
  }
}

export default function FileListTable() {
  const { files, total, page, pageSize, loading, fileTypeTab, setFiles, setStorageStats, setPagination, setTotal, setLoading } = useFileStore();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [versionFileId, setVersionFileId] = useState<string>('');
  const [versionFileName, setVersionFileName] = useState<string>('');

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        pageSize,
      };
      if (fileTypeTab !== 'all') {
        params.type = fileTypeTab;
      }
      const res = await getFiles(params) as {
        code: number;
        data: FileRecord[];
        total: number;
        storageStats: { totalFiles: number; usedSpace: number; totalSpace: number };
      };
      setFiles(res.data);
      setTotal(res.total);
      if (res.storageStats) {
        setStorageStats(res.storageStats);
      }
    } catch {
      message.error('获取文件列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, fileTypeTab, setFiles, setTotal, setStorageStats, setLoading]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPagination(newPage, newPageSize);
  };

  const handleShowVersions = (record: FileRecord) => {
    setVersionFileId(record.id);
    setVersionFileName(record.name);
    setVersionModalVisible(true);
  };

  const columns: ColumnsType<FileRecord> = [
    {
      title: '',
      dataIndex: 'type',
      width: 40,
      render: (type: FileRecord['type']) => (
        <span className={styles.fileIcon}>{getFileIcon(type)}</span>
      ),
    },
    {
      title: '文件名',
      dataIndex: 'name',
      ellipsis: true,
      render: (name: string) => (
        <span className={styles.fileName}>{name}</span>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      width: 100,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '上传人',
      dataIndex: 'uploaderName',
      width: 100,
      render: (name: string, record: FileRecord) => name || record.uploaderId,
    },
    {
      title: '操作',
      width: 100,
      render: (_: unknown, record: FileRecord) => (
        <button
          className={styles.versionBtn}
          onClick={() => handleShowVersions(record)}
        >
          版本历史
        </button>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <div className={styles.tableWrap}>
      <Table<FileRecord>
        rowSelection={rowSelection}
        columns={columns}
        dataSource={files}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
      />
      <div className={styles.paginationWrap}>
        <Table.Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          showTotal={(t) => `共 ${t} 条`}
          onChange={handlePageChange}
        />
      </div>
      <FileVersionModal
        visible={versionModalVisible}
        fileId={versionFileId}
        fileName={versionFileName}
        onClose={() => setVersionModalVisible(false)}
      />
    </div>
  );
}
