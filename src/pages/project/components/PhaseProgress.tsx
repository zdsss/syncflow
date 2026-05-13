import dayjs from 'dayjs';
import styles from './PhaseProgress.module.css';

interface PhaseProgressProps {
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  progress: number; // 0-100
  title?: string;
}

export default function PhaseProgress({
  plannedStart,
  plannedEnd,
  actualStart,
  actualEnd,
  progress,
  title,
}: PhaseProgressProps) {
  if (!plannedStart || !plannedEnd) return null;

  const start = dayjs(plannedStart);
  const end = dayjs(plannedEnd);
  const today = dayjs();
  const totalDays = end.diff(start, 'day');
  if (totalDays <= 0) return null;

  // Completed portion: based on progress percentage
  const completedPct = Math.min(progress, 100);

  // In-progress portion: from actual start (or planned start) to today
  const effectiveStart = actualStart ? dayjs(actualStart) : start;
  let inProgressPct = 0;
  if (progress < 100 && today.isAfter(effectiveStart)) {
    const progressEnd = today.isBefore(end) ? today : end;
    inProgressPct = Math.max(0, ((progressEnd.diff(effectiveStart, 'day')) / totalDays) * 100 - completedPct);
  }

  const remainingPct = Math.max(0, 100 - completedPct - inProgressPct);

  // Today marker position
  const todayOffset = today.diff(start, 'day');
  const todayPct = Math.max(0, Math.min(100, (todayOffset / totalDays) * 100));
  const showToday = today.isAfter(start) && today.isBefore(end);

  return (
    <div className={styles.container} data-testid="phase-progress">
      <div className={styles.header}>
        {title && <span className={styles.title}>{title}</span>}
        <span className={styles.pct}>{progress}%</span>
      </div>
      <div className={styles.track}>
        {completedPct > 0 && (
          <div
            className={styles.completed}
            style={{ width: `${completedPct}%` }}
            data-testid="progress-completed"
          />
        )}
        {inProgressPct > 0 && (
          <div
            className={styles.inProgress}
            style={{ width: `${inProgressPct}%`, left: `${completedPct}%` }}
            data-testid="progress-in-progress"
          />
        )}
        {showToday && (
          <div
            className={styles.todayLine}
            style={{ left: `${todayPct}%` }}
            data-testid="progress-today"
          />
        )}
      </div>
      <div className={styles.labels}>
        <span>{start.format('YYYY-MM-DD')}</span>
        <span>{end.format('YYYY-MM-DD')}</span>
      </div>
    </div>
  );
}
