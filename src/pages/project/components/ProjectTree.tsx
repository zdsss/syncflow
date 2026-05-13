import type React from 'react';
import { useMemo, useState, memo } from 'react';
import { Input, Tree, Modal, Select, InputNumber, DatePicker, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Project, ProjectTreeNode } from '@/types';
import { PROJECT_STATUS_CONFIG } from '@/constants/enums';
import type { DataNode } from 'antd/es/tree';
import HoverContextMenu from '@/components/business/HoverContextMenu';
import { getUsers } from '@/services/config.service';
import styles from './ProjectTree.module.css';

const { RangePicker } = DatePicker;

interface ProjectTreeProps {
  projects: Project[];
  selectedProjectId: string | null;
  expandedKeys: string[];
  onSelect: (id: string | null) => void;
  onExpand: (keys: string[]) => void;
  onAddChild?: (parentId: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onUpdateTask?: (taskId: string, data: Record<string, unknown>) => void;
  style?: React.CSSProperties;
  onResizeStart?: (e: React.MouseEvent) => void;
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

function treeToAntdData(
  nodes: ProjectTreeNode[],
  searchValue: string,
  expandedKeys: string[],
  callbacks: { onAddChild?: (parentId: string) => void; onEdit?: (id: string) => void; onDelete?: (id: string) => void; onDuplicate?: (id: string) => void },
  onAction?: (nodeId: string, actionKey: string) => void,
): DataNode[] {
  return nodes.map((node) => {
    const statusCfg = PROJECT_STATUS_CONFIG[node.status];
    const matchesSearch = !searchValue || node.name.toLowerCase().includes(searchValue.toLowerCase());
    const children = node.children ? treeToAntdData(node.children, searchValue, expandedKeys, callbacks, onAction) : [];
    const hasMatchingChildren = children.length > 0;

    if (!matchesSearch && !hasMatchingChildren && searchValue) {
      return null;
    }

    const nodeType = (node.level === 0 && !node.parentId) ? 'folder' : 'project';

    return {
      key: node.id,
      title: (
        <HoverContextMenu
          nodeType={nodeType}
          nodeId={String(node.id)}
          onAction={(id, actionKey) => onAction?.(id, actionKey)}
        >
          <div className={styles.nodeContent}>
            <div className={styles.nodeIcon} style={{ backgroundColor: statusCfg?.color || '#8C8C8C' }}>
              {node.name.charAt(0)}
            </div>
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
        </HoverContextMenu>
      ),
      children: children.length > 0 ? children : undefined,
    };
  }).filter(Boolean) as DataNode[];
}

export default memo(function ProjectTree({
  projects,
  selectedProjectId,
  expandedKeys,
  onSelect,
  onExpand,
  onAddChild,
  onEdit,
  onDelete,
  onDuplicate,
  onUpdateTask,
  style,
  onResizeStart,
}: ProjectTreeProps) {
  const [searchValue, setSearchValue] = useState('');
  const [actionModal, setActionModal] = useState<{ type: string; nodeId: string } | null>(null);
  const [assigneeValue, setAssigneeValue] = useState<string>('');
  const [hoursValue, setHoursValue] = useState<number>(0);
  const [durationValue, setDurationValue] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);

  const handleAction = (nodeId: string, actionKey: string) => {
    if (actionKey === 'new-folder' || actionKey === 'new-task' || actionKey === 'new-project') {
      onAddChild?.(nodeId);
    } else if (actionKey === 'edit') {
      onEdit?.(nodeId);
    } else if (actionKey === 'delete') {
      onDelete?.(nodeId);
    } else if (['set-assignee', 'set-hours', 'set-duration'].includes(actionKey)) {
      if (actionKey === 'set-assignee') {
        getUsers().then((res) => {
          const users = (res?.data || []) as { id: string; name: string }[];
          setUserOptions(users.map((u) => ({ value: String(u.id), label: u.name })));
        }).catch(() => {});
      }
      setActionModal({ type: actionKey, nodeId });
    } else {
      message.info('功能开发中');
    }
  };

  const handleModalOk = () => {
    if (!actionModal) return;
    const { type, nodeId } = actionModal;
    if (type === 'set-assignee' && assigneeValue) {
      onUpdateTask?.(nodeId, { assigneeId: Number(assigneeValue) });
      message.success('负责人已更新');
    } else if (type === 'set-hours' && hoursValue > 0) {
      onUpdateTask?.(nodeId, { plannedHours: hoursValue });
      message.success('工时已更新');
    } else if (type === 'set-duration' && durationValue[0] && durationValue[1]) {
      onUpdateTask?.(nodeId, {
        plannedStart: durationValue[0].format('YYYY-MM-DD'),
        plannedEnd: durationValue[1].format('YYYY-MM-DD'),
      });
      message.success('工期已更新');
    }
    setActionModal(null);
    setAssigneeValue('');
    setHoursValue(0);
    setDurationValue([null, null]);
  };

  const treeData = useMemo(() => {
    const tree = buildTree(projects);
    return treeToAntdData(tree, searchValue, expandedKeys, {
      onAddChild, onEdit, onDelete, onDuplicate,
    }, handleAction);
  }, [projects, searchValue, expandedKeys, onAddChild, onEdit, onDelete, onDuplicate, handleAction]);

  return (
    <div className={styles.container} style={style}>
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
      {onResizeStart && (
        <div
          className={styles.resizeHandle}
          onMouseDown={onResizeStart}
          data-testid="resize-handle"
        />
      )}

      {/* Action modals */}
      <Modal
        title="设置负责人"
        open={actionModal?.type === 'set-assignee'}
        onOk={handleModalOk}
        onCancel={() => setActionModal(null)}
        width={360}
        data-testid="set-assignee-modal"
      >
        <Select
          placeholder="选择负责人"
          style={{ width: '100%' }}
          options={userOptions}
          value={assigneeValue || undefined}
          onChange={setAssigneeValue}
          showSearch
          optionFilterProp="label"
        />
      </Modal>

      <Modal
        title="设置工时"
        open={actionModal?.type === 'set-hours'}
        onOk={handleModalOk}
        onCancel={() => setActionModal(null)}
        width={360}
        data-testid="set-hours-modal"
      >
        <InputNumber
          placeholder="计划工时（小时）"
          style={{ width: '100%' }}
          min={0}
          value={hoursValue}
          onChange={(v) => setHoursValue(v || 0)}
          addonAfter="小时"
        />
      </Modal>

      <Modal
        title="设置工期"
        open={actionModal?.type === 'set-duration'}
        onOk={handleModalOk}
        onCancel={() => setActionModal(null)}
        width={400}
        data-testid="set-duration-modal"
      >
        <RangePicker
          style={{ width: '100%' }}
          value={durationValue as any}
          onChange={(dates) => setDurationValue(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
        />
      </Modal>
    </div>
  );
});
