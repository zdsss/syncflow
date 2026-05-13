import { Table, Button, Popconfirm, Space, Tag, Descriptions } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

interface BomItem {
  id: number;
  bomId: number;
  parentId?: number | null;
  name: string;
  materialCode?: string;
  specification?: string;
  drawingNo?: string;
  material?: string;
  surfaceTreatment?: string;
  sourceType?: string;
  quantity: number;
  weight?: number;
  totalWeight?: number;
  unitOfMeasure?: string;
  isVirtual?: boolean;
  storageLocation?: string;
  isOptional?: boolean;
  remark?: string;
  level?: number;
  levelNo?: string;
  seqNo?: number;
  children?: BomItem[];
}

interface BomTableProps {
  items: BomItem[];
  selectedItem: BomItem | null;
  onUpdate: (id: number, data: Partial<BomItem>) => void;
  onDelete: (id: number) => void;
}

const SOURCE_TYPE_MAP: Record<string, { label: string; color: string }> = {
  MADE: { label: '自制', color: 'blue' },
  PURCHASED: { label: '外购', color: 'green' },
  BUY: { label: '外购', color: 'green' },
  SUBCONTRACT: { label: '外协', color: 'orange' },
};

export default function BomTable({ items, selectedItem, onDelete }: BomTableProps) {
  const displayItems = items;

  const columns = [
    { title: '层级', dataIndex: 'levelNo', key: 'levelNo', width: 70, render: (v: string) => v || '-' },
    { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 130, render: (v: string) => v || '-' },
    { title: '物料名称', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: '规格', dataIndex: 'specification', key: 'specification', width: 140, ellipsis: true, render: (v: string) => v || '-' },
    { title: '用量', dataIndex: 'quantity', key: 'quantity', width: 70 },
    { title: '单位', dataIndex: 'unitOfMeasure', key: 'unitOfMeasure', width: 60, render: (v: string) => v || '-' },
    {
      title: '来源',
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 80,
      render: (v: string) => {
        const cfg = SOURCE_TYPE_MAP[v];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : (v || '-');
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_: any, record: BomItem) => (
        <Popconfirm title="确认删除?" onConfirm={() => onDelete(record.id)}>
          <Button type="link" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
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
      childrenColumnName="__no_tree__"
      rowClassName={(record) => record.id === selectedItem?.id ? 'ant-table-row-selected' : ''}
      expandable={{
        expandedRowRender: (record: BomItem) => (
          <Descriptions size="small" column={4} data-testid={`expand-detail-${record.id}`}>
            <Descriptions.Item label="图号">{record.drawingNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="材料">{record.material || '-'}</Descriptions.Item>
            <Descriptions.Item label="表面处理">{record.surfaceTreatment || '-'}</Descriptions.Item>
            <Descriptions.Item label="重量(kg)">{record.weight != null ? record.weight.toFixed(2) : '-'}</Descriptions.Item>
            <Descriptions.Item label="总计重量">{record.totalWeight != null ? record.totalWeight.toFixed(2) : '-'}</Descriptions.Item>
            <Descriptions.Item label="库位">{record.storageLocation || '-'}</Descriptions.Item>
            <Descriptions.Item label="虚拟件">{record.isVirtual ? <Tag color="purple">是</Tag> : '否'}</Descriptions.Item>
            <Descriptions.Item label="可选件">{record.isOptional ? '是' : '否'}</Descriptions.Item>
            {record.remark && <Descriptions.Item label="备注" span={4}>{record.remark}</Descriptions.Item>}
          </Descriptions>
        ),
        rowExpandable: () => true,
      }}
    />
  );
}
