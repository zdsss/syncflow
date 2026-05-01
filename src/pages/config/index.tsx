import { Tabs } from 'antd';
import DepartmentTabs from './components/DepartmentTabs';
import RolePanel from './components/RolePanel';
import MemberPanel from './components/MemberPanel';
import RoleCardGrid from './components/RoleCardGrid';
import NotificationSettings from './components/NotificationSettings';
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
    key: 'roleCards',
    label: '角色卡片视图',
    children: <RoleCardGrid />,
  },
  {
    key: 'notification',
    label: '通知设置',
    children: <NotificationSettings />,
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
