import ReactECharts from 'echarts-for-react';

interface ProjectStat {
  status: string;
  _count: { id: number };
}

interface ProjectStatsChartProps {
  data: ProjectStat[];
}

const statusLabels: Record<string, string> = {
  NOT_STARTED: '未开始',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  DELAYED: '延期',
};

const statusColors: Record<string, string> = {
  NOT_STARTED: '#d9d9d9',
  IN_PROGRESS: '#3366FF',
  COMPLETED: '#52c41a',
  DELAYED: '#8B4513',
};

export default function ProjectStatsChart({ data }: ProjectStatsChartProps) {
  const total = data.reduce((sum, item) => sum + item._count.id, 0);

  const stackedBarOption = {
    title: {
      text: `项目状态统计 (共${total}项)`,
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      bottom: 0,
    },
    grid: [
      { left: '5%', right: '55%', top: '15%', bottom: '15%' },
    ],
    xAxis: {
      type: 'category',
      data: ['项目'],
      gridIndex: 0,
    },
    yAxis: {
      type: 'value',
      gridIndex: 0,
    },
    series: data.map((item) => ({
      name: statusLabels[item.status] || item.status,
      type: 'bar' as const,
      stack: 'total',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: [item._count.id],
      itemStyle: {
        color: statusColors[item.status] || '#3366FF',
      },
      label: {
        show: true,
        position: 'inside' as const,
        formatter: item._count.id > 0 ? '{b}' : '',
      },
      emphasis: {
        focus: 'series' as const,
      },
    })),
  };

  const pieOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical' as const,
      right: '5%',
      top: 'center',
    },
    series: [
      {
        name: '项目状态',
        type: 'pie' as const,
        center: ['75%', '55%'],
        radius: ['30%', '55%'],
        data: data.map((item) => ({
          value: item._count.id,
          name: statusLabels[item.status] || item.status,
          itemStyle: {
            color: statusColors[item.status] || '#3366FF',
          },
        })),
        label: {
          formatter: '{b}: {d}%',
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

  // Merge both charts into a single option
  const option = {
    ...stackedBarOption,
    grid: [
      stackedBarOption.grid[0],
    ],
    series: [
      ...stackedBarOption.series,
      pieOption.series[0],
    ],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
}
