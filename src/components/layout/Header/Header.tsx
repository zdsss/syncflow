import { useEffect } from 'react';
import { Badge, Popover, List, Button, Space } from 'antd';
import { BellOutlined, SearchOutlined, SettingOutlined, GlobalOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useSocket } from '@/hooks/useSocket';
import { getCurrentUser, getTeams } from '@/services/auth.service';
import GlobalSearch from '@/components/ui/GlobalSearch';
import styles from './Header.module.css';

export default function Header() {
  const { locale, setLocale } = useAppStore();
  const { currentUser, currentTeam, setCurrentUser, setCurrentTeam, setTeams } = useAuthStore();
  const navigate = useNavigate();
  const { notifications, addNotification, markAsRead, markAllAsRead } = useNotificationStore();
  const { on } = useSocket();
  const unreadCount = useNotificationStore((s) => s.unreadCount());

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

  useEffect(() => {
    const off = on('notification:new', (data: { title: string; desc: string; type: string }) => {
      addNotification({ title: data.title, desc: data.desc, type: data.type as any });
    });
    return off;
  }, [on, addNotification]);

  const toggleLocale = () => {
    setLocale(locale === 'zh' ? 'en' : 'zh');
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
              markAsRead(item.id);
              if (item.type === 'task') navigate('/todo');
              else if (item.type === 'approval') navigate('/approval');
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
