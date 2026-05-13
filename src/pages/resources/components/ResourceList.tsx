import { useState, useMemo } from 'react';
import { Table, Input, Button, Space, Tag } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';

interface Resource {
  id: string;
  name: string;
  type: string;
  description: string;
  tags: string[];
  status: string;
  createdAt: string;
}

interface ResourceListProps {
  resources: Resource[];
  loading: boolean;
  onSearch: (keyword: string) => void;
  onAdd: () => void;
  onEdit: (record: Resource) => void;
  onDelete: (id: string) => void;
  onBorrow?: (record: Resource) => void;
}

const statusColors: Record<string, string> = {
  available: 'green',
  busy: 'orange',
  unavailable: 'red',
  maintenance: 'blue',
};

const statusLabels: Record<string, string> = {
  available: '可用',
  busy: '忙碌',
  unavailable: '不可用',
  maintenance: '维护中',
};

export default function ResourceList({
  resources,
  loading,
  onSearch,
  onAdd,
  onEdit,
  onDelete,
  onBorrow,
}: ResourceListProps) {
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  // Collect all unique tags from human resources
  const skillTags = useMemo(() => {
    const humanTags = resources
      .filter((r) => r.type === 'human')
      .flatMap((r) => r.tags || []);
    return [...new Set(humanTags)];
  }, [resources]);

  // Filter resources by selected tag
  const filteredResources = useMemo(() => {
    if (!activeTagFilter) return resources;
    return resources.filter((r) => r.tags?.includes(activeTagFilter));
  }, [resources, activeTagFilter]);

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Resource) => (
        <div>
          <div>{name}</div>
          {record.type === 'human' && record.tags?.length > 0 && (
            <div data-testid={`skill-tags-${record.id}`} style={{ marginTop: 4 }}>
              {record.tags.map((tag) => (
                <Tag key={tag} color="blue" style={{ fontSize: 11 }}>
                  {tag}
                </Tag>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <Space>
          {tags?.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusLabels[status] || status}
        </Tag>
      ),
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
      render: (_: any, record: Resource) => (
        <Space>
          {onBorrow && record.status === 'available' && (
            <Button type="link" onClick={() => onBorrow(record)}>
              借用
            </Button>
          )}
          <Button type="link" onClick={() => onEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger onClick={() => onDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input.Search
          placeholder="搜索资源..."
          onSearch={onSearch}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          添加资源
        </Button>
      </div>
      {skillTags.length > 0 && (
        <div data-testid="skill-tag-filter" style={{ marginBottom: 12 }}>
          <span style={{ marginRight: 8, color: '#666', fontSize: 13 }}>技能标签:</span>
          <Tag
            color={activeTagFilter === null ? 'blue' : 'default'}
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveTagFilter(null)}
          >
            全部
          </Tag>
          {skillTags.map((tag) => (
            <Tag
              key={tag}
              color={activeTagFilter === tag ? 'blue' : 'default'}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
              data-testid={`skill-filter-${tag}`}
            >
              {tag}
            </Tag>
          ))}
        </div>
      )}
      <Table
        columns={columns}
        dataSource={filteredResources}
        loading={loading}
        rowKey="id"
      />
    </div>
  );
}
