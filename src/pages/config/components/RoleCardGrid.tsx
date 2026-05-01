import { useEffect, useMemo } from 'react';
import { Tabs } from 'antd';
import { useConfigStore } from '@/stores/useConfigStore';
import { getRoles } from '@/services/config.service';
import { mockUsers } from '@/mocks/data/users';
import styles from './RoleCardGrid.module.css';

const COLORS = ['#3366FF', '#52C41A', '#FAAD14', '#FF4D4F', '#722ED1', '#13C2C2', '#EB2F96', '#FA8C16'];

const tabItems = [
  { key: 'd1', label: '公司管理层' },
  { key: 'd2', label: '设计部' },
  { key: 'd3', label: '产品部' },
  { key: 'd4', label: '研发部' },
  { key: 'd5', label: '测试部' },
];

export default function RoleCardGrid() {
  const { departments, roles, selectedDepartmentId, selectDepartment, setRoles } = useConfigStore();

  const currentDeptId = selectedDepartmentId || departments[0]?.id || 'd1';

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await getRoles(currentDeptId);
        setRoles(res.data);
      } catch {
        // silent
      }
    };
    fetchRoles();
  }, [currentDeptId, setRoles]);

  const handleTabChange = (deptId: string) => {
    selectDepartment(deptId);
  };

  // Get members for each role from mock data
  const roleCards = useMemo(() => {
    return roles.map((role) => {
      const members = mockUsers.filter((u) => u.roleIds.includes(role.id));
      return { ...role, members };
    });
  }, [roles]);

  return (
    <div>
      <Tabs
        activeKey={currentDeptId}
        onChange={handleTabChange}
        items={tabItems}
        size="small"
      />
      <div className={styles.grid}>
        {roleCards.map((card) => (
          <div key={card.id} className={styles.card}>
            <div className={styles.cardTitle}>
              {card.name} ({card.members.length}人)
            </div>
            <div className={styles.memberList}>
              {card.members.length > 0 ? (
                card.members.map((member, idx) => (
                  <div key={member.id} className={styles.memberItem}>
                    <div
                      className={styles.avatar}
                      style={{ background: COLORS[idx % COLORS.length] }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <span className={styles.memberName}>{member.name}</span>
                  </div>
                ))
              ) : (
                <span style={{ color: '#999', fontSize: 13 }}>暂无成员</span>
              )}
            </div>
          </div>
        ))}
        {roleCards.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999', padding: 40 }}>
            该部门暂无角色
          </div>
        )}
      </div>
    </div>
  );
}
