import { Tabs } from 'antd';
import { useFileStore } from '@/stores/useFileStore';
import styles from './FileTypeTabs.module.css';

const tabItems = [
  { key: 'all', label: '全部' },
  { key: 'document', label: '文档' },
  { key: 'image', label: '图片' },
  { key: 'code', label: '代码' },
];

export default function FileTypeTabs() {
  const { fileTypeTab, setFileTypeTab } = useFileStore();

  return (
    <div className={styles.tabs}>
      <Tabs
        activeKey={fileTypeTab}
        onChange={setFileTypeTab}
        items={tabItems}
        size="middle"
      />
    </div>
  );
}
