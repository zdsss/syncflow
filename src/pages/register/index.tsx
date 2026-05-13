import { useEffect, useState, useCallback } from 'react';
import { Form, Input, Button, Card, Typography, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { register, getTeams } from '@/services/auth.service';
import { getDepartments } from '@/services/config.service';
import { ConfigProvider, message } from 'antd';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAsyncAction } from '@/hooks/useAsyncData';
import type { Team, Department } from '@/types';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const loginAsync = useAuthStore((s) => s.loginAsync);

  const fetcher = useCallback(async () => {
    const [teamsRes, deptsRes] = await Promise.all([getTeams(), getDepartments()]);
    return {
      teams: (teamsRes.data || []) as Team[],
      departments: (deptsRes.data || []) as Department[],
    };
  }, []);

  const { data: formData } = useAsyncData(fetcher, '加载表单数据失败');
  const teams = formData?.teams || [];
  const departments = formData?.departments || [];

  useEffect(() => {
    fetcher();
  }, [fetcher]);

  const { execute: doRegister, loading } = useAsyncAction<[any], void>(
    async (values: { name: string; email: string; password: string }) => {
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      await loginAsync(values.email, values.password);
      navigate('/dashboard', { replace: true });
    },
    { errorMessage: '注册失败，请稍后重试', successMessage: '注册成功' },
  );

  const handleSubmit = (values: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    departmentId?: string;
    teamId?: string;
  }) => {
    doRegister(values);
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
        <Card style={{ width: 460, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
            SyncFlow 注册
          </Title>
          <Form form={form} onFinish={handleSubmit} layout="vertical" size="large">
            <Form.Item
              label="姓名"
              name="name"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
            </Form.Item>
            <Form.Item
              label="邮箱"
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
            </Form.Item>
            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码（至少6个字符）" />
            </Form.Item>
            <Form.Item
              label="确认密码"
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次密码输入不一致'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
            </Form.Item>
            <Form.Item label="部门" name="departmentId">
              <Select placeholder="请选择部门" allowClear>
                {departments.map((dept) => (
                  <Select.Option key={dept.id} value={dept.id}>
                    {dept.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="团队" name="teamId">
              <Select placeholder="请选择团队" allowClear>
                {teams.map((team) => (
                  <Select.Option key={team.id} value={team.id}>
                    {team.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                注册
              </Button>
            </Form.Item>
            <div style={{ textAlign: 'center' }}>
              <Text>
                已有账号？ <Link to="/login">去登录</Link>
              </Text>
            </div>
          </Form>
        </Card>
      </div>
    </ConfigProvider>
  );
}
