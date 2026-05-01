import { Tree, Spin } from 'antd';
import type { DataNode } from 'antd/es/tree';

interface BomItem {
  id: string;
  name: string;
  partNumber?: string;
  children?: BomItem[];
}

interface BomTreeProps {
  data: BomItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  loading: boolean;
}

function buildTreeNodes(items: BomItem[]): DataNode[] {
  return items.map((item) => ({
    key: item.id,
    title: item.partNumber ? `${item.name} (${item.partNumber})` : item.name,
    children: item.children?.length ? buildTreeNodes(item.children) : undefined,
  }));
}

export default function BomTree({ data, selectedId, onSelect, loading }: BomTreeProps) {
  if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;

  if (!data.length) {
    return <div style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>暂无BOM数据</div>;
  }

  const treeData = buildTreeNodes(data);

  return (
    <Tree
      treeData={treeData}
      selectedKeys={selectedId ? [selectedId] : []}
      onSelect={(keys) => onSelect(keys.length ? (keys[0] as string) : null)}
      defaultExpandAll
      showLine
    />
  );
}
