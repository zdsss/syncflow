import { useState, useEffect, useCallback } from 'react';
import { Table, Tag, DatePicker, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { getLoginRecords, type LoginRecord } from '@/services/auth.service';
import { useAsyncData } from '@/hooks/useAsyncData';

const { RangePicker } = DatePicker;

export default function LoginRecords() {
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const fetcher = useCallback(async () => {
    const res = await getLoginRecords({ pageNum, pageSize });
    const data = (res as { data?: { records?: LoginRecord[] } }).data;
    let filtered = data.records as LoginRecord[];
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day');
      const end = dateRange[1].endOf('day');
      filtered = filtered.filter((r) => {
        const t = dayjs(r.loginTime);
        return t.isAfter(start) && t.isBefore(end);
      });
    }
    return { records: filtered, total: filtered.length };
  }, [pageNum, pageSize, dateRange]);

  const { data: recordsData, loading, refresh: fetchRecords } = useAsyncData(fetcher, '加载登录记录失败');
  const records = recordsData?.records || [];
  const total = recordsData?.total || 0;

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const columns: ColumnsType<LoginRecord> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
    },
    {
      title: '浏览器',
      dataIndex: 'userAgent',
      key: 'userAgent',
      ellipsis: true,
    },
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      key: 'loginTime',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => (
        <Tag color={val === 'success' ? 'green' : 'red'} data-testid={`status-tag-${val}`}>
          {val === 'success' ? '成功' : '失败'}
        </Tag>
      ),
    },
  ];

  return (
    <div data-testid="login-records">
      <Space style={{ marginBottom: 16 }}>
        <RangePicker
          data-testid="date-range-picker"
          onChange={(dates) => {
            setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null);
            setPageNum(1);
          }}
        />
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={records}
        loading={loading}
        data-testid="login-records-table"
        pagination={{
          current: pageNum,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (page, size) => {
            setPageNum(page);
            setPageSize(size);
          },
        }}
      />
    </div>
  );
}
