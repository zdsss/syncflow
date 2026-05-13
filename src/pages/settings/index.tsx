import { useState } from 'react';
import { Card, Form, Input, Button, Avatar, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, HistoryOutlined, KeyOutlined, SettingOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { updateProfile, changePassword } from '@/services/auth.service';
import { useAsyncAction } from '@/hooks/useAsyncData';
import LoginRecords from './components/LoginRecords';
import ApiKeyManagement from './components/ApiKeyManagement';
import TaskStrategy from './components/TaskStrategy';
import styles from './Settings.module.css';

type NavKey = 'profile' | 'task-strategy' | 'login-records' | 'api-keys';

const navItems: { key: NavKey; label: string; icon: React.ReactNode }[] = [
  { key: 'profile', label: '个人资料', icon: <UserOutlined /> },
  { key: 'task-strategy', label: '任务策略', icon: <SettingOutlined /> },
  { key: 'login-records', label: '登录记录', icon: <HistoryOutlined /> },
  { key: 'api-keys', label: 'API密钥', icon: <KeyOutlined /> },
];

function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + '***' + phone.slice(-3);
}

export default function SettingsPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);
  const [activeKey, setActiveKey] = useState<NavKey>('profile');
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const { execute: executeProfileUpdate, loading: profileLoading } = useAsyncAction(
    async (values: { name: string; phone?: string; avatar?: string }) => {
      await updateProfile(values);
      if (currentUser) {
        setCurrentUser({ ...currentUser, ...values });
      }
    },
    { successMessage: '个人资料更新成功', errorMessage: '个人资料更新失败' },
  );

  const { execute: executePasswordChange, loading: passwordLoading } = useAsyncAction(
    async (values: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的新密码不一致');
        return;
      }
      await changePassword({ oldPassword: values.oldPassword, newPassword: values.newPassword });
      passwordForm.resetFields();
    },
    { successMessage: '密码修改成功', errorMessage: '密码修改失败' },
  );

  const displayName = currentUser?.realName || currentUser?.name || '未知用户';
  const phone = currentUser?.phone;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <h1>个人设置</h1>
      <div className={styles.layout}>
        <nav className={styles.sidebar} data-testid="settings-sidebar">
          {navItems.map((item) => (
            <div
              key={item.key}
              className={`${styles.navItem} ${activeKey === item.key ? styles.navItemActive : ''}`}
              onClick={() => setActiveKey(item.key)}
              data-testid={`nav-${item.key}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div className={styles.content}>
          {activeKey === 'profile' && (
            <>
              <Card style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Avatar size={56} style={{ background: '#3366FF', flexShrink: 0 }}>
                    {displayName[0]}
                  </Avatar>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{displayName}</div>
                    {phone && (
                      <div style={{ color: '#999', fontSize: 13, marginTop: 2 }}>{maskPhone(phone)}</div>
                    )}
                  </div>
                </div>
              </Card>

              <Card title="个人信息" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <Avatar size={64} src={currentUser?.avatar} icon={<UserOutlined />} />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{displayName}</div>
                    <div style={{ color: '#888' }}>{currentUser?.email ?? ''}</div>
                  </div>
                </div>
                <div data-testid="user-department">
                  <strong>部门：</strong>{currentUser?.departmentId ?? currentUser?.deptName ?? '未分配'}
                </div>
                <div data-testid="user-role">
                  <strong>角色：</strong>{(currentUser?.roleIds ?? currentUser?.roles)?.join(', ') ?? '未分配'}
                </div>
              </Card>

              <Card title="编辑资料" style={{ marginBottom: 24 }}>
                <Form
                  form={profileForm}
                  layout="vertical"
                  initialValues={{
                    name: currentUser?.realName ?? currentUser?.name ?? '',
                    phone: currentUser?.phone ?? '',
                    avatar: currentUser?.avatar ?? '',
                  }}
                  onFinish={(values) => executeProfileUpdate(values)}
                >
                  <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
                    <Input placeholder="请输入姓名" />
                  </Form.Item>
                  <Form.Item label="手机号" name="phone">
                    <Input placeholder="请输入手机号" />
                  </Form.Item>
                  <Form.Item label="头像 URL" name="avatar">
                    <Input placeholder="请输入头像链接" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={profileLoading}>
                      保存修改
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              <Divider />

              <Card title="修改密码">
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={(values) => executePasswordChange(values)}
                >
                  <Form.Item
                    label="当前密码"
                    name="oldPassword"
                    rules={[{ required: true, message: '请输入当前密码' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
                  </Form.Item>
                  <Form.Item
                    label="新密码"
                    name="newPassword"
                    rules={[
                      { required: true, message: '请输入新密码' },
                      { min: 6, message: '密码至少6个字符' },
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码" />
                  </Form.Item>
                  <Form.Item
                    label="确认新密码"
                    name="confirmPassword"
                    rules={[
                      { required: true, message: '请确认新密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={passwordLoading}>
                      修改密码
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </>
          )}

          {activeKey === 'task-strategy' && <TaskStrategy />}
          {activeKey === 'login-records' && <LoginRecords />}
          {activeKey === 'api-keys' && <ApiKeyManagement />}
        </div>
      </div>
    </div>
  );
}
