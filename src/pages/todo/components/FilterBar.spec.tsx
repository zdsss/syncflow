import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import FilterBar from './FilterBar';

const mockCategoryChange = vi.fn();

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const FILTER_LABELS = ['今日', '本周', '逾期', '预警'];

describe('FilterBar', () => {
  beforeEach(() => {
    mockCategoryChange.mockClear();
  });

  it('renders only 4 high-frequency shortcut chips', () => {
    renderWithAntd(
      <FilterBar activeCategory="all" onCategoryChange={mockCategoryChange} />
    );
    for (const label of FILTER_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    // Should NOT render removed items
    expect(screen.queryByText('全部')).not.toBeInTheDocument();
    expect(screen.queryByText('本月')).not.toBeInTheDocument();
    expect(screen.queryByText('问题')).not.toBeInTheDocument();
    expect(screen.queryByText('风险')).not.toBeInTheDocument();
    expect(screen.queryByText('建议')).not.toBeInTheDocument();
    expect(screen.queryByText('关注')).not.toBeInTheDocument();
    expect(screen.queryByText('事务')).not.toBeInTheDocument();
    expect(screen.queryByText('阶段')).not.toBeInTheDocument();
  });

  it('renders filter bar container', () => {
    renderWithAntd(
      <FilterBar activeCategory="all" onCategoryChange={mockCategoryChange} />
    );
    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
  });

  it('highlights the chip matching activeCategory prop', () => {
    renderWithAntd(
      <FilterBar activeCategory="today" onCategoryChange={mockCategoryChange} />
    );
    const todayChip = screen.getByTestId('filter-today');
    expect(todayChip.className).toContain('chipActive');

    // Others should not be active
    const weekChip = screen.getByTestId('filter-thisWeek');
    expect(weekChip.className).not.toContain('chipActive');
  });

  it('highlights thisWeek chip when activeCategory is thisWeek', () => {
    renderWithAntd(
      <FilterBar activeCategory="thisWeek" onCategoryChange={mockCategoryChange} />
    );
    const weekChip = screen.getByTestId('filter-thisWeek');
    expect(weekChip.className).toContain('chipActive');
  });

  it('no chip is highlighted when activeCategory does not match any chip', () => {
    renderWithAntd(
      <FilterBar activeCategory="all" onCategoryChange={mockCategoryChange} />
    );
    const chips = screen.getAllByRole('button');
    for (const chip of chips) {
      expect(chip.className).not.toContain('chipActive');
    }
  });

  it('clicking a chip calls onCategoryChange with the correct category key', async () => {
    const user = userEvent.setup();
    renderWithAntd(
      <FilterBar activeCategory="all" onCategoryChange={mockCategoryChange} />
    );

    await user.click(screen.getByTestId('filter-today'));
    expect(mockCategoryChange).toHaveBeenCalledWith('today');

    await user.click(screen.getByTestId('filter-thisWeek'));
    expect(mockCategoryChange).toHaveBeenCalledWith('thisWeek');

    await user.click(screen.getByTestId('filter-overdue'));
    expect(mockCategoryChange).toHaveBeenCalledWith('overdue');

    await user.click(screen.getByTestId('filter-warning'));
    expect(mockCategoryChange).toHaveBeenCalledWith('warning');
  });

  it('does not maintain internal active state — relies on activeCategory prop', () => {
    const { rerender } = renderWithAntd(
      <FilterBar activeCategory="all" onCategoryChange={mockCategoryChange} />
    );

    // No chip active initially
    const todayChip = screen.getByTestId('filter-today');
    expect(todayChip.className).not.toContain('chipActive');

    // Parent changes activeCategory to today
    rerender(
      <ConfigProvider>
        <FilterBar activeCategory="today" onCategoryChange={mockCategoryChange} />
      </ConfigProvider>
    );
    expect(todayChip.className).toContain('chipActive');

    // Parent changes to overdue
    rerender(
      <ConfigProvider>
        <FilterBar activeCategory="overdue" onCategoryChange={mockCategoryChange} />
      </ConfigProvider>
    );
    expect(todayChip.className).not.toContain('chipActive');
    expect(screen.getByTestId('filter-overdue').className).toContain('chipActive');
  });
});
