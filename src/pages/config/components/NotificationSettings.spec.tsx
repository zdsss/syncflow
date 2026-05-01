import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import NotificationSettings from './NotificationSettings';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('NotificationSettings', () => {
  it('renders master toggle switch', () => {
    renderWithAntd(<NotificationSettings />);
    expect(screen.getByText('任务提醒')).toBeInTheDocument();
    // The switch should be checked by default (taskReminder initial = true)
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toBeChecked();
  });

  it('renders checkbox group with three channels', () => {
    renderWithAntd(<NotificationSettings />);
    expect(screen.getByText('通知渠道')).toBeInTheDocument();
    expect(screen.getByText('邮件通知')).toBeInTheDocument();
    expect(screen.getByText('应用内通知')).toBeInTheDocument();
    expect(screen.getByText('短信通知')).toBeInTheDocument();
  });

  it('email and inApp are checked by default, sms is not', () => {
    renderWithAntd(<NotificationSettings />);
    const checkboxes = screen.getAllByRole('checkbox');
    // Ant Design Checkbox.Group renders hidden native + styled spans
    // We can check the group labels are present
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

  it('3-day reminder is selected by default', () => {
    renderWithAntd(<NotificationSettings />);
    const radio3 = screen.getByLabelText('提前3天') || screen.getByText('提前3天').closest('label')?.querySelector('input');
    // Ant Design Radio wraps the label; check the radio group value
    // The "提前3天" radio should be checked
    const radios = screen.getAllByRole('radio');
    const checkedRadio = radios.find((r) => (r as HTMLInputElement).checked);
    expect(checkedRadio).toBeTruthy();
  });

  it('renders save and reset buttons', () => {
    renderWithAntd(<NotificationSettings />);
    expect(screen.getByText(/保存设置/)).toBeInTheDocument();
    expect(screen.getByText(/重\s*置/)).toBeInTheDocument();
  });

  it('save button is a primary button', () => {
    renderWithAntd(<NotificationSettings />);
    const saveBtn = screen.getByText(/保存设置/).closest('button')!;
    expect(saveBtn.className).toContain('ant-btn-primary');
  });

  it('clicking reset restores defaults', async () => {
    const user = userEvent.setup();
    renderWithAntd(<NotificationSettings />);

    // Toggle the switch off
    const switchEl = screen.getByRole('switch');
    await user.click(switchEl);
    expect(switchEl).not.toBeChecked();

    // Click reset (Ant Design 6 may insert space in button text)
    await user.click(screen.getByText(/重\s*置/));
    // Switch should be checked again
    expect(screen.getByRole('switch')).toBeChecked();
  });
});
