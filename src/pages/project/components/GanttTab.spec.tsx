import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import GanttTab from './GanttTab';

vi.mock('./TaskGanttTab', () => ({
  default: (props: any) => <div data-testid="task-gantt-tab">TaskGanttTab</div>,
}));

vi.mock('./ProjectGanttTab', () => ({
  default: (props: any) => <div data-testid="project-gantt-tab">ProjectGanttTab</div>,
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('GanttTab', () => {
  it('renders segmented toggle with two options', () => {
    renderWithAntd(<GanttTab tasks={[]} projects={[]} />);
    expect(screen.getByText('任务甘特图')).toBeInTheDocument();
    expect(screen.getByText('项目甘特图')).toBeInTheDocument();
  });

  it('defaults to task gantt view', () => {
    renderWithAntd(<GanttTab tasks={[]} projects={[]} />);
    expect(screen.getByTestId('task-gantt-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('project-gantt-tab')).not.toBeInTheDocument();
  });

  it('switches to project gantt view when toggle is clicked', () => {
    renderWithAntd(<GanttTab tasks={[]} projects={[]} />);
    const projectOption = screen.getByText('项目甘特图');
    fireEvent.click(projectOption);
    expect(screen.getByTestId('project-gantt-tab')).toBeInTheDocument();
  });
});
