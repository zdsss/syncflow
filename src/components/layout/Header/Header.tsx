import { useEffect, useState, useRef, useCallback } from 'react';
import { Badge, Space, message } from 'antd';
import { BellOutlined, SearchOutlined, SettingOutlined, GlobalOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import type { User, Team } from '@/types';
import { useSocket } from '@/hooks/useSocket';
import { getCurrentUser, getTeams } from '@/services/auth.service';
import GlobalSearch from '@/components/ui/GlobalSearch';
import NotificationPanel from '@/components/ui/NotificationPanel';
import styles from './Header.module.css';

function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + '***' + phone.slice(-3);
}

export default function Header() {
  const { locale, setLocale } = useAppStore();
  const { currentUser, currentTeam, setCurrentUser, setCurrentTeam, setTeams } = useAuthStore();
  const navigate = useNavigate();
  const { addNotification, fetchNotificationsAsync, fetchUnreadCountAsync } = useNotificationStore();
  const { subscribe, unsubscribe } = useSocket();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [panelOpen, setPanelOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const closePanel = useCallback(() => setPanelOpen(false), []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    if (panelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [panelOpen]);

  useEffect(() => {
    const load = async () => {
      try {
        const [authRes, teamsRes] = await Promise.all([getCurrentUser(), getTeams()]);
        const authData = authRes?.data as { user?: User; team?: Team } | undefined;
        if (authData?.user) {
          setCurrentUser(authData.user);
          setCurrentTeam(authData.team ?? null);
        }
        if (teamsRes?.data) setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : []);
      } catch (e) {
        message.error('加载用户信息失败');
      }
    };
    load();
  }, [setCurrentUser, setCurrentTeam, setTeams]);

  useEffect(() => {
    const destination = '/topic/notifications';
    subscribe(destination, (data: { title: string; desc: string; type: string }) => {
      addNotification({ title: data.title, desc: data.desc, type: (data.type || 'system') as 'task' | 'approval' | 'system' });
    });
    return () => unsubscribe(destination);
  }, [subscribe, unsubscribe, addNotification]);

  useEffect(() => {
    fetchNotificationsAsync().catch(() => {});
    fetchUnreadCountAsync().catch(() => {});
  }, [fetchNotificationsAsync, fetchUnreadCountAsync]);

  const toggleLocale = () => {
    setLocale(locale === 'zh' ? 'en' : 'zh');
  };

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
          {currentUser && (
            <div className={styles.userIdentity} onClick={() => navigate('/settings')} data-testid="user-identity">
              <span className={styles.userRealName}>{currentUser.realName || currentUser.name}</span>
              {currentUser.phone && (
                <span className={styles.userPhone}>{maskPhone(currentUser.phone)}</span>
              )}
            </div>
          )}
          <div ref={bellRef} style={{ position: 'relative' }}>
            <Badge count={unreadCount} size="small">
              <BellOutlined className={styles.iconBtn} onClick={() => setPanelOpen((v) => !v)} />
            </Badge>
            <NotificationPanel open={panelOpen} onClose={closePanel} />
          </div>
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
