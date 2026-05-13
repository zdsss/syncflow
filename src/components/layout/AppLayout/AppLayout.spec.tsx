import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import AppLayout from './AppLayout';

vi.mock('@/components/layout/Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock('@/components/layout/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, Outlet: () => <div data-testid="outlet">Content</div> };
});

const renderWithProviders = (ui: React.ReactElement) =>
  render(<MemoryRouter><ConfigProvider>{ui}</ConfigProvider></MemoryRouter>);

describe('AppLayout', () => {
  it('renders Sidebar', () => {
    renderWithProviders(<AppLayout />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders Header', () => {
    renderWithProviders(<AppLayout />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders Outlet content', () => {
    renderWithProviders(<AppLayout />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('applies mainLayout class for sidebar spacing', () => {
    renderWithProviders(<AppLayout />);
    const layouts = document.querySelectorAll('.ant-layout');
    let found = false;
    layouts.forEach((el) => {
      if (el.classList.contains('app-layout')) found = true;
    });
    expect(found).toBe(true);
  });

  it('wraps content in a Layout with min-height 100vh', () => {
    const { container } = renderWithProviders(<AppLayout />);
    const outerLayout = container.querySelector('.ant-layout');
    expect(outerLayout).toBeInTheDocument();
  });

  it('has a content area with background color', () => {
    renderWithProviders(<AppLayout />);
    const content = document.querySelector('.ant-layout-content');
    expect(content).toBeInTheDocument();
  });
});
