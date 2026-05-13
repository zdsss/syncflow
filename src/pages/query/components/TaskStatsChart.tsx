import ReactECharts from 'echarts-for-react';

interface TaskStat {
  status: string;
  _count: { id: number };
}

interface TaskStatsChartProps {
  data: TaskStat[];
}

const statusLabels: Record<string, string> = {
  NOT_STARTED: '未开始',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  OVERDUE: '已逾期',
  PENDING_ASSIGN: '待分配',
  URGENT: '紧急',
};

const statusColors: Record<string, string> = {
  NOT_STARTED: '#d9d9d9',
  IN_PROGRESS: '#faad14',
  COMPLETED: '#52c41a',
  OVERDUE: '#ff4d4f',
  PENDING_ASSIGN: '#d9d9d9',
  URGENT: '#ff4d4f',
};

export default function TaskStatsChart({ data }: TaskStatsChartProps) {
  const total = data.reduce((sum, item) => sum + item._count.id, 0);

  const pieData = data.map((item) => ({
    value: item._count.id,
    name: statusLabels[item.status] || item.status,
    itemStyle: {
      color: statusColors[item.status] || '#3366FF',
    },
  }));

  const option = {
    title: {
      text: `任务状态统计 (共${total}项)`,
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      bottom: 0,
      data: ['任务数量'],
    },
    grid: [
      { left: '55%', right: '5%', top: '15%', bottom: '15%' },
    ],
    xAxis: {
      type: 'category',
      data: data.map((item) => statusLabels[item.status] || item.status),
      gridIndex: 0,
    },
    yAxis: {
      type: 'value',
      gridIndex: 0,
    },
    series: [
      {
        name: '任务数量',
        type: 'bar',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: data.map((item, index) => ({
          value: item._count.id,
          itemStyle: {
            color: statusColors[item.status] || '#3366FF',
          },
        })),
        label: {
          show: true,
          position: 'top',
        },
      },
      {
        name: '任务状态分布',
        type: 'pie',
        center: ['25%', '55%'],
        radius: ['30%', '55%'],
        data: pieData,
        label: {
          formatter: '{b}: {d}%',
          fontSize: 11,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
}
