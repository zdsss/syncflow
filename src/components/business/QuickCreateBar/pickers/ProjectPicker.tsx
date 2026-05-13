import { useState, useEffect, useMemo, useCallback } from 'react';
import { Spin, Empty, Tree } from 'antd';
import { FolderOutlined, ProjectOutlined, CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import { getProjects, type ProjectVO } from '@/services/project.service';
import type { PickerProps } from './index';
import styles from '../QuickCreateBar.module.css';

// Pinyin initial for common project name chars
function getPinyinInitial(str: string): string {
  const map: Record<string, string> = {
    '汽': 'q', '新': 'x', '电': 'd', '智': 'z', '充': 'c',
    '车': 'c', '能': 'n', '池': 'c', '驾': 'j', '桩': 'z',
    '控': 'k', '制': 'z', '系': 'x', '管': 'g', '理': 'l',
    '设': 's', '计': 'j', '产': 'c', '品': 'p', '发': 'f',
    '测': 't', '试': 's', '模': 'm', '组': 'z', '包': 'b',
    '冷': 'l', '却': 'q', '液': 'y', '信': 'x', '息': 'x',
    '娱': 'y', '热': 'r', '管': 'g', '方': 'f', '案': 'a',
  };
  return map[str[0]] || str[0]?.toLowerCase() || '';
}

interface TreeNode {
  key: string;
  title: string;
  children?: TreeNode[];
  isLeaf?: boolean;
  level?: number;
}

export default function ProjectPicker({ searchQuery, onSelect }: PickerProps) {
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  useEffect(() => {
    getProjects()
      .then((res) => {
        const data = res?.data;
        setProjects(Array.isArray(data) ? data : []);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const query = searchQuery.toLowerCase().trim();

  // Build tree data for Ant Design Tree
  const treeData = useMemo(() => {
    const buildTree = (items: ProjectVO[], level = 0): TreeNode[] => {
      return items
        .filter((p) => {
          if (!query) return true;
          const name = p.name.toLowerCase();
          const pinyin = getPinyinInitial(p.name);
          // Show if name matches or pinyin initial matches
          // Also show parents of matching children
          if (name.includes(query) || pinyin.startsWith(query)) return true;
          if (p.children?.length) {
            const matchingChildren = buildTree(p.children, level + 1);
            return matchingChildren.length > 0;
          }
          return false;
        })
        .map((p) => ({
          key: String(p.id),
          title: p.name,
          isLeaf: !p.children?.length,
          level,
          children: p.children?.length ? buildTree(p.children, level + 1) : undefined,
        }));
    };
    return buildTree(projects);
  }, [projects, query]);

  // Auto-expand matching nodes when searching
  useEffect(() => {
    if (query) {
      const collectKeys = (nodes: TreeNode[]): string[] => {
        const keys: string[] = [];
        for (const n of nodes) {
          if (n.children?.length) {
            keys.push(n.key);
            keys.push(...collectKeys(n.children));
          }
        }
        return keys;
      };
      setExpandedKeys(collectKeys(treeData));
    }
  }, [query, treeData]);

  const handleSelect = useCallback((keys: React.Key[]) => {
    if (keys.length > 0) {
      // Find the project name from the tree
      const findName = (nodes: TreeNode[], key: string): string | null => {
        for (const n of nodes) {
          if (n.key === key) return n.title;
          if (n.children) {
            const found = findName(n.children, key);
            if (found) return found;
          }
        }
        return null;
      };
      const name = findName(treeData, String(keys[0]));
      if (name) onSelect(name);
    }
  }, [treeData, onSelect]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 16 }} data-testid="project-picker">
        <Spin size="small" />
      </div>
    );
  }

  if (treeData.length === 0) {
    return (
      <div data-testid="project-picker">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无项目" />
      </div>
    );
  }

  return (
    <div className={styles.pickerList} data-testid="project-picker" style={{ maxHeight: 300, overflow: 'auto' }}>
      <div className={styles.pickerGroup}>选择项目（支持首字母搜索）</div>
      <Tree
        treeData={treeData}
        expandedKeys={expandedKeys}
        onExpand={(keys) => setExpandedKeys(keys as string[])}
        onSelect={({ selectedKeys }) => handleSelect(selectedKeys)}
        showIcon
        icon={({ isLeaf, level }) =>
          isLeaf ? <ProjectOutlined style={{ fontSize: 12, color: '#1890ff' }} /> :
                   <FolderOutlined style={{ fontSize: 12, color: '#faad14' }} />
        }
        switcherIcon={({ expanded }) =>
          expanded ? <CaretDownOutlined style={{ fontSize: 10 }} /> : <CaretRightOutlined style={{ fontSize: 10 }} />
        }
        style={{ background: 'transparent', fontSize: 13 }}
        selectable
      />
    </div>
  );
}
