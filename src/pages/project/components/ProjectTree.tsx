import type React from 'react';
import { useMemo, useState } from 'react';
import { Input, Tree } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { Project, ProjectTreeNode } from '@/types';
import { PROJECT_STATUS_CONFIG } from '@/constants';
import type { DataNode } from 'antd/es/tree';
import styles from './ProjectTree.module.css';

interface ProjectTreeProps {
  projects: Project[];
  selectedProjectId: string | null;
  expandedKeys: string[];
  onSelect: (id: string | null) => void;
  onExpand: (keys: string[]) => void;
}

function buildTree(projects: Project[]): ProjectTreeNode[] {
  const map = new Map<string, ProjectTreeNode>();
  const roots: ProjectTreeNode[] = [];

  for (const p of projects) {
    map.set(p.id, { ...p, children: [], level: 0 });
  }

  for (const p of projects) {
    const node = map.get(p.id)!;
    if (p.parentId && map.has(p.parentId)) {
      const parent = map.get(p.parentId)!;
      node.level = parent.level + 1;
      parent.children = parent.children || [];
      parent.children.push(node);
    } else if (!p.parentId) {
      roots.push(node);
    }
  }

  return roots;
}

function treeToAntdData(nodes: ProjectTreeNode[], searchValue: string): DataNode[] {
  return nodes.map((node) => {
    const statusCfg = PROJECT_STATUS_CONFIG[node.status];
    const matchesSearch = !searchValue || node.name.toLowerCase().includes(searchValue.toLowerCase());
    const children = node.children ? treeToAntdData(node.children, searchValue) : [];
    const hasMatchingChildren = children.length > 0;

    if (!matchesSearch && !hasMatchingChildren && searchValue) {
      return null;
    }

    return {
      key: node.id,
      title: (
        <div className={styles.nodeContent}>
          <div className={styles.nodeDot} style={{ backgroundColor: statusCfg?.color || '#8C8C8C' }} />
          <span className={styles.nodeName}>{node.name}</span>
          <span
            className={styles.nodeStatus}
            style={{
              color: statusCfg?.color || '#8C8C8C',
              backgroundColor: `${statusCfg?.color || '#8C8C8C'}15`,
            }}
          >
            {statusCfg?.label || node.status}
          </span>
        </div>
      ),
      children: children.length > 0 ? children : undefined,
    };
  }).filter(Boolean) as DataNode[];
}

export default function ProjectTree({
  projects,
  selectedProjectId,
  expandedKeys,
  onSelect,
  onExpand,
}: ProjectTreeProps) {
  const [searchValue, setSearchValue] = useState('');

  const treeData = useMemo(() => {
    const tree = buildTree(projects);
    return treeToAntdData(tree, searchValue);
  }, [projects, searchValue]);

  return (
    <div className={styles.container}>
      <div className={styles.searchWrapper}>
        <Input
          prefix={<SearchOutlined style={{ color: '#999' }} />}
          placeholder="搜索项目..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          allowClear
          size="small"
          className={styles.searchInput}
        />
      </div>
      <div className={styles.treeWrapper}>
        <Tree
          treeData={treeData}
          selectedKeys={selectedProjectId ? [selectedProjectId] : []}
          expandedKeys={expandedKeys}
          onSelect={(keys) => {
            onSelect(keys.length > 0 ? (keys[0] as string) : null);
          }}
          onExpand={(keys) => {
            onExpand(keys as string[]);
          }}
          showLine={{ showLeafIcon: false }}
          blockNode
          className={styles.tree}
        />
      </div>
    </div>
  );
}
