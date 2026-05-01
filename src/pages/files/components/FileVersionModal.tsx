import { Modal, Table, Button, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, UndoOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from './FileVersionModal.module.css';

interface VersionEntry {
  version: string;
  uploadTime: string;
  uploader: string;
}

interface FileVersionModalProps {
  visible: boolean;
  fileId: string;
  fileName: string;
  onClose: () => void;
}

function generateMockVersions(): VersionEntry[] {
  const count = Math.floor(Math.random() * 3) + 3; // 3-5 versions
  const versions: VersionEntry[] = [];
  const uploaders = ['张伟', '李娜', '邓智豪', '王美玲', '陈思远'];
  for (let i = 0; i < count; i++) {
    versions.push({
      version: `v${i + 1}.0`,
      uploadTime: dayjs().subtract(i * 5, 'day').format('YYYY-MM-DD HH:mm'),
      uploader: uploaders[i % uploaders.length],
    });
  }
  return versions;
}

export default function FileVersionModal({ visible, fileId, fileName, onClose }: FileVersionModalProps) {
  const versions = generateMockVersions();

  const columns: ColumnsType<VersionEntry> = [
    {
      title: '版本号',
      dataIndex: 'version',
      width: 100,
      render: (v: string, _: VersionEntry, index: number) => (
        <span style={{ fontWeight: index === 0 ? 600 : 400, color: index === 0 ? '#3366FF' : '#333' }}>
          {v} {index === 0 && '(当前)'}
        </span>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'uploadTime',
      width: 170,
    },
    {
      title: '上传人',
      dataIndex: 'uploader',
      width: 100,
    },
    {
      title: '操作',
      width: 160,
      render: (_: unknown, __: VersionEntry, index: number) => (
        <span>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => message.success('下载开始')}
          >
            下载
          </Button>
          {index > 0 && (
            <Button
              type="link"
              size="small"
              icon={<UndoOutlined />}
              onClick={() => message.success('已回滚到该版本')}
            >
              回滚
            </Button>
          )}
        </span>
      ),
    },
  ];

  return (
    <Modal
      title={`版本历史 - ${fileName}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div className={styles.modalContent}>
        <Table<VersionEntry>
          columns={columns}
          dataSource={versions}
          rowKey="version"
          pagination={false}
          size="small"
        />
      </div>
    </Modal>
  );
}
