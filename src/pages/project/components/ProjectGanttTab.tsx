import type React from 'react';
import { useMemo } from 'react';
import dayjs from 'dayjs';
import type { Project } from '@/types';
import { PROJECT_STATUS_CONFIG } from '@/constants';
import styles from './ProjectGanttTab.module.css';

interface ProjectGanttTabProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
}

const STATUS_BAR_COLORS: Record<string, string> = {
  in_progress: '#3366FF',
  not_started: '#BFBFBF',
  completed: '#52C41A',
  delayed: '#FF4D4F',
};

export default function ProjectGanttTab({ projects, onProjectClick }: ProjectGanttTabProps) {
  const startYear = 2025;
  const monthCount = 24;
  const colWidth = 80;

  const monthColumns = useMemo(() => {
    const cols: { key: string; label: string; yearLabel: string }[] = [];
    const d = dayjs(`${startYear}-01-01`);
    for (let i = 0; i < monthCount; i++) {
      const m = d.add(i, 'month');
      cols.push({ key: m.format('YYYY-MM'), label: m.format('M月'), yearLabel: m.format('YYYY') });
    }
    return cols;
  }, []);

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
    if (!project.startDate || !project.endDate) return null;
    const s = dayjs(project.startDate);
    const e = dayjs(project.endDate);
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
      if (p.startDate && dayjs(p.startDate).isBefore(earliest)) earliest = dayjs(p.startDate);
      if (p.endDate && dayjs(p.endDate).isAfter(latest)) latest = dayjs(p.endDate);
    }
    const startOffset = Math.max(0, earliest.diff(timelineStart, 'day'));
    const endOffset = Math.min(totalDays, latest.diff(timelineStart, 'day'));
    return {
      left: (startOffset / totalDays) * totalWidth,
      width: Math.max(30, ((endOffset - startOffset) / totalDays) * totalWidth),
    };
  }, [projects, timelineStart, totalDays, totalWidth]);

  const ganttProjects = projects.filter((p) => p.startDate && p.endDate);

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        {/* Left department tree */}
        <div className={styles.leftPanel}>
          <div className={styles.leftHeader}>
            <span className={styles.collapseAll}>全部收起</span>
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
          <div className={styles.ganttScroll}>
            <div className={styles.ganttInner}>
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
                          style={{ left: bar.left, width: bar.width, backgroundColor: barColor }}
                          title={`${project.name} ${project.startDate} ~ ${project.endDate}`}
                        >
                          <span className={styles.barLabel}>
                            {project.name} {dayjs(project.startDate).format('MM/DD')}-{dayjs(project.endDate).format('MM/DD')}
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
