import { Form, Input, Button, Card, Typography, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '@/services/auth.service';

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleSubmit = async (values: { email: string }) => {
    try {
      await forgotPassword(values.email);
      message.success('重置链接已发送到您的邮箱，请查收');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      message.error(err?.message || '发送失败，请稍后重试');
    }
  };

  return (
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
          找回密码
        </Title>
        <Form form={form} onFinish={handleSubmit} layout="vertical" size="large">
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="请输入注册时的邮箱" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              发送重置链接
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            <Text>
              <Link to="/login">返回登录</Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}
