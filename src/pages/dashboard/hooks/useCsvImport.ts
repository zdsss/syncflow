import { useState, useCallback } from 'react';
import { message } from 'antd';

export function parseCSV(text: string): Record<string, any>[] {
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows: Record<string, any>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const row: Record<string, any> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

export function useCsvImport() {
  const [importData, setImportData] = useState<Record<string, any>[]>([]);
  const [importLoading, setImportLoading] = useState(false);

  const handleCSVUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      setImportData(rows);
    };
    reader.readAsText(file);
    return false;
  }, []);

  const handleImportConfirm = useCallback(async () => {
    if (importData.length === 0) {
      message.warning('没有可导入的数据');
      return;
    }
    // TODO: import endpoint not yet available on the new backend
    message.info('项目导入功能暂不可用');
    setImportData([]);
  }, [importData]);

  const clearImportData = useCallback(() => {
    setImportData([]);
  }, []);

  return { importData, importLoading, handleCSVUpload, handleImportConfirm, clearImportData };
}
