import { useState, useEffect } from 'react';
import { Modal, Select, Button, Space, message } from 'antd';
import { reassignTask } from '@/services/workflow.service';
import { getUsers } from '@/services/config.service';
import { useAsyncAction } from '@/hooks/useAsyncData';

interface TransferModalProps {
  open: boolean;
  approvalId: string;
  taskId?: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransferModal({ open, approvalId, taskId, userId, onClose, onSuccess }: TransferModalProps) {
  const [newApproverId, setNewApproverId] = useState('');
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (open) {
      getUsers()
        .then((res) => {
          const data = res?.data;
          const list = Array.isArray(data) ? data : data?.records ?? [];
          setUsers(list.map((u: any) => ({ id: String(u.id), name: u.realName || u.name || u.username }))
            .filter((u: any) => u.id !== String(userId)));
        })
        .catch(() => {});
    }
  }, [open, userId]);

  const { execute: doTransfer, loading } = useAsyncAction(
    async () => {
      if (!taskId) {
        throw new Error('无法获取当前审批任务ID');
      }
      await reassignTask(taskId, Number(newApproverId));
      return true;
    },
    { successMessage: '转交成功', errorMessage: '转交失败' },
  );

  const handleConfirm = async () => {
    if (!newApproverId) {
      message.warning('请选择新审批人');
      return;
    }
    if (!taskId) {
      message.error('无法获取当前审批任务，请刷新后重试');
      return;
    }
    const result = await doTransfer();
    if (result !== undefined) {
      setNewApproverId('');
      onSuccess();
    }
  };

  const handleCancel = () => {
    setNewApproverId('');
    onClose();
  };

  return (
    <Modal
      title="转交审批"
      open={open}
      onCancel={handleCancel}
      footer={
        <Space>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" loading={loading} onClick={handleConfirm}>
            确认转交
          </Button>
        </Space>
      }
    >
      <Select
        placeholder="请选择新审批人"
        value={newApproverId || undefined}
        onChange={(val) => setNewApproverId(val)}
        style={{ width: '100%' }}
        showSearch
        optionFilterProp="label"
        options={users.map((u) => ({ value: u.id, label: u.name }))}
      />
    </Modal>
  );
}
