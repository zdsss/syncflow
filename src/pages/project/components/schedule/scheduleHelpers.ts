import dayjs from 'dayjs';

export interface WeekInfo {
  monday: dayjs.Dayjs;
  key: string;
  label: string;
}

export interface MonthGroup {
  month: number;
  label: string;
  weekCount: number;
}

export const PHASE_MAP: Record<string, string> = {
  '研发部': 'P1',
  '设计部': 'P1',
  '产品部': 'P1',
  '测试部': 'P2',
  '生产部': 'P2',
};

export const PHASE_OPTIONS = ['P1', 'P2'];

export const STATUS_COLORS: Record<number, string> = {
  1: '#FAAD14',
  2: '#1890FF',
  3: '#3366FF',
  4: '#52C41A',
  5: '#BFBFBF',
};

export function getMondayOfWeek(date: dayjs.Dayjs): dayjs.Dayjs {
  const day = date.day();
  const diff = day === 0 ? -6 : 1 - day;
  return date.add(diff, 'day');
}

export function generateWeeks(year: number): WeekInfo[] {
  const yearStart = dayjs(`${year}-01-01`);
  const yearEnd = dayjs(`${year}-12-31`);
  let currentMonday = getMondayOfWeek(yearStart);
  const weeks: WeekInfo[] = [];
  while (currentMonday.isBefore(yearEnd.add(1, 'day'))) {
    weeks.push({
      monday: currentMonday,
      key: currentMonday.format('YYYY-MM-DD'),
      label: currentMonday.format('MM/DD'),
    });
    currentMonday = currentMonday.add(1, 'week');
  }
  return weeks;
}

export function groupWeeksByMonth(weeks: WeekInfo[], year: number): MonthGroup[] {
  const monthWeekCounts = new Map<number, number>();
  for (const week of weeks) {
    const month = week.monday.month() + 1;
    monthWeekCounts.set(month, (monthWeekCounts.get(month) || 0) + 1);
  }
  return Array.from(monthWeekCounts.entries())
    .sort(([a], [b]) => a - b)
    .map(([month, count]) => ({
      month,
      label: `${year}年${month}月`,
      weekCount: count,
    }));
}

export function calcDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDepartment(task: { tags?: string }): string {
  return task.tags?.split(',')[0]?.trim() || '未分配';
}

export function getPhase(task: { tags?: string[] }): string {
  const dept = getDepartment(task);
  return PHASE_MAP[dept] || 'P1';
}
