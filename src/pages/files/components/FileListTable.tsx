import { useEffect, useState, useCallback } from 'react';
import { Table, Checkbox, Pagination, Modal, Input, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FileTextOutlined,
  FileImageOutlined,
  CodeOutlined,
  FolderOutlined,
  FileExcelOutlined,
  EyeOutlined,
  EditOutlined,
  FolderOpenOutlined,
  DownloadOutlined,
  DeleteOutlined,
  HistoryOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useFileStore } from '@/stores/useFileStore';
import { getFiles, renameFile, deleteFile } from '@/services/file.service';
import type { FileRecord } from '@/types';
import { useAsyncData } from '@/hooks/useAsyncData';
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

interface FileListTableProps {
  onSelectionChange?: (selectedIds: string[]) => void;
  onFolderClick?: (folderId: string) => void;
  onFileClick?: (fileId: string) => void;
  onPreview?: (file: FileRecord) => void;
}

export default function FileListTable({ onSelectionChange, onFolderClick, onFileClick, onPreview }: FileListTableProps = {}) {
  const { files, total, page, pageSize, fileTypeTab, setFiles, setStorageStats, setPagination, setTotal } = useFileStore();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [versionFileId, setVersionFileId] = useState<string>('');
  const [versionFileName, setVersionFileName] = useState<string>('');
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameRecord, setRenameRecord] = useState<FileRecord | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenuFile, setContextMenuFile] = useState<FileRecord | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!contextMenuFile) return;
    const close = () => setContextMenuFile(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [contextMenuFile]);

  const fetcher = useCallback(async () => {
    const params: Record<string, string | number> = { page, pageSize };
    if (fileTypeTab !== 'all') {
      params.type = fileTypeTab;
    }
    const res = await getFiles(params);
    const result = res.data as {
      code: number;
      data: FileRecord[];
      total: number;
      storageStats: { totalFiles: number; usedSpace: number; totalSpace: number };
    };
    setFiles(result.data);
    setTotal(result.total);
    if (result.storageStats) {
      setStorageStats(result.storageStats);
    }
    return result.data;
  }, [page, pageSize, fileTypeTab, setFiles, setTotal, setStorageStats]);

  const { loading, refresh: fetchFiles } = useAsyncData(fetcher, '获取文件列表失败');

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

  const handleStartRename = (record: FileRecord) => {
    setRenameRecord(record);
    setRenameValue(record.name);
    setRenameModalVisible(true);
  };

  const handleConfirmRename = async () => {
    if (!renameRecord) return;
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenameModalVisible(false);
      return;
    }
    try {
      await renameFile(renameRecord.id, trimmed);
      message.success('重命名成功');
      fetchFiles();
    } catch {
      message.error('重命名失败');
    } finally {
      setRenameModalVisible(false);
      setRenameRecord(null);
    }
  };

  const handleDelete = async (record: FileRecord) => {
    try {
      await deleteFile(record.id);
      message.success('删除成功');
      fetchFiles();
    } catch {
      message.error('删除失败');
    }
  };

  const handleShare = async (record: FileRecord) => {
    const link = `https://syncflow.com/share/${record.id}`;
    try {
      await navigator.clipboard.writeText(link);
      message.success('分享链接已复制');
    } catch {
      message.error('复制失败');
    }
  };

  const handleContextMenuAction = (key: string) => {
    if (!contextMenuFile) return;
    const record = contextMenuFile;
    setContextMenuFile(null);
    switch (key) {
      case 'open':
        if (record.type === 'folder') onFolderClick?.(record.id);
        else onFileClick?.(record.id);
        break;
      case 'download':
        message.success('下载开始');
        break;
      case 'rename':
        handleStartRename(record);
        break;
      case 'versions':
        handleShowVersions(record);
        break;
      case 'delete':
        handleDelete(record);
        break;
    }
  };

  const contextMenuItems = [
    { key: 'open', icon: <FolderOpenOutlined />, label: '打开' },
    { key: 'download', icon: <DownloadOutlined />, label: '下载' },
    { key: 'rename', icon: <EditOutlined />, label: '重命名' },
    { key: 'versions', icon: <HistoryOutlined />, label: '版本历史' },
    { type: 'divider' as const },
    { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true },
  ];

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
      width: 200,
      render: (_: unknown, record: FileRecord) => (
        <span>
          {onPreview && record.type !== 'folder' && (
            <button
              className={styles.versionBtn}
              onClick={() => onPreview(record)}
              data-testid={`preview-btn-${record.id}`}
            >
              <EyeOutlined /> 预览
            </button>
          )}
          <button
            className={styles.versionBtn}
            onClick={() => handleStartRename(record)}
            data-testid={`rename-btn-${record.id}`}
          >
            <EditOutlined /> 重命名
          </button>
          <button
            className={styles.versionBtn}
            onClick={() => handleShowVersions(record)}
          >
            版本历史
          </button>
          <button
            className={styles.versionBtn}
            onClick={() => handleShare(record)}
            data-testid={`share-btn-${record.id}`}
          >
            <ShareAltOutlined /> 分享
          </button>
        </span>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
      onSelectionChange?.(keys.map(String));
    },
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
        onRow={(record) => ({
          onContextMenu: (e: React.MouseEvent) => {
            e.preventDefault();
            setContextMenuFile(record);
            setContextMenuPos({ x: e.clientX, y: e.clientY });
          },
        })}
      />
      {contextMenuFile && (
        <div
          data-testid="context-menu"
          style={{
            position: 'fixed',
            left: contextMenuPos.x,
            top: contextMenuPos.y,
            zIndex: 1050,
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05)',
            padding: '4px 0',
            minWidth: 160,
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {contextMenuItems.map((item) =>
            item.type === 'divider' ? (
              <div key="divider" style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
            ) : (
              <div
                key={item.key}
                data-testid={`context-menu-${item.key}`}
                style={{
                  padding: '5px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: item.danger ? '#ff4d4f' : undefined,
                  fontSize: 14,
                }}
                onClick={() => handleContextMenuAction(item.key)}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f5f5f5'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {item.icon} {item.label}
              </div>
            ),
          )}
        </div>
      )}
      <div className={styles.paginationWrap}>
        <Pagination
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
      <Modal
        title="重命名"
        open={renameModalVisible}
        onCancel={() => { setRenameModalVisible(false); setRenameRecord(null); }}
        onOk={handleConfirmRename}
        okText="确定"
        cancelText="取消"
        data-testid="rename-modal"
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onPressEnter={handleConfirmRename}
          placeholder="请输入新文件名"
          data-testid="rename-modal-input"
        />
      </Modal>
    </div>
  );
}
