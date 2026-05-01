import { useEffect } from 'react';
import { Tabs } from 'antd';
import { useConfigStore } from '@/stores/useConfigStore';
import { getDepartments, getRoles } from '@/services/config.service';
import styles from './DepartmentTabs.module.css';

const tabItems = [
  { key: 'd1', label: '公司管理层' },
  { key: 'd2', label: '设计部' },
  { key: 'd3', label: '产品部' },
  { key: 'd4', label: '研发部' },
  { key: 'd5', label: '测试部' },
];

export default function DepartmentTabs() {
  const { selectedDepartmentId, selectDepartment, setDepartments, setRoles, setLoading } = useConfigStore();

  useEffect(() => {
    const init = async () => {
      try {
        const res = await getDepartments();
        setDepartments(res.data);
        if (!selectedDepartmentId && res.data.length > 0) {
          selectDepartment(res.data[0].id);
          const roleRes = await getRoles(res.data[0].id);
          setRoles(roleRes.data);
        }
      } catch {
        // silent
      }
    };
    init();
  }, []);

  const handleTabChange = async (deptId: string) => {
    selectDepartment(deptId);
    setLoading(true);
    try {
      const roleRes = await getRoles(deptId);
      setRoles(roleRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.tabs}>
      <Tabs
        activeKey={selectedDepartmentId || undefined}
        onChange={handleTabChange}
        items={tabItems}
        size="small"
      />
    </div>
  );
}
