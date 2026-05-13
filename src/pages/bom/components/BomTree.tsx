import { Tree, Spin, Dropdown, message, Button } from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { MenuProps } from 'antd';
import { MoreOutlined } from '@ant-design/icons';

interface BomItem {
  id: number;
  name: string;
  materialCode?: string;
  levelNo?: string;
  children?: BomItem[];
}

interface BomTreeProps {
  data: BomItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  loading: boolean;
  onAddChild?: (parentId: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function buildTreeNodes(items: BomItem[]): DataNode[] {
  return items.map((item) => ({
    key: String(item.id),
    title: item.levelNo
      ? `[${item.levelNo}] ${item.name}${item.materialCode ? ` (${item.materialCode})` : ''}`
      : `${item.name}${item.materialCode ? ` (${item.materialCode})` : ''}`,
    children: item.children?.length ? buildTreeNodes(item.children) : undefined,
  }));
}

export default function BomTree({ data, selectedId, onSelect, loading, onAddChild, onEdit, onDelete }: BomTreeProps) {
  if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;

  if (!data.length) {
    return <div style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>暂无BOM数据</div>;
  }

  const treeData = buildTreeNodes(data);

  const titleRender = (node: DataNode) => {
    const nodeKey = node.key as string;
    const menuItems: MenuProps['items'] = [
      { key: 'add-child', label: '新增子物料' },
      { key: 'edit', label: '编辑' },
      { key: 'delete', label: '删除', danger: true },
    ];

    const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
      switch (key) {
        case 'add-child':
          if (onAddChild) onAddChild(nodeKey);
          else message.info('新增子物料');
          break;
        case 'edit':
          if (onEdit) onEdit(nodeKey);
          else message.info('编辑物料');
          break;
        case 'delete':
          if (onDelete) onDelete(nodeKey);
          else message.info('删除物料');
          break;
      }
    };

    return (
      <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} trigger={['contextMenu']}>
        <span data-testid={`tree-node-${nodeKey}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {node.title as React.ReactNode}
          <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} trigger={['click']}>
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              aria-label={`操作: ${node.title}`}
              style={{ opacity: 0.5, marginLeft: 4 }}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </span>
      </Dropdown>
    );
  };

  return (
    <Tree
      treeData={treeData}
      selectedKeys={selectedId ? [selectedId] : []}
      onSelect={(keys) => onSelect(keys.length ? (keys[0] as string) : null)}
      defaultExpandAll
      showLine
      titleRender={titleRender}
    />
  );
}
