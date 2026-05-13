import { useState } from 'react';
import { Button, Modal, Form, Input, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useConfigStore } from '@/stores/useConfigStore';
import { getMembers, createRole } from '@/services/config.service';
import styles from './RolePanel.module.css';

export default function RolePanel() {
  const { roles, selectedRoleId, selectedDepartmentId, selectRole, setMembers, setRoles, loading } = useConfigStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

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
    form.resetFields();
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const res = await createRole({
        name: values.name,
        departmentId: selectedDepartmentId || '',
        description: values.description,
      });
      // Add new role to store
      setRoles([...roles, { ...res.data, memberCount: 0 }]);
      setModalOpen(false);
      message.success('角色创建成功');
    } catch (err: any) {
      if (err?.errorFields) return; // form validation error
      message.error('创建角色失败');
    } finally {
      setSubmitting(false);
    }
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
      <Modal
        title="新建角色"
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入角色描述" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
