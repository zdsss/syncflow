import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import ServerErrorPage from './index';

describe('ServerErrorPage', () => {
  it('renders 500 message', () => {
    render(
      <ConfigProvider>
        <ServerErrorPage />
      </ConfigProvider>
    );
    expect(screen.getByText('系统异常')).toBeInTheDocument();
  });

  it('renders a refresh button', () => {
    render(
      <ConfigProvider>
        <ServerErrorPage />
      </ConfigProvider>
    );
    expect(screen.getByRole('button', { name: /刷新页面/i })).toBeInTheDocument();
  });

  it('calls window.location.reload when refresh button is clicked', async () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    });

    render(
      <ConfigProvider>
        <ServerErrorPage />
      </ConfigProvider>
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /刷新页面/i }));
    expect(reloadSpy).toHaveBeenCalled();
  });
});
