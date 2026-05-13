import { useState } from 'react';
import { Table, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import styles from './ModulePage.module.css';

interface BomRow {
  key: string;
  componentId: string;
  name: string;
  version: string;
  usage: string;
  supplier: string;
  materialType: string;
  unit: string;
  status: string;
  completion: number;
  level: number;
}

const TREE_DATA: DataNode[] = [
  {
    title: '电池Pack',
    key: 'pack-root',
    children: [
      {
        title: '模组组件',
        key: 'module-group',
        children: [
          { title: '电芯模组A', key: 'cell-module-a' },
          { title: '电芯模组B', key: 'cell-module-b' },
        ],
      },
      {
        title: '结构件',
        key: 'structure-group',
        children: [
          { title: '上壳体', key: 'top-cover' },
          { title: '下壳体', key: 'bottom-cover' },
          { title: '密封件', key: 'seal' },
        ],
      },
      {
        title: '电气件',
        key: 'electrical-group',
        children: [
          { title: 'BMS主控', key: 'bms-master' },
          { title: '高压线束', key: 'hv-harness' },
          { title: '低压线束', key: 'lv-harness' },
        ],
      },
      {
        title: '热管理',
        key: 'thermal-group',
        children: [
          { title: '液冷板', key: 'coldplate' },
          { title: '管路组件', key: 'pipes' },
        ],
      },
    ],
  },
];

const BOM_DATA: Record<string, BomRow[]> = {
  'pack-root': [
    { key: '1', componentId: 'PK-001', name: '电池Pack总成', version: 'V2.1', usage: '1', supplier: '自制', materialType: '总成件', unit: '套', status: '进行中', completion: 65, level: 1 },
    { key: '2', componentId: 'PK-001-01', name: '电芯模组A', version: 'V1.3', usage: '6', supplier: '宁德时代', materialType: '电芯', unit: '组', status: '已完成', completion: 100, level: 2 },
    { key: '3', componentId: 'PK-001-02', name: '电芯模组B', version: 'V1.2', usage: '4', supplier: '比亚迪', materialType: '电芯', unit: '组', status: '进行中', completion: 80, level: 2 },
    { key: '4', componentId: 'PK-001-03', name: '上壳体', version: 'V2.0', usage: '1', supplier: '敏实集团', materialType: '铝合金', unit: '件', status: '已完成', completion: 100, level: 2 },
    { key: '5', componentId: 'PK-001-04', name: '下壳体', version: 'V2.0', usage: '1', supplier: '敏实集团', materialType: '铝合金', unit: '件', status: '进行中', completion: 90, level: 2 },
    { key: '6', componentId: 'PK-001-05', name: '密封件', version: 'V1.1', usage: '2', supplier: '中鼎股份', materialType: '硅胶', unit: '套', status: '未开始', completion: 0, level: 2 },
    { key: '7', componentId: 'PK-001-06', name: 'BMS主控', version: 'V3.0', usage: '1', supplier: '亿纬锂能', materialType: 'PCB', unit: '块', status: '进行中', completion: 70, level: 2 },
    { key: '8', componentId: 'PK-001-07', name: '高压线束', version: 'V1.5', usage: '1', supplier: '沃尔核材', materialType: '铜线', unit: '套', status: '已完成', completion: 100, level: 2 },
    { key: '9', componentId: 'PK-001-08', name: '低压线束', version: 'V1.2', usage: '1', supplier: '沃尔核材', materialType: '铜线', unit: '套', status: '进行中', completion: 50, level: 2 },
    { key: '10', componentId: 'PK-001-09', name: '液冷板', version: 'V2.0', usage: '2', supplier: '银轮股份', materialType: '铝合金', unit: '件', status: '未开始', completion: 0, level: 2 },
    { key: '11', componentId: 'PK-001-10', name: '管路组件', version: 'V1.1', usage: '1', supplier: '银轮股份', materialType: '橡胶', unit: '套', status: '进行中', completion: 30, level: 2 },
  ],
  'module-group': [
    { key: '12', componentId: 'PK-001-01', name: '电芯模组A', version: 'V1.3', usage: '6', supplier: '宁德时代', materialType: '电芯', unit: '组', status: '已完成', completion: 100, level: 1 },
    { key: '13', componentId: 'PK-001-01-01', name: '电芯单体', version: 'V1.0', usage: '72', supplier: '宁德时代', materialType: '电芯', unit: '只', status: '已完成', completion: 100, level: 2 },
    { key: '14', componentId: 'PK-001-01-02', name: '模组壳体', version: 'V1.2', usage: '6', supplier: '敏实集团', materialType: '铝合金', unit: '件', status: '进行中', completion: 85, level: 2 },
    { key: '15', componentId: 'PK-001-01-03', name: '汇流排', version: 'V1.1', usage: '6', supplier: '自制', materialType: '铜', unit: '件', status: '已完成', completion: 100, level: 2 },
  ],
  'structure-group': [
    { key: '16', componentId: 'PK-001-03', name: '上壳体', version: 'V2.0', usage: '1', supplier: '敏实集团', materialType: '铝合金', unit: '件', status: '已完成', completion: 100, level: 1 },
    { key: '17', componentId: 'PK-001-04', name: '下壳体', version: 'V2.0', usage: '1', supplier: '敏实集团', materialType: '铝合金', unit: '件', status: '进行中', completion: 90, level: 1 },
    { key: '18', componentId: 'PK-001-05', name: '密封件', version: 'V1.1', usage: '2', supplier: '中鼎股份', materialType: '硅胶', unit: '套', status: '未开始', completion: 0, level: 1 },
  ],
  'electrical-group': [
    { key: '19', componentId: 'PK-001-06', name: 'BMS主控', version: 'V3.0', usage: '1', supplier: '亿纬锂能', materialType: 'PCB', unit: '块', status: '进行中', completion: 70, level: 1 },
    { key: '20', componentId: 'PK-001-07', name: '高压线束', version: 'V1.5', usage: '1', supplier: '沃尔核材', materialType: '铜线', unit: '套', status: '已完成', completion: 100, level: 1 },
    { key: '21', componentId: 'PK-001-08', name: '低压线束', version: 'V1.2', usage: '1', supplier: '沃尔核材', materialType: '铜线', unit: '套', status: '进行中', completion: 50, level: 1 },
  ],
  'thermal-group': [
    { key: '22', componentId: 'PK-001-09', name: '液冷板', version: 'V2.0', usage: '2', supplier: '银轮股份', materialType: '铝合金', unit: '件', status: '未开始', completion: 0, level: 1 },
    { key: '23', componentId: 'PK-001-10', name: '管路组件', version: 'V1.1', usage: '1', supplier: '银轮股份', materialType: '橡胶', unit: '套', status: '进行中', completion: 30, level: 1 },
  ],
};

const STATUS_COLOR: Record<string, string> = {
  '进行中': '#3366ff',
  '已完成': '#52c41a',
  '未开始': '#999',
};

const COMPLETION_COLOR = (v: number) => v >= 80 ? '#52c41a' : v >= 50 ? '#faad14' : '#ff4d4f';

const BOM_COLUMNS = [
  { title: '组件编号', dataIndex: 'componentId', key: 'componentId', width: 130,
    render: (id: string, record: BomRow) => (
      <span style={{ paddingLeft: (record.level - 1) * 20, fontFamily: 'monospace', fontSize: 13 }}>{id}</span>
    ),
  },
  { title: '名称', dataIndex: 'name', key: 'name', width: 140 },
  { title: '版本', dataIndex: 'version', key: 'version', width: 70 },
  { title: '用量', dataIndex: 'usage', key: 'usage', width: 60 },
  { title: '供应商', dataIndex: 'supplier', key: 'supplier', width: 100 },
  { title: '物料类型', dataIndex: 'materialType', key: 'materialType', width: 90 },
  { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80,
    render: (status: string) => (
      <span style={{ color: STATUS_COLOR[status] || '#999', fontSize: 13 }}>{status}</span>
    ),
  },
  { title: '完成率(%)', dataIndex: 'completion', key: 'completion', width: 90,
    render: (v: number) => (
      <span style={{ color: COMPLETION_COLOR(v), fontWeight: 500, fontSize: 13 }}>{v}%</span>
    ),
  },
];

export default function ModuleLibrary() {
  const [selectedKey, setSelectedKey] = useState<string>('pack-root');
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['pack-root', 'module-group', 'structure-group', 'electrical-group', 'thermal-group']);

  const tableData = BOM_DATA[selectedKey] || BOM_DATA['pack-root'];

  const handleSelect = (keys: React.Key[]) => {
    const key = keys[0] as string;
    if (key) setSelectedKey(key);
  };

  return (
    <div className={styles.splitLayout}>
      <div className={styles.treePanel} data-testid="bom-tree-panel">
        <h3 className={styles.treeTitle}>产品结构树</h3>
        <Tree
          treeData={TREE_DATA}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys as string[])}
          onSelect={handleSelect}
          selectedKeys={[selectedKey]}
        />
      </div>
      <div className={styles.dataPanel} data-testid="data-table-panel">
        <Table
          columns={BOM_COLUMNS}
          dataSource={tableData}
          pagination={false}
          size="small"
          className={styles.bomTable}
          scroll={{ y: 'calc(100vh - 200px)' }}
        />
      </div>
    </div>
  );
}
