import { useMemo } from 'react';
import dayjs from 'dayjs';

export type ZoomLevel = 'week' | 'month' | 'quarter';

export const ZOOM_OPTIONS = [
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '季', value: 'quarter' },
];

export function getMonthWeekColumns(startYear: number, monthCount: number) {
  const months: { key: string; label: string; weeks: { key: string; label: string; days: number }[] }[] = [];
  const d = dayjs(`${startYear}-01-01`);
  for (let i = 0; i < monthCount; i++) {
    const m = d.add(i, 'month');
    const weeks: { key: string; label: string; days: number }[] = [];
    const startOfMonth = m.startOf('month');
    const endOfMonth = m.endOf('month');
    let weekStart = startOfMonth.startOf('week').add(1, 'day');
    let wNum = 1;
    while (weekStart.isBefore(endOfMonth)) {
      weeks.push({ key: `${m.format('YYYY-MM')}-W${wNum}`, label: `W${wNum}`, days: 7 });
      weekStart = weekStart.add(1, 'week');
      wNum++;
    }
    if (weeks.length === 0) weeks.push({ key: startOfMonth.format('YYYY-MM-DD'), label: 'W1', days: 7 });
    months.push({ key: m.format('YYYY-MM'), label: m.format('M月'), weeks });
  }
  return months;
}

export function calcDays(start: string, end: string): number {
  return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
}

const MONTH_CELL_WIDTH = 120;

export function useGanttColumns(startYear: number, monthCount: number) {
  const monthWeeks = useMemo(() => getMonthWeekColumns(startYear, monthCount), [startYear, monthCount]);
  const totalWeeks = monthWeeks.reduce((s, m) => s + m.weeks.length, 0);
  const weekWidth = 60;
  const timelineStart = dayjs(`${startYear}-01-01`);
  const timelineEnd = timelineStart.add(monthCount, 'month');
  const totalDays = timelineEnd.diff(timelineStart, 'day');

  const monthColumns = useMemo(() => {
    const cols: { key: string; label: string }[] = [];
    for (let i = 0; i < monthCount; i++) {
      const m = dayjs(`${startYear}-01-01`).add(i, 'month');
      cols.push({ key: m.format('YYYY-MM'), label: m.format('M月') });
    }
    return cols;
  }, [startYear, monthCount]);
  const monthCellWidth = MONTH_CELL_WIDTH;

  const quarterColumns = useMemo(() => {
    const cols: { key: string; label: string; monthCount: number }[] = [];
    const quarterSize = 3;
    const numQuarters = Math.ceil(monthCount / quarterSize);
    for (let q = 0; q < numQuarters; q++) {
      cols.push({
        key: `${startYear}-Q${q + 1}`,
        label: `Q${q + 1}`,
        monthCount: quarterSize,
      });
    }
    return cols;
  }, [startYear, monthCount]);
  const quarterCellWidth = 3 * monthCellWidth;

  const today = dayjs();
  const todayOffset = today.diff(timelineStart, 'day');

  return {
    monthWeeks,
    totalWeeks,
    weekWidth,
    timelineStart,
    timelineEnd,
    totalDays,
    monthColumns,
    monthCellWidth,
    quarterColumns,
    quarterCellWidth,
    today,
    todayOffset,
  };
}
