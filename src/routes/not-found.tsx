import { Link } from 'react-router';

export function meta() {
  return [{ title: '404 — Page Not Found — formatvault' }];
}

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <p className="font-mono text-6xl font-bold text-gray-700">404</p>
      <h1 className="text-2xl font-semibold text-gray-200">Page not found</h1>
      <p className="text-gray-500">That URL doesn&apos;t exist. Maybe try one of the tools?</p>
      <Link
        to="/"
        className="mt-4 rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        Back to home
      </Link>
    </div>
  );
}
