import { useEffect, useState } from 'react';
import { Tabs, Button, Spin, Empty } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useNotificationStore, getDisplayTime } from '@/stores/useNotificationStore';
import type { Notification } from '@/stores/useNotificationStore';
import styles from './NotificationPanel.module.css';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

type NotificationType = 'all' | 'task' | 'approval' | 'system' | 'file' | 'announcement';

const typeMap: Record<string, NotificationType> = {
  task: 'task',
  approval: 'approval',
  system: 'system',
  file: 'file',
};

const typeColorMap: Record<string, string> = {
  task: '#1890FF',
  approval: '#FA8C16',
  system: '#999999',
  file: '#52C41A',
};

const tabItems = [
  { key: 'all', label: '全部' },
  { key: 'task', label: '任务通知' },
  { key: 'approval', label: '审批通知' },
  { key: 'system', label: '系统通知' },
  { key: 'announcement', label: '系统公告' },
];

export default function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const { notifications, fetchNotificationsAsync, markAsRead, markAllAsRead } =
    useNotificationStore();
  const [activeTab, setActiveTab] = useState<NotificationType>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetchNotificationsAsync()
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, fetchNotificationsAsync]);

  if (!open) return null;

  const filtered =
    activeTab === 'all'
      ? notifications
      : notifications.filter((n) => typeMap[n.type] === activeTab);

  const handleItemClick = (item: Notification) => {
    markAsRead(item.id);
  };

  return (
    <div className={styles.panel} data-testid="notification-panel">
      <div className={styles.header}>
        <span className={styles.title}>通知</span>
        <div>
          <Button type="link" size="small" className={styles.markAllBtn} onClick={markAllAsRead}>
            全部标为已读
          </Button>
          <CloseOutlined data-testid="close-btn" onClick={onClose} style={{ marginLeft: 8, cursor: 'pointer', color: '#999' }} />
        </div>
      </div>

      <div className={styles.tabs}>
        <Tabs
          activeKey={activeTab}
          items={tabItems}
          onChange={(key) => setActiveTab(key as NotificationType)}
          size="small"
        />
      </div>

      <div className={styles.listContainer}>
        {activeTab === 'announcement' ? (
          <div data-testid="system-announcement-content" style={{ padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#333', marginBottom: 8 }}>系统公告</div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
              欢迎使用 SyncFlow 协同管理系统
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 12 }}>2026-05-01</div>
          </div>
        ) : loading ? (
          <div className={styles.loadingContainer}>
            <Spin />
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyContainer}>
            <Empty description="暂无通知" />
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`${styles.notifItem} ${!item.read ? styles.notifUnread : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <span
                className={`${styles.dot} ${item.read ? styles.dotRead : styles.dotUnread}`}
                data-unread={(!item.read).toString()}
              />
              <span
                className={styles.typeDot}
                style={{ background: typeColorMap[item.type] || '#999' }}
                data-type={item.type}
                data-testid={`type-dot-${item.type}`}
              />
              <div className={styles.content}>
                <div className={styles.notifTitle}>{item.title}</div>
                <div className={styles.notifDesc}>{item.desc}</div>
                <div className={styles.notifTime}>{getDisplayTime(item)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.footerLink} onClick={onClose}>
          查看全部
        </span>
      </div>
    </div>
  );
}
