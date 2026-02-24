import type { Route } from './+types/csv-to-yaml-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { csvToYaml } from '@/features/convert/converters';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'CSV to YAML Converter',
    description:
      'Convert CSV to YAML online for free. Auto-detects delimiter and maps rows to objects. 100% client-side.',
    path: '/csv-to-yaml-converter',
  });
}

export default function CsvToYamlConverter() {
  return (
    <ConverterLayout
      title="CSV → YAML Converter"
      fromLanguage="csv"
      toLanguage="yaml"
      fromPlaceholder={'name,age\nAlice,30\nBob,25'}
      convert={csvToYaml}
    />
  );
}
