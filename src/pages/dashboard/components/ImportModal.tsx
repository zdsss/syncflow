import { Modal, Upload, Table } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

interface ImportModalProps {
  open: boolean;
  importData: Record<string, any>[];
  importLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
  onUpload: (file: File) => boolean;
}

export default function ImportModal({ open, importData, importLoading, onOk, onCancel, onUpload }: ImportModalProps) {
  return (
    <Modal
      title="导入项目"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="导入"
      cancelText="取消"
      confirmLoading={importLoading}
      data-testid="import-modal"
    >
      <Upload.Dragger
        accept=".csv"
        beforeUpload={onUpload}
        showUploadList={false}
        data-testid="import-upload"
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽 CSV 文件到此区域</p>
        <p className="ant-upload-hint">支持 .csv 格式，首行为表头</p>
      </Upload.Dragger>
      {importData.length > 0 && (
        <div data-testid="import-preview" style={{ marginTop: 16 }}>
          <h4>预览 (共 {importData.length} 行)</h4>
          <Table
            dataSource={importData.map((row, idx) => ({ ...row, key: idx }))}
            columns={
              importData.length > 0
                ? Object.keys(importData[0]).map((key) => ({
                    title: key,
                    dataIndex: key,
                    key,
                  }))
                : []
            }
            size="small"
            pagination={false}
            scroll={{ y: 200 }}
          />
        </div>
      )}
    </Modal>
  );
}
