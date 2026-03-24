import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import type { Route } from './+types/converters';
import { buildMeta } from '@/lib/meta';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'Data Format Converters — No Upload, 100% Private',
    description:
      'Convert between JSON, CSV, YAML and TOML privately in your browser — no data uploaded. All format pairs plus JSON→TypeScript. Free, no account required.',
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
      <h1 className="mb-2 text-3xl font-bold text-fg">Data Format Converters</h1>
      <p className="mb-10 text-fg-secondary">
        Convert between JSON, CSV and YAML — all processing happens in your browser.
      </p>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CONVERTERS.map(({ from, to, path }) => (
          <li key={path}>
            <Link
              to={path}
              className="group flex items-center justify-between rounded-lg border border-edge bg-surface-raised px-5 py-4 transition-colors hover:border-edge-emphasis hover:bg-surface-elevated/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <span className="font-medium text-fg group-hover:text-fg">
                {from} <span className="text-fg-tertiary">→</span> {to}
              </span>
              <ArrowRight
                className="h-4 w-4 text-fg-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent-400"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
