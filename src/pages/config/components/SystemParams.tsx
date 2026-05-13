import { useCallback, useEffect } from 'react';
import { Table, Input, Select, Button, message, type TableColumnsType } from 'antd';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import { getSystemParams, updateSystemParams, type SystemParam } from '@/services/config.service';

const STORAGE_KEY = 'system_params';

export default function SystemParams() {
  const fetcher = useCallback(
    () =>
      getSystemParams().then((res) => {
        if (res.code === 0 && res.data) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
          return res.data as SystemParam[];
        }
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as SystemParam[];
      }),
    [],
  );
  const { data, setData, refresh } = useAsyncData<SystemParam[]>(fetcher);

  useEffect(() => {
    refresh();
  }, []);

  const { execute: handleSave, loading } = useAsyncAction(
    async (params: SystemParam[]) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
      await updateSystemParams(params);
    },
    { successMessage: '系统参数保存成功', errorMessage: '' },
  );

  const handleChange = (key: string, newValue: string) => {
    setData((prev) =>
      (prev ?? []).map((p) => (p.key === key ? { ...p, value: newValue } : p)),
    );
  };

  const columns: TableColumnsType<SystemParam> = [
    {
      title: '参数名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '参数值',
      dataIndex: 'value',
      key: 'value',
      width: 300,
      render: (_: string, record: SystemParam) =>
        record.type === 'select' ? (
          <Select
            value={record.value}
            options={record.options!.map((o) => ({ label: o, value: o }))}
            onChange={(val) => handleChange(record.key, val)}
            style={{ width: 180 }}
          />
        ) : (
          <Input
            value={record.value}
            onChange={(e) => handleChange(record.key, e.target.value)}
            style={{ width: 180 }}
          />
        ),
    },
  ];

  return (
    <div data-testid="system-params">
      <Table
        dataSource={data ?? []}
        columns={columns}
        pagination={false}
        bordered
        size="middle"
        loading={loading && (data ?? []).length === 0}
      />
      <Button type="primary" onClick={() => handleSave(data ?? [])} loading={loading} style={{ marginTop: 16 }}>
        保存
      </Button>
    </div>
  );
}
