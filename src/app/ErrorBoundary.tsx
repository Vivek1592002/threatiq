import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StateMessage } from '@/components/ui/StateMessage';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Hook for an error reporter (Sentry etc.). Never surface stack traces in the UI.
    if (import.meta.env.DEV) console.error(error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <StateMessage
          tone="neg"
          title={this.props.fallbackTitle ?? 'Something went wrong'}
          message="This section failed to render. Try reloading — your tracked narratives and buckets are saved."
          action={{ label: 'Reload', onClick: () => window.location.reload() }}
        />
      );
    }
    return this.props.children;
  }
}
