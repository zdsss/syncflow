import { useState } from 'react';
import { Button, Table, Tree, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, SaveOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import styles from './ModulePage.module.css';

interface OrderRow {
  key: string;
  orderNo: string;
  customer: string;
  product: string;
  quantity: number;
  status: string;
}

const TREE_DATA: DataNode[] = [
  {
    title: '动力电池订单',
    key: 'ev-orders',
    children: [
      { title: '2026年订单', key: 'ev-2026' },
      { title: '2025年订单', key: 'ev-2025' },
    ],
  },
  {
    title: '储能订单',
    key: 'storage-orders',
    children: [
      { title: '2026年订单', key: 'storage-2026' },
    ],
  },
];

const ORDER_DATA: Record<string, OrderRow[]> = {
  'ev-orders': [
    { key: '1', orderNo: 'ORD-2026-001', customer: '比亚迪', product: '标准型Pack', quantity: 500, status: '生产中' },
    { key: '2', orderNo: 'ORD-2026-002', customer: '蔚来汽车', product: '高能量模组', quantity: 200, status: '待确认' },
  ],
  'storage-orders': [
    { key: '3', orderNo: 'ORD-2026-003', customer: '宁德时代', product: '储能模组', quantity: 1000, status: '已完成' },
  ],
};

const ORDER_COLUMNS = [
  { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo', render: (no: string) => <Tag color="blue">{no}</Tag> },
  { title: '客户名称', dataIndex: 'customer', key: 'customer' },
  { title: '产品', dataIndex: 'product', key: 'product' },
  { title: '数量', dataIndex: 'quantity', key: 'quantity' },
  { title: '状态', dataIndex: 'status', key: 'status',
    render: (status: string) => <Tag color={status === '已完成' ? 'green' : status === '生产中' ? 'blue' : 'orange'}>{status}</Tag>,
  },
];

const DEFAULT_DATA: OrderRow[] = [
  { key: '1', orderNo: 'ORD-2026-001', customer: '比亚迪', product: '标准型Pack', quantity: 500, status: '生产中' },
];

export default function OrderLibrary() {
  const [selectedKey, setSelectedKey] = useState<string>('ev-orders');
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['ev-orders']);

  const tableData = ORDER_DATA[selectedKey] || DEFAULT_DATA;
  const selectedNode = TREE_DATA.find(n => n.key === selectedKey) || TREE_DATA.find(n => n.children?.some(c => c.key === selectedKey));
  const title = typeof selectedNode?.title === 'string' ? selectedNode.title : '订单列表';

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
    <div className={styles.splitLayout} data-testid="order-library">
      <div className={styles.treePanel}>
        <h3 className={styles.treeTitle}>订单分类树</h3>
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
            <Table columns={ORDER_COLUMNS} dataSource={tableData} pagination={false} size="middle" />
          </div>
        </div>
      </div>
    </div>
  );
}
