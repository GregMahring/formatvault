import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import type { Route } from './+types/converters';
import { buildMeta } from '@/lib/meta';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'Data Format Converters',
    description:
      'Convert between JSON, CSV and YAML online for free. All six conversion pairs — JSON↔CSV, JSON↔YAML, CSV↔YAML. 100% client-side.',
    path: '/converters',
    schemaType: 'WebPage',
  });
}

const CONVERTERS = [
  { from: 'JSON', to: 'CSV', path: '/json-to-csv-converter' },
  { from: 'JSON', to: 'YAML', path: '/json-to-yaml-converter' },
  { from: 'CSV', to: 'JSON', path: '/csv-to-json-converter' },
  { from: 'CSV', to: 'YAML', path: '/csv-to-yaml-converter' },
  { from: 'YAML', to: 'JSON', path: '/yaml-to-json-converter' },
  { from: 'YAML', to: 'CSV', path: '/yaml-to-csv-converter' },
  { from: 'JSON', to: 'TypeScript', path: '/json-to-typescript' },
] as const;

export default function Converters() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold text-gray-100">Data Format Converters</h1>
      <p className="mb-10 text-gray-400">
        Convert between JSON, CSV and YAML — all processing happens in your browser.
      </p>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CONVERTERS.map(({ from, to, path }) => (
          <li key={path}>
            <Link
              to={path}
              className="group flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-5 py-4 transition-colors hover:border-gray-700 hover:bg-gray-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <span className="font-medium text-gray-200 group-hover:text-white">
                {from} <span className="text-gray-500">→</span> {to}
              </span>
              <ArrowRight
                className="h-4 w-4 text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-400"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
