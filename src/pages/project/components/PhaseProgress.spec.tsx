import { render, screen } from '@testing-library/react';
import PhaseProgress from './PhaseProgress';

vi.mock('./PhaseProgress.module.css', () => ({
  default: {
    container: 'container',
    header: 'header',
    title: 'title',
    pct: 'pct',
    track: 'track',
    completed: 'completed',
    inProgress: 'inProgress',
    todayLine: 'todayLine',
    labels: 'labels',
  },
}));

describe('PhaseProgress', () => {
  it('renders nothing when plannedStart is missing', () => {
    const { container } = render(
      <PhaseProgress plannedStart="" plannedEnd="2025-06-01" progress={50} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when plannedEnd is missing', () => {
    const { container } = render(
      <PhaseProgress plannedStart="2025-01-01" plannedEnd="" progress={50} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders title and progress percentage', () => {
    render(
      <PhaseProgress
        plannedStart="2025-01-01"
        plannedEnd="2025-12-31"
        progress={65}
        title="电池Pack项目"
      />
    );
    expect(screen.getByText('电池Pack项目')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('renders date labels at both ends', () => {
    render(
      <PhaseProgress
        plannedStart="2025-01-01"
        plannedEnd="2025-12-31"
        progress={50}
      />
    );
    expect(screen.getByText('2025-01-01')).toBeInTheDocument();
    expect(screen.getByText('2025-12-31')).toBeInTheDocument();
  });

  it('renders the progress track', () => {
    render(
      <PhaseProgress
        plannedStart="2025-01-01"
        plannedEnd="2025-12-31"
        progress={50}
      />
    );
    expect(screen.getByTestId('phase-progress')).toBeInTheDocument();
  });

  it('renders completed bar with correct width', () => {
    render(
      <PhaseProgress
        plannedStart="2025-01-01"
        plannedEnd="2025-12-31"
        progress={60}
      />
    );
    const completed = screen.getByTestId('progress-completed');
    expect(completed).toBeInTheDocument();
    expect(completed.style.width).toBe('60%');
  });

  it('renders in-progress bar when progress < 100', () => {
    render(
      <PhaseProgress
        plannedStart="2025-01-01"
        plannedEnd="2025-12-31"
        progress={40}
        actualStart="2025-02-01"
      />
    );
    expect(screen.getByTestId('progress-in-progress')).toBeInTheDocument();
  });

  it('does not render in-progress bar when progress is 100', () => {
    render(
      <PhaseProgress
        plannedStart="2025-01-01"
        plannedEnd="2025-12-31"
        progress={100}
        actualStart="2025-01-01"
        actualEnd="2025-11-01"
      />
    );
    expect(screen.queryByTestId('progress-in-progress')).not.toBeInTheDocument();
  });

  it('shows 0% progress correctly', () => {
    render(
      <PhaseProgress
        plannedStart="2025-01-01"
        plannedEnd="2025-12-31"
        progress={0}
      />
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.queryByTestId('progress-completed')).not.toBeInTheDocument();
  });
});
