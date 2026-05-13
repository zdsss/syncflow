import { useState, useRef, useCallback, useEffect } from 'react';
import styles from './HoverContextMenu.module.css';

export type NodeType = 'root' | 'folder' | 'project' | 'task';

export interface MenuItemDef {
  key: string;
  label: string;
  danger?: boolean;
  dividerAfter?: boolean;
}

/** Menu definitions per node type (v3 chapter 17.3) */
export const MENU_BY_NODE_TYPE: Record<NodeType, MenuItemDef[]> = {
  root: [
    { key: 'new-folder', label: '新建文件夹' },
    { key: 'new-project', label: '新建项目' },
  ],
  folder: [
    { key: 'new-folder', label: '新建文件夹' },
    { key: 'new-project', label: '新建项目' },
    { key: 'from-template', label: '通过模板创建' },
    { key: 'edit', label: '编辑' },
    { key: 'delete', label: '删除', danger: true },
    { key: 'load-workflow', label: '加载工作流' },
  ],
  project: [
    { key: 'new-task', label: '新建任务(阶段)' },
    { key: 'edit', label: '编辑' },
    { key: 'delete', label: '删除', danger: true, dividerAfter: true },
    { key: 'set-participants', label: '设置参与人' },
    { key: 'set-hours', label: '设置工时' },
    { key: 'set-duration', label: '设置工期' },
    { key: 'set-template', label: '设置模板' },
    { key: 'set-reminder', label: '设置提醒' },
    { key: 'load-workflow', label: '加载工作流' },
  ],
  task: [
    { key: 'new-task', label: '新建任务' },
    { key: 'edit', label: '编辑' },
    { key: 'delete', label: '删除', danger: true, dividerAfter: true },
    { key: 'set-assignee', label: '设置负责人/参与人' },
    { key: 'set-hours', label: '设置工时' },
    { key: 'set-duration', label: '设置工期' },
    { key: 'set-type', label: '设置类型' },
    { key: 'set-reminder', label: '设置提醒' },
    { key: 'load-workflow', label: '加载工作流' },
  ],
};

export interface HoverContextMenuProps {
  /** Node type determines which menu items are shown */
  nodeType: NodeType;
  /** Unique node identifier for event payloads */
  nodeId: string;
  /** Called when a menu item is clicked */
  onAction?: (nodeId: string, actionKey: string) => void;
  /** Hover delay in ms before showing the menu (default ~1000ms) */
  hoverDelay?: number;
  /** The element that triggers the hover (i.e. the tree node content) */
  children: React.ReactNode;
  /** Where to position the menu: 'right' | 'bottom' (default 'right') */
  placement?: 'right' | 'bottom';
  /** Optional test id */
  'data-testid'?: string;
}

const DEFAULT_HOVER_DELAY = 1000;

export default function HoverContextMenu({
  nodeType,
  nodeId,
  onAction,
  hoverDelay = DEFAULT_HOVER_DELAY,
  children,
  placement = 'right',
  'data-testid': dataTestId,
}: HoverContextMenuProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isHoveringMenu = useRef(false);

  const menuItems = MENU_BY_NODE_TYPE[nodeType] ?? MENU_BY_NODE_TYPE.root;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, hoverDelay);
  }, [clearTimer, hoverDelay]);

  const handleMouseLeave = useCallback(() => {
    clearTimer();
    // Only hide if mouse didn't move to the menu
    setTimeout(() => {
      if (!isHoveringMenu.current) {
        setVisible(false);
      }
    }, 100);
  }, [clearTimer]);

  const handleMenuEnter = useCallback(() => {
    isHoveringMenu.current = true;
    clearTimer();
  }, [clearTimer]);

  const handleMenuLeave = useCallback(() => {
    isHoveringMenu.current = false;
    setVisible(false);
  }, []);

  const handleItemClick = useCallback(
    (actionKey: string) => {
      setVisible(false);
      onAction?.(nodeId, actionKey);
    },
    [onAction, nodeId],
  );

  // Close on click outside
  useEffect(() => {
    if (!visible) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [visible]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const menuStyle: React.CSSProperties =
    placement === 'bottom'
      ? { top: '100%', left: 0, marginTop: 4 }
      : { top: 0, left: '100%', marginLeft: 4 };

  return (
    <div
      ref={wrapperRef}
      className={styles.wrapper}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid={dataTestId ?? `hover-menu-wrapper-${nodeId}`}
    >
      {children}
      {visible && (
        <ul
          className={styles.menu}
          style={menuStyle}
          onMouseEnter={handleMenuEnter}
          onMouseLeave={handleMenuLeave}
          data-testid={`hover-menu-${nodeId}`}
          role="menu"
        >
          {menuItems.map((item) => (
            <li key={item.key}>
              <div
                className={`${styles.menuItem} ${item.danger ? styles.danger : ''}`}
                role="menuitem"
                onClick={() => handleItemClick(item.key)}
                data-testid={`menu-item-${item.key}`}
              >
                {item.label}
              </div>
              {item.dividerAfter && <div className={styles.menuDivider} data-testid="menu-divider" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
