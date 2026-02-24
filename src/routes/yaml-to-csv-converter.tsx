import type { Route } from './+types/yaml-to-csv-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { yamlToCsv } from '@/features/convert/converters';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'YAML to CSV Converter',
    description:
      'Convert YAML to CSV online for free. Supports arrays of objects. 100% client-side.',
    path: '/yaml-to-csv-converter',
  });
}

export default function YamlToCsvConverter() {
  return (
    <ConverterLayout
      title="YAML → CSV Converter"
      fromLanguage="yaml"
      toLanguage="csv"
      fromPlaceholder={'- name: Alice\n  age: 30\n- name: Bob\n  age: 25'}
      convert={yamlToCsv}
    />
  );
}
