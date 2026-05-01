import { Layout, Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from 'react-i18next';
import { NAV_ITEMS } from '@/constants/navigation';
import styles from './Sidebar.module.css';

const { Sider } = Layout;

// Import all nav icons
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
};

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, locale } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('sidebar');

  const menuItems = NAV_ITEMS.map((item) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    const IconComponent = isActive ? activeIconMap[item.iconKey] : iconMap[item.iconKey];

    return {
      key: item.path,
      label: locale === 'zh' ? item.label : item.labelEn,
      icon: IconComponent ? (
        <IconComponent
          width={24}
          height={24}
          style={{ color: isActive ? '#3366FF' : '#333333' }}
        />
      ) : null,
      disabled: (item as any).comingSoon,
    };
  });

  return (
    <Sider
      collapsed={sidebarCollapsed}
      width={240}
      collapsedWidth={64}
      className={styles.sidebar}
    >
      <div className={styles.logo}>
        {sidebarCollapsed ? (
          <span className={styles.logoIcon}>SF</span>
        ) : (
          <span className={styles.logoText}>SyncFlow</span>
        )}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        className={styles.menu}
      />
      <div className={styles.collapseBtn} onClick={toggleSidebar}>
        {sidebarCollapsed ? '>' : '<'}
      </div>
    </Sider>
  );
}
