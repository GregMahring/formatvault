import { useRouteError, isRouteErrorResponse, Link } from 'react-router';
import { Button } from '@/components/ui/button';

/**
 * Route-level error boundary for React Router v7.
 * Export as `ErrorBoundary` from each route module to isolate crashes per-route.
 * Handles both route errors (404, 500) and unexpected render errors.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();

  let heading = 'Something went wrong';
  let message = 'An unexpected error occurred in this tool. Your data has not been sent anywhere.';
  let status: number | null = null;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    if (error.status === 404) {
      heading = 'Page not found';
      message = "The tool or page you're looking for doesn't exist.";
    } else if (error.status === 403) {
      heading = 'Access denied';
      message = "You don't have permission to view this page.";
    } else {
      heading = `Error ${String(error.status)}`;
      message = error.statusText || message;
    }
  } else if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    // Only surface error details in development to prevent info disclosure (ADR-0007)
    message = error.message;
  }

  return (
    <div
      role="alert"
      className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <p className="text-4xl">{status === 404 ? '🔍' : '⚠️'}</p>
      <h2 className="text-xl font-semibold text-gray-200">{heading}</h2>
      <p className="max-w-sm text-sm text-fg-tertiary">{message}</p>
      <div className="flex gap-2">
        {status !== 404 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.location.reload();
            }}
          >
            Try again
          </Button>
        )}
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
