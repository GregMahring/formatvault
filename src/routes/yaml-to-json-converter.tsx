import type { Route } from './+types/yaml-to-json-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { yamlToJson } from '@/features/convert/converters';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'YAML to JSON Converter',
    description:
      'Convert YAML to JSON online for free. Supports multi-document YAML. 100% client-side.',
    path: '/yaml-to-json-converter',
  });
}

export default function YamlToJsonConverter() {
  return (
    <ConverterLayout
      title="YAML → JSON Converter"
      fromLanguage="yaml"
      toLanguage="json"
      fromPlaceholder={'name: Alice\nroles:\n  - admin\n  - user'}
      convert={yamlToJson}
    />
  );
}
