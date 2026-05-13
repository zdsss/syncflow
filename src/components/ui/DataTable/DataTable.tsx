import { Table } from 'antd';
import type { TableProps } from 'antd';

// Performance note: For large datasets (1000+ rows), consider integrating
// react-window or @tanstack/react-virtual for row virtualization. AntD Table
// supports a `virtual` prop (antd 5.x) that can be toggled via a DataTable
// prop when needed.

interface DataTableProps<T> extends Omit<TableProps<T>, 'pagination'> {
  pageSize?: number;
  total?: number;
  current?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}

export default function DataTable<T extends object>({
  pageSize = 20,
  total,
  current = 1,
  onPageChange,
  ...rest
}: DataTableProps<T>) {
  return (
    <Table<T>
      {...rest}
      pagination={{
        current,
        pageSize,
        total,
        showTotal: (t) => `共 ${t} 条`,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        onChange: onPageChange,
      }}
      rowKey={rest.rowKey || 'id'}
    />
  );
}
