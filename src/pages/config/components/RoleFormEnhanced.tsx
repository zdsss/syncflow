import { useState, useEffect, useCallback } from 'react';
import { Modal, Tabs, Checkbox, Radio, Transfer, Tree, Spin, message } from 'antd';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import {
  getRolePermissions,
  updateRolePermissions,
  getMenuTree,
  getDataPermissions,
  getAppAuthorizations,
} from '@/services/config.service';
import type { RolePermission, DataPermission, AppAuthorization, MenuItem } from '@/services/config.service';

interface Props {
  open: boolean;
  roleId: string;
  roleName: string;
  onClose: () => void;
}

const FUNCTION_ITEMS = [
  { code: 'task:create', label: '创建任务' },
  { code: 'task:edit', label: '编辑任务' },
  { code: 'task:delete', label: '删除任务' },
  { code: 'task:assign', label: '指派任务' },
  { code: 'project:create', label: '创建项目' },
  { code: 'project:manage', label: '管理项目' },
  { code: 'bom:edit', label: '编辑BOM' },
  { code: 'bom:approve', label: '审批BOM' },
  { code: 'file:upload', label: '上传文件' },
  { code: 'file:delete', label: '删除文件' },
  { code: 'approval:approve', label: '审批权限' },
  { code: 'config:manage', label: '系统配置' },
];

function flattenMenuTree(nodes: MenuItem[]): { key: string; title: string }[] {
  const result: { key: string; title: string }[] = [];
  const walk = (items: MenuItem[]) => {
    for (const item of items) {
      result.push({ key: item.id, title: item.name });
      if (item.children?.length) walk(item.children);
    }
  };
  walk(nodes);
  return result;
}

function menuToTreeData(nodes: MenuItem[]): any[] {
  return nodes.map((item) => ({
    key: item.id,
    title: item.name,
    children: item.children?.length ? menuToTreeData(item.children) : undefined,
  }));
}

export default function RoleFormEnhanced({ open, roleId, roleName, onClose }: Props) {
  const [activeTab, setActiveTab] = useState('function');
  const [funcPerms, setFuncPerms] = useState<string[]>([]);
  const [dataPerm, setDataPerm] = useState<string>('data:department');
  const [appTargetKeys, setAppTargetKeys] = useState<string[]>([]);
  const [menuCheckedKeys, setMenuCheckedKeys] = useState<string[]>([]);

  const fetcher = useCallback(
    () => Promise.all([
      getMenuTree(),
      getDataPermissions(),
      getAppAuthorizations(),
      getRolePermissions(roleId, 'function'),
      getRolePermissions(roleId, 'data'),
      getRolePermissions(roleId, 'app'),
      getRolePermissions(roleId, 'menu'),
    ]).then(([menuRes, dpRes, appRes, funcRes, dataRes, appPermRes, menuRes2]) => {
      const funcCodes = (funcRes.data as RolePermission[])
        .filter((p) => p.permValue)
        .map((p) => p.permCode);
      const activeData = (dataRes.data as RolePermission[]).find((p) => p.permValue);
      const appKeys = (appPermRes.data as RolePermission[])
        .filter((p) => p.permValue)
        .map((p) => p.permCode);
      const menuKeys = (menuRes2.data as RolePermission[])
        .filter((p) => p.permValue)
        .map((p) => p.permCode);

      return {
        menuTree: menuRes.data,
        dataPermOptions: dpRes.data,
        appItems: appRes.data,
        funcCodes,
        dataPerm: activeData?.permCode ?? 'data:department',
        appKeys,
        menuKeys,
      };
    }),
    [roleId],
  );

  const { data, loading, refresh } = useAsyncData(fetcher, '加载权限数据失败');

  const menuTree = data?.menuTree ?? [];
  const dataPermOptions = data?.dataPermOptions ?? [];
  const appItems = data?.appItems ?? [];

  useEffect(() => {
    if (!open || !roleId) return;
    refresh();
  }, [open, roleId]);

  useEffect(() => {
    if (!data) return;
    setFuncPerms(data.funcCodes);
    setDataPerm(data.dataPerm);
    setAppTargetKeys(data.appKeys);
    setMenuCheckedKeys(data.menuKeys);
  }, [data]);

  const { execute: savePermissions } = useAsyncAction(
    async () => {
      await Promise.all([
        updateRolePermissions(roleId, 'function', FUNCTION_ITEMS.map((item) => ({
          permCode: item.code,
          permValue: funcPerms.includes(item.code),
        }))),
        updateRolePermissions(roleId, 'data', dataPermOptions.map((dp) => ({
          permCode: dp.code,
          permValue: dp.code === dataPerm,
        }))),
        updateRolePermissions(roleId, 'app', appItems.map((item) => ({
          permCode: item.keyName,
          permValue: appTargetKeys.includes(item.keyName),
        }))),
        updateRolePermissions(roleId, 'menu', flattenMenuTree(menuTree).map((m) => ({
          permCode: m.key,
          permValue: menuCheckedKeys.includes(m.key),
        }))),
      ]);
    },
    { successMessage: '权限保存成功', errorMessage: '权限保存失败' },
  );

  const handleSave = async () => {
    await savePermissions();
    onClose();
  };

  const tabItems = [
    {
      key: 'function',
      label: '功能权限',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Checkbox.Group
            value={funcPerms}
            onChange={(checked) => setFuncPerms(checked as string[])}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {FUNCTION_ITEMS.map((item) => (
                <Checkbox key={item.code} value={item.code}>{item.label}</Checkbox>
              ))}
            </div>
          </Checkbox.Group>
        </div>
      ),
    },
    {
      key: 'data',
      label: '数据权限',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Radio.Group value={dataPerm} onChange={(e) => setDataPerm(e.target.value)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {dataPermOptions.map((dp) => (
                <Radio key={dp.code} value={dp.code}>{dp.description}</Radio>
              ))}
            </div>
          </Radio.Group>
        </div>
      ),
    },
    {
      key: 'app',
      label: '应用权限',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Transfer
            dataSource={appItems.map((item) => ({
              key: item.keyName,
              title: item.description,
              description: item.scope,
            }))}
            targetKeys={appTargetKeys}
            onChange={(keys) => setAppTargetKeys(keys as string[])}
            render={(item) => item.title}
            titles={['未授权', '已授权']}
            listStyle={{ width: 280, height: 360 }}
          />
        </div>
      ),
    },
    {
      key: 'menu',
      label: '菜单权限',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Tree
            checkable
            defaultExpandAll
            treeData={menuToTreeData(menuTree)}
            checkedKeys={menuCheckedKeys}
            onCheck={(checked) => setMenuCheckedKeys(checked as string[])}
          />
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={`权限配置 - ${roleName}`}
      open={open}
      onOk={handleSave}
      onCancel={onClose}
      width={800}
      okText="保存"
      cancelText="取消"
      confirmLoading={loading}
    >
      <Spin spinning={loading}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Spin>
    </Modal>
  );
}
