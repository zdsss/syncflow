import { useState } from 'react';
import { Form, Switch, Checkbox, Radio, Button, message } from 'antd';
import styles from './NotificationSettings.module.css';

export default function NotificationSettings() {
  const [taskReminder, setTaskReminder] = useState(true);
  const [channels, setChannels] = useState<string[]>(['email', 'inApp']);
  const [reminderTiming, setReminderTiming] = useState<string>('3');

  const handleSave = () => {
    message.success('通知设置已保存');
  };

  const handleReset = () => {
    setTaskReminder(true);
    setChannels(['email', 'inApp']);
    setReminderTiming('3');
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
          <Checkbox.Group
            value={channels}
            onChange={(val) => setChannels(val as string[])}
            className={styles.checkboxGroup}
          >
            <Checkbox value="email">邮件通知</Checkbox>
            <Checkbox value="inApp">应用内通知</Checkbox>
            <Checkbox value="sms">短信通知</Checkbox>
          </Checkbox.Group>
        </Form.Item>

        <Form.Item label="提醒时间">
          <Radio.Group
            value={reminderTiming}
            onChange={(e) => setReminderTiming(e.target.value)}
            className={styles.radioGroup}
          >
            <Radio value="1">提前1天</Radio>
            <Radio value="3">提前3天</Radio>
            <Radio value="7">提前7天</Radio>
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
