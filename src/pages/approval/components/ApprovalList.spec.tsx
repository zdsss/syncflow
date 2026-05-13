import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi } from 'vitest';
import ApprovalList from './ApprovalList';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockApprovals = [
  {
    taskId: 'wf-t1',
    taskName: '技术评审',
    businessObjectId: 101,
    objectType: 'TASK',
    objectName: '完成设计文档',
    projectId: 1,
    applicantName: '张三',
    createdAt: '2026-05-01T10:00:00Z',
  },
  {
    taskId: 'wf-t2',
    taskName: '工艺评审',
    businessObjectId: 202,
    objectType: 'BOM',
    objectName: '产品A的BOM',
    objectCode: 'BOM-001',
    projectId: 1,
    applicantName: '李四',
    createdAt: '2026-05-01T11:00:00Z',
  },
  {
    taskId: 'wf-t3',
    taskName: '阶段门审批',
    businessObjectId: 303,
    objectType: 'STAGE_GATE',
    objectName: 'P阶段门评审',
    projectId: 2,
    applicantName: '王五',
    createdAt: '2026-05-01T12:00:00Z',
  },
];

describe('ApprovalList', () => {
  const defaultProps = {
    approvals: mockApprovals,
    selectedId: null,
    onSelect: vi.fn(),
    loading: false,
    activeTab: 'all',
    onTabChange: vi.fn(),
  };

  it('renders approval list with data rows', () => {
    renderWithAntd(<ApprovalList {...defaultProps} />);

    expect(screen.getByText('任务')).toBeTruthy();
    expect(screen.getByText('BOM')).toBeTruthy();
    expect(screen.getByText('阶段门')).toBeTruthy();
  });

  it('shows object names', () => {
    renderWithAntd(<ApprovalList {...defaultProps} />);

    expect(screen.getByText('完成设计文档')).toBeTruthy();
    expect(screen.getByText('产品A的BOM')).toBeTruthy();
  });

  it('shows applicant names', () => {
    renderWithAntd(<ApprovalList {...defaultProps} />);

    expect(screen.getByText('张三')).toBeTruthy();
    expect(screen.getByText('李四')).toBeTruthy();
    expect(screen.getByText('王五')).toBeTruthy();
  });

  it('shows loading state', () => {
    renderWithAntd(<ApprovalList {...defaultProps} loading={true} approvals={[]} />);

    expect(document.querySelector('.ant-spin')).toBeTruthy();
  });

  it('calls onSelect with taskId when row is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderWithAntd(<ApprovalList {...defaultProps} onSelect={onSelect} />);

    const firstRow = screen.getByText('完成设计文档').closest('tr');
    if (firstRow) {
      await user.click(firstRow);
    }

    expect(onSelect).toHaveBeenCalledWith('wf-t1');
  });

  it('renders tab filters', () => {
    renderWithAntd(<ApprovalList {...defaultProps} />);

    const tabs = document.querySelectorAll('.ant-tabs-tab');
    const tabTexts = Array.from(tabs).map((tab) => tab.textContent);
    expect(tabTexts.some((t) => t?.startsWith('待审批'))).toBe(true);
    expect(tabTexts.some((t) => t?.startsWith('全部'))).toBe(true);
  });

  it('calls onRemind with taskId', async () => {
    const onRemind = vi.fn();
    const user = userEvent.setup();
    renderWithAntd(<ApprovalList {...defaultProps} onRemind={onRemind} />);

    const firstRow = screen.getByText('完成设计文档').closest('tr')!;
    const remindBtn = within(firstRow).getByText('催办');
    expect(remindBtn).toBeTruthy();
    await user.click(remindBtn);
    expect(onRemind).toHaveBeenCalledWith('wf-t1');
  });

  it('calls onAddSigner with taskId', async () => {
    const onAddSigner = vi.fn();
    const user = userEvent.setup();
    renderWithAntd(<ApprovalList {...defaultProps} onAddSigner={onAddSigner} />);

    const addSignerBtns = screen.getAllByText('加签');
    expect(addSignerBtns.length).toBeGreaterThanOrEqual(1);
    await user.click(addSignerBtns[0]);
    expect(onAddSigner).toHaveBeenCalledWith('wf-t1');
  });

  it('highlights selected row', () => {
    renderWithAntd(<ApprovalList {...defaultProps} selectedId="wf-t2" />);

    const selectedRow = screen.getByText('产品A的BOM').closest('tr');
    expect(selectedRow?.style.background).toBe('rgb(235, 240, 255)');
  });
});
