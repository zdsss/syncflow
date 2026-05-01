import { useEffect } from 'react';
import { Badge, Space } from 'antd';
import { BellOutlined, SearchOutlined, SettingOutlined, GlobalOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { getCurrentUser, getTeams } from '@/services/auth.service';
import GlobalSearch from '@/components/ui/GlobalSearch';
import styles from './Header.module.css';

export default function Header() {
  const { locale, setLocale } = useAppStore();
  const { currentUser, currentTeam, setCurrentUser, setCurrentTeam, setTeams } = useAuthStore();

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
          <Badge count={3} size="small">
            <BellOutlined className={styles.iconBtn} />
          </Badge>
          <span className={styles.langBtn} onClick={toggleLocale}>
            <GlobalOutlined style={{ marginRight: 4 }} />
            {locale === 'zh' ? '中/EN' : 'EN/中'}
          </span>
          <SearchOutlined className={styles.iconBtn} onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))} />
          <SettingOutlined className={styles.iconBtn} />
        </Space>
      </div>
      </header>
      <GlobalSearch />
    </>
  );
}
