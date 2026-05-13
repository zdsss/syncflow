import { useState, useEffect, useCallback } from 'react';
import { Form, Switch, Checkbox, Radio, Button, message } from 'antd';
import { getNotificationSettings, updateNotificationSettings } from '@/services/config.service';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import styles from './NotificationSettings.module.css';

const DEFAULT_SETTINGS = {
  taskReminder: true,
  emailNotify: true,
  appNotify: true,
  smsNotify: false,
  reminderDays: 3,
};

export default function NotificationSettings() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const userId = currentUser?.id || '';

  const [taskReminder, setTaskReminder] = useState(DEFAULT_SETTINGS.taskReminder);
  const [emailNotify, setEmailNotify] = useState(DEFAULT_SETTINGS.emailNotify);
  const [appNotify, setAppNotify] = useState(DEFAULT_SETTINGS.appNotify);
  const [smsNotify, setSmsNotify] = useState(DEFAULT_SETTINGS.smsNotify);
  const [reminderDays, setReminderDays] = useState(DEFAULT_SETTINGS.reminderDays);

  const fetcher = useCallback(
    () => getNotificationSettings(userId).then((res: any) => res?.data ?? DEFAULT_SETTINGS),
    [userId],
  );
  const { data: settings, refresh } = useAsyncData<typeof DEFAULT_SETTINGS>(fetcher, '加载通知设置失败');

  useEffect(() => {
    if (userId) refresh();
  }, [userId, refresh]);

  useEffect(() => {
    if (settings) {
      setTaskReminder(settings.taskReminder ?? DEFAULT_SETTINGS.taskReminder);
      setEmailNotify(settings.emailNotify ?? DEFAULT_SETTINGS.emailNotify);
      setAppNotify(settings.appNotify ?? DEFAULT_SETTINGS.appNotify);
      setSmsNotify(settings.smsNotify ?? DEFAULT_SETTINGS.smsNotify);
      setReminderDays(settings.reminderDays ?? DEFAULT_SETTINGS.reminderDays);
    }
  }, [settings]);

  const { execute: saveSettings, loading: saving } = useAsyncAction(
    async (params: typeof DEFAULT_SETTINGS) => {
      await updateNotificationSettings(userId, params);
    },
    { successMessage: '通知设置已保存', errorMessage: '保存失败' },
  );

  const handleSave = () => {
    if (!userId) { message.error('请先登录'); return; }
    saveSettings({ taskReminder, emailNotify, appNotify, smsNotify, reminderDays });
  };

  const handleReset = () => {
    setTaskReminder(DEFAULT_SETTINGS.taskReminder);
    setEmailNotify(DEFAULT_SETTINGS.emailNotify);
    setAppNotify(DEFAULT_SETTINGS.appNotify);
    setSmsNotify(DEFAULT_SETTINGS.smsNotify);
    setReminderDays(DEFAULT_SETTINGS.reminderDays);
    message.info('已重置为默认设置');
  };

  return (
    <div className={styles.form}>
      <Form layout="vertical">
        <Form.Item label="任务提醒">
          <div className={styles.switchItem}>
            <Switch
              checked={taskReminder}
              onChange={setTaskReminder}
              checkedChildren="开启"
              unCheckedChildren="关闭"
            />
          </div>
        </Form.Item>

        <Form.Item label="通知渠道">
          <div className={styles.checkboxGroup}>
            <Checkbox checked={emailNotify} onChange={(e) => setEmailNotify(e.target.checked)}>邮件通知</Checkbox>
            <Checkbox checked={appNotify} onChange={(e) => setAppNotify(e.target.checked)}>应用内通知</Checkbox>
            <Checkbox checked={smsNotify} onChange={(e) => setSmsNotify(e.target.checked)}>短信通知</Checkbox>
          </div>
        </Form.Item>

        <Form.Item label="提醒时间">
          <Radio.Group
            value={reminderDays}
            onChange={(e) => setReminderDays(e.target.value)}
            className={styles.radioGroup}
          >
            <Radio value={1}>提前1天</Radio>
            <Radio value={3}>提前3天</Radio>
            <Radio value={7}>提前7天</Radio>
          </Radio.Group>
        </Form.Item>

        <div className={styles.actions}>
          <Button type="primary" onClick={handleSave}>
            保存设置
          </Button>
          <Button onClick={handleReset}>
            重置
          </Button>
        </div>
      </Form>
    </div>
  );
}
