import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import NotificationSettings from './NotificationSettings';
import { getNotificationSettings, updateNotificationSettings } from '@/services/config.service';

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    message: {
      ...actual.message,
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    },
  };
});

vi.mock('@/services/config.service', () => ({
  getNotificationSettings: vi.fn().mockResolvedValue({
    data: { taskReminder: true, emailNotify: true, appNotify: true, smsNotify: false, reminderDays: 3 },
  }),
  updateNotificationSettings: vi.fn().mockResolvedValue({ data: {} }),
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: (selector: any) => selector({ currentUser: { id: 'user-1', name: 'Test User' } }),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('NotificationSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getNotificationSettings as any).mockResolvedValue({
      data: { taskReminder: true, emailNotify: true, appNotify: true, smsNotify: false, reminderDays: 3 },
    });
  });

  it('renders master toggle switch', async () => {
    renderWithAntd(<NotificationSettings />);
    expect(screen.getByText('任务提醒')).toBeInTheDocument();
    await waitFor(() => {
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toBeChecked();
    });
  });

  it('renders checkbox group with three channels', () => {
    renderWithAntd(<NotificationSettings />);
    expect(screen.getByText('通知渠道')).toBeInTheDocument();
    expect(screen.getByText('邮件通知')).toBeInTheDocument();
    expect(screen.getByText('应用内通知')).toBeInTheDocument();
    expect(screen.getByText('短信通知')).toBeInTheDocument();
  });

  it('renders radio group for timing with three options', () => {
    renderWithAntd(<NotificationSettings />);
    expect(screen.getByText('提醒时间')).toBeInTheDocument();
    expect(screen.getByText('提前1天')).toBeInTheDocument();
    expect(screen.getByText('提前3天')).toBeInTheDocument();
    expect(screen.getByText('提前7天')).toBeInTheDocument();
  });

  it('renders save and reset buttons', () => {
    renderWithAntd(<NotificationSettings />);
    expect(screen.getByText(/保存设置/)).toBeInTheDocument();
    expect(screen.getByText(/重\s*置/)).toBeInTheDocument();
  });

  it('clicking reset restores defaults', async () => {
    const user = userEvent.setup();
    renderWithAntd(<NotificationSettings />);
    await waitFor(() => {
      expect(getNotificationSettings).toHaveBeenCalledWith('user-1');
    });

    const switchEl = screen.getByRole('switch');
    await user.click(switchEl);
    expect(switchEl).not.toBeChecked();

    await user.click(screen.getByText(/重\s*置/));
    expect(screen.getByRole('switch')).toBeChecked();
    expect(message.info).toHaveBeenCalledWith('已重置为默认设置');
  });

  it('clicking save shows success message', async () => {
    const user = userEvent.setup();
    renderWithAntd(<NotificationSettings />);
    await waitFor(() => {
      expect(getNotificationSettings).toHaveBeenCalledWith('user-1');
    });
    await user.click(screen.getByText(/保存设置/));
    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('通知设置已保存');
    });
  });

  it('fetches notification settings with actual user ID on mount', async () => {
    renderWithAntd(<NotificationSettings />);
    await waitFor(() => {
      expect(getNotificationSettings).toHaveBeenCalledWith('user-1');
    });
  });

  it('initializes form with fetched settings', async () => {
    (getNotificationSettings as any).mockResolvedValue({
      data: { taskReminder: false, emailNotify: false, appNotify: false, smsNotify: true, reminderDays: 7 },
    });
    renderWithAntd(<NotificationSettings />);
    await waitFor(() => {
      expect(getNotificationSettings).toHaveBeenCalledWith('user-1');
    });
    await waitFor(() => {
      const switchEl = screen.getByRole('switch');
      expect(switchEl).not.toBeChecked();
    });
  });

  it('save button calls updateNotificationSettings with correct user ID', async () => {
    const user = userEvent.setup();
    renderWithAntd(<NotificationSettings />);
    await waitFor(() => {
      expect(getNotificationSettings).toHaveBeenCalledWith('user-1');
    });
    await user.click(screen.getByText(/保存设置/));
    await waitFor(() => {
      expect(updateNotificationSettings).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ taskReminder: true, reminderDays: 3 }),
      );
    });
  });

  it('radio group onChange updates reminder days', async () => {
    const user = userEvent.setup();
    renderWithAntd(<NotificationSettings />);
    await waitFor(() => {
      expect(getNotificationSettings).toHaveBeenCalledWith('user-1');
    });

    await user.click(screen.getByText('提前7天'));
    const radios = screen.getAllByRole('radio');
    const checkedRadio = radios.find((r) => (r as HTMLInputElement).checked);
    expect(checkedRadio).toBeTruthy();
    expect((checkedRadio as HTMLInputElement).value).toBe('7');
  });
});
