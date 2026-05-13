import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressTimeline from './index';
import type { TimelineSegment } from './index';
import { SEGMENT_COLORS } from './index';

describe('ProgressTimeline', () => {
  const sampleSegments: TimelineSegment[] = [
    { start: '2026-01-01', end: '2026-03-01', status: 'completed' },
    { start: '2026-03-01', end: '2026-06-01', status: 'in_progress' },
    { start: '2026-06-01', end: '2026-12-31', status: 'not_started' },
  ];

  it('renders the correct number of segments', () => {
    render(<ProgressTimeline segments={sampleSegments} overallProgress={40} />);

    expect(screen.getByTestId('segment-0')).toBeTruthy();
    expect(screen.getByTestId('segment-1')).toBeTruthy();
    expect(screen.getByTestId('segment-2')).toBeTruthy();
    expect(screen.queryByTestId('segment-3')).toBeNull();
  });

  it('applies correct colors via CSS class names', () => {
    render(<ProgressTimeline segments={sampleSegments} overallProgress={40} />);

    const seg0 = screen.getByTestId('segment-0');
    const seg1 = screen.getByTestId('segment-1');
    const seg2 = screen.getByTestId('segment-2');

    // CSS modules with non-scoped strategy keep class names as-is
    expect(seg0.className).toContain('completed');
    expect(seg0.getAttribute('data-status')).toBe('completed');

    expect(seg1.className).toContain('in_progress');
    expect(seg1.getAttribute('data-status')).toBe('in_progress');

    expect(seg2.className).toContain('not_started');
    expect(seg2.getAttribute('data-status')).toBe('not_started');
  });

  it('displays the overall progress percentage', () => {
    render(<ProgressTimeline segments={sampleSegments} overallProgress={42} />);

    const label = screen.getByTestId('progress-label');
    expect(label.textContent).toContain('42');
    expect(label.textContent).toContain('%');
  });
});
