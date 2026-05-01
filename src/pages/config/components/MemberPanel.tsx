import { useState, useMemo } from 'react';
import { Table, Button, Checkbox, Modal, Input, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UserAddOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useConfigStore } from '@/stores/useConfigStore';
import type { User } from '@/types';
import styles from './MemberPanel.module.css';

export default function MemberPanel() {
  const { roles, selectedRoleId, members, setMembers } = useConfigStore();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  // Mock all users for the "add member" modal
  const allUsers: User[] = useMemo(() => [
    { id: 'u1', name: '邓智豪', email: 'deng@syncflow.com', departmentId: 'd2', roleIds: ['r5'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
    { id: 'u2', name: '王美玲', email: 'wang.ml@syncflow.com', departmentId: 'd2', roleIds: ['r6'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
    { id: 'u3', name: '陈思远', email: 'chen.sy@syncflow.com', departmentId: 'd2', roleIds: ['r6'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
    { id: 'u6', name: '张伟', email: 'zhang.w@syncflow.com', departmentId: 'd1', roleIds: ['r1'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
    { id: 'u7', name: '李娜', email: 'li.n@syncflow.com', departmentId: 'd1', roleIds: ['r2'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
    { id: 'u8', name: '王晓明', email: 'wang.xm@syncflow.com', departmentId: 'd3', roleIds: ['r7'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
    { id: 'u9', name: '赵静怡', email: 'zhao.jy@syncflow.com', departmentId: 'd3', roleIds: ['r8'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
    { id: 'u10', name: '刘伟', email: 'liu.w@syncflow.com', departmentId: 'd4', roleIds: ['r10'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
    { id: 'u11', name: '陈晨', email: 'chen.c@syncflow.com', departmentId: 'd4', roleIds: ['r11'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
    { id: 'u13', name: '孙小雨', email: 'sun.xy@syncflow.com', departmentId: 'd5', roleIds: ['r13'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
    { id: 'u14', name: '吴文杰', email: 'wu.wj@syncflow.com', departmentId: 'd5', roleIds: ['r14'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
  ], []);

  const existingMemberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      if (existingMemberIds.has(u.id)) return false;
      if (!searchKeyword) return true;
      return u.name.includes(searchKeyword) || u.email.includes(searchKeyword);
    });
  }, [allUsers, existingMemberIds, searchKeyword]);

  const [addSelectedKeys, setAddSelectedKeys] = useState<string[]>([]);

  const memberColumns: ColumnsType<User> = [
    {
      title: '',
      width: 40,
      render: (_: unknown, __: User, index: number) => (
        <Checkbox
          checked={selectedRowKeys.includes(members[index]?.id)}
          onChange={(e) => {
            const id = members[index]?.id;
            if (!id) return;
            if (e.target.checked) {
              setSelectedRowKeys((prev) => [...prev, id]);
            } else {
              setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
            }
          }}
        />
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
    },
    {
      title: '操作',
      width: 80,
      render: (_: unknown, record: User) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveMember(record.id)}
        />
      ),
    },
  ];

  const handleRemoveMember = (memberId: string) => {
    setMembers(members.filter((m) => m.id !== memberId));
    setSelectedRowKeys((prev) => prev.filter((k) => k !== memberId));
    message.success('成员已移除');
  };

  const handleBatchRemove = () => {
    setMembers(members.filter((m) => !selectedRowKeys.includes(m.id)));
    setSelectedRowKeys([]);
    message.success('已批量移除成员');
  };

  const handleAddMembers = () => {
    const newMembers = allUsers.filter((u) => addSelectedKeys.includes(u.id));
    setMembers([...members, ...newMembers]);
    setAddSelectedKeys([]);
    setAddModalVisible(false);
    setSearchKeyword('');
    message.success(`已添加 ${newMembers.length} 名成员`);
  };

  if (!selectedRole) {
    return <div className={styles.emptyState}>请在左侧选择角色以查看成员</div>;
  }

  return (
    <div>
      <div className={styles.header}>
        <span className={styles.roleTitle}>{selectedRole.name} - 成员列表</span>
        <div className={styles.actions}>
          {selectedRowKeys.length > 0 && (
            <Button danger icon={<DeleteOutlined />} onClick={handleBatchRemove}>
              移除成员
            </Button>
          )}
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => setAddModalVisible(true)}>
            添加成员
          </Button>
        </div>
      </div>

      <Table<User>
        columns={memberColumns}
        dataSource={members}
        rowKey="id"
        pagination={false}
        size="small"
      />

      <Modal
        title="添加成员"
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          setSearchKeyword('');
          setAddSelectedKeys([]);
        }}
        onOk={handleAddMembers}
        okText="确认添加"
        cancelText="取消"
        width={500}
        okButtonProps={{ disabled: addSelectedKeys.length === 0 }}
      >
        <Input
          placeholder="搜索成员姓名或邮箱..."
          prefix={<SearchOutlined />}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          allowClear
          className={styles.modalSearch}
        />
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: 4,
                cursor: 'pointer',
                background: addSelectedKeys.includes(user.id) ? '#EBF0FF' : 'transparent',
              }}
              onClick={() => {
                setAddSelectedKeys((prev) =>
                  prev.includes(user.id)
                    ? prev.filter((id) => id !== user.id)
                    : [...prev, user.id]
                );
              }}
            >
              <Checkbox
                checked={addSelectedKeys.includes(user.id)}
                style={{ marginRight: 8 }}
              />
              <span style={{ flex: 1, fontSize: 14 }}>{user.name}</span>
              <span style={{ color: '#999', fontSize: 12 }}>{user.email}</span>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>
              无匹配成员
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
