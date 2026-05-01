import { Tabs } from 'antd';

interface ResourceTabsProps {
  activeTab: string;
  onTabChange: (key: string) => void;
}

const tabItems = [
  { key: 'human', label: '人力资源' },
  { key: 'equipment', label: '设备资源' },
  { key: 'supplier', label: '供应商' },
];

export default function ResourceTabs({ activeTab, onTabChange }: ResourceTabsProps) {
  return (
    <Tabs
      activeKey={activeTab}
      onChange={onTabChange}
      items={tabItems}
    />
  );
}
