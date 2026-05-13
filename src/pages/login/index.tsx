import { Form, Input, Button, Card, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { ConfigProvider, message } from 'antd';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const loginAsync = useAuthStore((s) => s.loginAsync);

  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      await loginAsync(values.username, values.password);
      message.success('登录成功');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      message.error(err?.message || '登录失败，请检查用户名和密码');
    }
  };

  return (
    <ConfigProvider>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#F5F7FA',
        }}
      >
        <Card style={{ width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
            SyncFlow 登录
          </Title>
          <Form form={form} onFinish={handleSubmit} layout="vertical" size="large">
            <Form.Item
              label="用户名"
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
            </Form.Item>
            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                登录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </ConfigProvider>
  );
}
