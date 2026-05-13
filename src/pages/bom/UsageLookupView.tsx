import { Input, Table, Empty } from 'antd';
import { useState, useMemo } from 'react';
import type { BomItem } from './types';

interface UsageLookupViewProps {
  items: BomItem[];
}

export default function UsageLookupView({ items }: UsageLookupViewProps) {
  const [keyword, setKeyword] = useState('');

  const filteredItems = useMemo(() => {
    if (!keyword.trim()) return items;
    const kw = keyword.toLowerCase();
    return items.filter(
      (item) =>
        (item.materialCode || '').toLowerCase().includes(kw) ||
        item.name.toLowerCase().includes(kw)
    );
  }, [items, keyword]);

  const columns = [
    { title: '组件编号', dataIndex: 'materialCode', key: 'materialCode', render: (v: string) => v || '-' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '规格型号', dataIndex: 'specification', key: 'specification', render: (v: string) => v || '-' },
    { title: '用量', dataIndex: 'quantity', key: 'quantity' },
    { title: '单位', dataIndex: 'unitOfMeasure', key: 'unitOfMeasure', render: (v: string) => v || '-' },
    { title: '材质', dataIndex: 'material', key: 'material', render: (v: string) => v || '-' },
    { title: '来源类型', dataIndex: 'sourceType', key: 'sourceType', render: (v: string) => v || '-' },
  ];

  return (
    <div data-testid="usage-lookup-view">
      <div style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="输入组件编号或名称搜索..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ width: 360 }}
          allowClear
        />
      </div>
      {filteredItems.length === 0 ? (
        <Empty description="暂无匹配的物料数据" />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredItems}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 15 }}
        />
      )}
    </div>
  );
}
