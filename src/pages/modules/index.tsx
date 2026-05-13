import { useState } from 'react';
import { Input, Button } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import ModuleLibrary from './ModuleLibrary';
import UsageLookupView from './ProcessLibrary';
import ProcessRouteView from './OrderLibrary';
import styles from './ModulePage.module.css';

type TabKey = 'multilevel' | 'usage' | 'process';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'multilevel', label: '多级BOM' },
  { key: 'usage', label: '用量反查' },
  { key: 'process', label: '工艺路线' },
];

export default function ModulesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('multilevel');
  const [searchValue, setSearchValue] = useState('');

  return (
    <div className={styles.page}>
      {/* Header: title + search + button */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>物料清单</h1>
        <div className={styles.headerActions}>
          <Input
            className={styles.searchInput}
            placeholder="搜索..."
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />}>
            新增物料
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabBar} data-testid="bom-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tabItem} ${activeTab === tab.key ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'multilevel' && <ModuleLibrary />}
        {activeTab === 'usage' && <UsageLookupView />}
        {activeTab === 'process' && <ProcessRouteView />}
      </div>
    </div>
  );
}
