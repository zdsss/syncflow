import ReactECharts from 'echarts-for-react';

interface WorkloadData {
  total: number;
  byStatus: Record<string, number>;
}

interface WorkloadChartProps {
  data: WorkloadData;
}

const statusLabels: Record<string, string> = {
  COMPLETED: '已完成',
  IN_PROGRESS: '进行中',
  NOT_STARTED: '未开始',
  OVERDUE: '已逾期',
  PENDING_ASSIGN: '待分配',
  URGENT: '紧急',
};

const statusColors: Record<string, string> = {
  COMPLETED: '#52c41a',
  IN_PROGRESS: '#3366FF',
  NOT_STARTED: '#d9d9d9',
  OVERDUE: '#ff4d4f',
  PENDING_ASSIGN: '#d9d9d9',
  URGENT: '#ff4d4f',
};

export default function WorkloadChart({ data }: WorkloadChartProps) {
  const completed = data.byStatus['COMPLETED'] ?? 0;
  const remaining = data.total - completed;
  const statuses = Object.keys(data.byStatus);

  const option = {
    title: {
      text: '个人工作量',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
    },
    legend: {
      bottom: 0,
    },
    series: [
      {
        name: '完成率',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['25%', '50%'],
        data: [
          {
            name: '已完成',
            value: completed,
            itemStyle: { color: '#52c41a' },
          },
          {
            name: '未完成',
            value: remaining,
            itemStyle: { color: '#d9d9d9' },
          },
        ],
        label: {
          formatter: '{b}: {d}%',
        },
      },
      {
        name: '任务状态',
        type: 'bar',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: statuses.map((s) => ({
          value: data.byStatus[s],
          name: statusLabels[s] || s,
          itemStyle: {
            color: statusColors[s] || '#3366FF',
          },
        })),
      },
    ],
    xAxis: {
      type: 'category',
      data: statuses.map((s) => statusLabels[s] || s),
      gridIndex: 1,
    },
    yAxis: {
      type: 'value',
      gridIndex: 1,
    },
    grid: [
      { left: '55%', right: '5%', top: '15%', bottom: '15%' },
    ],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
}
