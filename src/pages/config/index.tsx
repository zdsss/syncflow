import { Tabs } from 'antd';
import DepartmentTabs from './components/DepartmentTabs';
import RolePanel from './components/RolePanel';
import MemberPanel from './components/MemberPanel';
import RoleCardGrid from './components/RoleCardGrid';
import NotificationSettings from './components/NotificationSettings';
import PermissionMatrix from './components/PermissionMatrix';
import SystemParams from './components/SystemParams';
import MenuManagement from './components/MenuManagement';
import DictionaryManagement from './components/DictionaryManagement';
import DataPermissionPage from './components/DataPermissionPage';
import AppAuthorizationPage from './components/AppAuthorizationPage';
import CodeManagement from './components/CodeManagement';
import ApprovalChainConfig from './components/ApprovalChainConfig';
import styles from './config.module.css';

const tabItems = [
  {
    key: 'roleConfig',
    label: '角色权限配置',
    children: (
      <div className={styles.dualPanel}>
        <div className={styles.leftPanel}>
          <DepartmentTabs />
          <RolePanel />
        </div>
        <div className={styles.rightPanel}>
          <MemberPanel />
        </div>
      </div>
    ),
  },
  {
    key: 'permissionMatrix',
    label: '权限配置',
    children: <PermissionMatrix />,
  },
  {
    key: 'menuMgmt',
    label: '菜单管理',
    children: <MenuManagement />,
  },
  {
    key: 'dictionaryMgmt',
    label: '字典管理',
    children: <DictionaryManagement />,
  },
  {
    key: 'dataPermission',
    label: '数据权限',
    children: <DataPermissionPage />,
  },
  {
    key: 'appAuth',
    label: '应用授权',
    children: <AppAuthorizationPage />,
  },
  {
    key: 'codeManagement',
    label: '编码管理',
    children: <CodeManagement />,
  },
  {
    key: 'roleCards',
    label: '角色卡片视图',
    children: <RoleCardGrid />,
  },
  {
    key: 'notification',
    label: '通知设置',
    children: <NotificationSettings />,
  },
  {
    key: 'systemParams',
    label: '系统参数',
    children: <SystemParams />,
  },
  {
    key: 'approvalChain',
    label: '审批链配置',
    children: <ApprovalChainConfig />,
  },
];

export default function ConfigPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>配置管理</h1>
      <div className={styles.body}>
        <Tabs items={tabItems} defaultActiveKey="roleConfig" />
      </div>
    </div>
  );
}
