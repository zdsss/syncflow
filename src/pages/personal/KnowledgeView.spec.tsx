import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect } from 'vitest';
import KnowledgeView from './KnowledgeView';

vi.mock('./PersonalPage.module.css', () => ({
  default: {
    knowledgeSidebar: 'knowledgeSidebar',
    sidebarItem: 'sidebarItem',
    sidebarItemActive: 'sidebarItemActive',
    knowledgeContent: 'knowledgeContent',
  },
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('KnowledgeView', () => {
  it('renders without crashing', () => {
    renderWithAntd(<KnowledgeView />);
    expect(screen.getByTestId('knowledge-section')).toBeInTheDocument();
  });

  it('displays knowledge library heading', () => {
    renderWithAntd(<KnowledgeView />);
    expect(screen.getByText('知识库')).toBeInTheDocument();
  });

  it('displays document list heading', () => {
    renderWithAntd(<KnowledgeView />);
    expect(screen.getByText('文档列表')).toBeInTheDocument();
  });

  it('displays all category items', () => {
    renderWithAntd(<KnowledgeView />);
    expect(screen.getByTestId('knowledge-cat-all')).toBeInTheDocument();
    expect(screen.getByTestId('knowledge-cat-personal')).toBeInTheDocument();
    expect(screen.getByTestId('knowledge-cat-tech')).toBeInTheDocument();
    expect(screen.getByTestId('knowledge-cat-project')).toBeInTheDocument();
    expect(screen.getByTestId('knowledge-cat-process')).toBeInTheDocument();
  });

  it('displays mock articles by default (all category)', () => {
    renderWithAntd(<KnowledgeView />);
    expect(screen.getByText('产品设计评审规范')).toBeInTheDocument();
    expect(screen.getByText('BOM管理流程指南')).toBeInTheDocument();
    expect(screen.getByText('项目管理最佳实践')).toBeInTheDocument();
  });

  it('filters articles when category is clicked', () => {
    renderWithAntd(<KnowledgeView />);
    fireEvent.click(screen.getByTestId('knowledge-cat-tech'));
    expect(screen.getByText('NestJS后端开发规范')).toBeInTheDocument();
    expect(screen.queryByText('产品设计评审规范')).not.toBeInTheDocument();
  });

  it('shows all articles when all category is active', () => {
    renderWithAntd(<KnowledgeView />);
    fireEvent.click(screen.getByTestId('knowledge-cat-all'));
    expect(screen.getByText('产品设计评审规范')).toBeInTheDocument();
    expect(screen.getByText('NestJS后端开发规范')).toBeInTheDocument();
  });
});
