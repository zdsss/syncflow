import { useMemo, useRef, useEffect, useCallback } from 'react';
import { Button, Space, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined, DoubleLeftOutlined, DoubleRightOutlined, CompressOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Project, Task } from '@/types';
import { ProjectStatus } from '@/types';
import { PROJECT_STATUS_CONFIG } from '@/constants/enums';
import TodoPanel from './TodoPanel';
import styles from './ScheduleView.module.css';

interface ScheduleViewProps {
  projects: Project[];
  tasks: Task[];
  dateRange: [string, string];
  onDateRangeChange: (range: [string, string]) => void;
}

function getMonthColumns(startYear: number, startMonth: number, monthCount: number) {
  const cols: { key: string; label: string; yearLabel: string }[] = [];
  const d = dayjs(`${startYear}-${String(startMonth).padStart(2, '0')}-01`);
  for (let i = 0; i < monthCount; i++) {
    const m = d.add(i, 'month');
    cols.push({
      key: m.format('YYYY-MM'),
      label: m.format('M月'),
      yearLabel: m.format('YYYY'),
    });
  }
  return cols;
}

type BarResult = {
  left: number;
  width: number;
  direction?: never;
} | {
  left?: never;
  width?: never;
  direction: 'left' | 'right';
};

function getBarPosition(
  startDate: string,
  endDate: string,
  timelineStart: dayjs.Dayjs,
  monthCount: number,
  colWidth: number
): BarResult | null {
  const s = dayjs(startDate);
  const e = dayjs(endDate);
  const timelineEnd = timelineStart.add(monthCount, 'month');

  if (e.isBefore(timelineStart)) return { direction: 'left' };
  if (s.isAfter(timelineEnd)) return { direction: 'right' };

  const totalDays = timelineEnd.diff(timelineStart, 'day');
  const totalWidth = monthCount * colWidth;
  const startOffset = Math.max(0, s.diff(timelineStart, 'day'));
  const endOffset = Math.min(totalDays, e.diff(timelineStart, 'day'));

  return {
    left: (startOffset / totalDays) * totalWidth,
    width: Math.max(20, ((endOffset - startOffset) / totalDays) * totalWidth),
  };
}

function getTodayPosition(
  timelineStart: dayjs.Dayjs,
  monthCount: number,
  colWidth: number
): number | null {
  const today = dayjs();
  const timelineEnd = timelineStart.add(monthCount, 'month');
  if (today.isBefore(timelineStart) || today.isAfter(timelineEnd)) return null;
  const totalDays = timelineEnd.diff(timelineStart, 'day');
  const totalWidth = monthCount * colWidth;
  const offset = today.diff(timelineStart, 'day');
  return (offset / totalDays) * totalWidth;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  [ProjectStatus.IN_PROGRESS]: '#FF9C00',
  [ProjectStatus.DELAYED]: '#FF4D4F',
  [ProjectStatus.NOT_STARTED]: '#BFBFBF',
  [ProjectStatus.COMPLETED]: '#52C41A',
};

export default function ScheduleView({
  projects,
  tasks,
  dateRange,
  onDateRangeChange,
}: ScheduleViewProps) {
  const COL_WIDTH = 100;
  const MONTH_COUNT = 12;
  const LABEL_COL_WIDTH = 200;
  const scrollRef = useRef<HTMLDivElement>(null);

  const timelineStart = useMemo(() => {
    if (dateRange[0]) return dayjs(dateRange[0]).startOf('month');
    return dayjs().subtract(2, 'month').startOf('month');
  }, [dateRange]);

  const startYear = timelineStart.year();
  const startMonth = timelineStart.month() + 1;
  const monthColumns = getMonthColumns(startYear, startMonth, MONTH_COUNT);

  const yearGroups = useMemo(() => {
    const groups: { year: string; count: number }[] = [];
    let currentYear = '';
    let count = 0;
    for (const col of monthColumns) {
      if (col.yearLabel !== currentYear) {
        if (currentYear) groups.push({ year: currentYear, count });
        currentYear = col.yearLabel;
        count = 1;
      } else {
        count++;
      }
    }
    if (currentYear) groups.push({ year: currentYear, count });
    return groups;
  }, [monthColumns]);

  const ganttProjects = useMemo(() => {
    return projects
      .filter((p) => p.plannedStart && p.plannedEnd)
      .sort((a, b) => dayjs(a.plannedStart).diff(dayjs(b.plannedStart)));
  }, [projects]);

  const todayPos = useMemo(
    () => getTodayPosition(timelineStart, MONTH_COUNT, COL_WIDTH),
    [timelineStart]
  );

  useEffect(() => {
    if (todayPos != null && scrollRef.current) {
      const scrollTarget = todayPos - scrollRef.current.clientWidth / 3;
      scrollRef.current.scrollLeft = Math.max(0, scrollTarget);
    }
  }, [todayPos]);

  const handleScrollToToday = () => {
    if (todayPos != null && scrollRef.current) {
      scrollRef.current.scrollTo({
        left: Math.max(0, todayPos - scrollRef.current.clientWidth / 3),
        behavior: 'smooth',
      });
    } else {
      const newStart = dayjs().subtract(2, 'month').startOf('month');
      onDateRangeChange([newStart.format('YYYY-MM-DD'), newStart.add(MONTH_COUNT, 'month').format('YYYY-MM-DD')]);
    }
  };

  const handleShiftTimeline = (direction: 'left' | 'right') => {
    const shift = direction === 'left' ? -3 : 3;
    const newStart = timelineStart.add(shift, 'month');
    onDateRangeChange([newStart.format('YYYY-MM-DD'), newStart.add(MONTH_COUNT, 'month').format('YYYY-MM-DD')]);
  };

  const handleFitAll = useCallback(() => {
    if (ganttProjects.length === 0) return;
    const earliest = ganttProjects.reduce(
      (min, p) => (dayjs(p.plannedStart).isBefore(min) ? dayjs(p.plannedStart) : min),
      dayjs(ganttProjects[0].plannedStart)
    );
    const newStart = earliest.subtract(1, 'month').startOf('month');
    onDateRangeChange([newStart.format('YYYY-MM-DD'), newStart.add(MONTH_COUNT, 'month').format('YYYY-MM-DD')]);
  }, [ganttProjects, onDateRangeChange]);

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.toolbar}>
          <Space size={8}>
            <Button size="small" icon={<LeftOutlined />} onClick={() => handleShiftTimeline('left')} />
            <Button size="small" onClick={handleScrollToToday}>今天</Button>
            <Button size="small" icon={<RightOutlined />} onClick={() => handleShiftTimeline('right')} />
            <Tooltip title="适配所有项目">
              <Button size="small" icon={<CompressOutlined />} onClick={handleFitAll} />
            </Tooltip>
          </Space>
          <span className={styles.timelineRange}>
            {timelineStart.format('YYYY年M月')} — {timelineStart.add(MONTH_COUNT - 1, 'month').format('YYYY年M月')}
          </span>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#FF9C00' }} />进行中
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#FF4D4F' }} />延期
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#52C41A' }} />已完成
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#BFBFBF' }} />未开始
            </span>
            <span className={styles.projectCount}>{ganttProjects.length} 个项目</span>
          </div>
        </div>

        <div className={styles.ganttContainer}>
          {ganttProjects.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📅</div>
              <div className={styles.emptyText}>暂无项目计划</div>
              <div className={styles.emptyHint}>创建项目并设置计划起止日期后，将在此显示甘特图</div>
            </div>
          ) : (
            <div className={styles.ganttScroll} ref={scrollRef}>
              <div className={styles.ganttInner} style={{ minWidth: LABEL_COL_WIDTH + MONTH_COUNT * COL_WIDTH }}>
                <div className={styles.ganttHeaderWrapper}>
                  <div className={styles.ganttLabelColHeader}>项目名称</div>
                  <div className={styles.ganttTimelineHeader}>
                    <div className={styles.yearRow}>
                      {yearGroups.map((yg) => (
                        <div
                          key={yg.year}
                          className={styles.yearCell}
                          style={{ width: yg.count * COL_WIDTH }}
                        >
                          {yg.year}
                        </div>
                      ))}
                    </div>
                    <div className={styles.monthRow}>
                      {monthColumns.map((col) => {
                        const isCurrentMonth = col.key === dayjs().format('YYYY-MM');
                        return (
                          <div
                            key={col.key}
                            className={`${styles.monthCell} ${isCurrentMonth ? styles.monthCellCurrent : ''}`}
                            style={{ width: COL_WIDTH }}
                          >
                            {col.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className={styles.ganttBody}>
                  {ganttProjects.map((project, idx) => {
                    const statusCfg = PROJECT_STATUS_CONFIG[project.status];
                    const barResult = getBarPosition(project.plannedStart, project.plannedEnd, timelineStart, MONTH_COUNT, COL_WIDTH);
                    const barColor = STATUS_COLOR_MAP[project.status] || '#BFBFBF';
                    const isOffScreen = barResult?.direction != null;

                    return (
                      <div key={project.id} className={`${styles.ganttRow} ${idx % 2 === 0 ? styles.ganttRowEven : ''}`}>
                        <div className={styles.ganttLabelCol}>
                          <div className={styles.projectInfo}>
                            <span
                              className={styles.statusDot}
                              style={{ backgroundColor: barColor }}
                            />
                            <span className={styles.projectName} title={project.name}>
                              {project.name}
                            </span>
                          </div>
                          <div className={styles.rowMeta}>
                            <span className={styles.assigneeName}>{project.ownerName || '—'}</span>
                            <span className={styles.progressBadge}>{project.progress ?? 0}%</span>
                            {isOffScreen && (
                              <Tooltip title={`${project.plannedStart} ~ ${project.plannedEnd}`}>
                                <span className={styles.offScreenHint}>
                                  {barResult.direction === 'left' ? <DoubleLeftOutlined /> : <DoubleRightOutlined />}
                                </span>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                        <div className={styles.ganttTimeline}>
                          {monthColumns.map((col) => {
                            const isCurrentMonth = col.key === dayjs().format('YYYY-MM');
                            return (
                              <div
                                key={col.key}
                                className={`${styles.gridCell} ${isCurrentMonth ? styles.gridCellCurrent : ''}`}
                                style={{ width: COL_WIDTH }}
                              />
                            );
                          })}
                          {todayPos != null && (
                            <div className={styles.todayLine} style={{ left: todayPos }} />
                          )}
                          {barResult && !isOffScreen && (
                            <Tooltip
                              title={
                                <span>
                                  {project.name}<br />
                                  {project.plannedStart} ~ {project.plannedEnd}<br />
                                  进度: {project.progress ?? 0}%
                                </span>
                              }
                              placement="top"
                            >
                              <div
                                className={styles.ganttBar}
                                style={{
                                  left: barResult.left,
                                  width: barResult.width,
                                  backgroundColor: barColor,
                                }}
                              >
                                <div
                                  className={styles.ganttBarProgress}
                                  style={{ width: `${project.progress ?? 0}%` }}
                                />
                                {barResult.width > 60 && (
                                  <span className={styles.ganttBarLabel}>
                                    {statusCfg?.label || project.status}
                                  </span>
                                )}
                              </div>
                            </Tooltip>
                          )}
                          {isOffScreen && (
                            <div className={styles.offScreenBar} data-direction={barResult.direction}>
                              <span className={styles.offScreenBarText}>
                                {barResult.direction === 'left' ? '← ' : ''}
                                {project.plannedStart} ~ {project.plannedEnd}
                                {barResult.direction === 'right' ? ' →' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.rightPanel}>
        <TodoPanel tasks={tasks} />
      </div>
    </div>
  );
}
