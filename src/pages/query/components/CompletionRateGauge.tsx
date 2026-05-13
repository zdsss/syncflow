import ReactECharts from 'echarts-for-react';

interface CompletionRateGaugeProps {
  rate: number;
  title?: string;
}

export default function CompletionRateGauge({ rate, title = '项目完成率' }: CompletionRateGaugeProps) {
  const option = {
    title: {
      text: title,
      left: 'center',
    },
    series: [
      {
        type: 'gauge',
        center: ['50%', '60%'],
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 10,
        itemStyle: {
          color: rate >= 80 ? '#52c41a' : rate >= 50 ? '#faad14' : '#ff4d4f',
        },
        progress: {
          show: true,
          width: 30,
        },
        pointer: {
          show: true,
          length: '60%',
          width: 6,
          itemStyle: {
            color: 'auto',
          },
        },
        axisLine: {
          lineStyle: {
            width: 30,
          },
        },
        axisTick: {
          distance: -30,
          length: 8,
          lineStyle: {
            color: '#fff',
            width: 2,
          },
        },
        splitLine: {
          distance: -30,
          length: 30,
          lineStyle: {
            color: '#fff',
            width: 4,
          },
        },
        axisLabel: {
          color: 'inherit',
          distance: 40,
          fontSize: 12,
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: 'inherit',
          fontSize: 24,
          offsetCenter: [0, '30%'],
        },
        data: [
          {
            value: rate,
          },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 350 }} />;
}
