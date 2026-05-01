import type React from 'react';
import { useMemo } from 'react';
import { DatePicker, Progress } from 'antd';
import dayjs from 'dayjs';
import type { Project } from '@/types';
import type { Task } from '@/types';
import { ProjectStatus } from '@/types';
import { PROJECT_STATUS_CONFIG } from '@/constants';
import InfoPanel from './InfoPanel';
import WeeklyTasks from './WeeklyTasks';
import styles from './ScheduleView.module.css';

const { RangePicker } = DatePicker;

interface ScheduleViewProps {
  projects: Project[];
  tasks: Task[];
  dateRange: [string, string];
  onDateRangeChange: (range: [string, string]) => void;
  summary: {
    totalTasks: number;
    completed: number;
    inProgress: number;
    overdue: number;
    warnings: number;
    risks: number;
    suggestions: number;
    todayTasks: number;
    pendingAssign: number;
  };
}

function getMonthColumns(startYear: number, monthCount: number) {
  const cols: { key: string; label: string; yearLabel: string }[] = [];
  const d = dayjs(`${startYear}-01-01`);
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

function getBarPosition(
  startDate: string,
  endDate: string,
  timelineStart: dayjs.Dayjs,
  monthCount: number,
  colWidth: number
): { left: number; width: number } | null {
  const s = dayjs(startDate);
  const e = dayjs(endDate);
  const timelineEnd = timelineStart.add(monthCount, 'month');

  if (e.isBefore(timelineStart) || s.isAfter(timelineEnd)) return null;

  const totalDays = timelineEnd.diff(timelineStart, 'day');
  const totalWidth = monthCount * colWidth;
  const startOffset = Math.max(0, s.diff(timelineStart, 'day'));
  const endOffset = Math.min(totalDays, e.diff(timelineStart, 'day'));

  return {
    left: (startOffset / totalDays) * totalWidth,
    width: Math.max(20, ((endOffset - startOffset) / totalDays) * totalWidth),
  };
}

export default function ScheduleView({
  projects,
  tasks,
  dateRange,
  onDateRangeChange,
  summary,
}: ScheduleViewProps) {
  const COL_WIDTH = 120;
  const MONTH_COUNT = 24;
  const startYear = 2025;
  const monthColumns = getMonthColumns(startYear, MONTH_COUNT);
  const timelineStart = dayjs(`${startYear}-01-01`);

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
    return projects.filter((p) => p.startDate && p.endDate);
  }, [projects]);

  const completionRate = summary.totalTasks > 0 ? Math.round((summary.completed / summary.totalTasks) * 100) : 0;

  const statusColorMap: Record<string, string> = {
    [ProjectStatus.IN_PROGRESS]: '#FF9C00',
    [ProjectStatus.DELAYED]: '#FF4D4F',
    [ProjectStatus.NOT_STARTED]: '#BFBFBF',
    [ProjectStatus.COMPLETED]: '#52C41A',
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>邓</div>
            <div className={styles.userMeta}>
              <span className={styles.userName}>邓智豪</span>
              <span className={styles.teamInfo}>设计团队 · 30人</span>
            </div>
          </div>
          <div className={styles.topRight}>
            <div className={styles.dateSelector}>
              <RangePicker
                size="small"
                value={dateRange[0] && dateRange[1] ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    onDateRangeChange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
                  }
                }}
                placeholder={['计划开始时间', '计划结束时间']}
                style={{ width: 280 }}
              />
            </div>
            <div className={styles.completion}>
              <span className={styles.completionLabel}>已完成</span>
              <Progress
                percent={completionRate}
                size="small"
                strokeColor="#52C41A"
                railColor="#F0F0F0"
                style={{ width: 120, marginBottom: 0 }}
              />
            </div>
          </div>
        </div>

        {/* Gantt area */}
        <div className={styles.ganttContainer}>
          <div className={styles.ganttScroll}>
            <div className={styles.ganttInner}>
              {/* Year header */}
              <div className={styles.ganttHeader}>
                <div className={styles.ganttLabelCol}>项目名称</div>
                <div className={styles.ganttTimeline}>
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
              </div>
              {/* Month header */}
              <div className={styles.ganttSubHeader}>
                <div className={styles.ganttLabelCol}>状态</div>
                <div className={styles.ganttTimeline}>
                  {monthColumns.map((col) => (
                    <div key={col.key} className={styles.monthCell} style={{ width: COL_WIDTH }}>
                      {col.label}
                    </div>
                  ))}
                </div>
              </div>
              {/* Rows */}
              <div className={styles.ganttBody}>
                {ganttProjects.map((project) => {
                  const statusCfg = PROJECT_STATUS_CONFIG[project.status];
                  const barPos = getBarPosition(project.startDate, project.endDate, timelineStart, MONTH_COUNT, COL_WIDTH);
                  return (
                    <div key={project.id} className={styles.ganttRow}>
                      <div className={styles.ganttLabelCol}>
                        <span className={styles.projectName}>{project.name}</span>
                      </div>
                      <div className={styles.ganttTimeline} style={{ position: 'relative' }}>
                        {monthColumns.map((col) => (
                          <div key={col.key} className={styles.gridCell} style={{ width: COL_WIDTH }} />
                        ))}
                        {barPos && (
                          <div
                            className={styles.ganttBar}
                            style={{
                              left: barPos.left,
                              width: barPos.width,
                              backgroundColor: statusColorMap[project.status] || '#BFBFBF',
                            }}
                            title={`${project.name}: ${project.startDate} ~ ${project.endDate}`}
                          >
                            <span className={styles.ganttBarLabel}>
                              {statusCfg?.label || project.status}
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
        </div>

        {/* Weekly tasks */}
        <WeeklyTasks tasks={tasks} />
      </div>

      {/* Right info panel */}
      <InfoPanel
        projects={projects}
        tasks={tasks}
        selectedProjectId={null}
        onProjectChange={() => {}}
        summary={{
          warnings: summary.warnings,
          risks: summary.risks,
          suggestions: summary.suggestions,
          overdue: summary.overdue,
          todayTasks: summary.todayTasks,
          pendingAssign: summary.pendingAssign,
        }}
      />
    </div>
  );
}
