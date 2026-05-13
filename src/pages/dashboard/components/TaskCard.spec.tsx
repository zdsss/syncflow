import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect } from 'vitest';
import TaskCard from './TaskCard';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const defaultProps = {
  id: '1',
  code: 'P3-L2-010',
  name: '电芯来料异常处理',
  status: 'in_progress',
  statusLabel: '进行中',
  statusColor: '#FAAD14',
  priority: 'high',
  priorityLabel: '高',
  priorityColor: '#FF9C00',
  assignee: '邓智豪',
  dueDate: '2026/05/10',
};

describe('TaskCard', () => {
  it('renders without crashing', () => {
    renderWithAntd(<TaskCard {...defaultProps} />);
    expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
  });

  it('displays task code', () => {
    renderWithAntd(<TaskCard {...defaultProps} />);
    expect(screen.getByText('P3-L2-010')).toBeInTheDocument();
  });

  it('displays task name', () => {
    renderWithAntd(<TaskCard {...defaultProps} />);
    expect(screen.getByText('电芯来料异常处理')).toBeInTheDocument();
  });

  it('displays status label', () => {
    renderWithAntd(<TaskCard {...defaultProps} />);
    expect(screen.getByText('进行中')).toBeInTheDocument();
  });

  it('displays priority label', () => {
    renderWithAntd(<TaskCard {...defaultProps} />);
    expect(screen.getByText('高')).toBeInTheDocument();
  });

  it('displays assignee when provided', () => {
    renderWithAntd(<TaskCard {...defaultProps} />);
    expect(screen.getByText('邓智豪')).toBeInTheDocument();
  });

  it('displays due date when provided', () => {
    renderWithAntd(<TaskCard {...defaultProps} />);
    expect(screen.getByText('2026/05/10')).toBeInTheDocument();
  });

  it('does not render assignee when not provided', () => {
    renderWithAntd(<TaskCard {...defaultProps} assignee={undefined} />);
    expect(screen.queryByText('邓智豪')).not.toBeInTheDocument();
  });

  it('does not render due date when not provided', () => {
    renderWithAntd(<TaskCard {...defaultProps} dueDate={undefined} />);
    expect(screen.queryByText('2026/05/10')).not.toBeInTheDocument();
  });

  it('uses id as fallback for code', () => {
    renderWithAntd(<TaskCard {...defaultProps} code={undefined} />);
    expect(screen.getByTestId('task-code')).toHaveTextContent('1');
  });

  it('applies urgent priority bar color', () => {
    renderWithAntd(<TaskCard {...defaultProps} priority="urgent" />);
    const card = screen.getByTestId('task-card-1');
    expect(card).toHaveStyle({ borderLeft: '3px solid #FF4D4F' });
  });
});
