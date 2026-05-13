import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ParameterEditor from './ParameterEditor';

vi.mock('@/services/process.service', () => ({
  getStepParameters: vi.fn().mockResolvedValue({ data: [] }),
  updateStepParameters: vi.fn().mockResolvedValue({ data: {} }),
}));

import { getStepParameters, updateStepParameters } from '@/services/process.service';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('ParameterEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getStepParameters as any).mockResolvedValue({ data: [] });
  });

  it('renders modal title when visible', async () => {
    renderWithAntd(<ParameterEditor routeId="r1" stepId="s1" stepName="焊接" visible={true} onClose={() => {}} />);
    expect(screen.getByText('工艺参数 - 焊接')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    renderWithAntd(<ParameterEditor routeId="r1" stepId="s1" stepName="焊接" visible={false} onClose={() => {}} />);
    expect(screen.queryByText('工艺参数 - 焊接')).not.toBeInTheDocument();
  });

  it('fetches parameters when visible', async () => {
    renderWithAntd(<ParameterEditor routeId="r1" stepId="s1" stepName="焊接" visible={true} onClose={() => {}} />);
    await waitFor(() => {
      expect(getStepParameters).toHaveBeenCalledWith('r1', 's1');
    });
  });

  it('displays existing parameters as input values', async () => {
    (getStepParameters as any).mockResolvedValue({
      data: [
        { name: 'Temperature', targetValue: '250', unit: '°C', upperLimit: '260', lowerLimit: '240', inspectionMethod: 'Thermometer' },
      ],
    });
    renderWithAntd(<ParameterEditor routeId="r1" stepId="s1" stepName="焊接" visible={true} onClose={() => {}} />);
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
      expect(inputs.some(i => i.value === 'Temperature')).toBe(true);
      expect(inputs.some(i => i.value === '250')).toBe(true);
    });
  });

  it('shows empty message when no parameters', async () => {
    renderWithAntd(<ParameterEditor routeId="r1" stepId="s1" stepName="焊接" visible={true} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('暂无参数，点击"添加参数"开始')).toBeInTheDocument();
    });
  });

  it('adds a new parameter row on add click', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ParameterEditor routeId="r1" stepId="s1" stepName="焊接" visible={true} onClose={() => {}} />);
    const addBtn = screen.getByText('添加参数');
    await user.click(addBtn);
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  it('calls updateStepParameters on save', async () => {
    (getStepParameters as any).mockResolvedValue({
      data: [{ name: 'Temp', targetValue: '250', unit: '°C', upperLimit: '260', lowerLimit: '240', inspectionMethod: 'Thermometer' }],
    });
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderWithAntd(<ParameterEditor routeId="r1" stepId="s1" stepName="焊接" visible={true} onClose={() => {}} onSaved={onSaved} />);
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
      expect(inputs.some(i => i.value === 'Temp')).toBe(true);
    });
    // Footer buttons are in a portal - use document.querySelector
    const saveBtn = document.querySelector('.ant-modal-footer button.ant-btn-primary') as HTMLButtonElement;
    expect(saveBtn).toBeTruthy();
    await user.click(saveBtn);
    await waitFor(() => {
      expect(updateStepParameters).toHaveBeenCalledWith('r1', 's1', expect.any(Array));
    });
  });

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithAntd(<ParameterEditor routeId="r1" stepId="s1" stepName="焊接" visible={true} onClose={onClose} />);
    // Footer buttons are in a portal - use document.querySelector
    const cancelBtn = document.querySelector('.ant-modal-footer button:not(.ant-btn-primary)') as HTMLButtonElement;
    expect(cancelBtn).toBeTruthy();
    await user.click(cancelBtn);
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
