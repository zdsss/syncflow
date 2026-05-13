import { useEffect, useMemo, useCallback } from 'react';
import { Tabs } from 'antd';
import { useConfigStore } from '@/stores/useConfigStore';
import { getRoles, getMembers } from '@/services/config.service';
import { useAsyncData } from '@/hooks/useAsyncData';
import type { User } from '@/types';
import styles from './RoleCardGrid.module.css';

const COLORS = ['#3366FF', '#52C41A', '#FAAD14', '#FF4D4F', '#722ED1', '#13C2C2', '#EB2F96', '#FA8C16'];

export default function RoleCardGrid() {
  const { departments, roles, selectedDepartmentId, selectDepartment, setRoles } = useConfigStore();

  const currentDeptId = selectedDepartmentId || departments[0]?.id || 'd1';

  const tabItems = useMemo(() => {
    return departments.map((dept) => ({
      key: dept.id,
      label: dept.name,
    }));
  }, [departments]);

  const rolesFetcher = useCallback(
    async () => {
      const res = await getRoles(currentDeptId);
      setRoles(res.data);
      return res.data;
    },
    [currentDeptId, setRoles],
  );
  const { data: fetchedRoles, refresh: refreshRoles } = useAsyncData(rolesFetcher, '加载角色列表失败');

  useEffect(() => { refreshRoles(); }, [refreshRoles]);

  const membersFetcher = useCallback(
    async () => {
      if (!roles.length) return {};
      const results: Record<string, User[]> = {};
      await Promise.all(
        roles.map(async (role) => {
          try {
            const res = await getMembers(role.id);
            results[role.id] = res.data;
          } catch {
            results[role.id] = [];
          }
        }),
      );
      return results;
    },
    [roles],
  );
  const { data: membersByRole, refresh: refreshMembers } = useAsyncData<Record<string, User[]>>(membersFetcher, '加载成员列表失败');

  useEffect(() => {
    if (roles.length > 0) refreshMembers();
  }, [roles, refreshMembers]);

  const handleTabChange = (deptId: string) => {
    selectDepartment(deptId);
  };

  // Build role cards with members from API data
  const roleCards = useMemo(() => {
    return roles.map((role) => {
      const members = (membersByRole ?? {})[role.id] || [];
      return { ...role, members };
    });
  }, [roles, membersByRole]);

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
