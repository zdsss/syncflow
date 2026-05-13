import { useState, useEffect } from 'react';
import { Modal, Select, Button, Space, message } from 'antd';
import { useAsyncAction } from '@/hooks/useAsyncData';
import { getUsers } from '@/services/config.service';
import { addCandidateUser } from '@/services/workflow.service';

interface AddSignerModalProps {
  open: boolean;
  businessObjectId: number;
  taskId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddSignerModal({ open, businessObjectId, taskId, onClose, onSuccess }: AddSignerModalProps) {
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (open) {
      getUsers().then((res) => {
        const data = res?.data;
        const users = Array.isArray(data) ? data : data?.records ?? [];
        setUserOptions(users.map((u: any) => ({ value: String(u.id), label: u.realName || u.name || u.username })));
      }).catch(() => {});
    }
  }, [open]);

  const { execute: doAddSigner, loading } = useAsyncAction(
    async () => {
      if (!taskId) {
        throw new Error('无法获取当前审批任务ID');
      }
      await addCandidateUser(taskId, Number(selectedUser));
      return true;
    },
    { successMessage: '已添加审批人', errorMessage: '添加审批人失败' },
  );

  const handleConfirm = async () => {
    if (!selectedUser) {
      message.warning('请选择要添加的审批人');
      return;
    }
    if (!taskId) {
      message.error('无法获取当前审批任务，请刷新后重试');
      return;
    }
    const result = await doAddSigner();
    if (result !== undefined) {
      setSelectedUser(undefined);
      onSuccess();
    }
  };

  const handleCancel = () => {
    setSelectedUser(undefined);
    onClose();
  };

  return (
    <Modal
      title="加签"
      open={open}
      onCancel={handleCancel}
      footer={
        <Space>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" loading={loading} onClick={handleConfirm}>
            确认添加
          </Button>
        </Space>
      }
    >
      <Select
        placeholder="请选择审批人"
        value={selectedUser}
        onChange={setSelectedUser}
        options={userOptions}
        style={{ width: '100%' }}
        showSearch
        optionFilterProp="label"
        data-testid="add-signer-select"
      />
    </Modal>
  );
}
