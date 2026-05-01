import { Table, Button, Popconfirm, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

interface BomItem {
  id: string;
  name: string;
  partNumber?: string;
  specification?: string;
  supplier?: string;
  unit?: string;
  unitPrice?: number;
  quantity: number;
  version: number;
}

interface BomTableProps {
  items: BomItem[];
  selectedItem: BomItem | null;
  onUpdate: (id: string, data: Partial<BomItem>) => void;
  onDelete: (id: string) => void;
}

export default function BomTable({ items, selectedItem, onDelete }: BomTableProps) {
  const displayItems = selectedItem ? [selectedItem] : items;

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '料号', dataIndex: 'partNumber', key: 'partNumber' },
    { title: '规格', dataIndex: 'specification', key: 'specification' },
    { title: '供应商', dataIndex: 'supplier', key: 'supplier' },
    { title: '单位', dataIndex: 'unit', key: 'unit' },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (v: number) => (v != null ? `¥${v.toFixed(2)}` : '-'),
    },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '版本', dataIndex: 'version', key: 'version' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: BomItem) => (
        <Space>
          <Popconfirm title="确认删除?" onConfirm={() => onDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={displayItems}
      columns={columns}
      rowKey="id"
      size="small"
      pagination={false}
    />
  );
}
