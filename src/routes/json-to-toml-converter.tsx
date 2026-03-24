import type { Route } from './+types/json-to-toml-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { jsonToToml } from '@/features/convert/converters';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'JSON to TOML Converter — Free, No Upload, Private',
    description:
      'Convert JSON to TOML privately in your browser — no data uploaded. JSON root must be an object. Free, no account required, 100% client-side.',
    path: '/json-to-toml-converter',
  });
}

export default function JsonToTomlConverter() {
  return (
    <ConverterLayout
      title="JSON → TOML Converter"
      fromLanguage="json"
      toLanguage="toml"
      fromPlaceholder={'{"server":{"host":"localhost","port":8080}}'}
      convert={jsonToToml}
    />
  );
}
