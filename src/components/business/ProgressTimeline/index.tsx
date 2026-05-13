import { useMemo } from 'react';
import dayjs from 'dayjs';
import styles from './ProgressTimeline.module.css';

export type SegmentStatus = 'completed' | 'in_progress' | 'not_started';

export interface TimelineSegment {
  start: string;
  end: string;
  status: SegmentStatus;
}

export interface ProgressTimelineProps {
  /** Array of timeline segments with start/end dates and status */
  segments: TimelineSegment[];
  /** Overall progress percentage (0-100) */
  overallProgress: number;
  /** Optional test id */
  'data-testid'?: string;
}

export const SEGMENT_COLORS: Record<SegmentStatus, string> = {
  completed: '#FAAD14',
  in_progress: '#3366FF',
  not_started: '#8C8C8C',
};

export default function ProgressTimeline({
  segments,
  overallProgress,
  'data-testid': dataTestId,
}: ProgressTimelineProps) {
  const { totalSpan, positionedSegments, todayOffset } = useMemo(() => {
    if (segments.length === 0) {
      return { totalSpan: 0, positionedSegments: [], todayOffset: null };
    }

    // Find the overall time span
    const allDates = segments.flatMap((s) => [dayjs(s.start), dayjs(s.end)]);
    const minDate = allDates.reduce((min, d) => (d.isBefore(min) ? d : min), allDates[0]);
    const maxDate = allDates.reduce((max, d) => (d.isAfter(max) ? d : max), allDates[0]);
    const totalDays = maxDate.diff(minDate, 'day') || 1;

    // Position each segment
    const positioned = segments.map((seg) => {
      const segStart = dayjs(seg.start);
      const segEnd = dayjs(seg.end);
      const leftDays = Math.max(0, segStart.diff(minDate, 'day'));
      const widthDays = Math.max(1, segEnd.diff(segStart, 'day'));
      return {
        ...seg,
        leftPct: (leftDays / totalDays) * 100,
        widthPct: Math.max((widthDays / totalDays) * 100, 2),
      };
    });

    // Today marker
    const today = dayjs();
    const todayDays = today.diff(minDate, 'day');
    const todayPct = todayDays >= 0 && todayDays <= totalDays
      ? (todayDays / totalDays) * 100
      : null;

    return { totalSpan: totalDays, positionedSegments: positioned, todayOffset: todayPct };
  }, [segments]);

  if (segments.length === 0) {
    return (
      <div className={styles.container} data-testid={dataTestId ?? 'progress-timeline'}>
        <div className={styles.barWrapper} data-testid="timeline-bar" />
        <span className={styles.progressLabel} data-testid="progress-label">
          {overallProgress}%
        </span>
      </div>
    );
  }

  return (
    <div className={styles.container} data-testid={dataTestId ?? 'progress-timeline'}>
      <div className={styles.barWrapper} data-testid="timeline-bar">
        {positionedSegments.map((seg, i) => (
          <div
            key={i}
            className={`${styles.segment} ${styles[seg.status]}`}
            style={{ left: `${seg.leftPct}%`, width: `${seg.widthPct}%` }}
            data-testid={`segment-${i}`}
            data-status={seg.status}
          />
        ))}
        {todayOffset !== null && (
          <div
            className={styles.todayMarker}
            style={{ left: `${todayOffset}%` }}
            data-testid="today-marker"
          >
            <span className={styles.todayLabel}>今天</span>
          </div>
        )}
      </div>
      <span className={styles.progressLabel} data-testid="progress-label">
        {overallProgress}%
      </span>
    </div>
  );
}
