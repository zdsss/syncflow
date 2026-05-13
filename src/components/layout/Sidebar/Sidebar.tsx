import { useState } from 'react';
import { Tooltip, Drawer } from 'antd';
import { SettingOutlined, MenuOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NAV_ITEMS } from '@/constants/navigation';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import styles from './Sidebar.module.css';

import workspaceSvg from '@/assets/icons/nav/workspace.svg?react';
import workspaceActiveSvg from '@/assets/icons/nav/workspace-active.svg?react';
import projectMgmtSvg from '@/assets/icons/nav/project-mgmt.svg?react';
import projectMgmtActiveSvg from '@/assets/icons/nav/project-mgmt-active.svg?react';
import dashboardSvg from '@/assets/icons/nav/dashboard.svg?react';
import dashboardActiveSvg from '@/assets/icons/nav/dashboard-active.svg?react';
import fileMgmtSvg from '@/assets/icons/nav/file-mgmt.svg?react';
import fileMgmtActiveSvg from '@/assets/icons/nav/file-mgmt-active.svg?react';
import bomMgmtSvg from '@/assets/icons/nav/bom-mgmt.svg?react';
import bomMgmtActiveSvg from '@/assets/icons/nav/bom-mgmt-active.svg?react';
import processMgmtSvg from '@/assets/icons/nav/process-mgmt.svg?react';
import processMgmtActiveSvg from '@/assets/icons/nav/process-mgmt-active.svg?react';
import configMgmtSvg from '@/assets/icons/nav/config-mgmt.svg?react';
import configMgmtActiveSvg from '@/assets/icons/nav/config-mgmt-active.svg?react';
import queryStatsSvg from '@/assets/icons/nav/query-stats.svg?react';
import queryStatsActiveSvg from '@/assets/icons/nav/query-stats-active.svg?react';
import resourcesSvg from '@/assets/icons/nav/resources.svg?react';
import resourcesActiveSvg from '@/assets/icons/nav/resources-active.svg?react';
import knowledgeSvg from '@/assets/icons/nav/knowledge.svg?react';
import knowledgeActiveSvg from '@/assets/icons/nav/knowledge-active.svg?react';
import templateSvg from '@/assets/icons/nav/template.svg?react';
import templateActiveSvg from '@/assets/icons/nav/template-active.svg?react';
import personalFolderSvg from '@/assets/icons/nav/personal-folder.svg?react';
import personalFolderActiveSvg from '@/assets/icons/nav/personal-folder-active.svg?react';
import approvalSvg from '@/assets/icons/nav/approval.svg?react';
import approvalActiveSvg from '@/assets/icons/nav/approval-active.svg?react';

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'workspace': workspaceSvg,
  'project-mgmt': projectMgmtSvg,
  'dashboard': dashboardSvg,
  'file-mgmt': fileMgmtSvg,
  'bom-mgmt': bomMgmtSvg,
  'process-mgmt': processMgmtSvg,
  'config-mgmt': configMgmtSvg,
  'query-stats': queryStatsSvg,
  'resources': resourcesSvg,
  'knowledge': knowledgeSvg,
  'template': templateSvg,
  'personal-folder': personalFolderSvg,
  'approval': approvalSvg,
};

const activeIconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'workspace': workspaceActiveSvg,
  'project-mgmt': projectMgmtActiveSvg,
  'dashboard': dashboardActiveSvg,
  'file-mgmt': fileMgmtActiveSvg,
  'bom-mgmt': bomMgmtActiveSvg,
  'process-mgmt': processMgmtActiveSvg,
  'config-mgmt': configMgmtActiveSvg,
  'query-stats': queryStatsActiveSvg,
  'resources': resourcesActiveSvg,
  'knowledge': knowledgeActiveSvg,
  'template': templateActiveSvg,
  'personal-folder': personalFolderActiveSvg,
  'approval': approvalActiveSvg,
};

export default function Sidebar() {
  const { locale } = useAppStore();
  const { currentUser } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('sidebar');
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <div className={styles.avatarSection}>
        <Tooltip title={currentUser?.realName || currentUser?.username || '用户'} placement="right">
          <div className={styles.avatar}>
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="" className={styles.avatarImg} />
            ) : (
              (currentUser?.realName || currentUser?.username || 'U')[0]
            )}
            <span className={styles.onlineDot} />
          </div>
        </Tooltip>
      </div>

      <div className={styles.navList}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const IconComponent = isActive ? activeIconMap[item.iconKey] : iconMap[item.iconKey];
          const label = locale === 'zh' ? item.label : item.labelEn;

          return (
            <Tooltip key={item.key} title={label} placement="right">
              <div
                role="link"
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { navigate(item.path); setMobileOpen(false); } }}
                tabIndex={0}
              >
                {IconComponent && (
                  <IconComponent className={styles.navIcon} width={24} height={24} />
                )}
                <span className={styles.navLabel}>{label}</span>
              </div>
            </Tooltip>
          );
        })}
      </div>

      <div className={styles.bottomSection}>
        <Tooltip title={t('settings', { defaultValue: '设置' })} placement="right">
          <div
            className={styles.settingsItem}
            onClick={() => { navigate('/config'); setMobileOpen(false); }}
          >
            <SettingOutlined className={styles.settingsIcon} />
          </div>
        </Tooltip>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <nav className={`${styles.sidebar} app-sidebar`} aria-label="主导航">
        {navContent}
      </nav>

      {/* Mobile hamburger button */}
      <button
        className={styles.mobileMenuBtn}
        onClick={() => setMobileOpen(true)}
        aria-label="打开导航菜单"
      >
        <MenuOutlined />
      </button>

      {/* Mobile drawer */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        placement="left"
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
        className={styles.mobileDrawer}
      >
        {navContent}
      </Drawer>
    </>
  );
}
