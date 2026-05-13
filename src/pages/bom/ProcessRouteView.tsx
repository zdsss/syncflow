import { useCallback, useEffect } from 'react';
import { Table, Tag, Alert, Empty } from 'antd';
import { getProcessRoutes, getProcessRoute } from '@/services/process.service';
import { useAsyncData } from '@/hooks/useAsyncData';

interface OperationVO {
  id: number;
  seqNo: number;
  operationNo: string;
  name: string;
  workCenterName?: string;
  status: number;
}

interface ProcessRouteVO {
  id: number;
  name: string;
  routeNo?: string;
  version?: string;
  status: number;
}

interface ProcessRouteViewProps {
  bomId?: number | null;
}

function operationStatusTag(status: number) {
  if (status >= 5) return <Tag color="success">已完成</Tag>;
  if (status >= 3) return <Tag color="processing">进行中</Tag>;
  return <Tag color="default">未开始</Tag>;
}

function routeStatusTag(status: number) {
  if (status === 3) return <Tag color="success">已发布</Tag>;
  if (status === 2) return <Tag color="warning">审批中</Tag>;
  return <Tag color="default">草稿</Tag>;
}

const OPERATION_COLUMNS = [
  { title: '工序号', dataIndex: 'operationNo', key: 'operationNo', width: 100 },
  { title: '工序名称', dataIndex: 'name', key: 'name', width: 140 },
  { title: '工作中心', dataIndex: 'workCenterName', key: 'workCenterName', width: 120, render: (v: string) => v || '-' },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (_: any, record: OperationVO) => operationStatusTag(record.status),
  },
];

const ROUTE_COLUMNS = [
  { title: '路线名称', dataIndex: 'name', key: 'name' },
  { title: '路线编号', dataIndex: 'routeNo', key: 'routeNo', width: 140, render: (v: string) => v || '-' },
  { title: '版本', dataIndex: 'version', key: 'version', width: 80, render: (v: string) => v || 'V1' },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (_: any, record: ProcessRouteVO) => routeStatusTag(record.status),
  },
];

export default function ProcessRouteView({ bomId }: ProcessRouteViewProps) {
  const routesFetcher = useCallback(
    () =>
      bomId
        ? getProcessRoutes({ bomId }).then((res: any) => (res.data as ProcessRouteVO[]) || [])
        : Promise.resolve([]),
    [bomId],
  );
  const { data: routes, error: routesError, refresh: refreshRoutes } = useAsyncData<ProcessRouteVO[]>(routesFetcher, '获取工艺路线失败');

  useEffect(() => {
    if (bomId) refreshRoutes();
  }, [bomId, refreshRoutes]);

  const firstRouteId = routes && routes.length > 0 ? routes[0].id : null;
  const detailFetcher = useCallback(
    () =>
      firstRouteId
        ? getProcessRoute(firstRouteId).then((res: any) => (res.data?.operations as OperationVO[]) || [])
        : Promise.resolve([]),
    [firstRouteId],
  );
  const { data: operations, refresh: refreshDetail } = useAsyncData<OperationVO[]>(detailFetcher, '获取工序失败');

  useEffect(() => {
    if (firstRouteId) refreshDetail();
  }, [firstRouteId, refreshDetail]);

  if (!bomId) {
    return <Empty description="请先选择BOM" />;
  }

  return (
    <div data-testid="process-route-view" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {routesError && <Alert message="获取工艺路线失败" type="error" style={{ marginBottom: 8 }} />}

      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>关联工艺路线</h3>
        <Table
          columns={ROUTE_COLUMNS}
          dataSource={routes || []}
          rowKey="id"
          size="small"
          pagination={false}
        />
      </div>

      {firstRouteId && (
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>工序明细</h3>
          <Table
            columns={OPERATION_COLUMNS}
            dataSource={operations || []}
            rowKey="id"
            size="small"
            pagination={false}
          />
        </div>
      )}
    </div>
  );
}
