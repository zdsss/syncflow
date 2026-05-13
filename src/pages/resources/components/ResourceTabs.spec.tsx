import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import ResourceTabs from './ResourceTabs';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('ResourceTabs', () => {
  const defaultProps = {
    activeTab: 'human',
    onTabChange: vi.fn(),
  };

  it('renders all tab labels', () => {
    renderWithAntd(<ResourceTabs {...defaultProps} />);
    expect(screen.getByText('人力资源')).toBeInTheDocument();
    expect(screen.getByText('设备资源')).toBeInTheDocument();
    expect(screen.getByText('供应商')).toBeInTheDocument();
  });

  it('calls onTabChange when a different tab is clicked', async () => {
    const onTabChange = vi.fn();
    renderWithAntd(<ResourceTabs {...defaultProps} onTabChange={onTabChange} />);
    await userEvent.click(screen.getByText('设备资源'));
    expect(onTabChange).toHaveBeenCalledWith('equipment');
  });

  it('calls onTabChange with supplier key', async () => {
    const onTabChange = vi.fn();
    renderWithAntd(<ResourceTabs {...defaultProps} onTabChange={onTabChange} />);
    await userEvent.click(screen.getByText('供应商'));
    expect(onTabChange).toHaveBeenCalledWith('supplier');
  });

  it('highlights the active tab', () => {
    renderWithAntd(<ResourceTabs {...defaultProps} activeTab="equipment" />);
    const tab = screen.getByText('设备资源').closest('.ant-tabs-tab');
    expect(tab).toHaveClass('ant-tabs-tab-active');
  });
});
