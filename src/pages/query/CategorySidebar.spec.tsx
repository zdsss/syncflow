import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CategorySidebar from './CategorySidebar';

vi.mock('./QueryPage.module.css', () => ({
  default: {
    sidebar: 'sidebar',
    categoryList: 'categoryList',
    categoryItem: 'categoryItem',
    activeCategory: 'activeCategory',
    categoryLabel: 'categoryLabel',
    categoryDot: 'categoryDot',
    categoryCount: 'categoryCount',
    dotOrange: 'dotOrange',
    dotBlue: 'dotBlue',
    dotRed: 'dotRed',
    dotYellow: 'dotYellow',
    dotGreen: 'dotGreen',
    dotPurple: 'dotPurple',
  },
}));

const mockOnCategoryChange = vi.fn();

describe('CategorySidebar', () => {
  beforeEach(() => {
    mockOnCategoryChange.mockClear();
  });

  it('renders without crashing', () => {
    render(<CategorySidebar />);
    expect(screen.getByTestId('category-sidebar')).toBeInTheDocument();
  });

  it('displays all category labels', () => {
    render(<CategorySidebar />);
    expect(screen.getByText('今日')).toBeInTheDocument();
    expect(screen.getByText('本周')).toBeInTheDocument();
    expect(screen.getByText('本月')).toBeInTheDocument();
    expect(screen.getByText('全部任务')).toBeInTheDocument();
    expect(screen.getByText('预警')).toBeInTheDocument();
    expect(screen.getByText('超期')).toBeInTheDocument();
    expect(screen.getByText('里程碑')).toBeInTheDocument();
  });

  it('displays category counts', () => {
    render(<CategorySidebar />);
    expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('calls onCategoryChange when a category is clicked', () => {
    render(<CategorySidebar onCategoryChange={mockOnCategoryChange} />);
    fireEvent.click(screen.getByText('今日'));
    expect(mockOnCategoryChange).toHaveBeenCalledWith('today');
  });

  it('sets active category via props', () => {
    render(<CategorySidebar activeCategory="week" />);
    const sidebar = screen.getByTestId('category-sidebar');
    expect(sidebar).toHaveAttribute('data-active-category', '本周');
  });

  it('defaults to all category when no activeCategory prop', () => {
    render(<CategorySidebar />);
    const sidebar = screen.getByTestId('category-sidebar');
    expect(sidebar).toHaveAttribute('data-active-category', '全部任务');
  });
});
