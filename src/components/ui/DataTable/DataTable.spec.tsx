import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataTable from './DataTable';

interface TestRow {
  id: string;
  name: string;
}

const columns = [
  { title: 'Name', dataIndex: 'name' as const, key: 'name' },
];

const data: TestRow[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
];

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable<TestRow> columns={columns} dataSource={data} />);
    expect(screen.getByText('Name')).toBeDefined();
  });

  it('renders data rows', () => {
    render(<DataTable<TestRow> columns={columns} dataSource={data} />);
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('Bob')).toBeDefined();
  });

  it('shows total count in pagination', () => {
    render(<DataTable<TestRow> columns={columns} dataSource={data} total={100} />);
    expect(screen.getByText(/共 100 条/)).toBeDefined();
  });
});
