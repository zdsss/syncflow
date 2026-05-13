import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { useAuthStore } from '@/stores/useAuthStore';

function RequireAuth() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (!currentUser && !token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

const LoginPage = lazy(() => import('@/pages/login'));
const DashboardPage = lazy(() => import('@/pages/dashboard'));
const ProjectPage = lazy(() => import('@/pages/project'));
const TodoPage = lazy(() => import('@/pages/todo'));
const FilesPage = lazy(() => import('@/pages/files'));
const ConfigPage = lazy(() => import('@/pages/config'));
const BomPage = lazy(() => import('@/pages/bom'));
const ProcessPage = lazy(() => import('@/pages/process'));
const ApprovalPage = lazy(() => import('@/pages/approval'));
const MyTasksPage = lazy(() => import('@/pages/mytasks'));
const NotFoundPage = lazy(() => import('@/pages/not-found'));
const SettingsPage = lazy(() => import('@/pages/settings'));
const ModulesPage = lazy(() => import('@/pages/modules'));
const ServerErrorPage = lazy(() => import('@/pages/server-error'));
const QueryPage = lazy(() => import('@/pages/query'));
const ResourcesPage = lazy(() => import('@/pages/resources'));
const KnowledgePage = lazy(() => import('@/pages/knowledge'));
const TemplatePage = lazy(() => import('@/pages/template'));
const PersonalPage = lazy(() => import('@/pages/personal'));

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSkeleton />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LazyPage><LoginPage /></LazyPage>,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <LazyPage><DashboardPage /></LazyPage> },
          { path: 'project', element: <LazyPage><ProjectPage /></LazyPage> },
          { path: 'todo', element: <LazyPage><TodoPage /></LazyPage> },
          { path: 'my-tasks', element: <LazyPage><MyTasksPage /></LazyPage> },
          { path: 'files', element: <LazyPage><FilesPage /></LazyPage> },
          { path: 'config', element: <LazyPage><ConfigPage /></LazyPage> },
          { path: 'bom', element: <LazyPage><BomPage /></LazyPage> },
          { path: 'process', element: <LazyPage><ProcessPage /></LazyPage> },
          { path: 'approval', element: <LazyPage><ApprovalPage /></LazyPage> },
          { path: 'modules', element: <LazyPage><ModulesPage /></LazyPage> },
          { path: 'query', element: <LazyPage><QueryPage /></LazyPage> },
          { path: 'resources', element: <LazyPage><ResourcesPage /></LazyPage> },
          { path: 'knowledge', element: <LazyPage><KnowledgePage /></LazyPage> },
          { path: 'template', element: <LazyPage><TemplatePage /></LazyPage> },
          { path: 'personal', element: <LazyPage><PersonalPage /></LazyPage> },
          { path: 'settings', element: <LazyPage><SettingsPage /></LazyPage> },
          { path: 'server-error', element: <LazyPage><ServerErrorPage /></LazyPage> },
          { path: '*', element: <LazyPage><NotFoundPage /></LazyPage> },
        ],
      },
    ],
  },
]);
