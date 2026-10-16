import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/layout/AppShell';
import { StateMessage } from '@/components/ui/StateMessage';
import { ErrorBoundary } from './ErrorBoundary';

// Route-level code splitting.
const PulsePage = lazy(() => import('@/features/pulse/PulsePage'));
const NarrativesPage = lazy(() => import('@/features/narratives/NarrativesPage'));
const AudiencePage = lazy(() => import('@/features/audience/AudiencePage'));

const page = (node: ReactNode) => (
  <ErrorBoundary>
    <Suspense fallback={<StateMessage title="Loading view" loading />}>{node}</Suspense>
  </ErrorBoundary>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/pulse" replace /> },
      { path: 'pulse', element: page(<PulsePage />) },
      { path: 'narratives', element: page(<NarrativesPage />) },
      { path: 'audience', element: page(<AudiencePage />) },
      { path: '*', element: <Navigate to="/pulse" replace /> },
    ],
  },
]);
