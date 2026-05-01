import ReactECharts from 'echarts-for-react';

interface TaskStat {
  status: string;
  _count: { id: number };
}

interface TaskStatsChartProps {
  data: TaskStat[];
}

const statusLabels: Record<string, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  completed: '已完成',
  overdue: '已逾期',
  cancelled: '已取消',
};

export default function TaskStatsChart({ data }: TaskStatsChartProps) {
  const option = {
    title: {
      text: '任务状态统计',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: data.map((item) => statusLabels[item.status] || item.status),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '任务数量',
        type: 'bar',
        data: data.map((item) => item._count.id),
        itemStyle: {
          color: '#1890ff',
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
}
