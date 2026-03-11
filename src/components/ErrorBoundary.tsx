import * as React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional fallback to render instead of the default error UI */
  fallback?: React.ReactNode;
}

/**
 * Catches React render errors and displays a safe fallback UI.
 * Error details are logged to the console in development only —
 * never surfaced to users (prevents info disclosure — ADR-0007).
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { hasError: true, errorMessage: message };
  }

  override componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // Only log in development — never expose stack traces to production users
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <p className="text-4xl">⚠️</p>
          <h2 className="text-xl font-semibold text-fg">Something went wrong</h2>
          <p className="max-w-sm text-sm text-fg-tertiary">
            An unexpected error occurred in this tool. Your data has not been sent anywhere.
          </p>
          <Button variant="secondary" size="sm" onClick={this.handleReset}>
            Try again
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="/">Back to home</a>
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
