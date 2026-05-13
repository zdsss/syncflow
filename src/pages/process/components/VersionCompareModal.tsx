import { useEffect, useState, useCallback } from 'react';
import { Modal, Select, Descriptions, Empty, Spin, Tag } from 'antd';
import { getProcessVersions } from '@/services/process.service';
import { useAsyncData } from '@/hooks/useAsyncData';

interface ProcessVersion {
  id: string;
  version: number;
  description?: string;
  status: string;
  routeId: string;
  createdAt: string;
  steps?: { id: string; name: string; sortOrder: number }[];
}

interface VersionCompareModalProps {
  routeId: string;
  visible: boolean;
  onClose: () => void;
}

export default function VersionCompareModal({ routeId, visible, onClose }: VersionCompareModalProps) {
  const [baseVersionId, setBaseVersionId] = useState<string | null>(null);
  const [targetVersionId, setTargetVersionId] = useState<string | null>(null);

  const fetcher = useCallback(
    () => getProcessVersions(routeId).then((res) => res.data || []),
    [routeId],
  );
  const { data: versions, loading, refresh } = useAsyncData<ProcessVersion[]>(fetcher, '加载版本列表失败');

  useEffect(() => {
    if (visible && routeId) refresh();
  }, [visible, routeId, refresh]);

  const versionList = versions || [];
  const baseVersion = versionList.find((v) => v.id === baseVersionId);
  const targetVersion = versionList.find((v) => v.id === targetVersionId);

  const renderComparison = () => {
    if (!baseVersion || !targetVersion) {
      return <Empty description="请选择两个版本进行对比" />;
    }

    return (
      <div data-testid="compare-result">
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="对比项">
            <Tag color="blue">基准版本 (v{baseVersion.version})</Tag>
          </Descriptions.Item>
          <Descriptions.Item>
            <Tag color="green">对比版本 (v{targetVersion.version})</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="版本号">v{baseVersion.version}</Descriptions.Item>
          <Descriptions.Item>v{targetVersion.version}</Descriptions.Item>

          <Descriptions.Item label="版本说明">{baseVersion.description || '-'}</Descriptions.Item>
          <Descriptions.Item>{targetVersion.description || '-'}</Descriptions.Item>

          <Descriptions.Item label="状态">
            <Tag color={baseVersion.status === 'published' ? 'green' : 'default'}>
              {baseVersion.status === 'published' ? '已发布' : '草稿'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item>
            <Tag color={targetVersion.status === 'published' ? 'green' : 'default'}>
              {targetVersion.status === 'published' ? '已发布' : '草稿'}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="发布日期">
            {new Date(baseVersion.createdAt).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item>
            {new Date(targetVersion.createdAt).toLocaleDateString()}
          </Descriptions.Item>

          <Descriptions.Item label="步骤数">
            {baseVersion.steps?.length ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item>
            {targetVersion.steps?.length ?? '-'}
          </Descriptions.Item>
        </Descriptions>
      </div>
    );
  };

  return (
    <Modal
      title="版本对比"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>基准版本</div>
              <Select
                style={{ width: '100%' }}
                placeholder="选择基准版本"
                value={baseVersionId}
                onChange={setBaseVersionId}
              >
                {versionList.map((v) => (
                  <Select.Option key={v.id} value={v.id}>
                    v{v.version} - {v.description || '无说明'} ({v.status === 'published' ? '已发布' : '草稿'})
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>对比版本</div>
              <Select
                style={{ width: '100%' }}
                placeholder="选择对比版本"
                value={targetVersionId}
                onChange={setTargetVersionId}
              >
                {versionList.map((v) => (
                  <Select.Option key={v.id} value={v.id}>
                    v{v.version} - {v.description || '无说明'} ({v.status === 'published' ? '已发布' : '草稿'})
                  </Select.Option>
                ))}
              </Select>
            </div>
          </div>

          {renderComparison()}
        </>
      )}
    </Modal>
  );
}
