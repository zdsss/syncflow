import { RouterProvider } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { App as AntdApp } from 'antd';
import { router } from './routes';

export default function App() {
  const { i18n } = useTranslation();

  return (
    <AntdApp>
      <RouterProvider router={router} />
    </AntdApp>
  );
}
