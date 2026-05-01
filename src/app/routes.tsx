import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

const DashboardPage = lazy(() => import('@/pages/dashboard'));
const ProjectPage = lazy(() => import('@/pages/project'));
const TodoPage = lazy(() => import('@/pages/todo'));
const FilesPage = lazy(() => import('@/pages/files'));
const ConfigPage = lazy(() => import('@/pages/config'));
const BomPage = lazy(() => import('@/pages/bom'));
const ProcessPage = lazy(() => import('@/pages/process'));
const KnowledgePage = lazy(() => import('@/pages/knowledge'));
const TemplatePage = lazy(() => import('@/pages/template'));
const PersonalPage = lazy(() => import('@/pages/personal'));
const QueryPage = lazy(() => import('@/pages/query'));
const ResourcesPage = lazy(() => import('@/pages/resources'));
const ApprovalPage = lazy(() => import('@/pages/approval'));

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
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <LazyPage><DashboardPage /></LazyPage> },
      { path: 'project', element: <LazyPage><ProjectPage /></LazyPage> },
      { path: 'todo', element: <LazyPage><TodoPage /></LazyPage> },
      { path: 'files', element: <LazyPage><FilesPage /></LazyPage> },
      { path: 'config', element: <LazyPage><ConfigPage /></LazyPage> },
      { path: 'bom', element: <LazyPage><BomPage /></LazyPage> },
      { path: 'process', element: <LazyPage><ProcessPage /></LazyPage> },
      { path: 'knowledge', element: <LazyPage><KnowledgePage /></LazyPage> },
      { path: 'template', element: <LazyPage><TemplatePage /></LazyPage> },
      { path: 'personal', element: <LazyPage><PersonalPage /></LazyPage> },
      { path: 'query', element: <LazyPage><QueryPage /></LazyPage> },
      { path: 'resources', element: <LazyPage><ResourcesPage /></LazyPage> },
      { path: 'approval', element: <LazyPage><ApprovalPage /></LazyPage> },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);
