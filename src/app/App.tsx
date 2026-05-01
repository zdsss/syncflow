import { RouterProvider } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { router } from './routes';

export default function App() {
  const { i18n } = useTranslation();

  return <RouterProvider router={router} />;
}
