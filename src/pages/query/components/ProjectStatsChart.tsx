import ReactECharts from 'echarts-for-react';

interface ProjectStat {
  status: string;
  _count: { id: number };
}

interface ProjectStatsChartProps {
  data: ProjectStat[];
}

const statusLabels: Record<string, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  completed: '已完成',
  on_hold: '已暂停',
  cancelled: '已取消',
};

const statusColors: Record<string, string> = {
  not_started: '#d9d9d9',
  in_progress: '#1890ff',
  completed: '#52c41a',
  on_hold: '#faad14',
  cancelled: '#ff4d4f',
};

export default function ProjectStatsChart({ data }: ProjectStatsChartProps) {
  const option = {
    title: {
      text: '项目状态统计',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '项目状态',
        type: 'pie',
        radius: '50%',
        data: data.map((item) => ({
          value: item._count.id,
          name: statusLabels[item.status] || item.status,
          itemStyle: {
            color: statusColors[item.status] || '#1890ff',
          },
        })),
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
