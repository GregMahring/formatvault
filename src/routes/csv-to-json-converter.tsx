import type { Route } from './+types/csv-to-json-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { csvToJson } from '@/features/convert/converters';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'CSV to JSON Converter — Free, No Upload, Private',
    description:
      'Convert CSV to JSON privately in your browser — no data uploaded. Auto-detects headers and delimiter. Free, no account required, 100% client-side.',
    path: '/csv-to-json-converter',
  });
}

export default function CsvToJsonConverter() {
  return (
    <ConverterLayout
      title="CSV → JSON Converter"
      fromLanguage="csv"
      toLanguage="json"
      fromPlaceholder={'name,age\nAlice,30\nBob,25'}
      convert={csvToJson}
    />
  );
}
