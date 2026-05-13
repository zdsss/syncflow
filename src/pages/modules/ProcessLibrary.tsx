import { useState } from 'react';
import { Button, Table, Tree, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, SaveOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import styles from './ModulePage.module.css';

interface ProcessRow {
  key: string;
  name: string;
  code: string;
  type: string;
  equipment: string;
  status: string;
}

const TREE_DATA: DataNode[] = [
  {
    title: '焊接工艺',
    key: 'welding',
    children: [
      { title: '激光焊接', key: 'laser-weld' },
      { title: '超声焊接', key: 'ultrasonic-weld' },
    ],
  },
  {
    title: '装配工艺',
    key: 'assembly',
    children: [
      { title: '模组装配', key: 'module-assembly' },
      { title: 'Pack装配', key: 'pack-assembly' },
    ],
  },
];

const PROCESS_DATA: Record<string, ProcessRow[]> = {
  'welding': [
    { key: '1', name: '激光焊接工艺', code: 'PRC-W001', type: '焊接', equipment: '激光焊接机', status: '已发布' },
    { key: '2', name: '超声焊接工艺', code: 'PRC-W002', type: '焊接', equipment: '超声焊接机', status: '草稿' },
  ],
  'assembly': [
    { key: '3', name: '模组装配工艺', code: 'PRC-A001', type: '装配', equipment: '装配线', status: '已发布' },
    { key: '4', name: 'Pack装配工艺', code: 'PRC-A002', type: '装配', equipment: 'Pack装配线', status: '审批中' },
  ],
};

const PROCESS_COLUMNS = [
  { title: '工艺名称', dataIndex: 'name', key: 'name' },
  { title: '工艺编码', dataIndex: 'code', key: 'code', render: (code: string) => <Tag color="blue">{code}</Tag> },
  { title: '工艺类型', dataIndex: 'type', key: 'type' },
  { title: '设备', dataIndex: 'equipment', key: 'equipment' },
  { title: '状态', dataIndex: 'status', key: 'status',
    render: (status: string) => <Tag color={status === '已发布' ? 'green' : status === '审批中' ? 'orange' : 'default'}>{status}</Tag>,
  },
];

const DEFAULT_DATA: ProcessRow[] = [
  { key: '1', name: '激光焊接工艺', code: 'PRC-W001', type: '焊接', equipment: '激光焊接机', status: '已发布' },
];

export default function ProcessLibrary() {
  const [selectedKey, setSelectedKey] = useState<string>('welding');
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['welding']);

  const tableData = PROCESS_DATA[selectedKey] || DEFAULT_DATA;
  const selectedNode = TREE_DATA.find(n => n.key === selectedKey) || TREE_DATA.find(n => n.children?.some(c => c.key === selectedKey));
  const title = typeof selectedNode?.title === 'string' ? selectedNode.title : '工艺列表';

  const handleSelect = (keys: React.Key[]) => {
    const key = keys[0] as string;
    if (key) {
      setSelectedKey(key);
      const parent = TREE_DATA.find(n => n.children?.some(c => c.key === key));
      if (parent && !expandedKeys.includes(parent.key as string)) {
        setExpandedKeys([...expandedKeys, parent.key as string]);
      }
    }
  };

  return (
    <div className={styles.splitLayout} data-testid="process-library">
      <div className={styles.treePanel}>
        <h3 className={styles.treeTitle}>工艺结构树</h3>
        <Tree
          treeData={TREE_DATA}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys as string[])}
          onSelect={handleSelect}
          selectedKeys={[selectedKey]}
        />
      </div>
      <div className={styles.dataPanel}>
        <div className={styles.tableToolbar}>
          <Button type="primary" size="small" icon={<PlusOutlined />}>新增</Button>
          <Button size="small" icon={<EditOutlined />}>修改</Button>
          <Button size="small" icon={<DeleteOutlined />} danger>删除</Button>
          <Button size="small" icon={<CheckOutlined />}>审批</Button>
          <Button size="small" icon={<SaveOutlined />}>保存</Button>
        </div>
        <div className={styles.tableContent}>
          <div className={styles.tableWrapper}>
            <h3 className={styles.tableTitle}>{title}</h3>
            <Table columns={PROCESS_COLUMNS} dataSource={tableData} pagination={false} size="middle" />
          </div>
        </div>
      </div>
    </div>
  );
}
