import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardProvider } from '@/app/DashboardContext';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { FeedbackHost } from '@/components/ui/FeedbackHost';
import { StateMessage } from '@/components/ui/StateMessage';
import { useDashboardQuery } from '@/services/queries';
import { Footer } from './Footer';
import { NavTabs } from './NavTabs';
import { TopBar } from './TopBar';
import s from './layout.module.css';

const NarrativeDetailHost = lazy(() => import('@/features/narrative-detail/NarrativeDetailHost'));

export function AppShell() {
  const { data, isPending, isError, refetch } = useDashboardQuery();

  if (isPending) {
    return (
      <div className={s.page}>
        <StateMessage title="Scanning the conversation…" message="Pulling the latest 6-hour cycle." loading />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className={s.page}>
        <StateMessage tone="neg" title="Couldn't load the radar" message="The data service didn't respond. Check your connection and try again." action={{ label: 'Retry', onClick: () => void refetch() }} />
      </div>
    );
  }

  return (
    <DashboardProvider value={data}>
      <a href="#main" className={s.skip}>
        Skip to content
      </a>
      <TopBar />
      <NavTabs />
      <main id="main" className={s.main}>
        <Outlet />
      </main>
      <Footer />
      <ErrorBoundary fallbackTitle="Couldn't open this narrative">
        <Suspense fallback={null}>
          <NarrativeDetailHost />
        </Suspense>
      </ErrorBoundary>
      <FeedbackHost />
    </DashboardProvider>
  );
}
