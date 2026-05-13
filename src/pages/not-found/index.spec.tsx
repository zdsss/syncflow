import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import NotFoundPage from './index';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderPage = () =>
  render(
    <ConfigProvider>
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    </ConfigProvider>
  );

describe('NotFoundPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 404 message', () => {
    renderPage();
    expect(screen.getByText('页面未找到')).toBeInTheDocument();
  });

  it('renders a link back to home (dashboard)', () => {
    renderPage();
    const button = screen.getByRole('button', { name: /返回首页/i });
    expect(button).toBeInTheDocument();
  });

  it('navigates to /dashboard when button is clicked', async () => {
    renderPage();
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: /返回首页/i });
    await user.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
