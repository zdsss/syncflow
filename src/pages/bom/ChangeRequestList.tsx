import { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getChangeRequests } from '@/services/bom.service';
import { useAsyncData } from '@/hooks/useAsyncData';

interface ChangeRequest {
  id: number;
  entityType: string;
  entityId: number;
  changeType: string;
  changeData?: string;
  status: number;
  applicantId: number;
  applicantName?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: number;
}

const typeLabels: Record<string, string> = {
  ADD_ITEM: '新增物料',
  UPDATE_ITEM: '修改物料',
  DELETE_ITEM: '删除物料',
  REORDER: '重排序',
  UPDATE_SPEC: '修改规格',
  ADD_OPERATION: '新增工序',
  DELETE_OPERATION: '删除工序',
};

const statusMap: Record<number, { label: string; color: string }> = {
  1: { label: '待审批', color: 'orange' },
  2: { label: '已通过', color: 'green' },
  3: { label: '已拒绝', color: 'red' },
  4: { label: '已撤回', color: 'default' },
};

interface ChangeRequestListProps {
  bomId: number | null;
}

const columns: ColumnsType<ChangeRequest> = [
  {
    title: '变更类型',
    dataIndex: 'changeType',
    key: 'changeType',
    width: 120,
    render: (type: string) => typeLabels[type] || type,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (status: number) => {
      const cfg = statusMap[status] || { label: `未知(${status})`, color: 'default' };
      return <Tag color={cfg.color}>{cfg.label}</Tag>;
    },
  },
  {
    title: '申请人',
    dataIndex: 'applicantName',
    key: 'applicantName',
    width: 100,
    render: (v: string) => v || '-',
  },
  {
    title: '申请时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
    render: (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '-',
  },
  {
    title: '处理时间',
    dataIndex: 'resolvedAt',
    key: 'resolvedAt',
    width: 180,
    render: (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '-',
  },
];

export default function ChangeRequestList({ bomId }: ChangeRequestListProps) {
  const fetcher = useCallback(
    () => bomId ? getChangeRequests(bomId).then((res) => (res as any).data || []) : Promise.resolve([]),
    [bomId],
  );

  const { data: requests, loading, refresh } = useAsyncData<ChangeRequest[]>(fetcher, '获取变更记录失败');

  useEffect(() => {
    if (bomId) {
      refresh();
    }
  }, [bomId, refresh]);

  if (!bomId) {
    return <Empty description="请先选择BOM" />;
  }

  return (
    <div data-testid="change-request-list">
      <Table
        columns={columns}
        dataSource={requests || []}
        rowKey="id"
        size="small"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条记录`, showSizeChanger: false }}
      />
    </div>
  );
}
