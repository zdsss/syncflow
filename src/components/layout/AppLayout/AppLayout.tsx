import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import theme from '@/styles/antd-theme';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAppStore } from '@/stores/useAppStore';
import '@/styles/tokens.css';
import '@/styles/global.css';

const { Content } = Layout;

export default function AppLayout() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);

  return (
    <ConfigProvider theme={theme}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sidebar />
        <Layout
          style={{
            marginLeft: sidebarCollapsed ? 64 : 240,
            transition: 'margin-left 300ms ease-in-out',
          }}
        >
          <Header />
          <Content
            style={{
              padding: 24,
              minHeight: 'calc(100vh - 56px)',
              background: '#F5F7FA',
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
