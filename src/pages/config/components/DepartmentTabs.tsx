import { useEffect, useCallback } from 'react';
import { Tabs, Button, Modal, Input, Space, Tooltip, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useConfigStore } from '@/stores/useConfigStore';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import {
  getDepartments,
  getRoles,
  createDepartment,
  updateDepartment,
  removeDepartment,
} from '@/services/config.service';
import type { Department } from '@/types';
import styles from './DepartmentTabs.module.css';

export default function DepartmentTabs() {
  const {
    selectedDepartmentId,
    selectDepartment,
    setDepartments,
    setRoles,
    setLoading,
    departments,
  } = useConfigStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { execute: createDept } = useAsyncAction(
    async (name: string) => { await createDepartment({ name }); },
    { successMessage: '部门创建成功', errorMessage: '操作失败' },
  );
  const { execute: updateDept } = useAsyncAction(
    async (id: string, name: string) => { await updateDepartment(id, { name }); },
    { successMessage: '部门更新成功', errorMessage: '操作失败' },
  );
  const { execute: deleteDept } = useAsyncAction(
    async (id: string) => { await removeDepartment(id); },
    { successMessage: '部门已删除', errorMessage: '删除失败' },
  );

  const initFetcher = useCallback(async () => {
    const res = await getDepartments();
    setDepartments(res.data);
    if (!selectedDepartmentId && res.data.length > 0) {
      selectDepartment(res.data[0].id);
      const roleRes = await getRoles(res.data[0].id);
      setRoles(roleRes.data);
    }
    return res.data;
  }, [selectedDepartmentId, selectDepartment, setDepartments, setRoles]);

  const { refresh: refreshDepartments } = useAsyncData(initFetcher, '加载部门列表失败');

  useEffect(() => { refreshDepartments(); }, []);

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

  const openAddModal = () => {
    setModalMode('add');
    setEditingDept(null);
    setDeptName('');
    setModalVisible(true);
  };

  const openEditModal = (dept: Department) => {
    setModalMode('edit');
    setEditingDept(dept);
    setDeptName(dept.name);
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    if (!deptName.trim()) {
      message.warning('请输入部门名称');
      return;
    }
    if (modalMode === 'add') {
      await createDept(deptName.trim());
    } else if (editingDept) {
      await updateDept(editingDept.id, deptName.trim());
    }
    setModalVisible(false);
    await refreshDepartments();
  };

  const handleDelete = async (deptId: string) => {
    await deleteDept(deptId);
    await refreshDepartments();
  };

  const tabItems = departments.map((dept) => ({
    key: dept.id,
    label: (
      <Space size={4} className={styles.tabLabel}>
        <span>{dept.name}</span>
        <Tooltip title="编辑部门">
          <EditOutlined
            aria-label="编辑部门"
            className={styles.tabAction}
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(dept);
            }}
          />
        </Tooltip>
        <Popconfirm
          title="确认删除"
          description={`确定要删除 "${dept.name}" 吗？`}
          onConfirm={(e) => {
            e?.stopPropagation();
            handleDelete(dept.id);
          }}
          onCancel={(e) => e?.stopPropagation()}
          okText="确定"
          cancelText="取消"
        >
          <Tooltip title="删除部门">
            <DeleteOutlined
              aria-label="删除部门"
              className={styles.tabAction}
              onClick={(e) => e.stopPropagation()}
            />
          </Tooltip>
        </Popconfirm>
      </Space>
    ),
  }));

  const addTab = (
    <Button
      type="text"
      size="small"
      icon={<PlusOutlined />}
      aria-label="添加部门"
      onClick={openAddModal}
    />
  );

  return (
    <div className={styles.tabs}>
      <Tabs
        activeKey={selectedDepartmentId || undefined}
        onChange={handleTabChange}
        items={tabItems}
        size="small"
        tabBarExtraContent={addTab}
      />
      <Modal
        title={modalMode === 'add' ? '新增部门' : '编辑部门'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        okText="确定"
        cancelText="取消"
      >
        <Input
          placeholder="请输入部门名称"
          value={deptName}
          onChange={(e) => setDeptName(e.target.value)}
          onPressEnter={handleModalOk}
        />
      </Modal>
    </div>
  );
}
