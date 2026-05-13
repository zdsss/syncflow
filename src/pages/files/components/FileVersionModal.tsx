import { useState } from 'react';
import { Modal, Table, Button, Checkbox, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, UndoOutlined, SwapOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from './FileVersionModal.module.css';

interface VersionEntry {
  version: string;
  uploadTime: string;
  uploader: string;
  size: number;
}

interface FileVersionModalProps {
  visible: boolean;
  fileId: string;
  fileName: string;
  onClose: () => void;
}

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

function generateMockVersions(): VersionEntry[] {
  const count = Math.floor(Math.random() * 3) + 3; // 3-5 versions
  const versions: VersionEntry[] = [];
  const uploaders = ['张伟', '李娜', '邓智豪', '王美玲', '陈思远'];
  const baseSize = 1048576; // 1 MB
  for (let i = 0; i < count; i++) {
    versions.push({
      version: `v${i + 1}.0`,
      uploadTime: dayjs().subtract(i * 5, 'day').format('YYYY-MM-DD HH:mm'),
      uploader: uploaders[i % uploaders.length],
      size: baseSize + i * 524288 + Math.floor(Math.random() * 262144),
    });
  }
  return versions;
}

interface DiffViewProps {
  left: VersionEntry;
  right: VersionEntry;
  fileName: string;
}

function DiffView({ left, right, fileName }: DiffViewProps) {
  return (
    <div data-testid="diff-view" style={{ padding: '16px 0' }}>
      <h4 style={{ marginBottom: 12 }}>版本对比 - {fileName}</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 12px', background: '#fafafa', borderBottom: '1px solid #e8e8e8', width: '30%' }}>属性</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>{left.version}</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>{right.version}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>版本号</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>{left.version}</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>{right.version}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>文件大小</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>{formatFileSize(left.size)}</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>{formatFileSize(right.size)}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>上传人</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>{left.uploader}</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>{right.uploader}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>上传时间</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>{left.uploadTime}</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>{right.uploadTime}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function FileVersionModal({ visible, fileId, fileName, onClose }: FileVersionModalProps) {
  const versions = generateMockVersions();
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showDiff, setShowDiff] = useState(false);

  const handleCheckboxChange = (version: string, checked: boolean) => {
    setShowDiff(false);
    if (checked) {
      setSelectedVersions((prev) => {
        if (prev.length >= 2) return prev;
        return [...prev, version];
      });
    } else {
      setSelectedVersions((prev) => prev.filter((v) => v !== version));
    }
  };

  const selectedEntries = selectedVersions.map((v) => versions.find((ver) => ver.version === v)).filter(Boolean) as VersionEntry[];

  const columns: ColumnsType<VersionEntry> = [
    {
      title: '',
      width: 40,
      render: (_: unknown, record: VersionEntry) => (
        <Checkbox
          checked={selectedVersions.includes(record.version)}
          disabled={!selectedVersions.includes(record.version) && selectedVersions.length >= 2}
          onChange={(e) => handleCheckboxChange(record.version, e.target.checked)}
          data-testid={`version-checkbox-${record.version}`}
        />
      ),
    },
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
      render: (_: unknown, record: VersionEntry, index: number) => (
        <span>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => window.open(`/api/files/${fileId}/download?version=${record.version}`, '_blank')}
            data-testid={`download-version-${record.version}`}
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
      onCancel={() => { setSelectedVersions([]); setShowDiff(false); onClose(); }}
      footer={null}
      width={600}
    >
      <div className={styles.modalContent}>
        {selectedVersions.length === 2 && !showDiff && (
          <div style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              icon={<SwapOutlined />}
              onClick={() => setShowDiff(true)}
              data-testid="compare-btn"
            >
              对比
            </Button>
          </div>
        )}
        {showDiff && selectedEntries.length === 2 && (
          <DiffView left={selectedEntries[0]} right={selectedEntries[1]} fileName={fileName} />
        )}
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
