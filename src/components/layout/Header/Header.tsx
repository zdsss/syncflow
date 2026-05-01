import { useEffect, useState } from 'react';
import { Badge, Popover, List, Button, Space } from 'antd';
import { BellOutlined, SearchOutlined, SettingOutlined, GlobalOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { getCurrentUser, getTeams } from '@/services/auth.service';
import GlobalSearch from '@/components/ui/GlobalSearch';
import styles from './Header.module.css';

interface Notification {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: 'task' | 'approval' | 'system';
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: '任务已分配', desc: '邓智豪 将"电池Pack外观设计"分配给你', time: '5分钟前', read: false, type: 'task' },
  { id: '2', title: '审批待处理', desc: '"BOM清单v3"需要你的审批', time: '30分钟前', read: false, type: 'approval' },
  { id: '3', title: '系统维护通知', desc: '系统将于今晚22:00-23:00进行维护', time: '2小时前', read: true, type: 'system' },
];

export default function Header() {
  const { locale, setLocale } = useAppStore();
  const { currentUser, currentTeam, setCurrentUser, setCurrentTeam, setTeams } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const load = async () => {
      try {
        const [authRes, teamsRes] = await Promise.all([getCurrentUser(), getTeams()]);
        if (authRes?.data) {
          setCurrentUser((authRes as any).data.user);
          setCurrentTeam((authRes as any).data.team);
        }
        if (teamsRes?.data) setTeams((teamsRes as any).data);
      } catch (e) {
        console.warn('Auth load failed:', e);
      }
    };
    load();
  }, [setCurrentUser, setCurrentTeam, setTeams]);

  const toggleLocale = () => {
    setLocale(locale === 'zh' ? 'en' : 'zh');
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const notificationPanel = (
    <div className={styles.notifPanel}>
      <div className={styles.notifHeader}>
        <span>通知 ({unreadCount})</span>
        <Button type="link" size="small" onClick={markAllRead}>全部已读</Button>
      </div>
      <List
        size="small"
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item
            className={`${styles.notifItem} ${!item.read ? styles.notifUnread : ''}`}
            onClick={() => {
              setNotifications((prev) => prev.map((n) => n.id === item.id ? { ...n, read: true } : n));
              if (item.type === 'task') navigate('/todo');
              else if (item.type === 'approval') navigate('/config');
              else navigate('/dashboard');
            }}
          >  <div>
              <div className={styles.notifTitle}>{item.title}</div>
              <div className={styles.notifDesc}>{item.desc}</div>
              <div className={styles.notifTime}>{item.time}</div>
            </div>
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <>
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {currentUser?.name?.[0] || 'U'}
          </div>
          <span className={styles.userName}>{currentUser?.name || '用户'}</span>
        </div>
        <div className={styles.teamInfo}>
          <span className={styles.teamName}>{currentTeam?.name || '默认团队'}</span>
          <span className={styles.teamCount}>团队人数: {currentTeam?.memberCount || 0}人</span>
        </div>
      </div>
      <div className={styles.rightSection}>
        <Space size={20}>
          <Popover content={notificationPanel} trigger="click" placement="bottomRight" arrow={false}>
            <Badge count={unreadCount} size="small">
              <BellOutlined className={styles.iconBtn} />
            </Badge>
          </Popover>
          <span className={styles.langBtn} onClick={toggleLocale}>
            <GlobalOutlined style={{ marginRight: 4 }} />
            {locale === 'zh' ? '中/EN' : 'EN/中'}
          </span>
          <SearchOutlined className={styles.iconBtn} onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))} />
          <SettingOutlined className={styles.iconBtn} onClick={() => navigate('/config')} />
        </Space>
      </div>
      </header>
      <GlobalSearch />
    </>
  );
}
