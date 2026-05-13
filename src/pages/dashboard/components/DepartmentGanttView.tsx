import { useMemo } from 'react';
import dayjs from 'dayjs';
import type { Project } from '@/types';
import { ProjectStatus } from '@/types';
import { PROJECT_STATUS_CONFIG } from '@/constants/enums';
import styles from './DepartmentGanttView.module.css';

interface Department {
  id: string;
  name: string;
}

interface DepartmentGanttViewProps {
  departments: Department[];
  projects: Project[];
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

const statusColorMap: Record<string, string> = {
  [ProjectStatus.IN_PROGRESS]: '#FF9C00',
  [ProjectStatus.DELAYED]: '#FF4D4F',
  [ProjectStatus.NOT_STARTED]: '#BFBFBF',
  [ProjectStatus.COMPLETED]: '#52C41A',
};

export default function DepartmentGanttView({
  departments,
  projects,
  dateRange,
}: DepartmentGanttViewProps) {
  const COL_WIDTH = 120;
  const MONTH_COUNT = 24;

  const timelineStart = useMemo(() => {
    if (dateRange[0]) return dayjs(dateRange[0]).startOf('month');
    return dayjs().subtract(1, 'month').startOf('month');
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

  const projectsByDept = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const dept of departments) {
      map.set(dept.name, []);
    }
    for (const p of projects) {
      if (!p.plannedStart || !p.plannedEnd) continue;
      const deptName = p.projectType;
      const list = map.get(deptName);
      if (list) {
        list.push(p);
      } else {
        map.set(deptName, [p]);
      }
    }
    return map;
  }, [departments, projects]);

  return (
    <div className={styles.container}>
      <div className={styles.ganttContainer}>
        <div className={styles.ganttScroll}>
          <div className={styles.ganttInner}>
            {/* Year header */}
            <div className={styles.ganttHeader}>
              <div className={styles.labelCol}>部门</div>
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
              <div className={styles.labelCol}>项目</div>
              <div className={styles.ganttTimeline}>
                {monthColumns.map((col) => (
                  <div key={col.key} className={styles.monthCell} style={{ width: COL_WIDTH }}>
                    {col.label}
                  </div>
                ))}
              </div>
            </div>
            {/* Department rows */}
            <div>
              {departments.map((dept) => {
                const deptProjects = projectsByDept.get(dept.name) || [];
                return (
                  <div key={dept.id}>
                    {/* Department label row */}
                    <div className={styles.deptRow}>
                      <div className={styles.deptLabel}>{dept.name}</div>
                      <div className={styles.ganttTimeline} style={{ position: 'relative' }}>
                        {monthColumns.map((col) => (
                          <div key={col.key} className={styles.gridCell} style={{ width: COL_WIDTH }} />
                        ))}
                      </div>
                    </div>
                    {/* Project rows under department */}
                    {deptProjects.map((project) => {
                      const statusCfg = PROJECT_STATUS_CONFIG[project.status];
                      const barPos = getBarPosition(project.plannedStart, project.plannedEnd, timelineStart, MONTH_COUNT, COL_WIDTH);
                      return (
                        <div key={project.id} className={styles.projectRow}>
                          <div className={styles.projectLabel}>
                            <span className={styles.projectName}>{project.name}</span>
                            <span className={styles.completionPct}>{project.progress}%</span>
                          </div>
                          <div className={styles.timelineArea}>
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
                                title={`${project.name}: ${project.plannedStart} ~ ${project.plannedEnd}`}
                              >
                                <span className={styles.ganttBarLabel}>
                                  {statusCfg?.label || project.status}
                                </span>
                              </div>
                            )}
                            {barPos && (
                              <span
                                className={styles.barPercent}
                                style={{ left: barPos.left + barPos.width + 4 }}
                              >
                                {project.progress}%
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
