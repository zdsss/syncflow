import { useState, useEffect } from 'react';
import { Input, Button, Table, message } from 'antd';
import { SearchOutlined, UploadOutlined, FileOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from './PersonalPage.module.css';

interface PersonalFile {
  id: string;
  name: string;
  type: string;
  extension: string;
  size: string;
  createdAt: string;
}

export default function PersonalPage() {
  const [files, setFiles] = useState<PersonalFile[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/personal/files?userId=user-1');
      const data = await res.json();
      if (data.code === 0) {
        setFiles(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/personal/files/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.code === 0) {
        message.success('文件已删除');
        fetchFiles();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleUpload = () => {
    message.info('上传功能开发中...');
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span>
          <FileOutlined className={styles.fileIcon} />
          {name}
        </span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: string) => <span className={styles.fileSize}>{size}</span>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: PersonalFile) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.id)}
        >
          删除
        </Button>
      ),
    },
  ];

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>个人文件夹</h1>
        <div className={styles.headerActions}>
          <Input
            placeholder="搜索文件..."
            prefix={<SearchOutlined />}
            className={styles.searchInput}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
          />
          <Button type="primary" icon={<UploadOutlined />} onClick={handleUpload}>
            上传文件
          </Button>
        </div>
      </div>

      <div className={styles.body}>
        <Table
          columns={columns}
          dataSource={filteredFiles}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
}
