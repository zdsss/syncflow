import { useEffect, useCallback } from 'react';
import { Modal, Table, Tag, Empty } from 'antd';
import { compareBomVersions } from '@/services/bom.service';
import { useAsyncData } from '@/hooks/useAsyncData';

interface BomItem {
  id: number;
  name: string;
  materialCode?: string;
  quantity: number;
  specification?: string;
  unitOfMeasure?: string;
}

interface FieldChange {
  field: string;
  oldValue: string;
  newValue: string;
}

interface ModifiedEntry {
  item: BomItem;
  changes: FieldChange[];
}

interface CompareResult {
  added: BomItem[];
  removed: BomItem[];
  modified: ModifiedEntry[];
}

interface BomCompareModalProps {
  bomId: number | string | null;
  open: boolean;
  onClose: () => void;
  v1: string | number;
  v2: string | number;
}

const itemColumns = [
  { title: '物料名称', dataIndex: 'name', key: 'name' },
  { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode' },
  { title: '数量', dataIndex: 'quantity', key: 'quantity' },
];

export default function BomCompareModal({ bomId, open, onClose, v1, v2 }: BomCompareModalProps) {
  const fetcher = useCallback(
    () => bomId ? compareBomVersions(bomId, v1, v2).then((res) => res.data) : Promise.resolve(null),
    [bomId, v1, v2],
  );
  const { data: result, loading, error, refresh } = useAsyncData<CompareResult>(fetcher, '版本对比失败');

  useEffect(() => {
    if (open && bomId) refresh();
  }, [open, bomId, v1, v2, refresh]);

  const hasNoDiff = result && result.added.length === 0 && result.removed.length === 0 && result.modified.length === 0;

  return (
    <Modal
      title={`版本对比 v${v1} → v${v2}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ maxWidth: 800 }}
    >
      {loading && <div>加载中...</div>}
      {error && <div>版本对比失败</div>}
      {!loading && !error && hasNoDiff && <Empty description="两个版本无差异" />}
      {!loading && !error && result && !hasNoDiff && (
        <>
          <h4>新增物料</h4>
          <Table
            dataSource={result.added}
            columns={itemColumns}
            rowKey="id"
            pagination={false}
            size="small"
            locale={{ emptyText: '无' }}
          />

          <h4 style={{ marginTop: 16 }}>删除物料</h4>
          <Table
            dataSource={result.removed}
            columns={itemColumns}
            rowKey="id"
            pagination={false}
            size="small"
            locale={{ emptyText: '无' }}
          />

          <h4 style={{ marginTop: 16 }}>修改物料</h4>
          {result.modified.length === 0 ? (
            <div>无</div>
          ) : (
            result.modified.map((entry) => (
              <div key={entry.item.id} style={{ marginBottom: 12 }}>
                <Tag color="blue">{entry.item.name}</Tag>
                <span style={{ color: '#999', marginLeft: 4 }}>{entry.item.materialCode}</span>
                <Table
                  dataSource={entry.changes}
                  columns={[
                    { title: '字段', dataIndex: 'field', key: 'field' },
                    {
                      title: '旧值',
                      dataIndex: 'oldValue',
                      key: 'oldValue',
                      render: (val: string) => <span style={{ color: '#ff4d4f' }}>{val}</span>,
                    },
                    {
                      title: '新值',
                      dataIndex: 'newValue',
                      key: 'newValue',
                      render: (val: string) => <span style={{ color: '#52c41a' }}>{val}</span>,
                    },
                  ]}
                  rowKey="field"
                  pagination={false}
                  size="small"
                />
              </div>
            ))
          )}
        </>
      )}
    </Modal>
  );
}
