import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import theme from '@/styles/antd-theme';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import '@/styles/tokens.css';
import '@/styles/global.css';
import styles from './AppLayout.module.css';

const { Content } = Layout;

export default function AppLayout() {
  return (
    <ConfigProvider theme={theme}>
      <Layout style={{ height: '100vh', overflow: 'hidden' }}>
        <Sidebar />
        <Layout className={`app-layout ${styles.mainLayout}`}>
          <Header />
          <Content className={styles.content}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
