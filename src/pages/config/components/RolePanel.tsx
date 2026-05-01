import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useConfigStore } from '@/stores/useConfigStore';
import { getMembers } from '@/services/config.service';
import styles from './RolePanel.module.css';

export default function RolePanel() {
  const { roles, selectedRoleId, selectRole, setMembers, loading } = useConfigStore();

  const handleSelectRole = async (roleId: string) => {
    selectRole(roleId);
    try {
      const res = await getMembers(roleId);
      setMembers(res.data);
    } catch {
      message.error('获取成员列表失败');
    }
  };

  const handleAddRole = () => {
    message.info('添加角色功能开发中...');
  };

  return (
    <div className={styles.panel}>
      <div className={styles.roleList}>
        {loading && <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>加载中...</div>}
        {!loading && roles.map((role) => (
          <div
            key={role.id}
            className={`${styles.roleItem} ${selectedRoleId === role.id ? styles.roleItemActive : ''}`}
            onClick={() => handleSelectRole(role.id)}
          >
            <span className={styles.roleName}>{role.name}</span>
            <span className={styles.badge}>{role.memberCount}</span>
          </div>
        ))}
        {!loading && roles.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>暂无角色</div>
        )}
      </div>
      <div className={styles.addBtnWrap}>
        <Button type="dashed" block icon={<PlusOutlined />} onClick={handleAddRole}>
          添加角色
        </Button>
      </div>
    </div>
  );
}
