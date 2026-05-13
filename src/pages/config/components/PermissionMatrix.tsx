import { useEffect, useCallback } from 'react';
import { Table, Checkbox, Radio, Space, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getPermissions, updatePermissions } from '@/services/config.service';
import type { PermissionEntry } from '@/services/config.service';

const MODULE_COLUMNS: { key: keyof Omit<PermissionEntry, 'id' | 'name' | 'dataPermission'>; label: string }[] = [
  { key: 'project', label: '项目' },
  { key: 'task', label: '任务' },
  { key: 'file', label: '文件' },
  { key: 'bom', label: 'BOM' },
  { key: 'approval', label: '审批' },
  { key: 'config', label: '配置' },
];

const DATA_PERMISSION_LEVELS = [
  { value: 'global', label: '全局', description: '管理员可见所有数据' },
  { value: 'department', label: '部门', description: '同部门可见' },
  { value: 'project', label: '项目', description: '项目成员可见' },
  { value: 'personal', label: '个人', description: '仅自己可见' },
];

export default function PermissionMatrix() {
  const fetcher = useCallback(() => getPermissions().then(r => r.data), []);
  const { data, loading, setData, refresh } = useAsyncData<PermissionEntry[]>(fetcher);

  useEffect(() => { refresh(); }, []);

  const persistPermissions = useCallback(async (updated: PermissionEntry[]) => {
    const payload = updated.map((p) => ({
      roleId: p.id,
      modules: MODULE_COLUMNS.filter((m) => p[m.key]).map((m) => m.key),
      dataPermission: p.dataPermission,
    }));
    await updatePermissions(payload);
  }, []);

  const handleModuleToggle = useCallback((roleId: string, moduleKey: string, checked: boolean) => {
    setData((prev) => {
      const updated = (prev ?? []).map((p) =>
        p.id === roleId ? { ...p, [moduleKey]: checked } : p,
      );
      persistPermissions(updated);
      return updated;
    });
  }, [persistPermissions, setData]);

  const handleDataPermissionChange = useCallback((roleId: string, value: string) => {
    setData((prev) => {
      const updated = (prev ?? []).map((p) =>
        p.id === roleId ? { ...p, dataPermission: value } : p,
      );
      persistPermissions(updated);
      return updated;
    });
  }, [persistPermissions, setData]);

  const columns: ColumnsType<PermissionEntry> = [
    {
      title: '角色',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      fixed: 'left',
    },
    ...MODULE_COLUMNS.map((mod) => ({
      title: mod.label,
      dataIndex: mod.key,
      key: mod.key,
      width: 100,
      align: 'center' as const,
      render: (val: boolean, record: PermissionEntry) => (
        <Checkbox
          checked={val}
          onChange={(e) => handleModuleToggle(record.id, mod.key, e.target.checked)}
        />
      ),
    })),
  ];

  return (
    <div data-testid="permission-matrix">
      <Spin spinning={loading}>
        <Table
          dataSource={data ?? []}
          columns={columns}
          pagination={false}
          bordered
          size="middle"
          scroll={{ x: 'max-content' }}
          rowKey="id"
        />
      </Spin>
      <div style={{ marginTop: 24 }} data-testid="data-permission">
        <h3>数据权限</h3>
        {(data ?? []).map((role) => (
          <div key={role.id} style={{ marginBottom: 12 }}>
            <span style={{ marginRight: 16, fontWeight: 500 }}>{role.name}:</span>
            <Radio.Group
              value={role.dataPermission}
              onChange={(e) => handleDataPermissionChange(role.id, e.target.value)}
            >
              <Space>
                {DATA_PERMISSION_LEVELS.map((level) => (
                  <Radio key={level.value} value={level.value}>
                    {level.label} ({level.description})
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </div>
        ))}
      </div>
    </div>
  );
}
