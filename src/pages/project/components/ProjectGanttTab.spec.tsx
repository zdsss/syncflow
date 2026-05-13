import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import ProjectGanttTab from './ProjectGanttTab';
import { ProjectStatus } from '@/types';
import type { Project } from '@/types';

vi.mock('./ProjectGanttTab.module.css', () => ({ default: {} }));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const currentYear = new Date().getFullYear();

const mockProjects: Project[] = [
  {
    id: 1,
    code: 'ALPHA',
    name: '项目 Alpha',
    projectType: 'dev',
    status: ProjectStatus.IN_PROGRESS,
    ownerId: 1,
    ownerName: '张三',
    plannedStart: `${currentYear}-03-01`,
    plannedEnd: `${currentYear}-08-01`,
    progress: 50,
    priority: 2,
    createdAt: `${currentYear}-01-01T00:00:00Z`,
    updatedAt: `${currentYear}-01-15T00:00:00Z`,
  },
  {
    id: 2,
    code: 'BETA',
    name: '项目 Beta',
    projectType: 'design',
    status: ProjectStatus.COMPLETED,
    ownerId: 2,
    ownerName: '李四',
    plannedStart: `${currentYear}-01-15`,
    plannedEnd: `${currentYear}-05-15`,
    progress: 100,
    priority: 2,
    createdAt: `${currentYear}-01-01T00:00:00Z`,
    updatedAt: `${currentYear}-05-15T00:00:00Z`,
  },
];

describe('ProjectGanttTab', () => {
  it('renders the gantt chart container', () => {
    renderWithAntd(<ProjectGanttTab projects={mockProjects} />);
    expect(screen.getByText('全部收起')).toBeInTheDocument();
  });

  it('shows project names in the left panel', () => {
    renderWithAntd(<ProjectGanttTab projects={mockProjects} />);
    expect(screen.getByText('项目 Alpha')).toBeInTheDocument();
    expect(screen.getByText('项目 Beta')).toBeInTheDocument();
  });

  it('renders year headers', () => {
    renderWithAntd(<ProjectGanttTab projects={mockProjects} />);
    expect(screen.getByText(String(currentYear))).toBeInTheDocument();
  });

  it('renders month column headers', () => {
    renderWithAntd(<ProjectGanttTab projects={mockProjects} />);
    expect(screen.getAllByText('1月').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('6月').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onProjectClick when a project gantt row is clicked', async () => {
    const onProjectClick = vi.fn();
    renderWithAntd(<ProjectGanttTab projects={mockProjects} onProjectClick={onProjectClick} />);
    const bars = screen.getAllByText(/项目 Alpha/);
    const barLabel = bars.find((el) => el.textContent?.includes('03/01'));
    expect(barLabel).toBeDefined();
    const ganttRow = barLabel!.closest('div')?.parentElement;
    if (ganttRow) {
      await userEvent.click(ganttRow);
      expect(onProjectClick).toHaveBeenCalled();
    }
  });

  it('calls onCollapseAll when "全部收起" is clicked', async () => {
    const onCollapseAll = vi.fn();
    renderWithAntd(<ProjectGanttTab projects={mockProjects} onCollapseAll={onCollapseAll} />);
    const collapseBtn = screen.getByTestId('collapse-all');
    await userEvent.click(collapseBtn);
    expect(onCollapseAll).toHaveBeenCalled();
  });
});
