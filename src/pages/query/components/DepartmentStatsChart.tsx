import ReactECharts from 'echarts-for-react';

interface DepartmentUser {
  id: string;
  name: string;
  taskCount: number;
  byStatus?: Record<string, number>;
}

interface DepartmentStatsChartProps {
  data: DepartmentUser[];
}

const statusLabels: Record<string, string> = {
  COMPLETED: '已完成',
  IN_PROGRESS: '进行中',
  NOT_STARTED: '未开始',
};

const statusColors: Record<string, string> = {
  COMPLETED: '#52c41a',
  IN_PROGRESS: '#3366FF',
  NOT_STARTED: '#d9d9d9',
};

export default function DepartmentStatsChart({ data }: DepartmentStatsChartProps) {
  const userNames = data.map((u) => u.name);
  const statuses = ['COMPLETED', 'IN_PROGRESS', 'NOT_STARTED'];

  const series = statuses.map((status) => ({
    name: statusLabels[status],
    type: 'bar' as const,
    stack: 'total',
    data: data.map((u) => u.byStatus?.[status] ?? 0),
    itemStyle: {
      color: statusColors[status],
    },
  }));

  const option = {
    title: {
      text: '部门任务统计',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      bottom: 0,
    },
    yAxis: {
      type: 'category',
      data: userNames,
    },
    xAxis: {
      type: 'value',
    },
    series,
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
}
