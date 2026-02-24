import type { Route } from './+types/json-to-csv-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { jsonToCsv } from '@/features/convert/converters';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'JSON to CSV Converter',
    description:
      'Convert JSON to CSV online for free. Handles nested objects with flattening. 100% client-side.',
    path: '/json-to-csv-converter',
  });
}

export default function JsonToCsvConverter() {
  return (
    <ConverterLayout
      title="JSON → CSV Converter"
      fromLanguage="json"
      toLanguage="csv"
      fromPlaceholder='[{"name":"Alice","age":30},{"name":"Bob","age":25}]'
      convert={jsonToCsv}
    />
  );
}
