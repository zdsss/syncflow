import { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Input, message, Breadcrumb, Modal, Descriptions, Table, Tag, Spin } from 'antd';
import { UploadOutlined, SearchOutlined, FolderOutlined, HomeOutlined, DeleteOutlined, FolderAddOutlined, DownloadOutlined } from '@ant-design/icons';
import StorageStatsBar from './components/StorageStatsBar';
import FileTypeTabs from './components/FileTypeTabs';
import FileListTable from './components/FileListTable';
import UploadZone from './components/UploadZone';
import BatchActionBar from './components/BatchActionBar';
import { uploadFile, getFileBreadcrumbs, getFileInfo, deleteFile, batchDeleteFiles, getBatchDownloadInfo, createFolder, getFileContent } from '@/services/file.service';
import { useAuthStore } from '@/stores/useAuthStore';
import styles from './files.module.css';

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface FileInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  version: number;
  uploadedAt: string;
  permissions: string[];
  versions: { version: number; uploadedAt: string; uploader: string }[];
}

interface PreviewFile {
  id: string;
  name: string;
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp', '.webp'];
const TEXT_EXTENSIONS = ['.txt', '.md', '.json', '.csv', '.xml', '.yaml', '.yml', '.log'];

function getPreviewType(filename: string): 'image' | 'text' | 'unsupported' {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (TEXT_EXTENSIONS.includes(ext)) return 'text';
  return 'unsupported';
}

export default function FilesPage() {
  const [uploadVisible, setUploadVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderCreating, setFolderCreating] = useState(false);
  const [contentPreviewVisible, setContentPreviewVisible] = useState(false);
  const [contentPreviewFile, setContentPreviewFile] = useState<PreviewFile | null>(null);
  const [textContent, setTextContent] = useState<string>('');
  const [contentLoading, setContentLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore((s) => s.currentUser);

  useEffect(() => {
    if (currentFolderId) {
      getFileBreadcrumbs(currentFolderId)
        .then((res) => {
          setBreadcrumbs(res.data?.data ?? res.data ?? []);
        })
        .catch(() => {
          setBreadcrumbs([]);
        });
    } else {
      setBreadcrumbs([]);
    }
  }, [currentFolderId]);

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const handleBreadcrumbNavigate = (folderId: string | null) => {
    setCurrentFolderId(folderId);
  };

  const handleFileClick = async (fileId: string) => {
    try {
      const res = await getFileInfo(fileId);
      const info = res.data?.data ?? res.data;
      setPreviewFile(info);
      setPreviewVisible(true);
    } catch {
      message.error('获取文件信息失败');
    }
  };

  const handlePreviewClose = () => {
    setPreviewVisible(false);
    setPreviewFile(null);
  };

  const handleDelete = async (fileId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定删除此文件吗？删除后将无法恢复。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteFile(fileId);
          message.success('文件已删除');
          setPreviewVisible(false);
          setPreviewFile(null);
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  const handleUpload = async (file: File) => {
    if (!currentUser) {
      message.error('请先登录');
      return;
    }
    try {
      await uploadFile(file, { uploaderId: currentUser.id });
      message.success('上传成功');
    } catch {
      message.error('上传失败');
    }
  };

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    // Search is handled client-side or can be extended to pass to API
  };

  const handleBatchDelete = async () => {
    try {
      await batchDeleteFiles(selectedFileIds);
      message.success(`已删除 ${selectedFileIds.length} 个文件`);
      setSelectedFileIds([]);
    } catch {
      message.error('批量删除失败');
    }
  };

  const handleBatchDownload = async () => {
    try {
      const res = await getBatchDownloadInfo(selectedFileIds);
      const info = res.data?.data ?? res.data;
      const totalSize = info?.totalSize ?? 0;
      const mb = (totalSize / (1024 * 1024)).toFixed(2);
      message.info(`已选择文件总大小：${mb} MB`);
    } catch {
      message.error('获取下载信息失败');
    }
  };

  const handleFilePreview = async (file: { id: string; name: string }) => {
    setContentPreviewFile({ id: file.id, name: file.name });
    setContentPreviewVisible(true);
    const previewType = getPreviewType(file.name);
    if (previewType === 'text') {
      setContentLoading(true);
      setTextContent('');
      try {
        const text = await getFileContent(file.id);
        setTextContent(text);
      } catch {
        setTextContent('加载文件内容失败');
      } finally {
        setContentLoading(false);
      }
    }
  };

  const handleContentPreviewClose = () => {
    setContentPreviewVisible(false);
    setContentPreviewFile(null);
    setTextContent('');
  };

  const previewType = contentPreviewFile ? getPreviewType(contentPreviewFile.name) : 'unsupported';
  const previewWidth = previewType === 'image' ? 800 : 600;

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      message.warning('请输入文件夹名称');
      return;
    }
    setFolderCreating(true);
    try {
      await createFolder({
        name: folderName.trim(),
        parentFolderId: currentFolderId ?? undefined,
      });
      message.success('文件夹创建成功');
      setFolderModalVisible(false);
      setFolderName('');
      // Trigger FileListTable refresh via key change or callback
      // For now, close modal and the list will be refreshed on next navigation
    } catch {
      message.error('文件夹创建失败');
    } finally {
      setFolderCreating(false);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setUploadVisible(true);
    }
  }, []);

  const breadcrumbItems = [
    {
      title: (
        <span onClick={() => handleBreadcrumbNavigate(null)} style={{ cursor: 'pointer' }}>
          <HomeOutlined /> 项目文件
        </span>
      ),
    },
    ...breadcrumbs.map((item) => ({
      title: (
        <span
          onClick={() => handleBreadcrumbNavigate(item.id)}
          style={{ cursor: 'pointer' }}
        >
          <FolderOutlined /> {item.name}
        </span>
      ),
    })),
  ];

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
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadVisible(true)}>
            上传文件
          </Button>
          <Button icon={<FolderAddOutlined />} onClick={() => setFolderModalVisible(true)}>
            新建文件夹
          </Button>
        </div>
      </div>

      <StorageStatsBar />

      {currentFolderId && (
        <div data-testid="file-breadcrumbs">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      )}

      <div className={styles.body}>
        <FileTypeTabs />
        <FileListTable onFolderClick={handleFolderClick} onFileClick={(id) => { handleFileClick(id); }} onSelectionChange={setSelectedFileIds} onPreview={(file) => { handleFilePreview(file); }} />
      </div>

      {selectedFileIds.length > 0 && (
        <BatchActionBar
          selectedCount={selectedFileIds.length}
          onDelete={handleBatchDelete}
          onDownload={handleBatchDownload}
          onCancel={() => setSelectedFileIds([])}
        />
      )}

      <div className={styles.dropOverlay}>
        <UploadZone visible={uploadVisible} onVisibleChange={setUploadVisible} />
      </div>

      <Modal
        title="文件预览"
        open={previewVisible}
        onCancel={handlePreviewClose}
        footer={null}
        width={640}
      >
        {previewFile && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="文件名">{previewFile.name}</Descriptions.Item>
              <Descriptions.Item label="类型">{previewFile.type}</Descriptions.Item>
              <Descriptions.Item label="大小">{previewFile.size} B</Descriptions.Item>
              <Descriptions.Item label="当前版本">版本 {previewFile.version}</Descriptions.Item>
              <Descriptions.Item label="上传时间">{previewFile.uploadedAt}</Descriptions.Item>
              <Descriptions.Item label="权限">
                {previewFile.permissions?.map((p) => (
                  <Tag key={p}>{p}</Tag>
                ))}
              </Descriptions.Item>
            </Descriptions>
            {previewFile.versions && previewFile.versions.length > 0 && (
              <>
                <h4 style={{ marginTop: 16 }}>版本历史</h4>
                <Table
                  dataSource={previewFile.versions}
                  rowKey="version"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: '版本', dataIndex: 'version', key: 'version' },
                    { title: '上传时间', dataIndex: 'uploadedAt', key: 'uploadedAt' },
                    { title: '上传者', dataIndex: 'uploader', key: 'uploader' },
                  ]}
                />
              </>
            )}
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(previewFile.id)}
                data-testid="delete-file-btn"
              >
                删除文件
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        title="新建文件夹"
        open={folderModalVisible}
        onCancel={() => { setFolderModalVisible(false); setFolderName(''); }}
        onOk={handleCreateFolder}
        confirmLoading={folderCreating}
        okText="创建"
        cancelText="取消"
      >
        <Input
          placeholder="请输入文件夹名称"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          onPressEnter={handleCreateFolder}
          data-testid="folder-name-input"
        />
      </Modal>

      <Modal
        title={`文件预览 - ${contentPreviewFile?.name ?? ''}`}
        open={contentPreviewVisible}
        onCancel={handleContentPreviewClose}
        footer={null}
        width={previewWidth}
        data-testid="content-preview-modal"
      >
        {contentPreviewFile && (
          <>
            {previewType === 'image' && (
              <div style={{ textAlign: 'center' }}>
                <img
                  src={`/api/files/${contentPreviewFile.id}/download`}
                  alt={contentPreviewFile.name}
                  style={{ maxWidth: '100%', maxHeight: '600px' }}
                  data-testid="preview-image"
                />
              </div>
            )}
            {previewType === 'text' && (
              contentLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin tip="加载中..." />
                </div>
              ) : (
                <pre
                  style={{
                    maxHeight: '500px',
                    overflow: 'auto',
                    background: '#f5f5f5',
                    padding: 16,
                    borderRadius: 4,
                    fontSize: 13,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                  data-testid="preview-text"
                >
                  {textContent}
                </pre>
              )
            )}
            {previewType === 'unsupported' && (
              <div style={{ textAlign: 'center', padding: 40 }} data-testid="preview-unsupported">
                <p style={{ fontSize: 16, color: '#666', marginBottom: 16 }}>
                  暂不支持预览此文件类型
                </p>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  href={`/api/files/${contentPreviewFile.id}/download`}
                  data-testid="preview-download-btn"
                >
                  下载文件
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
