import type React from 'react';
import { useMemo } from 'react';
import dayjs from 'dayjs';
import type { Project } from '@/types';
import { ProjectStatus } from '@/types';
import { PROJECT_STATUS_CONFIG } from '@/constants/enums';
import styles from './ProjectGanttTab.module.css';

interface ProjectGanttTabProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
  onCollapseAll?: () => void;
}

const STATUS_BAR_GRADIENT: Record<number, string> = {
  [ProjectStatus.CANCELLED]: '#BFBFBF',
  [ProjectStatus.IN_PROGRESS]: 'linear-gradient(180deg, #4C8BF5 0%, #3366FF 100%)',
  [ProjectStatus.NOT_STARTED]: '#BFBFBF',
  [ProjectStatus.COMPLETED]: '#52C41A',
  [ProjectStatus.DELAYED]: '#FF4D4F',
};

const STATUS_BAR_COLORS: Record<number, string> = {
  [ProjectStatus.CANCELLED]: '#BFBFBF',
  [ProjectStatus.IN_PROGRESS]: '#3366FF',
  [ProjectStatus.NOT_STARTED]: '#BFBFBF',
  [ProjectStatus.COMPLETED]: '#52C41A',
  [ProjectStatus.DELAYED]: '#FF4D4F',
};

export default function ProjectGanttTab({ projects, onProjectClick, onCollapseAll }: ProjectGanttTabProps) {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear;
  const monthCount = (currentYear + 2 - startYear) * 12 - new Date().getMonth();
  const colWidth = 80;

  const monthColumns = useMemo(() => {
    const cols: { key: string; label: string; yearLabel: string }[] = [];
    const d = dayjs(`${startYear}-01-01`);
    for (let i = 0; i < monthCount; i++) {
      const m = d.add(i, 'month');
      cols.push({ key: m.format('YYYY-MM'), label: m.format('M月'), yearLabel: m.format('YYYY') });
    }
    return cols;
  }, [startYear, monthCount]);

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

  const timelineStart = dayjs(`${startYear}-01-01`);
  const timelineEnd = timelineStart.add(monthCount, 'month');
  const totalDays = timelineEnd.diff(timelineStart, 'day');
  const totalWidth = monthCount * colWidth;

  const getBarForProject = (project: Project) => {
    if (!project.plannedStart || !project.plannedEnd) return null;
    const s = dayjs(project.plannedStart);
    const e = dayjs(project.plannedEnd);
    if (e.isBefore(timelineStart) || s.isAfter(timelineEnd)) return null;
    const startOffset = Math.max(0, s.diff(timelineStart, 'day'));
    const endOffset = Math.min(totalDays, e.diff(timelineStart, 'day'));
    return {
      left: (startOffset / totalDays) * totalWidth,
      width: Math.max(30, ((endOffset - startOffset) / totalDays) * totalWidth),
    };
  };

  // Build summary bar range
  const summaryRange = useMemo(() => {
    if (projects.length === 0) return null;
    let earliest = dayjs('2099-01-01');
    let latest = dayjs('2000-01-01');
    for (const p of projects) {
      if (p.plannedStart && dayjs(p.plannedStart).isBefore(earliest)) earliest = dayjs(p.plannedStart);
      if (p.plannedEnd && dayjs(p.plannedEnd).isAfter(latest)) latest = dayjs(p.plannedEnd);
    }
    const startOffset = Math.max(0, earliest.diff(timelineStart, 'day'));
    const endOffset = Math.min(totalDays, latest.diff(timelineStart, 'day'));
    return {
      left: (startOffset / totalDays) * totalWidth,
      width: Math.max(30, ((endOffset - startOffset) / totalDays) * totalWidth),
    };
  }, [projects, timelineStart, totalDays, totalWidth]);

  const ganttProjects = projects.filter((p) => p.plannedStart && p.plannedEnd);

  // Current month highlight position
  const now = dayjs();
  const currentMonthIndex = now.diff(timelineStart, 'month');
  const currentMonthHighlight = currentMonthIndex >= 0 && currentMonthIndex < monthCount
    ? { left: currentMonthIndex * colWidth, width: colWidth }
    : null;

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        {/* Left department tree */}
        <div className={styles.leftPanel}>
          <div className={styles.leftHeader}>
            <span className={styles.leftHeaderTitle}>项目名称</span>
          </div>
          {ganttProjects.map((project) => {
            const statusCfg = PROJECT_STATUS_CONFIG[project.status];
            return (
              <div key={project.id} className={styles.treeRow} style={{ paddingLeft: 12 + (project.parentId ? 16 : 0) }}>
                <div className={styles.nodeDot} style={{ backgroundColor: statusCfg?.color || '#8C8C8C' }} />
                <span className={styles.nodeName}>{project.name}</span>
              </div>
            );
          })}
        </div>

        {/* Right gantt */}
        <div className={styles.ganttArea}>
          <div className={styles.ganttAreaHeader}>
            <span className={styles.collapseAll} onClick={onCollapseAll} data-testid="collapse-all">全部收起</span>
          </div>
          <div className={styles.ganttScroll}>
            <div className={styles.ganttInner}>
              {/* Current month highlight */}
              {currentMonthHighlight && (
                <div
                  className={styles.currentMonthHighlight}
                  style={{ left: currentMonthHighlight.left, width: currentMonthHighlight.width }}
                  data-testid="current-month-highlight"
                />
              )}
              {/* Year header */}
              <div className={styles.yearHeader}>
                {yearGroups.map((yg) => (
                  <div key={yg.year} className={styles.yearCell} style={{ width: yg.count * colWidth }}>
                    {yg.year}
                  </div>
                ))}
              </div>
              {/* Month header */}
              <div className={styles.monthHeader}>
                {monthColumns.map((col) => (
                  <div key={col.key} className={styles.monthCell} style={{ width: colWidth }}>
                    {col.label}
                  </div>
                ))}
              </div>
              {/* Project rows */}
              <div className={styles.ganttBody}>
                {ganttProjects.map((project) => {
                  const bar = getBarForProject(project);
                  const barColor = STATUS_BAR_COLORS[project.status] || '#BFBFBF';
                  const barGradient = STATUS_BAR_GRADIENT[project.status] || barColor;
                  return (
                    <div
                      key={project.id}
                      className={styles.ganttRow}
                      onClick={() => onProjectClick?.(project)}
                    >
                      {monthColumns.map((col) => (
                        <div key={col.key} className={styles.gridCell} style={{ width: colWidth }} />
                      ))}
                      {bar && (
                        <div
                          className={styles.ganttBar}
                          style={{ left: bar.left, width: bar.width, background: barGradient }}
                          title={`${project.name} ${project.plannedStart} ~ ${project.plannedEnd}`}
                        >
                          <span className={styles.barLabel}>
                            {project.name} {dayjs(project.plannedStart).format('MM/DD')}-{dayjs(project.plannedEnd).format('MM/DD')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Summary bar */}
              {summaryRange && (
                <div className={styles.summaryRow}>
                  <div className={styles.summaryBar} style={{ left: summaryRange.left, width: summaryRange.width }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
