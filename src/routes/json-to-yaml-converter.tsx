import type { Route } from './+types/json-to-yaml-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { jsonToYaml } from '@/features/convert/converters';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'JSON to YAML Converter — Free, No Upload, Private',
    description:
      'Convert JSON to YAML privately in your browser — no data uploaded. Preserves all structure and types. Free, no account required, 100% client-side.',
    path: '/json-to-yaml-converter',
  });
}

export default function JsonToYamlConverter() {
  return (
    <ConverterLayout
      title="JSON → YAML Converter"
      fromLanguage="json"
      toLanguage="yaml"
      fromPlaceholder='{"name":"Alice","roles":["admin","user"]}'
      convert={jsonToYaml}
    />
  );
}
