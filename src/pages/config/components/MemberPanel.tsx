import { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Button, Checkbox, Modal, Input, message, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UserAddOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useConfigStore } from '@/stores/useConfigStore';
import { getMembers, addMember, removeMember, getUsers } from '@/services/config.service';
import { useAsyncAction } from '@/hooks/useAsyncData';
import type { User } from '@/types';
import styles from './MemberPanel.module.css';

export default function MemberPanel() {
  const { roles, selectedRoleId, members, setMembers } = useConfigStore();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  // Fetch members from API when selectedRoleId changes
  useEffect(() => {
    if (!selectedRoleId) return;
    const fetchMembers = async () => {
      try {
        const res = await getMembers(selectedRoleId);
        setMembers(res.data);
      } catch {
        // silent
      }
    };
    fetchMembers();
  }, [selectedRoleId, setMembers]);

  const existingMemberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      if (existingMemberIds.has(u.id)) return false;
      if (!searchKeyword) return true;
      return u.name.includes(searchKeyword) || u.email.includes(searchKeyword);
    });
  }, [allUsers, existingMemberIds, searchKeyword]);

  const [addSelectedKeys, setAddSelectedKeys] = useState<string[]>([]);

  const fetchMembers = useCallback(async () => {
    if (!selectedRoleId) return;
    const res = await getMembers(selectedRoleId);
    setMembers(res.data);
  }, [selectedRoleId, setMembers]);

  const { execute: removeSingle } = useAsyncAction(
    async (memberId: string) => {
      await removeMember(memberId);
      await fetchMembers();
      setSelectedRowKeys((prev) => prev.filter((k) => k !== memberId));
    },
    { successMessage: '成员已移除', errorMessage: '移除失败' },
  );

  const { execute: removeBatch } = useAsyncAction(
    async () => {
      await Promise.all(selectedRowKeys.map((id) => removeMember(id as string)));
      await fetchMembers();
      setSelectedRowKeys([]);
    },
    { successMessage: '已批量移除成员', errorMessage: '批量移除失败' },
  );

  const { execute: addMembers } = useAsyncAction(
    async () => {
      if (!selectedRoleId) return;
      await Promise.all(addSelectedKeys.map((userId) => addMember(selectedRoleId, userId)));
      await fetchMembers();
      const count = addSelectedKeys.length;
      setAddSelectedKeys([]);
      setAddModalVisible(false);
      setSearchKeyword('');
      return count;
    },
    { successMessage: '', errorMessage: '添加失败' },
  );

  const handleOpenAddModal = async () => {
    setAddModalVisible(true);
    try {
      const res = await getUsers();
      const users: User[] = res.data.map((u) => ({
        ...u,
        departmentId: '',
        roleIds: [],
        teamIds: [],
        status: 'active' as const,
        createdAt: '',
        updatedAt: '',
      }));
      setAllUsers(users);
    } catch {
      // silent
    }
  };

  const handleAddMembers = async () => {
    const count = await addMembers();
    if (count) message.success(`已添加 ${count} 名成员`);
  };

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
        <Popconfirm
          title="确定要移除此成员吗？"
          onConfirm={() => removeSingle(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            data-testid={`remove-member-${record.id}`}
          />
        </Popconfirm>
      ),
    },
  ];

  if (!selectedRole) {
    return <div className={styles.emptyState}>请在左侧选择角色以查看成员</div>;
  }

  return (
    <div>
      <div className={styles.header}>
        <span className={styles.roleTitle}>{selectedRole.name} - 成员列表</span>
        <div className={styles.actions}>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title="确定要批量移除所选成员吗？"
              onConfirm={() => removeBatch()}
              okText="确定"
              cancelText="取消"
            >
              <Button danger icon={<DeleteOutlined />}>
                移除成员
              </Button>
            </Popconfirm>
          )}
          <Button type="primary" icon={<UserAddOutlined />} onClick={handleOpenAddModal}>
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
